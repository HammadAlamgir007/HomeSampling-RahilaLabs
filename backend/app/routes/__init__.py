"""Routes package."""
from .auth import auth_bp
from .patient import patient_bp
from .admin import admin_bp
from .rider import rider_bp
from .contact import contact_bp

__all__ = ['auth_bp', 'patient_bp', 'admin_bp', 'rider_bp', 'contact_bp']
