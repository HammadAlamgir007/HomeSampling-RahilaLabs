from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='patient')  # patient, admin
    
    # Profile fields
    phone = db.Column(db.String(20))
    city = db.Column(db.String(50))
    status = db.Column(db.String(20), default='active')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'city': self.city,
            'status': self.status
        }

class Test(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price
        }

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    test_id = db.Column(db.Integer, db.ForeignKey('test.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed
    address = db.Column(db.String(200), nullable=False)
    report_path = db.Column(db.String(255))  # Path to uploaded PDF
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('appointments', lazy=True))
    test = db.relationship('Test', backref=db.backref('appointments', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'test_id': self.test_id,
            'test_name': self.test.name if self.test else None,
            'patient_name': self.user.username if self.user else "Unknown",
            'patient_phone': self.user.phone,
            'patient_city': self.user.city,
            'patient_email': self.user.email,
            'date': self.appointment_date.isoformat(),
            'status': self.status,
            'address': self.address,
            'report_path': self.report_path
        }
