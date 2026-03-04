import json as _json
from datetime import datetime
from .base import db


class TaskLog(db.Model):
    """Immutable audit trail of every task status transition."""
    __tablename__ = 'task_log'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'), nullable=False, index=True)
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'), nullable=True)

    # Status transition
    from_status = db.Column(db.String(30), nullable=True)   # null for the very first assignment
    to_status = db.Column(db.String(30), nullable=False)

    # Who triggered the change
    changed_by_role = db.Column(db.String(20), nullable=False)  # 'rider' | 'admin' | 'system'
    changed_by_id = db.Column(db.Integer, nullable=True)        # rider / user id

    # Rider GPS at time of change (for geo-audit)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # Free-form metadata (JSON string — notes, photo path, etc.)
    log_meta = db.Column(db.Text, nullable=True)  # 'metadata' is reserved by SQLAlchemy

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointment = db.relationship(
        'Appointment',
        backref=db.backref('logs', lazy=True, order_by='TaskLog.created_at'),
    )
    rider = db.relationship('Rider', backref=db.backref('task_logs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'rider_id': self.rider_id,
            'from_status': self.from_status,
            'to_status': self.to_status,
            'changed_by_role': self.changed_by_role,
            'changed_by_id': self.changed_by_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'metadata': _json.loads(self.log_meta) if self.log_meta else None,
            'created_at': self.created_at.isoformat(),
        }
