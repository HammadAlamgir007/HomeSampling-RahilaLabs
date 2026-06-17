from app.models import db, User, OTP
from datetime import datetime, timedelta, timezone

def test_login_patient_success(client, test_db):
    """Test successful login returns a JWT token."""
    res = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })
    assert res.status_code == 200
    data = res.json
    assert data['success'] is True
    assert 'access_token' in data['data']
    assert data['data']['user']['email'] == 'testuser@example.com'

def test_login_patient_invalid_credentials(client, test_db):
    """Test login fails with invalid password."""
    res = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401
    assert res.json['success'] is False

def test_register_patient(client, app):
    """Test patient registration with a valid mocked OTP."""
    with app.app_context():
        # Insert a valid OTP for a new email
        email = "newpatient@example.com"
        otp_code = "123456"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        otp = OTP(email=email, otp_code=otp_code, expires_at=expires_at, purpose='registration')
        db.session.add(otp)
        db.session.commit()

    res = client.post('/api/auth/register', json={
        'username': 'New Patient',
        'email': 'newpatient@example.com',
        'password': 'StrongPassword1!',
        'otp_code': '123456',
        'phone': '03001112233',
        'city': 'Karachi'
    })
    
    assert res.status_code == 201
    data = res.json
    assert data['success'] is True
    assert data['data']['user']['email'] == 'newpatient@example.com'

    # Verify user exists in DB
    with app.app_context():
        user = User.query.filter_by(email='newpatient@example.com').first()
        assert user is not None
        assert user.role == 'patient'
