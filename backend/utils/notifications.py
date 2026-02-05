from models import db, Notification
from datetime import datetime

def create_notification(user_id=None, rider_id=None, appointment_id=None, message="", notification_type=""):
    """Create a notification record"""
    notification = Notification(
        user_id=user_id,
        rider_id=rider_id,
        appointment_id=appointment_id,
        message=message,
        notification_type=notification_type,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.session.add(notification)
    db.session.commit()
    return notification

def notify_rider_assignment(rider_id, appointment_id, patient_name, address):
    """Notify rider of new task assignment"""
    message = f"New task assigned: Collect sample from {patient_name} at {address}"
    return create_notification(
        rider_id=rider_id,
        appointment_id=appointment_id,
        message=message,
        notification_type="task_assigned"
    )

def notify_patient_rider_assigned(user_id, appointment_id, rider_name):
    """Notify patient that a rider has been assigned"""
    message = f"Rider {rider_name} has been assigned to collect your sample"
    return create_notification(
        user_id=user_id,
        appointment_id=appointment_id,
        message=message,
        notification_type="rider_assigned"
    )

def notify_patient_rider_on_way(user_id, appointment_id, rider_name):
    """Notify patient that rider is on the way"""
    message = f"Rider {rider_name} is on the way to collect your sample"
    return create_notification(
        user_id=user_id,
        appointment_id=appointment_id,
        message=message,
        notification_type="rider_on_way"
    )

def notify_admin_sample_collected(appointment_id, rider_name, patient_name):
    """Notify admin that sample has been collected"""
    from models import User
    
    # Get all admin users
    admins = User.query.filter_by(role='admin').all()
    
    message = f"Sample collected by {rider_name} from {patient_name}"
    
    notifications = []
    for admin in admins:
        notification = create_notification(
            user_id=admin.id,
            appointment_id=appointment_id,
            message=message,
            notification_type="sample_collected"
        )
        notifications.append(notification)
    
    return notifications

def notify_admin_sample_delivered(appointment_id, rider_name, patient_name):
    """Notify admin that sample has been delivered to lab"""
    from models import User
    
    # Get all admin users
    admins = User.query.filter_by(role='admin').all()
    
    message = f"Sample from {patient_name} delivered to lab by {rider_name}"
    
    notifications = []
    for admin in admins:
        notification = create_notification(
            user_id=admin.id,
            appointment_id=appointment_id,
            message=message,
            notification_type="sample_delivered"
        )
        notifications.append(notification)
    
    return notifications

def notify_patient_sample_collected(user_id, appointment_id):
    """Notify patient that their sample has been collected"""
    message = "Your sample has been collected and is being delivered to the lab"
    return create_notification(
        user_id=user_id,
        appointment_id=appointment_id,
        message=message,
        notification_type="sample_collected"
    )

def notify_admin_rider_rejected(appointment_id, rider_name, reason):
    """Notify admin that rider rejected the task"""
    from models import User
    
    # Get all admin users
    admins = User.query.filter_by(role='admin').all()
    
    message = f"Rider {rider_name} rejected task. Reason: {reason}"
    
    notifications = []
    for admin in admins:
        notification = create_notification(
            user_id=admin.id,
            appointment_id=appointment_id,
            message=message,
            notification_type="rider_rejected"
        )
        notifications.append(notification)
    
    return notifications

def get_user_notifications(user_id, unread_only=False):
    """Get notifications for a user"""
    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)
    return query.order_by(Notification.created_at.desc()).all()

def get_rider_notifications(rider_id, unread_only=False):
    """Get notifications for a rider"""
    query = Notification.query.filter_by(rider_id=rider_id)
    if unread_only:
        query = query.filter_by(is_read=False)
    return query.order_by(Notification.created_at.desc()).all()

def mark_notification_read(notification_id):
    """Mark a notification as read"""
    notification = Notification.query.get(notification_id)
    if notification:
        notification.is_read = True
        db.session.commit()
        return True
    return False

def mark_all_read(user_id=None, rider_id=None):
    """Mark all notifications as read for a user or rider"""
    if user_id:
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    elif rider_id:
        Notification.query.filter_by(rider_id=rider_id, is_read=False).update({'is_read': True})
    
    db.session.commit()
    return True
