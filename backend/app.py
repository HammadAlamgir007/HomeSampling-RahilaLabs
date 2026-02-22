from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Test, Appointment, Rider
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
app.config.from_object(Config)

# Configure Logging
if not app.debug:
    file_handler = RotatingFileHandler('backend_log.txt', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Rahila Labs startup')

# JWT Secure Cookie Configuration
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = False # Set to True in production (HTTPS)
app.config['JWT_COOKIE_CSRF_PROTECT'] = True # Requires X-CSRF-TOKEN header for state-changing requests
app.config['JWT_CSRF_IN_COOKIES'] = True # Creates a csrf_access_token cookie automatically

from utils.extensions import limiter
limiter.init_app(app)

# Allow all origins, methods, and headers for development
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN"], "supports_credentials": True}})

@app.after_request
def add_cors_headers(response):
    # For local development with Flutter Web, we need explicit headers on preflight
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-TOKEN'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

db.init_app(app)
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid Token: {error}")
    return jsonify({'msg': 'Invalid token', 'error': error}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Missing Token: {error}")
    return jsonify({'msg': 'Missing token', 'error': error}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"Expired Token: {jwt_payload}")
    return jsonify({'msg': 'Token has expired', 'error': 'token_expired'}), 401

from routes.auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/api/auth')

from routes.patient import patient_bp
app.register_blueprint(patient_bp, url_prefix='/api/patient')

from routes.admin import admin_bp
app.register_blueprint(admin_bp, url_prefix='/api/admin')

from routes.rider import rider_bp
app.register_blueprint(rider_bp, url_prefix='/api/rider')

from routes.contact import contact_bp
app.register_blueprint(contact_bp, url_prefix='/api')

@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'message': 'Rahila Labs Backend is running'})

def init_db():
    with app.app_context():
        db.create_all()
        # Seed some data if empty
        if not Test.query.first():
            tests = [
                Test(name="Complete Blood Count", description="Full blood work analysis", price=1500),
                Test(name="Thyroid Profile", description="Thyroid function tests", price=2000),
                Test(name="Lipid Profile", description="Cholesterol and lipid levels", price=1800),
                Test(name="Liver Function", description="Liver health assessment", price=2200),
            ]
            db.session.bulk_save_objects(tests)
            db.session.commit()
            print("Seeded initial tests")

        # Seed Admin User
        from werkzeug.security import generate_password_hash
        from datetime import datetime
        if not User.query.filter_by(role='admin').first():
            admin = User(
                username="admin", 
                email="admin@rahilalabs.com", 
                password_hash=generate_password_hash("admin123"), 
                role="admin",
                status="active",
                is_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Seeded admin user")
        
        # Seed Demo Patient & Appointment
        if not User.query.filter_by(role='patient').first():
            patient = User(username="ali", email="ali@example.com", password_hash=generate_password_hash("password"), role="patient", phone="1234567890", city="Lahore", is_verified=True)
            db.session.add(patient)
            db.session.commit()
            
            test = Test.query.first()
            if test:
                appt = Appointment(
                    user_id=patient.id, 
                    test_id=test.id, 
                    appointment_date=datetime.utcnow(), 
                    status="pending", 
                    address="123 Main St, Lahore"
                )
                db.session.add(appt)
                db.session.commit()
                print("Seeded demo appointment")
        
        # Seed Demo Riders
        if not Rider.query.first():
            riders = [
                Rider(
                    name="Ahmed Khan",
                    email="ahmed@rider.com",
                    phone="03001234567",
                    password_hash=generate_password_hash("rider123"),
                    availability_status="available"
                ),
                Rider(
                    name="Hassan Ali",
                    email="hassan@rider.com",
                    phone="03009876543",
                    password_hash=generate_password_hash("rider123"),
                    availability_status="available"
                )
            ]
            db.session.bulk_save_objects(riders)
            db.session.commit()
            print("Seeded demo riders")


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', debug=True, port=5000)
