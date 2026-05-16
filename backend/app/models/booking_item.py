from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from .base import db

class BookingItem(db.Model):
    __tablename__ = 'booking_item'
    id = db.Column(db.Integer, primary_key=True)
    
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False, index=True)
    test_id = db.Column(db.Integer, db.ForeignKey('test.id'), nullable=False)
    
    price = db.Column(db.Float, nullable=False)
    item_status = db.Column(db.String(30), default='pending')
    
    report_path = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    test = relationship('Test', backref=db.backref('booking_items', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'test_id': self.test_id,
            'test_name': self.test.name if self.test else None,
            'price': self.price,
            'item_status': self.item_status,
            'report_path': self.report_path
        }
