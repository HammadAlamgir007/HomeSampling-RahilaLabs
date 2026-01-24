from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Test

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3005"}})

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
                status="active"
            )
            db.session.add(admin)
            db.session.commit()
            print("Seeded admin user")
        
        # Seed Demo Patient & Appointment
        if not User.query.filter_by(role='patient').first():
            patient = User(username="ali", email="ali@example.com", password_hash=generate_password_hash("password"), role="patient", phone="1234567890", city="Lahore")
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


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
