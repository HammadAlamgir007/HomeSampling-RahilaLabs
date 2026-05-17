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

@admin_bp.route('/tests', methods=['GET'])
@require_admin()
def get_tests():
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)
    query = Test.query
    total = query.count()
    if limit is not None:
        tests = query.offset(offset).limit(limit).all()
    else:
        tests = query.all()
    return jsonify({
        'tests': [test.to_dict() for test in tests],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200


@admin_bp.route('/tests', methods=['POST'])
@require_admin()
def add_test():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('price'):
        return jsonify({'error': 'Name and price are required'}), 400

    new_test = Test(
        name=data['name'],
        code=data.get('code', ''),
        category=data.get('category', ''),
        description=data.get('description', ''),
        specimen=data.get('specimen', ''),
        reporting_time=data.get('reporting_time', ''),
        price=float(data['price'])
    )
    try:
        db.session.add(new_test)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to add test due to a database error.'}), 500
    return jsonify({'message': 'Test created successfully', 'test': new_test.to_dict()}), 201


@admin_bp.route('/tests/<int:id>', methods=['PUT'])
@require_admin()
def update_test(id):
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
    if 'category' in data:
        test.category = data['category']
    if 'is_active' in data:
        test.is_active = data['is_active']
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update test'}), 500
    return jsonify({'message': 'Test updated successfully', 'test': test.to_dict()}), 200


@admin_bp.route('/tests/<int:id>', methods=['DELETE'])
@require_admin()
def delete_test(id):
    test = Test.query.get(id)
    if not test:
        return jsonify({'error': 'Test not found'}), 404
    try:
        if Appointment.query.filter_by(test_id=id).first():
            test.is_active = False
            db.session.commit()
            return jsonify({'message': 'Test cannot be deleted because it is linked to appointments. It has been marked as inactive instead.'}), 200
        
        db.session.delete(test)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete test'}), 500
    return jsonify({'message': 'Test deleted successfully'}), 200
