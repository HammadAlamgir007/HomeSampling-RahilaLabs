import pytest
from app import create_app
from app.models import db, User, Test, Rider
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Use testing config
    app = create_app('testing')
    
    # Establish an application context before running the tests.
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
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def test_db(app):
    """Fixture to provide a clean database with seed data."""
    with app.app_context():
        # Seed test user
        user = User(
            username="testuser",
            email="testuser@example.com",
            password_hash=generate_password_hash("password123"),
            role="patient",
            is_verified=True
        )
        # Seed test admin
        admin = User(
            username="testadmin",
            email="admin@example.com",
            password_hash=generate_password_hash("password123"),
            role="admin",
            is_verified=True
        )
        # Seed test rider
        rider = Rider(
            name="testrider",
            email="rider@example.com",
            phone="03001234567",
            password_hash=generate_password_hash("password123"),
            availability_status="available"
        )
        db.session.add_all([user, admin, rider])
        db.session.commit()
        yield db

@pytest.fixture
def auth_headers(client, test_db):
    """Returns headers containing a valid JWT for the test user."""
    res = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })
    token = res.json['data']['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def admin_headers(client, test_db):
    """Returns headers containing a valid JWT for the admin user."""
    res = client.post('/api/auth/login', json={
        'email': 'admin@example.com',
        'password': 'password123'
    })
    token = res.json['data']['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def rider_headers(client, test_db):
    """Returns headers containing a valid JWT for the test rider."""
    res = client.post('/api/auth/login', json={
        'email': 'rider@example.com',
        'password': 'password123',
        'is_rider': True
    })
    token = res.json['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
