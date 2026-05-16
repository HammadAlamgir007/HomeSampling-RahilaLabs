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

@admin_bp.route('/profile', methods=['GET'])
@require_admin()
def get_admin_profile():
    return jsonify({'id': user.id, 'username': user.username, 'email': user.email,
                    'phone': user.phone or '', 'city': user.city or ''}), 200


@admin_bp.route('/profile', methods=['PUT'])
@require_admin()
def update_admin_profile():
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
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200


@admin_bp.route('/change-password', methods=['PUT'])
@require_admin()
def change_admin_password():
    data = request.get_json() or {}
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')
    confirm_pw = data.get('confirm_password', '')
    if not check_password_hash(user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if new_pw != confirm_pw:
        return jsonify({'error': 'Passwords do not match'}), 400
    user.password_hash = generate_password_hash(new_pw)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update password'}), 500
    return jsonify({'message': 'Password changed successfully'}), 200


