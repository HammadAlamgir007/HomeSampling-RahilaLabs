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

@admin_bp.route('/patients', methods=['GET'])
@require_admin()
def get_patients():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    pagination = User.query.filter_by(role='patient').order_by(User.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    patients_list = [p.to_dict() for p in pagination.items]
    return jsonify({
        'users': patients_list,
        'patients': patients_list,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@admin_bp.route('/patients/<int:patient_id>', methods=['GET'])
@require_admin()
def get_patient_detail(patient_id):
    patient = User.query.get(patient_id)
    if not patient or patient.role != 'patient':
        return jsonify({'error': 'Patient not found'}), 404
    appointments = Appointment.query.filter_by(user_id=patient_id).order_by(Appointment.created_at.desc()).all()
    appointment_list = [{
        'id': appt.id,
        'booking_order_id': getattr(appt, 'booking_order_id', None),
        'test_name': appt.test.name if appt.test else 'Unknown Test',
        'test_price': appt.test.price if appt.test else None,
        'status': appt.status,
        'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
        'address': getattr(appt, 'address', None),
        'city': getattr(appt, 'city', None),
        'created_at': appt.created_at.isoformat() if appt.created_at else None,
        'report_path': getattr(appt, 'report_path', None),
        'rider_name': appt.rider.name if getattr(appt, 'rider', None) else None,
    } for appt in appointments]
    return jsonify({
        'patient': {
            'id': patient.id, 'username': patient.username, 'email': patient.email,
            'phone': patient.phone, 'city': patient.city, 'mrn': getattr(patient, 'mrn', None),
            'status': patient.status, 'is_verified': getattr(patient, 'is_verified', False),
            'created_at': patient.created_at.isoformat() if getattr(patient, 'created_at', None) else None,
        },
        'stats': {
            'total': len(appointments),
            'pending': sum(1 for a in appointments if a.status == 'pending'),
            'confirmed': sum(1 for a in appointments if a.status == 'confirmed'),
            'completed': sum(1 for a in appointments if a.status == 'completed'),
            'cancelled': sum(1 for a in appointments if a.status == 'cancelled'),
        },
        'appointments': appointment_list,
    }), 200


@admin_bp.route('/patients', methods=['POST'])
@require_admin()
def create_patient():
    data = request.get_json()
    for field in ['username', 'email', 'password', 'phone']:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    email = sanitize_email(data['email'])
    username = sanitize_string(data['username'])
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    new_patient = User(
        username=username, email=email,
        password_hash=generate_password_hash(data['password']),
        phone=sanitize_string(data['phone']), city=sanitize_string(data.get('city', '')),
        role='patient', status='active', is_verified=True, mrn=generate_mrn(),
    )
    try:
        db.session.add(new_patient)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to create patient due to a database error.'}), 500
    return jsonify({'message': 'Patient created successfully', 'user': new_patient.to_dict()}), 201


@admin_bp.route('/patients/<int:id>', methods=['PUT', 'DELETE'])
@require_admin()
def update_or_delete_patient(id):
    patient = User.query.get(id)
    if not patient or patient.role != 'patient':
        return jsonify({'error': 'Patient not found'}), 404
    if request.method == 'DELETE':
        try:
            for appt in Appointment.query.filter_by(user_id=id).all():
                db.session.delete(appt)
            db.session.delete(patient)
            db.session.commit()
            return jsonify({'message': 'Patient deleted successfully'}), 200
        except Exception:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete patient due to a database error.'}), 500

    data = request.get_json()
    if 'username' in data:
        patient.username = sanitize_string(data['username'])
    if 'email' in data:
        patient.email = sanitize_email(data['email'])
    if 'phone' in data:
        patient.phone = sanitize_string(data['phone'])
    if 'city' in data:
        patient.city = sanitize_string(data['city'])
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update patient due to a database error.'}), 500
    return jsonify({'message': 'Patient updated', 'user': patient.to_dict()}), 200


