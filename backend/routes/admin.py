from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from datetime import datetime
from models import db, User, Appointment, Test, Rider, log_task_status_change

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password) and user.role == 'admin':
        access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
        return jsonify({
            'message': 'Admin login successful',
            'token': access_token,
            'user': user.to_dict()
        }), 200

    return jsonify({'error': 'Invalid credentials or unauthorized'}), 401

# ─── Admin Profile / Settings ────────────────────────────────────────────────

@admin_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_admin_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({
        'id':       user.id,
        'username': user.username,
        'email':    user.email,
        'phone':    user.phone or '',
        'city':     user.city  or '',
    }), 200

@admin_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_admin_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}
    if 'username' in data:
        user.username = data['username'].strip()
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
    if 'city' in data:
        user.city = data['city'].strip()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

@admin_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_admin_password():
    from werkzeug.security import generate_password_hash, check_password_hash as chk
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}
    current_pw  = data.get('current_password', '')
    new_pw      = data.get('new_password', '')
    confirm_pw  = data.get('confirm_password', '')

    if not chk(user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if new_pw != confirm_pw:
        return jsonify({'error': 'Passwords do not match'}), 400

    user.password_hash = generate_password_hash(new_pw)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update password'}), 500

    return jsonify({'message': 'Password changed successfully'}), 200

# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    # Verify admin role
    claims = get_jwt()
    if claims.get('type') != 'user':
        return jsonify({'error': 'Unauthorized access'}), 403
        
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

@admin_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_dashboard_activity():
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    activity = []

    # Get recent appointments (limit 5)
    appointments = Appointment.query.order_by(Appointment.created_at.desc()).limit(5).all()
    for appt in appointments:
        patient_name = appt.user.username if appt.user else "Unknown Patient"
        activity.append({
            'action': f"New appointment booked by {patient_name}",
            'time': appt.created_at,
            'type': 'appointment'
        })
    
    # Get recent new patients (limit 5)
    new_patients = User.query.filter_by(role='patient').order_by(User.created_at.desc()).limit(5).all()
    for patient in new_patients:
        activity.append({
            'action': f"New patient registered: {patient.username}",
            'time': patient.created_at,
            'type': 'user'
        })

    # Sort combined activity by time desc
    activity.sort(key=lambda x: x['time'], reverse=True)
    
    # Format time for display (simplified relative time logic could be added here or frontend)
    # For now sending ISO string
    formatted_activity = []
    for item in activity[:10]: # Return top 10 combined
        # Simple relative time logic for demo
        import datetime
        now = datetime.datetime.utcnow()
        diff = now - item['time']
        
        if diff.days > 0:
            time_str = f"{diff.days} days ago"
        elif diff.seconds // 3600 > 0:
            time_str = f"{diff.seconds // 3600} hours ago"
        elif diff.seconds // 60 > 0:
            time_str = f"{diff.seconds // 60} mins ago"
        else:
            time_str = "Just now"

        formatted_activity.append({
            'action': item['action'],
            'time': time_str
        })

    return jsonify(formatted_activity), 200

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """Return all appointments that have an uploaded report"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    search = request.args.get('search', '').strip().lower()

    # Only include appointments that have a report file uploaded
    appointments = Appointment.query.filter(
        Appointment.report_path.isnot(None),
        Appointment.report_path != ''
    ).order_by(Appointment.created_at.desc()).all()

    result = []
    for appt in appointments:
        patient_name = appt.user.username if appt.user else 'Unknown'
        test_name    = appt.test.name if appt.test else 'Unknown Test'

        # Apply optional search filter
        if search and search not in patient_name.lower() and search not in test_name.lower():
            continue

        result.append({
            'id':               appt.id,
            'booking_order_id': getattr(appt, 'booking_order_id', None),
            'patient_id':       appt.user_id,
            'patient_name':     patient_name,
            'patient_email':    appt.user.email if appt.user else None,
            'test_name':        test_name,
            'test_price':       appt.test.price if appt.test else None,
            'status':           appt.status,
            'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
            'created_at':       appt.created_at.isoformat() if appt.created_at else None,
            'report_path':      appt.report_path,
            'address':          getattr(appt, 'address', None),
        })

    return jsonify({
        'reports': result,
        'total': len(result)
    }), 200

@admin_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)

        pagination = Appointment.query.order_by(Appointment.appointment_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        appointments = pagination.items
        
        return jsonify({
            'appointments': [appt.to_dict() for appt in appointments],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception as e:
        print(f"Admin: Error fetching appointments: {e}")
        return jsonify({'error': str(e)}), 500

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

    try:
        appointment.status = new_status   # ← was missing!
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update status due to a database error.'}), 500

    return jsonify({'message': 'Status updated', 'appointment': appointment.to_dict()}), 200

@admin_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    # Verify admin
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)

    pagination = User.query.filter_by(role='patient').order_by(User.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'users': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@admin_bp.route('/patients/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_detail(patient_id):
    """Get full patient profile + appointment history for admin view"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    patient = User.query.get(patient_id)
    if not patient or patient.role != 'patient':
        return jsonify({'error': 'Patient not found'}), 404

    # Fetch all appointments for this patient, newest first
    appointments = Appointment.query.filter_by(user_id=patient_id)\
        .order_by(Appointment.created_at.desc()).all()

    # Build appointment list with test name included
    appointment_list = []
    for appt in appointments:
        appointment_list.append({
            'id': appt.id,
            'booking_order_id': getattr(appt, 'booking_order_id', None),
            'test_name': appt.test.name if appt.test else 'Unknown Test',
            'test_price': appt.test.price if appt.test else None,
            'status': appt.status,
            'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
            'address': getattr(appt, 'address', None),
            'city': getattr(appt, 'city', None),
            'created_at': appt.created_at.isoformat() if appt.created_at else None,
            'report_path': getattr(appt, 'report_path', None),
            'rider_name': appt.rider.name if getattr(appt, 'rider', None) else None,
        })

    # Summary stats
    total = len(appointments)
    pending  = sum(1 for a in appointments if a.status == 'pending')
    confirmed = sum(1 for a in appointments if a.status == 'confirmed')
    completed = sum(1 for a in appointments if a.status == 'completed')
    cancelled = sum(1 for a in appointments if a.status == 'cancelled')

    return jsonify({
        'patient': {
            'id': patient.id,
            'username': patient.username,
            'email': patient.email,
            'phone': patient.phone,
            'city': patient.city,
            'mrn': getattr(patient, 'mrn', None),
            'status': patient.status,
            'is_verified': getattr(patient, 'is_verified', False),
            'created_at': patient.created_at.isoformat() if getattr(patient, 'created_at', None) else None,
        },
        'stats': {
            'total': total,
            'pending': pending,
            'confirmed': confirmed,
            'completed': completed,
            'cancelled': cancelled,
        },
        'appointments': appointment_list
    }), 200

@admin_bp.route('/patients', methods=['POST'])
@jwt_required()
def create_patient():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    
    # Validation
    required_fields = ['username', 'email', 'password', 'phone']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    from werkzeug.security import generate_password_hash
    from utils.identifiers import generate_mrn
    
    new_patient = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        phone=data['phone'],
        city=data.get('city', ''),
        role='patient',
        status='active',
        is_verified=True,
        mrn=generate_mrn()
    )
    
    try:
        db.session.add(new_patient)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create patient due to a database error.'}), 500
    
    return jsonify({'message': 'Patient created successfully', 'user': new_patient.to_dict()}), 201

@admin_bp.route('/patients/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_or_delete_patient(id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    patient = User.query.get(id)
    if not patient or patient.role != 'patient':
        return jsonify({'error': 'Patient not found'}), 404
        
    if request.method == 'DELETE':
        # Delete associated appointments to avoid IntegrityError (Foreign Key constraint)
        appointments = Appointment.query.filter_by(user_id=id).all()
        for appt in appointments:
            db.session.delete(appt)
            
        db.session.delete(patient)
        db.session.commit()
        return jsonify({'message': 'Patient deleted successfully'}), 200

    # Handle PUT request
    data = request.get_json()
    if 'username' in data:
        patient.username = data['username']
    if 'email' in data:
        patient.email = data['email'] # Note: Should check uniqueness
    if 'phone' in data:
        patient.phone = data['phone']
    if 'city' in data:
        patient.city = data['city']
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update patient due to a database error.'}), 500
    return jsonify({'message': 'Patient updated', 'user': patient.to_dict()}), 200

@admin_bp.route('/appointments/<int:id>', methods=['PUT'])
@jwt_required()
def update_appointment(id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
        
    data = request.get_json()
    # Allow updating date, status, test, address
    if 'date' in data:
        from datetime import datetime
        try:
             date_str = data['date'].replace('Z', '+00:00')
             appointment.appointment_date = datetime.fromisoformat(date_str)
        except:
             pass
    if 'status' in data:
        appointment.status = data['status']
    if 'address' in data:
        appointment.address = data['address']
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update appointment due to a database error.'}), 500
    return jsonify({'message': 'Appointment updated', 'appointment': appointment.to_dict()}), 200

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
    try:
        db.session.add(new_test)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add test due to a database error.'}), 500
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
        
    try:
        db.session.delete(test)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete test due to a database error.'}), 500
    return jsonify({'message': 'Test deleted successfully'}), 200

@admin_bp.route('/tests/<int:id>', methods=['PUT'])
@jwt_required()
def update_test(id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    test = Test.query.get(id)
    if not test:
        return jsonify({'error': 'Test not found'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        test.name = data['name'].strip()
    if 'price' in data:
        try:
            test.price = float(data['price'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Price must be a number'}), 400
    if 'description' in data:
        test.description = data['description'].strip()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update test'}), 500

    return jsonify({'message': 'Test updated', 'test': test.to_dict()}), 200

# --- Reports ---
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads/reports'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

import uuid

# Size limits
MAX_IMAGE_SIZE = 2 * 1024 * 1024 # 2MB
MAX_DOC_SIZE = 5 * 1024 * 1024 # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin_bp.route('/upload-report/<int:appointment_id>', methods=['POST'])
@jwt_required()
def upload_report(appointment_id):
    from flask import current_app # Import needed here
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
        # Size validation
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0, os.SEEK_SET)

        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext in ['png', 'jpg', 'jpeg'] and file_length > MAX_IMAGE_SIZE:
             return jsonify({'error': 'Image file size exceeds 2MB limit'}), 400
        elif ext == 'pdf' and file_length > MAX_DOC_SIZE:
             return jsonify({'error': 'Document file size exceeds 5MB limit'}), 400

        # Secure naming
        safe_filename = secure_filename(file.filename)
        randomized_name = f"{uuid.uuid4().hex}_{safe_filename}"
        
        # Use absolute path based on app location
        base_dir = os.path.join(current_app.root_path, 'uploads', 'reports')
        
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)
            
        file.save(os.path.join(base_dir, randomized_name))
        
        # Update db
        appointment = Appointment.query.get(appointment_id)
        if appointment:
            appointment.report_path = randomized_name
            appointment.status = 'completed' # Auto-complete
            db.session.commit()
            return jsonify({'message': 'File uploaded', 'path': randomized_name}), 200
            
    return jsonify({'error': 'File type not allowed'}), 400

# --- Rider Management ---

@admin_bp.route('/riders', methods=['POST'])
@jwt_required()
def create_rider():
    """Create new rider account"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'phone', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if email already exists
    existing_rider = Rider.query.filter_by(email=data['email']).first()
    if existing_rider:
        return jsonify({'error': 'Email already exists'}), 400
    
    from werkzeug.security import generate_password_hash
    
    new_rider = Rider(
        name=data['name'],
        email=data['email'],
        phone=data['phone'],
        password_hash=generate_password_hash(data['password']),
        availability_status='available'
    )
    
    db.session.add(new_rider)
    db.session.commit()
    
    return jsonify({
        'message': 'Rider created successfully',
        'rider': new_rider.to_dict()
    }), 201

@admin_bp.route('/riders', methods=['GET'])
@jwt_required()
def get_riders():
    """List all riders with their status"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    riders = Rider.query.all()
    return jsonify({
        'riders': [rider.to_dict(include_stats=True) for rider in riders]
    }), 200

@admin_bp.route('/riders/<int:rider_id>', methods=['GET'])
@jwt_required()
def get_rider(rider_id):
    """Get specific rider details"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    return jsonify(rider.to_dict(include_stats=True)), 200

@admin_bp.route('/riders/<int:rider_id>', methods=['PUT'])
@jwt_required()
def update_rider(rider_id):
    """Update rider information"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        rider.name = data['name']
    if 'email' in data:
        # Check if email is unique
        existing = Rider.query.filter(Rider.email == data['email'], Rider.id != rider_id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 400
        rider.email = data['email']
    if 'phone' in data:
        rider.phone = data['phone']
    if 'availability_status' in data:
        if data['availability_status'] in ['available', 'busy', 'offline']:
            rider.availability_status = data['availability_status']
    
    from werkzeug.security import generate_password_hash
    if 'password' in data and data['password']:
        rider.password_hash = generate_password_hash(data['password'])
    
    rider.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Rider updated successfully',
        'rider': rider.to_dict()
    }), 200

@admin_bp.route('/riders/<int:rider_id>', methods=['DELETE'])
@jwt_required()
def delete_rider(rider_id):
    """Delete rider account"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    # Check if rider has active assignments
    active_assignments = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected'])
    ).count()
    
    if active_assignments > 0:
        return jsonify({'error': 'Cannot delete rider with active assignments'}), 400
    
    db.session.delete(rider)
    db.session.commit()
    
    return jsonify({'message': 'Rider deleted successfully'}), 200

@admin_bp.route('/riders/<int:rider_id>/performance', methods=['GET'])
@jwt_required()
def get_rider_performance(rider_id):
    """Get rider performance stats"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    # Calculate stats
    total_assigned = Appointment.query.filter_by(rider_id=rider_id).count()
    completed = Appointment.query.filter_by(rider_id=rider_id, status='delivered_to_lab').count()
    rejected = Appointment.query.filter_by(rider_id=rider_id, status='rider_rejected').count()
    in_progress = Appointment.query.filter(
        Appointment.rider_id == rider_id,
        Appointment.status.in_(['assigned_to_rider', 'rider_accepted', 'rider_on_way', 'sample_collected'])
    ).count()
    
    # Calculate average completion time (from assignment to delivery)
    completed_tasks = Appointment.query.filter_by(
        rider_id=rider_id,
        status='delivered_to_lab'
    ).all()
    
    avg_completion_time = None
    if completed_tasks:
        total_time = sum([
            (task.delivered_at - task.rider_assigned_at).total_seconds() / 3600
            for task in completed_tasks
            if task.delivered_at and task.rider_assigned_at
        ])
        avg_completion_time = total_time / len(completed_tasks) if len(completed_tasks) > 0 else 0
    
    return jsonify({
        'rider': rider.to_dict(),
        'performance': {
            'total_assigned': total_assigned,
            'completed': completed,
            'rejected': rejected,
            'in_progress': in_progress,
            'success_rate': (completed / total_assigned * 100) if total_assigned > 0 else 0,
            'avg_completion_time_hours': round(avg_completion_time, 2) if avg_completion_time else None
        }
    }), 200

@admin_bp.route('/riders/<int:rider_id>/history', methods=['GET'])
@jwt_required()
def get_rider_history(rider_id):
    """Get rider's task history"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    # Get all tasks for this rider
    tasks = Appointment.query.filter_by(rider_id=rider_id).order_by(
        Appointment.created_at.desc()
    ).all()
    
    return jsonify({
        'rider': rider.to_dict(),
        'tasks': [task.to_dict(include_rider=False) for task in tasks]
    }), 200

@admin_bp.route('/appointments/<int:appointment_id>/assign-rider', methods=['POST'])
@jwt_required()
def assign_rider(appointment_id):
    """Assign rider to appointment"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    rider_id = data.get('rider_id')
    
    if not rider_id:
        return jsonify({'error': 'rider_id is required'}), 400
    
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    rider = Rider.query.get(rider_id)
    if not rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    # Check if rider is available
    if rider.availability_status != 'available':
        return jsonify({'error': 'Rider is not available'}), 400
    
    # Store patient GPS coordinates for geo-fence validation (optional)
    if 'patient_lat' in data and 'patient_lng' in data:
        appointment.patient_latitude = float(data['patient_lat'])
        appointment.patient_longitude = float(data['patient_lng'])

    # SLA fields (optional — auto-default if not provided)
    from datetime import timedelta
    now = datetime.utcnow()
    if 'pickup_deadline' in data:
        appointment.pickup_deadline = datetime.fromisoformat(data['pickup_deadline'])
    else:
        # Default: rider must arrive within 1 hour of assignment
        appointment.pickup_deadline = now + timedelta(hours=1)

    if 'delivery_deadline' in data:
        appointment.delivery_deadline = datetime.fromisoformat(data['delivery_deadline'])
    else:
        # Default: sample must reach lab within 4 hours of assignment
        appointment.delivery_deadline = now + timedelta(hours=4)

    appointment.priority_level = data.get('priority_level', 'normal')
    
    # Auto-accept: task is mandatory, no rider confirmation needed
    appointment.rider_id = rider_id
    appointment.status = 'rider_accepted'
    appointment.rider_assigned_at = datetime.utcnow()
    appointment.rider_accepted_at = datetime.utcnow()
    
    # Mark rider as busy immediately
    rider.availability_status = 'busy'
    
    # Notify rider and patient
    from utils.notifications import notify_rider_assignment, notify_patient_rider_assigned
    notify_rider_assignment(rider_id, appointment_id, appointment.user.username, appointment.address)
    notify_patient_rider_assigned(appointment.user_id, appointment_id, rider.name)

    # Audit log — task created/assigned
    log_task_status_change(
        appointment_id=appointment_id,
        from_status=None,
        to_status='rider_accepted',
        changed_by_role='admin',
        changed_by_id=current_user_id,
        rider_id=rider_id,
        metadata={
            'priority_level': appointment.priority_level,
            'pickup_deadline': appointment.pickup_deadline.isoformat() if appointment.pickup_deadline else None,
            'delivery_deadline': appointment.delivery_deadline.isoformat() if appointment.delivery_deadline else None,
        },
    )

    db.session.commit()
    
    return jsonify({
        'message': 'Rider assigned and task auto-accepted',
        'appointment': appointment.to_dict()
    }), 200

@admin_bp.route('/appointments/<int:appointment_id>/reassign-rider', methods=['PUT'])
@jwt_required()
def reassign_rider(appointment_id):
    """Reassign appointment to different rider"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_rider_id = data.get('rider_id')
    
    if not new_rider_id:
        return jsonify({'error': 'rider_id is required'}), 400
    
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    new_rider = Rider.query.get(new_rider_id)
    if not new_rider:
        return jsonify({'error': 'Rider not found'}), 404
    
    # Check if new rider is available
    if new_rider.availability_status != 'available':
        return jsonify({'error': 'Rider is not available'}), 400
    
    # Update old rider availability if they were busy
    if appointment.rider_id:
        old_rider = Rider.query.get(appointment.rider_id)
        if old_rider and old_rider.availability_status == 'busy':
            old_rider.availability_status = 'available'
    
    # Auto-accept: task is mandatory for new rider
    appointment.rider_id = new_rider_id
    appointment.status = 'rider_accepted'
    appointment.rider_assigned_at = datetime.utcnow()
    appointment.rider_accepted_at = datetime.utcnow()
    
    # Mark new rider as busy
    new_rider.availability_status = 'busy'
    
    # Notify new rider
    from utils.notifications import notify_rider_assignment
    notify_rider_assignment(new_rider_id, appointment_id, appointment.user.username, appointment.address)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Rider reassigned and task auto-accepted',
        'appointment': appointment.to_dict()
    }), 200

@admin_bp.route('/appointments/<int:appointment_id>/rider-tracking', methods=['GET'])
@jwt_required()
def get_rider_tracking(appointment_id):
    """Get real-time rider location for appointment"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    if not appointment.rider:
        return jsonify({'error': 'No rider assigned to this appointment'}), 404
    
    rider = appointment.rider
    
    return jsonify({
        'appointment_id': appointment_id,
        'rider': {
            'id': rider.id,
            'name': rider.name,
            'phone': rider.phone,
            'gps_latitude': rider.gps_latitude,
            'gps_longitude': rider.gps_longitude,
            'last_location_update': rider.last_location_update.isoformat() if rider.last_location_update else None,
            'availability_status': rider.availability_status
        },
        'patient_address': appointment.address,
        'status': appointment.status
    }), 200
