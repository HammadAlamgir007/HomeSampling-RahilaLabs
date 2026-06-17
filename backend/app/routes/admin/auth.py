from datetime import datetime, timedelta, timezone

from flask import request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash

from app.models import db, User
from app.extensions import limiter
from . import admin_bp


@admin_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", error_message="Too many login attempts. Please wait.")
def login():
    """Admin login with rate limiting and account lockout protection."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request body'}), 400

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # SECURITY: Limit input length to prevent abuse
    if len(username) > 80 or len(password) > 128:
        return jsonify({'error': 'Invalid credentials'}), 401

    user = User.query.filter_by(username=username).first()

    # SECURITY: Use constant-time comparison and generic error messages
    # to prevent user enumeration
    if not user or user.role != 'admin':
        return jsonify({'error': 'Invalid credentials or unauthorized'}), 401

    # SECURITY: Account lockout — same logic used in patient login
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return jsonify({'error': 'Account temporarily locked. Try again later.'}), 429
    elif user.locked_until and user.locked_until <= datetime.now(timezone.utc):
        user.locked_until = None
        user.failed_login_attempts = 0
        db.session.commit()

    if not check_password_hash(user.password_hash, password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.session.commit()
            return jsonify({'error': 'Account temporarily locked. Try again in 15 minutes.'}), 429
        db.session.commit()
        return jsonify({'error': 'Invalid credentials or unauthorized'}), 401

    # Success — reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    db.session.commit()

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'type': 'user'}
    )
    return jsonify({
        'message': 'Admin login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200
