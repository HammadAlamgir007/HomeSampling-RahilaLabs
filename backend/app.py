from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Test

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

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

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
