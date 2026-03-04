"""
Models package — imports all models so they are registered with SQLAlchemy.
Import from here (e.g. `from app.models import db, User`) everywhere in the app.
"""
from .base import db
from .user import User
from .otp import OTP
from .rider import Rider
from .test import Test
from .appointment import Appointment, log_task_status_change
from .task_log import TaskLog
from .notification import Notification

__all__ = [
    'db', 'User', 'OTP', 'Rider', 'Test',
    'Appointment', 'TaskLog', 'Notification',
    'log_task_status_change',
]
