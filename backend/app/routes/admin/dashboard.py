import datetime

from flask import request, jsonify
from sqlalchemy import func

from app.models import db, User, Test, Appointment, BookingItem
from app.utils.decorators import require_admin
from . import admin_bp

@admin_bp.route('/stats', methods=['GET'])
@require_admin()
def get_dashboard_stats():
    # Revenue from legacy appointments (test_id is set)
    legacy_revenue = db.session.query(db.func.sum(Test.price)) \
        .join(Appointment, Appointment.test_id == Test.id) \
        .filter(Appointment.status != 'cancelled').scalar() or 0

    # Revenue from new architecture bookings (via BookingItem)
    new_revenue = db.session.query(db.func.sum(BookingItem.price)).scalar() or 0

    total_revenue = float(legacy_revenue) + float(new_revenue)

    return jsonify({
        'total_bookings': Appointment.query.count(),
        'total_appointments': Appointment.query.count(),
        'pending_bookings': Appointment.query.filter_by(status='pending').count(),
        'total_patients': User.query.filter_by(role='patient').count(),
        'total_tests': Test.query.count(),
        'revenue': total_revenue,
    }), 200


@admin_bp.route('/activity', methods=['GET'])
@require_admin()
def get_dashboard_activity():
    activity = []
    for appt in Appointment.query.order_by(Appointment.created_at.desc()).limit(5).all():
        patient_name = appt.user.username if appt.user else "Unknown Patient"
        activity.append({'action': f"New appointment booked by {patient_name}", 'time': appt.created_at, 'type': 'appointment'})
    for patient in User.query.filter_by(role='patient').order_by(User.created_at.desc()).limit(5).all():
        activity.append({'action': f"New patient registered: {patient.username}", 'time': patient.created_at, 'type': 'user'})

    activity.sort(key=lambda x: x['time'], reverse=True)
    formatted = []
    now = datetime.datetime.now(datetime.timezone.utc)
    for item in activity[:10]:
        diff = now - item['time']
        if diff.days > 0:
            time_str = f"{diff.days} days ago"
        elif diff.seconds // 3600 > 0:
            time_str = f"{diff.seconds // 3600} hours ago"
        elif diff.seconds // 60 > 0:
            time_str = f"{diff.seconds // 60} mins ago"
        else:
            time_str = "Just now"
        formatted.append({'action': item['action'], 'time': time_str})
    return jsonify(formatted), 200
