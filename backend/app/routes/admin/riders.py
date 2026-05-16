import os
import datetime
import uuid
import math
from flask import request, jsonify, send_file
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import or_, and_, func

from app.models import db, User, Test, Appointment, Rider, TaskLog
from app.utils.api import sanitize_string, sanitize_email
from app.utils.decorators import require_admin
from app.extensions import limiter
from app.utils.notifications import notify_rider_assignment
from . import admin_bp

@admin_bp.route('/riders', methods=['POST'])
@require_admin()
def create_rider():
    data = request.get_json()
    for field in ['name', 'email', 'phone', 'password']:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    email = sanitize_email(data['email'])
    name = sanitize_string(data['name'])
    if Rider.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    new_rider = Rider(
        name=name, email=email, phone=sanitize_string(data['phone']),
        password_hash=generate_password_hash(data['password']), availability_status='available',
    )
    try:
        db.session.add(new_rider)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to create rider'}), 500
    return jsonify({'message': 'Rider created successfully', 'rider': new_rider.to_dict()}), 201


@admin_bp.route('/riders', methods=['GET'])
@require_admin()
def get_riders():
    riders = Rider.query.all()
    rider_dicts = {r.id: r.to_dict() for r in riders}
    for r in rider_dicts.values():
        r['stats'] = {'completed_tasks': 0, 'pending_tasks': 0}

    completed = db.session.query(Appointment.rider_id, db.func.count(Appointment.id)) \
        .filter(Appointment.rider_id.isnot(None), Appointment.status == 'delivered_to_lab') \
        .group_by(Appointment.rider_id).all()
    for rider_id, count in completed:
        if rider_id in rider_dicts:
            rider_dicts[rider_id]['stats']['completed_tasks'] = count

    pending = db.session.query(Appointment.rider_id, db.func.count(Appointment.id)) \
        .filter(Appointment.rider_id.isnot(None), Appointment.status.in_([
            'rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected'
        ])).group_by(Appointment.rider_id).all()
    for rider_id, count in pending:
        if rider_id in rider_dicts:
            rider_dicts[rider_id]['stats']['pending_tasks'] = count

    return jsonify({'riders': list(rider_dicts.values())}), 200


@admin_bp.route('/riders/<int:rider_id>', methods=['GET'])
@require_admin()
def get_rider(rider_id):
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
        
    data = rider.to_dict()
    completed = Appointment.query.filter_by(rider_id=rider_id, status='delivered_to_lab').count()
    pending = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected'])
    ).count()
    data['stats'] = {'completed_tasks': completed, 'pending_tasks': pending}
    return jsonify(data), 200


@admin_bp.route('/riders/<int:rider_id>', methods=['PUT'])
@require_admin()
def update_rider(rider_id):
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    data = request.get_json()
    if 'name' in data:
        rider.name = sanitize_string(data['name'])
    if 'email' in data:
        clean_email = sanitize_email(data['email'])
        existing = Rider.query.filter(Rider.email == clean_email, Rider.id != rider_id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 400
        rider.email = clean_email
    if 'phone' in data:
        rider.phone = sanitize_string(data['phone'])
    if 'availability_status' in data and data['availability_status'] in ['available', 'busy', 'offline']:
        rider.availability_status = data['availability_status']
    if 'password' in data and data['password']:
        rider.password_hash = generate_password_hash(data['password'])
    rider.updated_at = datetime.datetime.now(datetime.timezone.utc)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update rider'}), 500
    return jsonify({'message': 'Rider updated successfully', 'rider': rider.to_dict()}), 200


@admin_bp.route('/riders/<int:rider_id>', methods=['DELETE'])
@require_admin()
def delete_rider(rider_id):
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    active_assignments = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected']),
    ).count()
    if active_assignments > 0:
        return jsonify({'error': 'Cannot delete rider with active assignments'}), 400
    try:
        db.session.delete(rider)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete rider'}), 500
    return jsonify({'message': 'Rider deleted successfully'}), 200


@admin_bp.route('/riders/<int:rider_id>/performance', methods=['GET'])
@require_admin()
def get_rider_performance(rider_id):
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    total_assigned = Appointment.query.filter_by(rider_id=rider_id).count()
    completed = Appointment.query.filter_by(rider_id=rider_id, status='delivered_to_lab').count()
    rejected = Appointment.query.filter_by(rider_id=rider_id, status='rider_rejected').count()
    in_progress = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected']),
    ).count()
    completed_tasks = Appointment.query.filter_by(rider_id=rider_id, status='delivered_to_lab').all()
    avg_completion_time = None
    if completed_tasks:
        total_time = sum([
            (task.delivered_at - task.rider_assigned_at).total_seconds() / 3600
            for task in completed_tasks
            if task.delivered_at and task.rider_assigned_at
        ])
        avg_completion_time = total_time / len(completed_tasks) if completed_tasks else 0
    return jsonify({
        'rider': rider.to_dict(),
        'performance': {
            'total_assigned': total_assigned,
            'completed': completed,
            'rejected': rejected,
            'in_progress': in_progress,
            'success_rate': (completed / total_assigned * 100) if total_assigned > 0 else 0,
            'avg_completion_time_hours': round(avg_completion_time, 2) if avg_completion_time else None,
        },
    }), 200


@admin_bp.route('/riders/<int:rider_id>/history', methods=['GET'])
@require_admin()
def get_rider_history(rider_id):
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    tasks = Appointment.query.filter_by(rider_id=rider_id).order_by(Appointment.created_at.desc()).all()
    return jsonify({'rider': rider.to_dict(), 'tasks': [t.to_dict(include_rider=False) for t in tasks]}), 200


