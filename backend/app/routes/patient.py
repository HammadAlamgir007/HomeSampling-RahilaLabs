import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timezone

from app.models import db, Test, Appointment, User
from app.extensions import limiter, cache
from app.schemas.booking_schemas import BookingCreateSchema

from app.utils.identifiers import generate_booking_id
from app.tasks.email_tasks import send_booking_confirmation

patient_bp = Blueprint('patient', __name__)


@patient_bp.route('/tests', methods=['GET'])
@cache.cached(timeout=3600, query_string=True) # Cache for 1 hour, considering pagination params
def get_tests():
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)
    
    query = Test.query
    if limit is not None:
        query = query.offset(offset).limit(limit)
        
    tests = query.all()
    total = Test.query.count()
    
    return jsonify({
        'tests': [test.to_dict() for test in tests],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200


@patient_bp.route('/book', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute", error_message="You are booking too quickly. Please pause.")
def book_appointment():
    """
    Legacy v1 booking endpoint — now delegates to BookingService
    so all bookings flow through the unified architecture.
    Accepts both old-style (test_id) and new-style (test_ids) payloads.
    """
    claims = get_jwt()
    if claims.get('type') != 'user':
        return jsonify({'error': 'Unauthorized'}), 403

    current_user_id = get_jwt_identity()
    schema = BookingCreateSchema()
    data = schema.load(request.get_json() or {})

    test_ids = data.get('test_ids')
    if not test_ids:
        test_ids = [data.get('test_id')]

    date_str = data.get('scheduled_datetime') or data.get('date')
    date_str_clean = date_str.replace('Z', '+00:00')
    scheduled_datetime = datetime.fromisoformat(date_str_clean)

    address_data = data.get('address_data')
    if not address_data:
        address_data = {'street': data.get('address'), 'city': '', 'state': 'Main', 'zipCode': ''}

    from app.services.booking_service import BookingService
    try:
        booking = BookingService.create_booking(
            patient_id=current_user_id,
            test_ids=test_ids,
            address_data=address_data,
            scheduled_datetime=scheduled_datetime,
            notes=data.get('notes', ''),
            idempotency_key=data.get('idempotency_key')
        )
        try:
            send_booking_confirmation.delay(booking.id)
        except Exception:
            pass # Failed to queue email, but booking succeeded

        return jsonify({
            'success': True,
            'message': 'Appointment booked successfully',
            'data': {'booking': booking.to_dict()},
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception:
        return jsonify({'error': 'Failed to create booking due to database error'}), 500


@patient_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    current_user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('limit', 20, type=int), 100)
    try:
        from sqlalchemy.orm import joinedload
        pagination = (
            Appointment.query.options(
                joinedload(Appointment.test),
                joinedload(Appointment.rider)
            )
            .filter_by(user_id=current_user_id)
            .order_by(Appointment.appointment_date.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )
        return jsonify({
            'bookings': [appt.to_dict() for appt in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception:
        return jsonify({'error': 'Failed to retrieve bookings'}), 500


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
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel appointment due to database error'}), 500


@patient_bp.route('/reports/<path:filename>', methods=['GET'])
@jwt_required()
def download_report(filename):
    import datetime as dt
    current_user_id = int(get_jwt_identity())
    try:
        appointment = Appointment.query.filter_by(report_path=filename).first()
        if not appointment:
            return jsonify({'error': 'Appointment or report not found'}), 404

        if appointment.user_id != current_user_id:
            user = User.query.get(current_user_id)
            if user.role != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403

        # Report expiry: 30 days after upload (using created_at as proxy if no uploaded_at)
        if appointment.created_at:
            expiry = appointment.created_at + dt.timedelta(days=30)
            if dt.datetime.now(timezone.utc) > expiry:
                return jsonify({
                    'error': 'Report has expired (30 days). Please contact the lab to request a new copy.',
                    'expired': True
                }), 410

    except Exception:
        return jsonify({'error': 'Server error verifying report ownership'}), 500

    reports_dir = os.path.abspath(os.path.join(current_app.root_path, '..', 'uploads', 'reports'))
    return send_from_directory(reports_dir, filename, as_attachment=True)
