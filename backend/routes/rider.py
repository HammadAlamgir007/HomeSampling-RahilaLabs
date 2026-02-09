from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from models import db, Rider, Appointment
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
    
    # Get tasks that are assigned, accepted, on way, or sample collected
    tasks = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected'])
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
    
    # Get completed or rejected tasks
    tasks = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['delivered_to_lab', 'completed', 'rider_rejected'])
    ).order_by(Appointment.created_at.desc()).limit(50).all()
    
    return jsonify({
        'tasks': [task.to_dict() for task in tasks]
    }), 200

@rider_bp.route('/tasks/<int:task_id>/accept', methods=['PUT'])
@jwt_required()
def accept_task(task_id):
    """Accept assigned task"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status != 'assigned_to_rider':
        return jsonify({'msg': 'Task cannot be accepted in current status'}), 400
    
    # Update appointment status
    appointment.status = 'rider_accepted'
    appointment.rider_accepted_at = datetime.utcnow()
    
    # Update rider status to busy
    rider = Rider.query.get(rider_id)
    rider.availability_status = 'busy'
    
    db.session.commit()
    
    return jsonify({
        'msg': 'Task accepted successfully',
        'task': appointment.to_dict()
    }), 200

@rider_bp.route('/tasks/<int:task_id>/reject', methods=['PUT'])
@jwt_required()
def reject_task(task_id):
    """Reject assigned task with reason"""
    claims = get_jwt()
    if claims.get('type') != 'rider':
        return jsonify({'msg': 'Unauthorized'}), 403

    rider_id = int(get_jwt_identity())
    data = request.get_json()
    reason = data.get('reason', 'No reason provided')
    
    appointment = Appointment.query.get(task_id)
    
    if not appointment:
        return jsonify({'msg': 'Task not found'}), 404
    
    if appointment.rider_id != rider_id:
        return jsonify({'msg': 'This task is not assigned to you'}), 403
    
    if appointment.status != 'assigned_to_rider':
        return jsonify({'msg': 'Task cannot be rejected in current status'}), 400
    
    # Update appointment status
    appointment.status = 'rider_rejected'
    appointment.rider_rejected_at = datetime.utcnow()
    appointment.rejection_reason = reason
    
    # Notify admin
    rider = Rider.query.get(rider_id)
    from utils.notifications import notify_admin_rider_rejected
    notify_admin_rider_rejected(appointment.id, rider.name, reason)
    
    db.session.commit()
    
    return jsonify({
        'msg': 'Task rejected',
        'task': appointment.to_dict()
    }), 200

@rider_bp.route('/tasks/<int:task_id>/on-way', methods=['PUT'])
@jwt_required()
def mark_on_way(task_id):
    """Mark rider is on the way"""
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
    
    # Update status
    appointment.status = 'rider_on_way'
    
    # Notify patient
    rider = Rider.query.get(rider_id)
    notify_patient_rider_on_way(appointment.user_id, appointment.id, rider.name)
    
    db.session.commit()
    
    return jsonify({
        'msg': 'Status updated to on way',
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
    
    if appointment.status != 'rider_on_way':
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
    
    # Save collection notes
    appointment.collection_notes = data.get('notes', '')
    
    # Save GPS coordinates
    if 'latitude' in data and 'longitude' in data:
        appointment.collection_latitude = float(data['latitude'])
        appointment.collection_longitude = float(data['longitude'])
    
    # Update status and timestamp
    appointment.status = 'sample_collected'
    appointment.sample_collected_at = datetime.utcnow()
    
    # Notify admin and patient
    rider = Rider.query.get(rider_id)
    notify_admin_sample_collected(appointment.id, rider.name, appointment.user.username)
    notify_patient_sample_collected(appointment.user_id, appointment.id)
    
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
    
    db.session.commit()
    
    return jsonify({
        'msg': 'Sample delivered to lab successfully',
        'task': appointment.to_dict()
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

