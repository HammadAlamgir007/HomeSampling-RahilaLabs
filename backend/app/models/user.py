from datetime import datetime
from .base import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20), default='patient')  # patient, admin, rider

    # Profile fields
    mrn = db.Column(db.String(50), unique=True, nullable=True)  # Medical Record Number
    phone = db.Column(db.String(20))
    city = db.Column(db.String(50))
    status = db.Column(db.String(20), default='active')

    # Auth & security fields
    is_verified = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'mrn': self.mrn,
            'phone': self.phone,
            'city': self.city,
            'status': self.status,
            'is_verified': self.is_verified,
        }
