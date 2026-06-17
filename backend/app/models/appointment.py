from datetime import datetime, timezone
from .base import db


class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    test_id = db.Column(db.Integer, db.ForeignKey('test.id'), nullable=True) # Now nullable for 1-to-1 Booking architecture
    appointment_date = db.Column(db.DateTime, nullable=False)

    booking_order_id = db.Column(db.String(50), index=True, nullable=True)

    # Status: pending > rider_accepted > rider_on_way > rider_arrived > sample_collected > delivered_to_lab > completed
    status = db.Column(db.String(30), default='pending', index=True)
    address = db.Column(db.String(200), nullable=False)
    report_path = db.Column(db.String(255))  # Path to uploaded PDF

    VALID_TRANSITIONS = {
        'pending': ['confirmed', 'rider_accepted', 'cancelled'],
        'confirmed': ['rider_accepted', 'cancelled'],
        'rider_accepted': ['rider_on_way', 'rider_rejected', 'cancelled'],
        'rider_on_way': ['rider_arrived', 'cancelled'],
        'rider_arrived': ['sample_collected', 'cancelled'],
        'sample_collected': ['delivered_to_lab', 'cancelled'],
        'delivered_to_lab': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'rider_rejected': ['rider_accepted', 'cancelled']
    }

    # Rider assignment
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'), index=True)
    rider_assigned_at = db.Column(db.DateTime)
    rider_accepted_at = db.Column(db.DateTime)
    rider_rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.String(200))

    # Patient location (for geo-fencing validation)
    patient_latitude = db.Column(db.Float, nullable=True)
    patient_longitude = db.Column(db.Float, nullable=True)

    # Arrival tracking
    arrived_at = db.Column(db.DateTime)

    # Sample collection
    sample_collected_at = db.Column(db.DateTime)
    sample_photo = db.Column(db.String(255))
    collection_notes = db.Column(db.Text)
    collection_latitude = db.Column(db.Float)
    collection_longitude = db.Column(db.Float)

    # Delivery tracking
    delivered_at = db.Column(db.DateTime)

    # SLA fields
    pickup_deadline = db.Column(db.DateTime, nullable=True)
    delivery_deadline = db.Column(db.DateTime, nullable=True)
    priority_level = db.Column(db.String(20), default='normal')  # normal, urgent, critical

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('idx_appointment_date_status', 'appointment_date', 'status'),
        db.Index('idx_appointment_rider_status', 'rider_id', 'status'),
    )

    # Relationships
    user = db.relationship('User', backref=db.backref('appointments', lazy=True))
    test = db.relationship('Test', backref=db.backref('appointments', lazy=True))
    rider = db.relationship('Rider', backref=db.backref('assignments', lazy=True))

    def to_dict(self, include_rider=True):
        from .booking import Booking
        test_name = None
        test_price = None
        
        if self.test:
            test_name = self.test.name
            test_price = self.test.price
        elif self.booking_order_id:
            booking = Booking.query.filter_by(booking_order_id=self.booking_order_id).first()
            if booking and booking.items:
                test_name = " + ".join([item.test.name for item in booking.items if item.test])
                test_price = sum([item.price for item in booking.items])

        data = {
            'id': self.id,
            'booking_order_id': self.booking_order_id,
            'user_id': self.user_id,
            'test_id': self.test_id,
            'test_name': test_name,
            'test_price': test_price,
            'patient_name': self.user.username if self.user else "Unknown",
            'patient_phone': self.user.phone if self.user else None,
            'patient_city': self.user.city if self.user else None,
            'patient_email': self.user.email if self.user else None,
            'patient_mrn': self.user.mrn if self.user else None,
            'date': self.appointment_date.isoformat(),
            'status': self.status,
            'address': self.address,
            'patient_latitude': self.patient_latitude,
            'patient_longitude': self.patient_longitude,
            'report_path': self.report_path,
            'created_at': self.created_at.isoformat(),
            'sample_photo': self.sample_photo,
            'collection_notes': self.collection_notes,
            'sample_collected_at': (
                self.sample_collected_at.isoformat() if self.sample_collected_at else None
            ),
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'pickup_deadline': self.pickup_deadline.isoformat() if self.pickup_deadline else None,
            'delivery_deadline': (
                self.delivery_deadline.isoformat() if self.delivery_deadline else None
            ),
            'priority_level': self.priority_level,
        }

        if include_rider and self.rider:
            data['rider'] = {
                'id': self.rider.id,
                'name': self.rider.name,
                'phone': self.rider.phone,
                'email': self.rider.email,
                'availability_status': self.rider.availability_status,
                'profile_photo': self.rider.profile_photo,
                'gps_latitude': self.rider.gps_latitude,
                'gps_longitude': self.rider.gps_longitude,
            }
            data['rider_assigned_at'] = (
                self.rider_assigned_at.isoformat() if self.rider_assigned_at else None
            )
            data['rider_accepted_at'] = (
                self.rider_accepted_at.isoformat() if self.rider_accepted_at else None
            )

        return data

    def transition_status(self, new_status, changed_by_role, changed_by_id=None, rider_id=None, **kwargs):
        """Safely transition the appointment to a new status and log it."""
        if new_status not in self.VALID_TRANSITIONS.get(self.status, []):
            raise ValueError(f"Invalid status transition from {self.status} to {new_status}")
            
        old_status = self.status
        self.status = new_status
        now = datetime.now(timezone.utc)
        
        if new_status == 'rider_accepted':
            self.rider_accepted_at = now
        elif new_status == 'rider_rejected':
            self.rider_rejected_at = now
        elif new_status == 'rider_arrived':
            self.arrived_at = now
        elif new_status == 'sample_collected':
            self.sample_collected_at = now
        elif new_status == 'delivered_to_lab':
            self.delivered_at = now

        log_task_status_change(
            appointment_id=self.id,
            from_status=old_status,
            to_status=new_status,
            changed_by_role=changed_by_role,
            changed_by_id=changed_by_id,
            rider_id=rider_id or self.rider_id,
            **kwargs
        )


def log_task_status_change(
    appointment_id,
    from_status,
    to_status,
    changed_by_role,
    changed_by_id=None,
    rider_id=None,
    latitude=None,
    longitude=None,
    metadata=None,
):
    """Convenience function: create and add a TaskLog entry (caller must commit)."""
    import json as _json
    from .task_log import TaskLog

    entry = TaskLog(
        appointment_id=appointment_id,
        rider_id=rider_id,
        from_status=from_status,
        to_status=to_status,
        changed_by_role=changed_by_role,
        changed_by_id=changed_by_id,
        latitude=latitude,
        longitude=longitude,
        log_meta=_json.dumps(metadata) if metadata else None,
    )
    db.session.add(entry)
