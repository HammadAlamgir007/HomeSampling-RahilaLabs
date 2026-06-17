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
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)  # SECURITY: short-lived tokens for healthcare
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
    JWT_COOKIE_SECURE = True          # SECURITY: cookies only over HTTPS
    JWT_COOKIE_SAMESITE = 'Lax'       # SECURITY: prevent CSRF via cross-site cookies
    JWT_COOKIE_CSRF_PROTECT = True    # SECURITY: require CSRF token with cookie auth

    def __init__(self):
        super().__init__()
        # Fail fast if production runs with insecure defaults
        if self.SECRET_KEY in ('dev-secret-key-change-this', None, ''):
            raise RuntimeError(
                "SECRET_KEY is not set or uses insecure default. "
                "Set a strong SECRET_KEY in your environment before running in production."
            )
        if self.JWT_SECRET_KEY in ('jwt-secret-key-change-this', None, ''):
            raise RuntimeError(
                "JWT_SECRET_KEY is not set or uses insecure default. "
                "Set a strong JWT_SECRET_KEY in your environment before running in production."
            )
            
        # Production DB connection pooling
        if self.SQLALCHEMY_DATABASE_URI and not self.SQLALCHEMY_DATABASE_URI.startswith('sqlite:'):
            self.SQLALCHEMY_ENGINE_OPTIONS = {
                'pool_size': int(os.environ.get('DB_POOL_SIZE', 20)),
                'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 1800)),
                'pool_pre_ping': True,
                'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 10)),
            }


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
