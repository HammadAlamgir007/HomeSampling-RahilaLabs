from datetime import datetime
from .base import db


class Rider(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Location tracking
    gps_latitude = db.Column(db.Float)
    gps_longitude = db.Column(db.Float)
    last_location_update = db.Column(db.DateTime)

    # Status and profile
    availability_status = db.Column(db.String(20), default='available')  # available, busy, offline
    profile_photo = db.Column(db.String(255))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_stats=False):
        from .appointment import Appointment  # local import to avoid circular dependency

        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'gps_latitude': self.gps_latitude,
            'gps_longitude': self.gps_longitude,
            'last_location_update': (
                self.last_location_update.isoformat() if self.last_location_update else None
            ),
            'availability_status': self.availability_status,
            'profile_photo': self.profile_photo,
            'created_at': self.created_at.isoformat(),
        }

        if include_stats:
            completed_tasks = Appointment.query.filter_by(
                rider_id=self.id, status='delivered_to_lab'
            ).count()
            pending_tasks = Appointment.query.filter(
                Appointment.rider_id == self.id,
                Appointment.status.in_([
                    'rider_accepted', 'rider_on_way',
                    'rider_arrived', 'sample_collected',
                ]),
            ).count()
            data['stats'] = {
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
            }

        return data
