import os
import pytest
from app import create_app
from app.models import db, User, Test, Rider, Appointment

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    os.environ['TESTING'] = 'true'
    # Use SQLite in-memory for fast tests
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    # Disable Celery execution in tests, tasks will run synchronously or be mocked
    os.environ['CELERY_BROKER_URL'] = 'memory://'
    os.environ['CELERY_RESULT_BACKEND'] = 'cache+memory://'
    # Use a dummy Redis URL if blocklist is used, though testing blocklist requires fakeredis or skipping
    os.environ['REDIS_URL'] = 'redis://localhost:6379/1' 

    app = create_app('testing')
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
        "JWT_COOKIE_CSRF_PROTECT": False, # disable CSRF for testing endpoints
    })

    # create db tables
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's click commands."""
    return app.test_cli_runner()

@pytest.fixture
def init_database(app):
    """Seed the database with some initial data."""
    with app.app_context():
        # Create an admin
        admin = User(username='admin', email='admin@test.com', role='admin')
        admin.set_password('Admin123!')
        
        # Create a patient
        patient = User(username='patient1', email='patient1@test.com', role='patient')
        patient.set_password('Patient123!')
        
        # Create a rider
        rider = Rider(name='rider1', email='rider1@test.com', phone='1234567890', availability_status='available')
        rider.set_password('Rider123!')
        
        # Create a test
        test = Test(name='CBC', code='CBC01', price=15.0, description='Complete Blood Count')
        
        db.session.add_all([admin, patient, rider, test])
        db.session.commit()
        
        # Keep references if needed by tests, though usually they'll query them
        yield db

@pytest.fixture
def admin_headers(client, init_database):
    """Returns headers containing a valid JWT for the admin user."""
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'Admin123!'
    })
    # For cookie-based JWT, client handles it. But we may need CSRF tokens.
    # We disabled JWT_COOKIE_CSRF_PROTECT in tests, so cookies in client are enough.
    return res

@pytest.fixture
def patient_headers(client, init_database):
    """Returns headers containing a valid JWT for the patient user."""
    res = client.post('/api/auth/login', json={
        'email': 'patient1@test.com',
        'password': 'Patient123!'
    })
    return res
