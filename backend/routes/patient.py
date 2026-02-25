from flask import Blueprint, request, jsonify
from models import db, Test, Appointment
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from utils.identifiers import generate_booking_id
from utils.mail import send_booking_confirmation
from utils.api import api_response
from utils.extensions import limiter
from models import User

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/tests', methods=['GET'])
def get_tests():
    tests = Test.query.all()
    return jsonify([test.to_dict() for test in tests]), 200

@patient_bp.route('/book', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute", error_message="You are booking too quickly. Please pause.")
def book_appointment():
    claims = get_jwt()
    if claims.get('type') != 'user':
        return jsonify({'error': 'Unauthorized'}), 403

    current_user_id = get_jwt_identity()
    data = request.get_json()

    print(f"Received booking request: {data}")
    if not data or not data.get('test_id') or not data.get('date') or not data.get('address'):
        print("Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        print(f"Parsing date: {data['date']}")
        # Handle 'Z' for Python < 3.11 fromisoformat
        date_str = data['date'].replace('Z', '+00:00')
        appointment_date = datetime.fromisoformat(date_str)
    except ValueError as e:
        print(f"Date parsing error: {e}")
        return jsonify({'error': 'Invalid date format. Use ISO format.'}), 400

    # Idempotency Check: Prevent duplicate exact bookings
    existing = Appointment.query.filter_by(
        user_id=current_user_id,
        test_id=data['test_id'],
        appointment_date=appointment_date,
        status='pending'
    ).first()
    
    if existing:
        return jsonify({'error': 'A booking for this exact test and time slot already exists.'}), 409

    new_appointment = Appointment(
        user_id=current_user_id,
        test_id=data['test_id'],
        appointment_date=appointment_date,
        address=data['address'],
        booking_order_id=generate_booking_id(),
        status='pending'
    )

    try:
        db.session.add(new_appointment)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create booking due to database error'}), 500
    
    # Retrieve relations for email
    patient = User.query.get(current_user_id)
    test = Test.query.get(data['test_id'])
    test_name = test.name if test else "Laboratory Test"
    
    # Send Automated Confirmation
    mail_result = send_booking_confirmation(
        patient_email=patient.email,
        patient_name=patient.username,
        mrn=patient.mrn or "MRN-PENDING",
        booking_id=new_appointment.booking_order_id,
        test_name=test_name,
        test_date=appointment_date.strftime("%Y-%m-%d %I:%M %p")
    )

    return jsonify({
        'message': 'Appointment booked successfully', 
        'appointment': new_appointment.to_dict(),
        'email_sent': True if mail_result else False
    }), 201

@patient_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    current_user_id = int(get_jwt_identity())
    print(f"Patient: Fetching bookings for user {current_user_id}")
    try:
        appointments = Appointment.query.filter_by(user_id=current_user_id).order_by(Appointment.appointment_date.desc()).all()
        print(f"Patient: Found {len(appointments)} bookings")
        serialized = [appt.to_dict() for appt in appointments]
        return jsonify(serialized), 200
    except Exception as e:
        print(f"Patient: Error fetching bookings: {e}")
        return jsonify({'error': str(e)}), 500

@patient_bp.route('/bookings/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    current_user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(booking_id)

    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    if appointment.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if appointment.status != 'pending':
        return jsonify({'error': 'Cannot cancel a completed or confirmed appointment'}), 400

    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment cancelled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel appointment due to database error'}), 500

import os
from flask import send_from_directory, current_app

@patient_bp.route('/reports/<path:filename>', methods=['GET'])
@jwt_required()
def download_report(filename):
    current_user_id = int(get_jwt_identity())
    
    # Security: Verify ownership
    try:
        # Lookup the appointment directly by its unique report_path
        appointment = Appointment.query.filter_by(report_path=filename).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment or report not found'}), 404
            
        if appointment.user_id != current_user_id:
             from models import User
             user = User.query.get(current_user_id)
             if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403

    except Exception as e:
        return jsonify({'error': 'Server error verifying report ownership'}), 500

    reports_dir = os.path.join(current_app.root_path, 'uploads', 'reports')
    return send_from_directory(reports_dir, filename, as_attachment=True)
