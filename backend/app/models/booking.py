from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from .base import db

class Booking(db.Model):
    __tablename__ = 'booking'
    id = db.Column(db.Integer, primary_key=True)
    booking_order_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    
    # Store Google Maps address info as JSON
    address_data = db.Column(db.JSON, nullable=False)
    
    scheduled_datetime = db.Column(db.DateTime, nullable=False, index=True)
    
    # Status: draft > pending > confirmed > collector_assigned > collector_arriving > sample_collected > processing > completed | cancelled | failed
    status = db.Column(db.String(30), default='pending', index=True)
    payment_status = db.Column(db.String(30), default='pending')
    notes = db.Column(db.Text)
    
    # Advanced scheduling and SLAs
    pickup_deadline = db.Column(db.DateTime, nullable=True)
    priority_level = db.Column(db.String(20), default='normal')
    
    # Idempotency token for this transaction
    idempotency_key = db.Column(db.String(100), unique=True, nullable=True)
    
    # Concurrency control
    version_id = db.Column(db.Integer, nullable=False, default=1)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __mapper_args__ = {
        'version_id_col': version_id
    }

    __table_args__ = (
        db.Index('idx_booking_scheduled_status', 'scheduled_datetime', 'status'),
    )

    # Relationships
    user = relationship('User', backref=db.backref('bookings', lazy=True))
    items = relationship('BookingItem', backref='booking', cascade='all, delete-orphan', lazy='joined')
    # If a rider is assigned to the booking as a whole:
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'), index=True)
    rider = relationship('Rider', backref=db.backref('assigned_bookings', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'booking_order_id': self.booking_order_id,
            'user_id': self.user_id,
            'patient_name': self.user.username if self.user else None,
            'address_data': self.address_data,
            'scheduled_datetime': self.scheduled_datetime.isoformat() if self.scheduled_datetime else None,
            'status': self.status,
            'payment_status': self.payment_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items': [item.to_dict() for item in self.items],
            'total_price': sum(item.price for item in self.items),
            'rider_id': self.rider_id
        }
