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
from flask import current_app
from . import admin_bp

_ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
_MAX_IMAGE_SIZE = 2 * 1024 * 1024   # 2 MB
_MAX_DOC_SIZE = 5 * 1024 * 1024     # 5 MB

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in _ALLOWED_EXTENSIONS


@admin_bp.route('/reports', methods=['GET'])
@require_admin()
def get_reports():
    search = request.args.get('search', '').strip().lower()
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)

    query = Appointment.query.filter(
        Appointment.report_path.isnot(None),
        Appointment.report_path != ''
    )
    if search:
        query = query.join(User).join(Test).filter(
            or_(
                func.lower(User.username).contains(search),
                func.lower(Test.name).contains(search)
            )
        )
    
    query = query.order_by(Appointment.created_at.desc())
    total = query.count()
    if limit is not None:
        query = query.offset(offset).limit(limit)

    appointments = query.all()
    result = []
    for appt in appointments:
        patient_name = appt.user.username if appt.user else 'Unknown'
        test_name = appt.test.name if appt.test else 'Unknown Test'
        result.append({
            'id': appt.id,
            'booking_order_id': getattr(appt, 'booking_order_id', None),
            'patient_id': appt.user_id,
            'patient_name': patient_name,
            'patient_email': appt.user.email if appt.user else None,
            'test_name': test_name,
            'test_price': appt.test.price if appt.test else None,
            'status': appt.status,
            'appointment_date': appt.appointment_date.isoformat() if appt.appointment_date else None,
            'created_at': appt.created_at.isoformat() if appt.created_at else None,
            'report_path': appt.report_path,
            'address': getattr(appt, 'address', None),
        })
    return jsonify({
        'reports': result,
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200


@admin_bp.route('/upload-report/<int:appointment_id>', methods=['POST'])
@require_admin()
def upload_report(appointment_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not _allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0, os.SEEK_SET)
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg'] and file_length > _MAX_IMAGE_SIZE:
        return jsonify({'error': 'Image file size exceeds 2MB limit'}), 400
    elif ext == 'pdf' and file_length > _MAX_DOC_SIZE:
        return jsonify({'error': 'Document file size exceeds 5MB limit'}), 400

    safe_filename = secure_filename(file.filename)
    randomized_name = f"{uuid.uuid4().hex}_{safe_filename}"
    base_dir = os.path.abspath(os.path.join(current_app.root_path, '..', 'uploads', 'reports'))
    os.makedirs(base_dir, exist_ok=True)
    file.save(os.path.join(base_dir, randomized_name))

    appointment = Appointment.query.get(appointment_id)
    if appointment:
        appointment.report_path = randomized_name
        appointment.status = 'completed'
        db.session.commit()
        return jsonify({'message': 'File uploaded', 'path': randomized_name}), 200
    return jsonify({'error': 'Appointment not found'}), 404


