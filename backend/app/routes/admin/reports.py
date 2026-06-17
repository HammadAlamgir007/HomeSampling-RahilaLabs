import os
import uuid
from flask import request, jsonify
from werkzeug.utils import secure_filename
from sqlalchemy import or_, func
from flask import current_app

from app.models import db, User, Test, Appointment
from app.utils.decorators import require_admin
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
        query = query.join(User).outerjoin(Test).filter(
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
    # SECURITY: Validate appointment exists BEFORE processing file
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not _allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # SECURITY: Check file size
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0, os.SEEK_SET)
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg'] and file_length > _MAX_IMAGE_SIZE:
        return jsonify({'error': 'Image file size exceeds 2MB limit'}), 400
    elif ext == 'pdf' and file_length > _MAX_DOC_SIZE:
        return jsonify({'error': 'Document file size exceeds 5MB limit'}), 400

    # SECURITY: Validate magic bytes match the declared file extension
    header = file.read(8)
    file.seek(0)
    _MAGIC_BYTES = {
        'pdf': [b'%PDF'],
        'png': [b'\x89PNG'],
        'jpg': [b'\xff\xd8\xff'],
        'jpeg': [b'\xff\xd8\xff'],
    }
    expected_magic = _MAGIC_BYTES.get(ext, [])
    if expected_magic and not any(header.startswith(m) for m in expected_magic):
        return jsonify({'error': 'File content does not match its extension'}), 400

    safe_filename = secure_filename(file.filename)
    randomized_name = f"{uuid.uuid4().hex}_{safe_filename}"
    base_dir = os.path.abspath(os.path.join(current_app.root_path, '..', 'uploads', 'reports'))
    os.makedirs(base_dir, exist_ok=True)
    file.save(os.path.join(base_dir, randomized_name))

    appointment.report_path = randomized_name
    # SECURITY: Use state machine instead of directly setting status
    try:
        appointment.transition_status('completed', changed_by_role='admin')
    except ValueError:
        # If transition is invalid (e.g. already completed), just save the report path
        pass
    db.session.commit()
    return jsonify({'message': 'File uploaded', 'path': randomized_name}), 200
