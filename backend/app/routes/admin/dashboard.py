import os
import datetime
import uuid
import math
from flask import request, jsonify, send_file
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import or_, and_, func

from app.models import db, User, Test, Appointment, Rider, TaskLog
from app.utils.api import sanitize_string, sanitize_email
from app.utils.decorators import require_admin
from app.extensions import limiter
from app.utils.notifications import notify_rider_assignment
from . import admin_bp

@admin_bp.route('/stats', methods=['GET'])
@require_admin()
def get_dashboard_stats():
    claims = get_jwt()
    if claims.get('type') != 'user':
        return jsonify({'error': 'Unauthorized access'}), 403
    total_revenue = db.session.query(db.func.sum(Test.price)) \
        .join(Appointment, Appointment.test_id == Test.id) \
        .filter(Appointment.status != 'cancelled').scalar() or 0
    return jsonify({
        'total_bookings': Appointment.query.count(),
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


