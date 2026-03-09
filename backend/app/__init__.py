"""
Flask Application Factory
Creates and configures the Flask app instance.
"""
import logging
import os
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

    # JWT cookie settings
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
    app.config['JWT_COOKIE_SECURE'] = False        # Set True in production (HTTPS)
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    app.config['JWT_CSRF_IN_COOKIES'] = True

    # Configure logging (only outside debug mode)
    _configure_logging(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    # CORS — allow all origins / headers during development
    CORS(app, resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
        "supports_credentials": True,
    }})

    # Explicit CORS headers after each response (needed for Flutter Web preflight)
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-TOKEN'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # JWT error handlers
    _register_jwt_handlers(app, jwt)

    # Register blueprints
    _register_blueprints(app)

    # Utility routes
    _register_utility_routes(app)

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        app.logger.error(f'Unhandled Exception: {str(e)}\n{traceback.format_exc()}')
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred.",
            "error": str(e)
        }), 500

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
        handler = RotatingFileHandler(log_path, maxBytes=10240, backupCount=5)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Rahila Labs startup')


def _register_jwt_handlers(app: Flask, jwt_manager):
    """Register JWT error callbacks."""
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

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(rider_bp, url_prefix='/api/rider')
    app.register_blueprint(contact_bp, url_prefix='/api')


def _register_utility_routes(app: Flask):
    """Register health check and maintenance routes."""
    import os

    @app.route('/health')
    def health_check():
        return jsonify({'status': 'ok', 'message': 'Rahila Labs Backend is running'})

    @app.route('/api/reset-db')
    def reset_db():
        """
        DROP all tables and recreate them fresh.
        Protected by ?key= query param.
        DELETE THIS ROUTE after running it once on production.
        """
        from .models import User, Test, Rider
        from werkzeug.security import generate_password_hash as gph

        secret = request.args.get('key', '')
        expected = os.environ.get('SECRET_KEY', 'dev-secret-key-change-this')
        if secret != expected:
            return jsonify({'error': 'Unauthorized'}), 403

        try:
            db.drop_all()
            db.create_all()
            tests = [
                Test(name="Complete Blood Count", description="Full blood work analysis", price=1500),
                Test(name="Thyroid Profile", description="Thyroid function tests", price=2000),
                Test(name="Lipid Profile", description="Cholesterol and lipid levels", price=1800),
                Test(name="Liver Function", description="Liver health assessment", price=2200),
            ]
            db.session.bulk_save_objects(tests)
            admin = User(
                username="admin", email="admin@rahilalabs.com",
                password_hash=gph("admin123"), role="admin",
                status="active", is_verified=True
            )
            db.session.add(admin)
            riders = [
                Rider(name="Ahmed Khan", email="ahmed@rider.com", phone="03001234567",
                      password_hash=gph("rider123"), availability_status="available"),
                Rider(name="Hassan Ali", email="hassan@rider.com", phone="03009876543",
                      password_hash=gph("rider123"), availability_status="available"),
            ]
            db.session.bulk_save_objects(riders)
            db.session.commit()
            return jsonify({'message': '✅ Database reset and reseeded successfully.'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


def _init_db(app: Flask):
    """Create all tables and seed initial data if the database is empty."""
    from .models import User, Test, Rider, Appointment
    from werkzeug.security import generate_password_hash
    from datetime import datetime

    try:
        db.create_all()

        # --- Safe column migration ---
        # Add new columns to the `test` table if they don't already exist.
        # Uses SQL Server's IF NOT EXISTS check so it's safe to run every startup.
        from sqlalchemy import text
        migration_statements = [
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('test') AND name = 'code') ALTER TABLE [test] ADD code VARCHAR(20) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('test') AND name = 'category') ALTER TABLE [test] ADD category VARCHAR(100) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('test') AND name = 'specimen') ALTER TABLE [test] ADD specimen VARCHAR(100) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('test') AND name = 'reporting_time') ALTER TABLE [test] ADD reporting_time VARCHAR(50) NULL",
        ]
        for stmt in migration_statements:
            try:
                db.session.execute(text(stmt))
                db.session.commit()
            except Exception as col_err:
                db.session.rollback()
                app.logger.warning(f"Column migration warning: {col_err}")
        app.logger.info("DB column migration check complete")

        # Seed tests
        if not Test.query.first():
            tests = [
                Test(name="Complete Blood Count", description="Full blood work analysis", price=1500),
                Test(name="Thyroid Profile", description="Thyroid function tests", price=2000),
                Test(name="Lipid Profile", description="Cholesterol and lipid levels", price=1800),
                Test(name="Liver Function", description="Liver health assessment", price=2200),
            ]
            db.session.bulk_save_objects(tests)
            db.session.commit()
            app.logger.info("Seeded initial tests")

        # Seed admin
        if not User.query.filter_by(role='admin').first():
            admin = User(
                username="admin",
                email="admin@rahilalabs.com",
                password_hash=generate_password_hash("admin123"),
                role="admin", status="active", is_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            app.logger.info("Seeded admin user")

        # Seed demo patient & appointment
        if not User.query.filter_by(email='ali@example.com').first():
            patient = User(
                username="ali", email="ali@example.com",
                password_hash=generate_password_hash("password"),
                role="patient", phone="1234567890", city="Lahore", is_verified=True
            )
            db.session.add(patient)
            db.session.commit()

            test = Test.query.first()
            if test:
                appt = Appointment(
                    user_id=patient.id, test_id=test.id,
                    appointment_date=datetime.utcnow(),
                    status="pending", address="123 Main St, Lahore"
                )
                db.session.add(appt)
                db.session.commit()
                app.logger.info("Seeded demo appointment")

        # Seed demo riders
        if not Rider.query.first():
            riders = [
                Rider(name="Ahmed Khan", email="ahmed@rider.com", phone="03001234567",
                      password_hash=generate_password_hash("rider123"), availability_status="available"),
                Rider(name="Hassan Ali", email="hassan@rider.com", phone="03009876543",
                      password_hash=generate_password_hash("rider123"), availability_status="available"),
            ]
            db.session.bulk_save_objects(riders)
            db.session.commit()
            app.logger.info("Seeded demo riders")

    except Exception as e:
        app.logger.error(f"Error during DB initialization: {e}")

    # Seed tests from JSON locally or on Azure App Service
    try:
        from seed_from_json import seed_from_json
        seed_from_json()
    except Exception as e:
        app.logger.error(f"Error during JSON test seeding: {e}")
