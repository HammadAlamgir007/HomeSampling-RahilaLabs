from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from models import db, Rider, Appointment, log_task_status_change
from datetime import datetime
from utils.file_upload import save_sample_photo, save_rider_photo
from utils.notifications import (
    notify_patient_rider_on_way,
    notify_admin_sample_collected,
    notify_admin_sample_delivered,
    notify_patient_sample_collected,
    get_rider_notifications,
    mark_notification_read
)

rider_bp = Blueprint('rider', __name__)


def _validate_geofence(rider_lat, rider_lng, patient_lat, patient_lng, max_meters=200):
    """Returns an error message if rider is too far from patient, or None if OK.
    Skips validation if patient coordinates are not configured."""
    if not all([rider_lat, rider_lng, patient_lat, patient_lng]):
        return None  # Can't validate without coordinates, skip
    import math
    # Haversine formula
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(float(rider_lat)), math.radians(float(patient_lat))
    d_phi = math.radians(float(patient_lat) - float(rider_lat))
    d_lambda = math.radians(float(patient_lng) - float(rider_lng))
    a = math.sin(d_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(d_lambda/2)**2
    distance_m = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    if distance_m > max_meters:
        dist_str = f'{distance_m/1000:.1f}km' if distance_m >= 1000 else f'{distance_m:.0f}m'
        return f'You are too far from the patient location ({dist_str} away). Move within {max_meters}m to proceed.'
    return None

@rider_bp.route('/login', methods=['POST'])
def rider_login():
    """Rider authentication"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'msg': 'Email and password required'}), 400
    
    rider = Rider.query.filter_by(email=email).first()
    
    if not rider or not check_password_hash(rider.password_hash, password):
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    # Create access token with rider ID as string (Flask-JWT-Extended requires string identity)
    access_token = create_access_token(identity=str(rider.id), additional_claims={'type': 'rider'})
    
    return jsonify({
        'access_token': access_token,
        'rider': rider.to_dict(include_stats=True)
    }), 200

@rider_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get rider profile with stats"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    
    rider = Rider.query.get(rider_id)
    
    if not rider:
        return jsonify({'msg': 'Rider not found'}), 404
    
    return jsonify(rider.to_dict(include_stats=True)), 200

@rider_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update rider profile (location, status, photo)"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    
    rider = Rider.query.get(rider_id)
    
    if not rider:
        return jsonify({'msg': 'Rider not found'}), 404
    
    data = request.form if request.files else request.get_json()
    
    # Update location
    if 'gps_latitude' in data and 'gps_longitude' in data:
        rider.gps_latitude = float(data['gps_latitude'])
        rider.gps_longitude = float(data['gps_longitude'])
        rider.last_location_update = datetime.utcnow()
    
    # Update availability status
    if 'availability_status' in data:
        if data['availability_status'] in ['available', 'busy', 'offline']:
            rider.availability_status = data['availability_status']
    
    # Update profile photo
    if 'profile_photo' in request.files:
        file = request.files['profile_photo']
        try:
            photo_path = save_rider_photo(file, rider.id)
            rider.profile_photo = photo_path
        except ValueError as e:
            return jsonify({'msg': str(e)}), 400
    
    # Update name and phone if provided
    if 'name' in data:
        rider.name = data['name']
    if 'phone' in data:
        rider.phone = data['phone']
    
    rider.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'msg': 'Profile updated successfully',
        'rider': rider.to_dict(include_stats=True)
    }), 200

@rider_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get assigned tasks (pending acceptance or in-progress)"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    
    # Get active tasks (accepted onwards — assignment is auto-accepted)
    tasks = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected'])
    ).order_by(Appointment.appointment_date.desc()).all()
    
    return jsonify({
        'tasks': [task.to_dict() for task in tasks]
    }), 200

@rider_bp.route('/tasks/history', methods=['GET'])
@jwt_required()
def get_task_history():
    """Get completed task history"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    
    # Get completed tasks
    tasks = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['delivered_to_lab', 'completed'])
    ).order_by(Appointment.created_at.desc()).limit(50).all()
    
    return jsonify({
        'tasks': [task.to_dict() for task in tasks]
    }), 200


@rider_bp.route('/tasks/<int:task_id>/on-way', methods=['PUT'])
@jwt_required()
def mark_on_way(task_id):
    """Mark rider is on the way. Enforces only one active rider_on_way task per rider.
    If another task is already rider_on_way, it is reverted to rider_accepted first.
    Returns 'switched_from_task_id' when a task was reverted.
    """
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status != 'rider_accepted':
        return jsonify({'msg': 'Invalid status transition'}), 400
    
    # Enforce only one rider_on_way at a time
    # Find any existing on-way task for this rider
    switched_from_task_id = None
    existing_on_way = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status == 'rider_on_way',
        Appointment.id != task_id
    ).first()
    
    if existing_on_way:
        # Revert the old on-way task back to accepted
        existing_on_way.status = 'rider_accepted'
        switched_from_task_id = existing_on_way.id
        # Audit log — revert
        log_task_status_change(
            appointment_id=existing_on_way.id,
            from_status='rider_on_way',
            to_status='rider_accepted',
            changed_by_role='system',
            rider_id=rider_id,
            latitude=rider.gps_latitude if rider else None,
            longitude=rider.gps_longitude if rider else None,
            metadata={'reason': 'task_switch', 'switched_to_task_id': task_id},
        )

    # Set new task as on-way
    appointment.status = 'rider_on_way'

    # Notify patient
    rider = Rider.query.get(rider_id)
    notify_patient_rider_on_way(appointment.user_id, appointment.id, rider.name)

    # Audit log
    log_task_status_change(
        appointment_id=appointment.id,
        from_status='rider_accepted',
        to_status='rider_on_way',
        changed_by_role='rider',
        changed_by_id=rider_id,
        rider_id=rider_id,
        latitude=rider.gps_latitude,
        longitude=rider.gps_longitude,
    )

    db.session.commit()

    return jsonify({
        'msg': 'Status updated to on way',
        'task': appointment.to_dict(),
        'switched_from_task_id': switched_from_task_id
    }), 200


@rider_bp.route('/tasks/<int:task_id>/arrive', methods=['PUT'])
@jwt_required()
def mark_arrived(task_id):
    """Mark rider arrived at patient location. Validates geo-fence (must be within 200m)."""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status != 'rider_on_way':
        return jsonify({'msg': 'Invalid status transition — must be rider_on_way first'}), 400
    
    # Geo-fence validation
    rider = Rider.query.get(rider_id)
    geo_error = _validate_geofence(
        rider.gps_latitude, rider.gps_longitude,
        appointment.patient_latitude, appointment.patient_longitude
    )
    if geo_error:
        return jsonify({'msg': geo_error, 'error': 'geofence_violation'}), 422
    
    appointment.status = 'rider_arrived'
    appointment.arrived_at = datetime.utcnow()

    # Audit log
    log_task_status_change(
        appointment_id=appointment.id,
        from_status='rider_on_way',
        to_status='rider_arrived',
        changed_by_role='rider',
        changed_by_id=rider_id,
        rider_id=rider_id,
        latitude=rider.gps_latitude,
        longitude=rider.gps_longitude,
    )

    db.session.commit()

    return jsonify({
        'msg': 'Marked as arrived at patient location',
        'task': appointment.to_dict()
    }), 200

@rider_bp.route('/tasks/<int:task_id>/collect', methods=['PUT'])
@jwt_required()
def collect_sample(task_id):
    """Mark sample collected (with photo upload and notes)"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status not in ('rider_on_way', 'rider_arrived'):
        return jsonify({'msg': 'Invalid status transition'}), 400
    
    data = request.form
    
    # Save sample photo
    if 'sample_photo' in request.files:
        file = request.files['sample_photo']
        try:
            photo_path = save_sample_photo(file, appointment.id)
            appointment.sample_photo = photo_path
        except ValueError as e:
            return jsonify({'msg': str(e)}), 400
    else:
        return jsonify({'msg': 'Sample photo is required'}), 400
    
    # Save collection notes — enforce minimum length for compliance (Phase 7.3)
    notes = (data.get('notes', '') or '').strip()
    if len(notes) < 5:
        return jsonify({'msg': 'Collection notes are required (minimum 5 characters).'}), 400
    appointment.collection_notes = notes
    
    # Save GPS coordinates
    if 'latitude' in data and 'longitude' in data:
        appointment.collection_latitude = float(data['latitude'])
        appointment.collection_longitude = float(data['longitude'])
    
    # Update status and timestamp
    prev_status = appointment.status
    appointment.status = 'sample_collected'
    appointment.sample_collected_at = datetime.utcnow()

    # Notify admin and patient
    rider = Rider.query.get(rider_id)
    notify_admin_sample_collected(appointment.id, rider.name, appointment.user.username)
    notify_patient_sample_collected(appointment.user_id, appointment.id)

    # Audit log
    log_task_status_change(
        appointment_id=appointment.id,
        from_status=prev_status,
        to_status='sample_collected',
        changed_by_role='rider',
        changed_by_id=rider_id,
        rider_id=rider_id,
        latitude=appointment.collection_latitude,
        longitude=appointment.collection_longitude,
        metadata={
            'photo_path': appointment.sample_photo,
            'notes_preview': notes[:80] if notes else None,
        },
    )

    db.session.commit()

    return jsonify({
        'msg': 'Sample collected successfully',
        'task': appointment.to_dict()
    }), 200

@rider_bp.route('/tasks/<int:task_id>/deliver', methods=['PUT'])
@jwt_required()
def deliver_to_lab(task_id):
    """Mark sample delivered to lab"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status != 'sample_collected':
        return jsonify({'msg': 'Invalid status transition'}), 400
    
    # Update status
    appointment.status = 'delivered_to_lab'
    appointment.delivered_at = datetime.utcnow()

    # Update rider availability
    rider = Rider.query.get(rider_id)
    rider.availability_status = 'available'

    # Notify admin
    notify_admin_sample_delivered(appointment.id, rider.name, appointment.user.username)

    # Audit log
    log_task_status_change(
        appointment_id=appointment.id,
        from_status='sample_collected',
        to_status='delivered_to_lab',
        changed_by_role='rider',
        changed_by_id=rider_id,
        rider_id=rider_id,
        latitude=rider.gps_latitude,
        longitude=rider.gps_longitude,
    )

    db.session.commit()

    return jsonify({
        'msg': 'Sample delivered to lab successfully',
        'task': appointment.to_dict()
    }), 200


@rider_bp.route('/tasks/<int:task_id>/logs', methods=['GET'])
@jwt_required()
def get_task_logs(task_id):
    """GET audit log for a specific task (Phase 8.3 — optional endpoint)."""
    claims = get_jwt()
    if claims.get('type') not in ('rider', 'admin'):
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)

    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404

    # Riders can only see logs for their own tasks
    if claims.get('type') == 'rider' and appointment.rider_id != rider_id:
        return jsonify({'msg': 'Access denied'}), 403

    return jsonify({
        'task_id': task_id,
        'logs': [log.to_dict() for log in appointment.logs]
    }), 200

@rider_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get rider notifications"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    notifications = get_rider_notifications(rider_id, unread_only)
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications]
    }), 200

@rider_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """Mark notification as read"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403
        
    # No need to get rider_id for this endpoint, just mark as read
    success = mark_notification_read(notification_id)
    
    if success:
        return jsonify({'msg': 'Notification marked as read'}), 200
    else:
        return jsonify({'msg': 'Notification not found'}), 404

