"""Re-export the shared db instance from extensions for use in all model files."""
from app.extensions import db

__all__ = ['db']
