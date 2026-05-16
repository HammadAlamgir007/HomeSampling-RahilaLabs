from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from app.extensions import limiter
from app.services.booking_service import BookingService
from . import booking_bp

@booking_bp.route('/v2/bookings', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def create_booking():
    claims = get_jwt()
    if claims.get('type') != 'user':
        return jsonify({'error': 'Unauthorized'}), 403

    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('test_ids') or not data.get('date') or not data.get('address_data'):
        return jsonify({'error': 'Missing required fields (test_ids, date, address_data)'}), 400

    if not isinstance(data['test_ids'], list) or len(data['test_ids']) == 0:
        return jsonify({'error': 'test_ids must be a non-empty array'}), 400

    try:
        date_str = data['date'].replace('Z', '+00:00')
        scheduled_datetime = datetime.fromisoformat(date_str)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO format.'}), 400

    idempotency_key = data.get('idempotency_key')
    notes = data.get('notes', '')

    try:
        booking = BookingService.create_booking(
            patient_id=current_user_id,
            test_ids=data['test_ids'],
            address_data=data['address_data'],
            scheduled_datetime=scheduled_datetime,
            notes=notes,
            idempotency_key=idempotency_key
        )
        return jsonify({
            'message': 'Booking created successfully',
            'booking': booking.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error processing booking', 'details': str(e)}), 500


@booking_bp.route('/v2/bookings', methods=['GET'])
@jwt_required()
def get_bookings():
    current_user_id = int(get_jwt_identity())
    try:
        bookings = BookingService.get_patient_bookings(current_user_id)
        return jsonify([b.to_dict() for b in bookings]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/v2/bookings/available-slots', methods=['GET'])
def get_available_slots():
    date_str = request.args.get('date')
    city = request.args.get('city', 'Unknown')
    if not date_str:
        return jsonify({'error': 'Missing date parameter'}), 400
        
    from app.services.scheduling_service import SchedulingService
    try:
        slots = SchedulingService.get_available_slots(date_str, city)
        return jsonify({'slots': slots}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error processing slots', 'details': str(e)}), 500
