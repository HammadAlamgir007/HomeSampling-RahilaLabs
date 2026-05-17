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
from app.utils.notifications import notify_rider_assignment, notify_patient_rider_assigned
from app.utils.identifiers import generate_mrn
from app.utils.mail import send_approval_email, send_sms_notification, send_whatsapp_notification
from . import admin_bp

@admin_bp.route('/appointments', methods=['GET'])
@require_admin()
def get_appointments():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', request.args.get('limit', 10, type=int), type=int)
        search = request.args.get('search', '').strip().lower()
        query = Appointment.query
        if search:
            from sqlalchemy import or_
            query = query.join(Appointment.user, isouter=True).join(Appointment.test, isouter=True).filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Test.name.ilike(f'%{search}%'),
                    Appointment.booking_order_id.ilike(f'%{search}%'),
                    Appointment.status.ilike(f'%{search}%'),
                )
            )
        pagination = query.order_by(Appointment.appointment_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'appointments': [appt.to_dict() for appt in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/appointments/<int:id>/status', methods=['PUT'])
@require_admin()
def update_appointment_status(id):
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ['pending', 'confirmed', 'collected', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    old_status = appointment.status
    if new_status:
        try:
            appointment.transition_status(new_status, changed_by_role='admin')
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update status due to a database error.'}), 500

    # Fire approval email + SMS/WhatsApp when admin confirms an appointment
    if new_status == 'confirmed' and old_status != 'confirmed':
        try:
            patient = appointment.user
            test = appointment.test
            if patient and test:
                test_date = appointment.appointment_date.strftime('%Y-%m-%d %I:%M %p') if appointment.appointment_date else 'TBD'
                send_approval_email(
                    patient_email=patient.email,
                    patient_name=patient.username,
                    mrn=patient.mrn or 'MRN-PENDING',
                    booking_id=appointment.booking_order_id or str(appointment.id),
                    test_name=test.name,
                    test_date=test_date,
                    address=appointment.address or 'Address on record',
                )
                # SMS notification
                if patient.phone:
                    sms_msg = (f"Rahila Labs: Your appointment for {test.name} on {test_date} "
                               f"is APPROVED. Booking ID: {appointment.booking_order_id}. "
                               f"MRN: {patient.mrn or 'N/A'}")
                    send_sms_notification(patient.phone, sms_msg)
                    send_whatsapp_notification(patient.phone, sms_msg)
        except Exception as e:
            print(f"Approval notification error (non-fatal): {e}")

    return jsonify({'message': 'Status updated', 'appointment': appointment.to_dict()}), 200






@admin_bp.route('/appointments/bulk-status', methods=['PUT'])
@require_admin()
def bulk_update_status():
    """Bulk approve or reject multiple appointments."""
    data = request.get_json()
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
        try:
            appt.transition_status(new_status, changed_by_role='admin')
            updated += 1
        except ValueError as e:
            errors.append({'id': appt_id, 'error': str(e)})
            continue
        if new_status == 'confirmed' and appt.status != 'confirmed':
            try:
                patient = appt.user
                test = appt.test
                if patient and test:
                    test_date = appt.appointment_date.strftime('%Y-%m-%d %I:%M %p') if appt.appointment_date else 'TBD'
                    send_approval_email(
                        patient_email=patient.email,
                        patient_name=patient.username,
                        mrn=patient.mrn or 'MRN-PENDING',
                        booking_id=appt.booking_order_id or str(appt.id),
                        test_name=test.name,
                        test_date=test_date,
                        address=appt.address or '',
                    )
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
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    # Get all non-offline riders, prefer available, then busy (but not offline)
    riders = Rider.query.filter(Rider.availability_status != 'offline').all()
    if not riders:
        return jsonify({'error': 'No available riders found'}), 404

    # Sort: available first, then by fewest active tasks
    def rider_load(r):
        active = Appointment.query.filter(
            Appointment.rider_id == r.id,
            Appointment.status.in_(['rider_accepted', 'rider_on_way', 'sample_collected'])
        ).count()
        priority = 0 if r.availability_status == 'available' else 1
        return (priority, active)

    best_rider = min(riders, key=rider_load)

    from datetime import timedelta
    now = datetime.datetime.utcnow()
    appointment.rider_id = best_rider.id
    appointment.rider_assigned_at = now
    appointment.rider_accepted_at = now
    appointment.pickup_deadline = now + timedelta(hours=1)
    appointment.delivery_deadline = now + timedelta(hours=4)
    try:
        appointment.transition_status(
            'rider_accepted', changed_by_role='admin', rider_id=best_rider.id
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if best_rider.availability_status == 'available':
        best_rider.availability_status = 'busy'

    notify_rider_assignment(best_rider.id, appointment_id, appointment.user.username, appointment.address)
    notify_patient_rider_assigned(appointment.user_id, appointment_id, best_rider.name)

    # SMS to patient
    try:
        if appointment.user and appointment.user.phone:
            send_sms_notification(
                appointment.user.phone,
                f"Rahila Labs: Rider {best_rider.name} has been assigned to collect your sample. Contact: {best_rider.phone}"
            )
            send_whatsapp_notification(
                appointment.user.phone,
                f"Rahila Labs: Rider {best_rider.name} has been assigned to collect your sample. Contact: {best_rider.phone}"
            )
    except Exception as e:
        print(f"Auto-assign SMS error (non-fatal): {e}")

    db.session.commit()
    return jsonify({
        'message': f'Rider {best_rider.name} auto-assigned successfully',
        'rider': best_rider.to_dict(),
        'appointment': appointment.to_dict()
    }), 200



@admin_bp.route('/appointments/<int:id>', methods=['PUT'])
@require_admin()
def update_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    data = request.get_json()
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
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    if rider.availability_status == 'offline':
        return jsonify({'error': 'Rider is offline and cannot receive tasks'}), 400

    if 'patient_lat' in data and 'patient_lng' in data:
        appointment.patient_latitude = float(data['patient_lat'])
        appointment.patient_longitude = float(data['patient_lng'])

    from datetime import timedelta
    now = datetime.datetime.utcnow()
    appointment.pickup_deadline = (
        datetime.datetime.fromisoformat(data['pickup_deadline'])
        if 'pickup_deadline' in data
        else now + timedelta(hours=1)
    )
    appointment.delivery_deadline = (
        datetime.datetime.fromisoformat(data['delivery_deadline'])
        if 'delivery_deadline' in data
        else now + timedelta(hours=4)
    )
    appointment.priority_level = data.get('priority_level', 'normal')
    appointment.rider_id = rider_id
    appointment.rider_assigned_at = now
    appointment.rider_accepted_at = now
    try:
        appointment.transition_status(
            'rider_accepted', changed_by_role='admin', rider_id=rider_id
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if rider.availability_status == 'available':
        rider.availability_status = 'busy'

    notify_rider_assignment(rider_id, appointment_id, appointment.user.username, appointment.address)
    notify_patient_rider_assigned(appointment.user_id, appointment_id, rider.name)

    db.session.commit()
    return jsonify({'message': 'Rider assigned and task auto-accepted', 'appointment': appointment.to_dict()}), 200


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
    now = datetime.datetime.utcnow()
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
