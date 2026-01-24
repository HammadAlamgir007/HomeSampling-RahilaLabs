from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from models import db, User, Appointment, Test

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password) and user.role == 'admin':
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Admin login successful',
            'token': access_token,
            'user': user.to_dict()
        }), 200

    return jsonify({'error': 'Invalid credentials or unauthorized'}), 401

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    # Verify admin role
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403

    total_bookings = Appointment.query.count()
    pending_bookings = Appointment.query.filter_by(status='pending').count()
    total_patients = User.query.filter_by(role='patient').count()
    # Mock revenue for now (or calculate from appointments * test price)
    # real calculation:
    appointments = Appointment.query.all()
    total_revenue = sum(appt.test.price for appt in appointments if appt.test and appt.status != 'cancelled') if appointments else 0
    
    return jsonify({
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'total_patients': total_patients,
        'total_tests': Test.query.count(),
        'revenue': total_revenue
    }), 200

@admin_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    appointments = Appointment.query.order_by(Appointment.appointment_date.desc()).all()
    return jsonify([appt.to_dict() for appt in appointments]), 200

@admin_bp.route('/appointments/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(id):
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['pending', 'confirmed', 'collected', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400

    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    appointment.status = new_status
    db.session.commit()

    return jsonify({'message': 'Status updated', 'appointment': appointment.to_dict()}), 200

@admin_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    patients = User.query.filter_by(role='patient').all()
    return jsonify([p.to_dict() for p in patients]), 200

# --- Test Management ---

@admin_bp.route('/tests', methods=['GET'])
@jwt_required()
def get_tests():
    # Admin check
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    tests = Test.query.all()
    return jsonify([t.to_dict() for t in tests]), 200

@admin_bp.route('/tests', methods=['POST'])
@jwt_required()
def add_test():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    new_test = Test(
        name=data['name'],
        description=data.get('description', ''),
        price=float(data['price'])
    )
    db.session.add(new_test)
    db.session.commit()
    return jsonify({'message': 'Test added', 'test': new_test.to_dict()}), 201

@admin_bp.route('/tests/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_test(id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    test = Test.query.get(id)
    if not test:
        return jsonify({'error': 'Test not found'}), 404
        
    db.session.delete(test)
    db.session.commit()
    return jsonify({'message': 'Test deleted successfully'}), 200

# --- Reports ---
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads/reports'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin_bp.route('/upload-report/<int:appointment_id>', methods=['POST'])
@jwt_required()
def upload_report(appointment_id):
    # Check if admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(f"report_{appointment_id}_{file.filename}")
        
        # Ensure directory exists
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
            
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        
        # Update db
        appointment = Appointment.query.get(appointment_id)
        if appointment:
            appointment.report_path = filename
            appointment.status = 'completed' # Auto-complete
            db.session.commit()
            return jsonify({'message': 'File uploaded', 'path': filename}), 200
            
    return jsonify({'error': 'File type not allowed'}), 400
