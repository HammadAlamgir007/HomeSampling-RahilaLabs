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
from app.schemas.rider_schemas import RiderCreateSchema, RiderUpdateSchema
from . import admin_bp

@admin_bp.route('/riders', methods=['POST'])
@require_admin()
def create_rider():
    schema = RiderCreateSchema()
    data = schema.load(request.get_json() or {})
    email = data['email']
    name = data['name']
    if Rider.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    new_rider = Rider(
        name=name, email=email, phone=data['phone'],
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
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('limit', 50, type=int), 100)
    
    pagination = Rider.query.paginate(page=page, per_page=per_page, error_out=False)
    riders = pagination.items
    
    rider_dicts = {r.id: r.to_dict() for r in riders}
    for r in rider_dicts.values():
        r['stats'] = {'completed_tasks': 0, 'pending_tasks': 0}

    if not rider_dicts:
        return jsonify({'riders': [], 'total': 0, 'pages': 0, 'current_page': page}), 200

    rider_ids = list(rider_dicts.keys())

    completed = db.session.query(Appointment.rider_id, db.func.count(Appointment.id)) \
        .filter(Appointment.rider_id.in_(rider_ids), Appointment.status == 'delivered_to_lab') \
        .group_by(Appointment.rider_id).all()
    for rider_id, count in completed:
        rider_dicts[rider_id]['stats']['completed_tasks'] = count

    pending = db.session.query(Appointment.rider_id, db.func.count(Appointment.id)) \
        .filter(Appointment.rider_id.in_(rider_ids), Appointment.status.in_([
            'rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected'
        ])).group_by(Appointment.rider_id).all()
    for rider_id, count in pending:
        rider_dicts[rider_id]['stats']['pending_tasks'] = count

    return jsonify({
        'riders': list(rider_dicts.values()),
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


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
    schema = RiderUpdateSchema()
    data = schema.load(request.get_json() or {})
    if 'name' in data:
        rider.name = data['name']
    if 'email' in data:
        clean_email = data['email']
        existing = Rider.query.filter(Rider.email == clean_email, Rider.id != rider_id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 400
        rider.email = clean_email
    if 'phone' in data:
        rider.phone = data['phone']
    if 'availability_status' in data:
        rider.availability_status = data['availability_status']
    if data.get('password'):
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
        Appointment.status.in_(['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected']),
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
        Appointment.status.in_(['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected']),
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
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('limit', 50, type=int), 100)
    
    from sqlalchemy.orm import joinedload
    pagination = Appointment.query.options(
        joinedload(Appointment.user),
        joinedload(Appointment.test)
    ).filter_by(rider_id=rider_id).order_by(Appointment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'rider': rider.to_dict(), 
        'tasks': [t.to_dict(include_rider=False) for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


