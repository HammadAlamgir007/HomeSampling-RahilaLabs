import os
import datetime
import uuid
import math
from flask import request, jsonify, send_file
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import or_, and_, func

from app.models import db, User, Test, Appointment, Rider, TaskLog
from app.utils.api import sanitize_string, sanitize_email
from app.utils.decorators import require_admin
from app.extensions import limiter
from app.utils.notifications import notify_rider_assignment
from . import admin_bp

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password) and user.role == 'admin':
        access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
        return jsonify({'message': 'Admin login successful', 'token': access_token, 'user': user.to_dict()}), 200
    return jsonify({'error': 'Invalid credentials or unauthorized'}), 401


