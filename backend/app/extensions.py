"""
Flask extension instances (initialized without app — use app factory pattern).
Import these instances in routes/services, do NOT import from app.py.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
