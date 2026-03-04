"""
Configuration classes for different environments.
Usage: app.config.from_object(get_config('production'))
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Resolve backend/ root: backend/app/config.py → go up 2 levels
_basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(_basedir, '.env'))


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-this'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-this'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Default to SQLite stored in backend/instance/
    _instance_dir = os.path.join(_basedir, 'instance')
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL')
        or f'sqlite:///{os.path.join(_instance_dir, "database.db")}'
    )


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False
    JWT_COOKIE_SECURE = True        # Enforce HTTPS cookies in production


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


_config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}


def get_config(name=None):
    """Return the config class for the given name (or env-based default)."""
    name = name or os.environ.get('FLASK_ENV', 'development')
    return _config_map.get(name, DevelopmentConfig)
