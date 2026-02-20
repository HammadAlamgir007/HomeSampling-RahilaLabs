from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20), default='patient')  # patient, admin, rider
    
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
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'gps_latitude': self.gps_latitude,
            'gps_longitude': self.gps_longitude,
            'last_location_update': self.last_location_update.isoformat() if self.last_location_update else None,
            'availability_status': self.availability_status,
            'profile_photo': self.profile_photo,
            'created_at': self.created_at.isoformat()
        }
        
        if include_stats:
            completed_tasks = Appointment.query.filter_by(
                rider_id=self.id, 
                status='delivered_to_lab'
            ).count()
            pending_tasks = Appointment.query.filter(
                Appointment.rider_id == self.id,
                Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected'])
            ).count()
            
            data['stats'] = {
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks
            }
        
        return data

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
    
    # Status: pending, assigned_to_rider, rider_accepted, rider_rejected, rider_on_way, sample_collected, delivered_to_lab, completed
    status = db.Column(db.String(30), default='pending')
    address = db.Column(db.String(200), nullable=False)
    report_path = db.Column(db.String(255))  # Path to uploaded PDF
    
    # Rider assignment fields
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'))
    rider_assigned_at = db.Column(db.DateTime)
    rider_accepted_at = db.Column(db.DateTime)
    rider_rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.String(200))
    
    # Sample collection fields
    sample_collected_at = db.Column(db.DateTime)
    sample_photo = db.Column(db.String(255))
    collection_notes = db.Column(db.Text)
    collection_latitude = db.Column(db.Float)
    collection_longitude = db.Column(db.Float)
    
    # Delivery tracking
    delivered_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('appointments', lazy=True))
    test = db.relationship('Test', backref=db.backref('appointments', lazy=True))
    rider = db.relationship('Rider', backref=db.backref('assignments', lazy=True))

    def to_dict(self, include_rider=True):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'test_id': self.test_id,
            'test_name': self.test.name if self.test else None,
            'test_price': self.test.price if self.test else None,
            'patient_name': self.user.username if self.user else "Unknown",
            'patient_phone': self.user.phone if self.user else None,
            'patient_city': self.user.city if self.user else None,
            'patient_email': self.user.email if self.user else None,
            'date': self.appointment_date.isoformat(),
            'status': self.status,
            'address': self.address,
            'report_path': self.report_path,
            'created_at': self.created_at.isoformat(),
            'sample_photo': self.sample_photo,
            'collection_notes': self.collection_notes,
            'sample_collected_at': self.sample_collected_at.isoformat() if self.sample_collected_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
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
                'gps_longitude': self.rider.gps_longitude
            }
            data['rider_assigned_at'] = self.rider_assigned_at.isoformat() if self.rider_assigned_at else None
            data['rider_accepted_at'] = self.rider_accepted_at.isoformat() if self.rider_accepted_at else None
        
        return data

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
            'appointment_id': self.appointment_id
        }
