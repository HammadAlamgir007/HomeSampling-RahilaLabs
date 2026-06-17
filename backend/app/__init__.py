"""
Flask Application Factory
Creates and configures the Flask app instance.
"""
import logging
import os
import secrets
from logging.handlers import RotatingFileHandler

from flask import Flask, jsonify, request
from flask_cors import CORS

from .config import get_config
from .extensions import db, jwt, limiter


def create_app(config_name=None):
    """Application factory — create and configure the Flask app."""
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    cfg = get_config(config_name)
    app.config.from_object(cfg)

    # Sentry integration
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    sentry_dsn = os.environ.get("SENTRY_DSN")
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FlaskIntegration()],
            traces_sample_rate=1.0
        )

    # Celery configuration
    app.config.from_mapping(
        CELERY=dict(
            broker_url=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
            result_backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
            task_ignore_result=True,
            broker_connection_retry_on_startup=True,
        ),
    )
    
    from .celery_app import celery_init_app
    celery_init_app(app)

    # JWT cookie settings
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
    app.config['JWT_COOKIE_SECURE'] = not app.debug   # True in production (HTTPS)
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    app.config['JWT_CSRF_IN_COOKIES'] = True
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'

    # Configure logging (only outside debug mode)
    _configure_logging(app)

    # Initialize extensions
    db.init_app(app)
    
    from flask_migrate import Migrate
    Migrate(app, db)
    
    from app.extensions import cache
    # Configure cache (use Redis if URL provided, else simple in-memory)
    redis_url = os.environ.get('REDIS_URL')
    if redis_url:
        app.config['CACHE_TYPE'] = 'RedisCache'
        app.config['CACHE_REDIS_URL'] = redis_url
    else:
        app.config['CACHE_TYPE'] = 'SimpleCache'
        
    cache.init_app(app)
    
    jwt.init_app(app)
    limiter.init_app(app)
    
    from flasgger import Swagger
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,  # all in
                "model_filter": lambda tag: True,  # all in
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }
    swagger_template = {
        "info": {
            "title": "Rahila Labs API",
            "description": "API Documentation for the Rahila Labs Platform.",
            "version": "1.0.0"
        }
    }
    Swagger(app, config=swagger_config, template=swagger_template)

    # CORS — restrict to allowed origins (configurable via CORS_ORIGINS env var)
    _allowed_origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,https://rahila-labs-web.azurewebsites.net'
    ).split(',')
    CORS(app, resources={r"/*": {
        "origins": [o.strip() for o in _allowed_origins],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
        "supports_credentials": True,
    }})

    # JWT error handlers
    _register_jwt_handlers(app, jwt)

    # Register blueprints
    _register_blueprints(app)

    # Utility routes
    _register_utility_routes(app)

    # ── SECURITY HEADERS (Talisman) ─────────────────────────────────────────
    from flask_talisman import Talisman
    csp = {
        'default-src': ["'self'"],
    }
    # We disable force_https locally so development is not broken
    Talisman(app, content_security_policy=csp, force_https=not app.debug)


    # Global error handler
    from werkzeug.exceptions import NotFound
    from marshmallow.exceptions import ValidationError

    @app.errorhandler(ValidationError)
    def handle_marshmallow_error(e):
        return jsonify({
            "error": True,
            "message": "Validation failed",
            "fields": e.messages
        }), 422

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Ignore 404s from health checks or invalid paths gracefully without traceback
        if isinstance(e, NotFound):
            return jsonify({'success': False, 'message': 'Endpoint not found.'}), 404

        import traceback
        app.logger.error(f'Unhandled Exception: {str(e)}\n{traceback.format_exc()}')
        error_response = {
            "success": False,
            "message": "An unexpected error occurred.",
        }
        # Only expose error details in debug mode
        if app.debug:
            error_response["error"] = str(e)
        return jsonify(error_response), 500

    # Initialize DB (create tables + seed initial data)
    with app.app_context():
        _init_db(app)

    return app


# ── Private helpers ────────────────────────────────────────────────────────────

def _configure_logging(app: Flask):
    """Set up rotating file handler for non-debug environments."""
    if not app.debug:
        log_path = os.path.join(os.path.dirname(__file__), '..', 'logs', 'backend.log')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        handler = RotatingFileHandler(log_path, maxBytes=10 * 1024 * 1024, backupCount=10)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Rahila Labs startup')


def _register_jwt_handlers(app: Flask, jwt_manager):
    """Register JWT error callbacks and token blocklist."""
    from .utils.blocklist import is_token_revoked

    @jwt_manager.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return is_token_revoked(jwt_payload['jti'])

    @jwt_manager.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'msg': 'Token has been revoked', 'error': 'token_revoked'}), 401

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'msg': 'Invalid token', 'error': error}), 422

    @jwt_manager.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'msg': 'Missing token', 'error': error}), 401

    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'msg': 'Token has expired', 'error': 'token_expired'}), 401


def _register_blueprints(app: Flask):
    """Register all route blueprints."""
    from .routes.auth import auth_bp
    from .routes.patient import patient_bp
    from .routes.admin import admin_bp
    from .routes.rider import rider_bp
    from .routes.contact import contact_bp
    from .controllers import booking_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(rider_bp, url_prefix='/api/rider')
    app.register_blueprint(contact_bp, url_prefix='/api')
    app.register_blueprint(booking_bp, url_prefix='/api')


def _register_utility_routes(app: Flask):
    """Register health check route."""

    @app.route('/health')
    def health_check():
        from sqlalchemy import text
        try:
            db.session.execute(text('SELECT 1'))
            return jsonify({'status': 'ok', 'message': 'Rahila Labs Backend is running', 'db': 'connected'})
        except Exception:
            return jsonify({'status': 'unhealthy', 'message': 'Database connection failed', 'db': 'disconnected'}), 503


def _get_seed_password(env_var, fallback_label):
    """Get seed password from env var, or generate a secure random one."""
    pw = os.environ.get(env_var)
    if pw:
        return pw
    # Generate a secure random password for first-time seeding
    generated = secrets.token_urlsafe(16)
    logging.getLogger(__name__).warning(
        f"⚠ No {env_var} set — generated random {fallback_label} password. "
        f"Set {env_var} in .env to use a fixed password."
    )
    return generated


def _init_db(app: Flask):
    """Create all tables and seed initial data if the database is empty."""
    from .models import User, Test, Rider, Appointment
    from werkzeug.security import generate_password_hash
    from datetime import datetime, timezone

    try:
        db.create_all()

        # Resiliently drop unique index on booking_order_id in production MySQL
        if os.environ.get('DATABASE_URL'):
            try:
                db.session.execute(db.text("ALTER TABLE appointment DROP INDEX booking_order_id;"))
                db.session.execute(db.text("ALTER TABLE appointment ADD INDEX (booking_order_id);"))
                db.session.commit()
                app.logger.info("Successfully dropped unique constraint on booking_order_id and added standard index.")
            except Exception as ex:
                db.session.rollback()
                app.logger.warning(f"Note: Unique index drop/add skipped or already applied: {ex}")

        # Seed admin
        if not User.query.filter_by(role='admin').first():
            admin_pw = _get_seed_password('DEFAULT_ADMIN_PASSWORD', 'admin')
            admin = User(
                username="admin",
                email="admin@rahilalabs.com",
                password_hash=generate_password_hash(admin_pw),
                role="admin", status="active", is_verified=True,
                mrn="SYS-ADMIN-01"
            )
            db.session.add(admin)
            db.session.commit()
            app.logger.info("Seeded admin user")

        # Seed demo patient & appointment
        if not User.query.filter_by(email='ali@example.com').first():
            demo_pw = _get_seed_password('DEFAULT_DEMO_PASSWORD', 'demo patient')
            patient = User(
                username="ali", email="ali@example.com",
                password_hash=generate_password_hash(demo_pw),
                role="patient", phone="1234567890", city="Lahore", is_verified=True,
                mrn="SYS-PATIENT-01"
            )
            db.session.add(patient)
            db.session.commit()

            test = Test.query.first()
            if test:
                appt = Appointment(
                    user_id=patient.id, test_id=test.id,
                    appointment_date=datetime.now(timezone.utc),
                    status="pending", address="123 Main St, Lahore"
                )
                db.session.add(appt)
                db.session.commit()
                app.logger.info("Seeded demo appointment")

        # Seed demo riders
        if not Rider.query.first():
            rider_pw = _get_seed_password('DEFAULT_RIDER_PASSWORD', 'rider')
            riders = [
                Rider(name="Ahmed Khan", email="ahmed@rider.com", phone="03001234567",
                      password_hash=generate_password_hash(rider_pw), availability_status="available"),
                Rider(name="Hassan Ali", email="hassan@rider.com", phone="03009876543",
                      password_hash=generate_password_hash(rider_pw), availability_status="available"),
            ]
            db.session.bulk_save_objects(riders)
            db.session.commit()
            app.logger.info("Seeded demo riders")

    except Exception as e:
        app.logger.error(f"Error during DB initialization: {e}")

    # Seed tests from JSON locally or on Azure App Service
    try:
        from seed_from_json import seed_from_json
        seed_from_json(app)
    except Exception as e:
        app.logger.error(f"Error during JSON test seeding: {e}")
