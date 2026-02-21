import os
from werkzeug.utils import secure_filename
from datetime import datetime

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image(file):
    """Validate image file"""
    if not file:
        print("Validation Failed: No file provided")
        return False, "No file provided"
    
    if file.filename == '':
        print("Validation Failed: No file selected")
        return False, "No file selected"
    
    if not allowed_file(file.filename):
        print(f"Validation Failed: File type not allowed for {file.filename}")
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size (if possible)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
    
    return True, "Valid"

def save_sample_photo(file, appointment_id):
    """Save uploaded sample photo and return file path"""
    if not file:
        return None
    
    # Validate file
    is_valid, message = validate_image(file)
    if not is_valid:
        raise ValueError(message)
    
    # Create uploads directory if it doesn't exist
    sample_photos_dir = os.path.join(UPLOAD_FOLDER, 'sample_photos')
    os.makedirs(sample_photos_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    unique_filename = f"sample_{appointment_id}_{timestamp}{ext}"
    
    # Save file
    file_path = os.path.join(sample_photos_dir, unique_filename)
    file.save(file_path)
    
    return file_path

def save_rider_photo(file, rider_id):
    """Save uploaded rider profile photo and return file path"""
    if not file:
        return None
    
    # Validate file
    is_valid, message = validate_image(file)
    if not is_valid:
        raise ValueError(message)
    
    # Create uploads directory if it doesn't exist
    rider_photos_dir = os.path.join(UPLOAD_FOLDER, 'rider_photos')
    os.makedirs(rider_photos_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    unique_filename = f"rider_{rider_id}_{timestamp}{ext}"
    
    # Save file
    file_path = os.path.join(rider_photos_dir, unique_filename)
    file.save(file_path)
    
    return file_path

def delete_file(file_path):
    """Delete a file if it exists"""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    return False
