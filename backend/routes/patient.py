from flask import Blueprint, request, jsonify
from models import db, Test, Appointment
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/tests', methods=['GET'])
def get_tests():
    tests = Test.query.all()
    return jsonify([test.to_dict() for test in tests]), 200

@patient_bp.route('/book', methods=['POST'])
@jwt_required()
def book_appointment():
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

    new_appointment = Appointment(
        user_id=current_user_id,
        test_id=data['test_id'],
        appointment_date=appointment_date,
        address=data['address'],
        status='pending'
    )

    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({'message': 'Appointment booked successfully', 'appointment': new_appointment.to_dict()}), 201

@patient_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    current_user_id = get_jwt_identity()
    appointments = Appointment.query.filter_by(user_id=current_user_id).order_by(Appointment.appointment_date.desc()).all()
    return jsonify([appt.to_dict() for appt in appointments]), 200

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

    db.session.delete(appointment)
    db.session.commit()
    
    return jsonify({'message': 'Appointment cancelled successfully'}), 200
