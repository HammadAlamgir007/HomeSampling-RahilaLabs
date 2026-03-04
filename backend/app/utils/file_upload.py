import os
from werkzeug.utils import secure_filename
from datetime import datetime

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_image(file):
    if not file:
        return False, "No file provided"
    if file.filename == '':
        return False, "No file selected"
    if not allowed_file(file.filename):
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024)}MB"

    return True, "Valid"


def save_sample_photo(file, appointment_id):
    if not file:
        return None
    is_valid, message = validate_image(file)
    if not is_valid:
        raise ValueError(message)

    sample_photos_dir = os.path.join(UPLOAD_FOLDER, 'sample_photos')
    os.makedirs(sample_photos_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename)
    unique_filename = f"sample_{appointment_id}_{timestamp}{ext}"
    file_path = os.path.join(sample_photos_dir, unique_filename)
    file.save(file_path)
    return file_path


def save_rider_photo(file, rider_id):
    if not file:
        return None
    is_valid, message = validate_image(file)
    if not is_valid:
        raise ValueError(message)

    rider_photos_dir = os.path.join(UPLOAD_FOLDER, 'rider_photos')
    os.makedirs(rider_photos_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename)
    unique_filename = f"rider_{rider_id}_{timestamp}{ext}"
    file_path = os.path.join(rider_photos_dir, unique_filename)
    file.save(file_path)
    return file_path


def delete_file(file_path):
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    return False
