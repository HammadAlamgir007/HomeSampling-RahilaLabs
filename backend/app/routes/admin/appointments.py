import datetime
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_

from app.models import db, User, Test, Appointment, Rider
from app.utils.decorators import require_admin
from app.extensions import limiter
from app.utils.notifications import notify_rider_assignment, notify_patient_rider_assigned
from app.utils.mail import send_sms_notification, send_whatsapp_notification
from app.schemas.booking_schemas import AppointmentStatusUpdateSchema
from app.services.appointment_service import AppointmentService
from . import admin_bp

@admin_bp.route('/appointments', methods=['GET'])
@require_admin()
def get_appointments():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', request.args.get('limit', 10, type=int), type=int), 100)
        search = request.args.get('search', '').strip().lower()
        from app.repositories.appointment_repository import AppointmentRepository
        pagination = AppointmentRepository.get_all_paginated(page, per_page, search)
        
        return jsonify({
            'appointments': [appt.to_dict() for appt in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception:
        return jsonify({'error': 'Failed to retrieve appointments'}), 500


@admin_bp.route('/appointments/<int:id>/status', methods=['PUT'])
@require_admin()
def update_appointment_status(id):
    schema = AppointmentStatusUpdateSchema()
    data = schema.load(request.get_json() or {})
    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'status is required'}), 400
    try:
        appointment = AppointmentService.update_status(id, new_status, changed_by_role='admin')
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update status due to a database error.'}), 500

    return jsonify({'message': 'Status updated', 'appointment': appointment.to_dict()}), 200






@admin_bp.route('/appointments/bulk-status', methods=['PUT'])
@require_admin()
def bulk_update_status():
    """Bulk approve or reject multiple appointments."""
    schema = AppointmentStatusUpdateSchema()
    data = schema.load(request.get_json() or {})
    ids = data.get('ids', [])
    new_status = data.get('status')
    if not ids or new_status not in ['confirmed', 'cancelled']:
        return jsonify({'error': 'ids (list) and valid status (confirmed/cancelled) required'}), 400
    updated = 0
    errors = []
    for appt_id in ids:
        appt = Appointment.query.get(appt_id)
        if not appt:
            errors.append(f'ID {appt_id} not found')
            continue
        old_status = appt.status  # Capture BEFORE transition
        try:
            appt.transition_status(new_status, changed_by_role='admin')
            updated += 1
        except ValueError as e:
            errors.append({'id': appt_id, 'error': str(e)})
            continue
        if new_status == 'confirmed' and old_status != 'confirmed':
            try:
                patient = appt.user
                test = appt.test
                if patient and test:
                    test_date = appt.appointment_date.strftime('%Y-%m-%d %I:%M %p') if appt.appointment_date else 'TBD'
                    send_approval_email.delay(appt.id)
            except Exception as e:
                print(f"Bulk approval email error for {appt_id}: {e}")
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Database error during bulk update'}), 500
    return jsonify({'message': f'{updated} appointments updated to {new_status}', 'errors': errors}), 200






@admin_bp.route('/appointments/<int:appointment_id>/auto-assign-rider', methods=['POST'])
@require_admin()
def auto_assign_rider(appointment_id):
    """Auto-pick the least-busy non-offline rider."""
    current_user_id = int(get_jwt_identity())
    try:
        best_rider, appointment = AppointmentService.auto_assign_rider(appointment_id)
        return jsonify({
            'message': f'Rider {best_rider.name} auto-assigned successfully',
            'rider': best_rider.to_dict(),
            'appointment': appointment.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception:
        return jsonify({'error': 'Failed to auto-assign rider'}), 500



@admin_bp.route('/appointments/<int:id>', methods=['PUT'])
@require_admin()
def update_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    schema = AppointmentStatusUpdateSchema()
    data = schema.load(request.get_json() or {})
    if 'date' in data:
        try:
            date_str = data['date'].replace('Z', '+00:00')
            appointment.appointment_date = datetime.datetime.fromisoformat(date_str)
        except Exception:
            pass
    if 'status' in data:
        try:
            appointment.transition_status(data['status'], changed_by_role='admin')
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
    if 'address' in data:
        appointment.address = data['address']
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update appointment due to a database error.'}), 500
    return jsonify({'message': 'Appointment updated', 'appointment': appointment.to_dict()}), 200






@admin_bp.route('/appointments/<int:appointment_id>/assign-rider', methods=['POST'])
@require_admin()
def assign_rider(appointment_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    rider_id = data.get('rider_id')
    if not rider_id:
        return jsonify({'error': 'rider_id is required'}), 400
    try:
        appointment = AppointmentService.assign_rider(
            appointment_id=appointment_id,
            rider_id=rider_id,
            priority_level=data.get('priority_level', 'normal'),
            pickup_deadline=data.get('pickup_deadline'),
            delivery_deadline=data.get('delivery_deadline'),
            patient_lat=data.get('patient_lat'),
            patient_lng=data.get('patient_lng')
        )
        return jsonify({'message': 'Rider assigned and task auto-accepted', 'appointment': appointment.to_dict()}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception:
        return jsonify({'error': 'Failed to assign rider'}), 500


@admin_bp.route('/appointments/<int:appointment_id>/reassign-rider', methods=['PUT'])
@require_admin()
def reassign_rider(appointment_id):
    data = request.get_json()
    new_rider_id = data.get('rider_id')
    if not new_rider_id:
        return jsonify({'error': 'rider_id is required'}), 400
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    new_rider = Rider.query.get(new_rider_id)
    if not new_rider:
        return jsonify({'error': 'Rider not found'}), 404
    if new_rider.availability_status == 'offline':
        return jsonify({'error': 'Rider is offline and cannot receive tasks'}), 400
    _ACTIVE_STATUSES = ['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected']
    if appointment.rider_id:
        old_rider = Rider.query.get(appointment.rider_id)
        if old_rider:
            # Only free old rider if they have no other active tasks
            remaining = Appointment.query.filter(
                Appointment.rider_id == old_rider.id,
                Appointment.status.in_(_ACTIVE_STATUSES),
                Appointment.id != appointment_id,
            ).count()
            if remaining == 0:
                old_rider.availability_status = 'available'
    now = datetime.datetime.now(datetime.timezone.utc)
    appointment.rider_id = new_rider_id
    appointment.rider_assigned_at = now
    appointment.rider_accepted_at = now
    try:
        appointment.transition_status(
            'rider_accepted', changed_by_role='admin', rider_id=new_rider_id
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if new_rider.availability_status == 'available':
        new_rider.availability_status = 'busy'
    notify_rider_assignment(new_rider_id, appointment_id, appointment.user.username, appointment.address)
    db.session.commit()
    return jsonify({'message': 'Rider reassigned and task auto-accepted', 'appointment': appointment.to_dict()}), 200


@admin_bp.route('/appointments/<int:appointment_id>/rider-tracking', methods=['GET'])
@require_admin()
def get_rider_tracking(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    if not appointment.rider:
        return jsonify({'error': 'No rider assigned to this appointment'}), 404
    rider = appointment.rider
    return jsonify({
        'appointment_id': appointment_id,
        'rider': {
            'id': rider.id, 'name': rider.name, 'phone': rider.phone,
            'gps_latitude': rider.gps_latitude, 'gps_longitude': rider.gps_longitude,
            'last_location_update': rider.last_location_update.isoformat() if rider.last_location_update else None,
            'availability_status': rider.availability_status,
        },
        'patient_address': appointment.address,
        'status': appointment.status,
    }), 200


@admin_bp.route('/riders/<int:rider_id>/active-tasks', methods=['GET'])
@require_admin()
def get_rider_active_tasks(rider_id):
    """Return all currently active (non-completed) tasks for a given rider."""
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    active_statuses = ['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected']
    tasks = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(active_statuses),
    ).order_by(Appointment.appointment_date.asc()).all()
    return jsonify({
        'rider_id': rider_id,
        'rider_name': rider.name,
        'active_task_count': len(tasks),
        'tasks': [t.to_dict() for t in tasks],
    }), 200
