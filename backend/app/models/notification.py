from datetime import datetime
from .base import db


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Recipient (can be user, rider, or admin)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'))

    # Related appointment
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'))

    # Notification content
    message = db.Column(db.String(255), nullable=False)
    notification_type = db.Column(db.String(50))  # task_assigned, rider_on_way, sample_collected, etc.

    # Status
    is_read = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))
    rider = db.relationship('Rider', backref=db.backref('notifications', lazy=True))
    appointment = db.relationship('Appointment', backref=db.backref('notifications', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'appointment_id': self.appointment_id,
        }
