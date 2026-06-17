import pytest
from app.models import db, OTP, User
import datetime
from datetime import timezone

def test_otp_generation_and_verification(client, init_database):
    """Test OTP flow: generate OTP, verify OTP."""
    # Register a new user
    res = client.post('/api/auth/register', json={
        'username': 'otpuser',
        'email': 'otpuser@test.com',
        'password': 'Password123!',
        'role': 'patient'
    })
    assert res.status_code == 201

    # OTP should be in DB
    user = User.query.filter_by(email='otpuser@test.com').first()
    assert user is not None
    assert user.is_verified == False

    otp_record = OTP.query.filter_by(user_id=user.id).first()
    assert otp_record is not None
    assert otp_record.is_verified == False

    # Verify with wrong OTP
    res_verify_fail = client.post('/api/auth/verify-otp', json={
        'email': 'otpuser@test.com',
        'otp': '000000'
    })
    assert res_verify_fail.status_code == 400

    # Verify with correct OTP
    res_verify_pass = client.post('/api/auth/verify-otp', json={
        'email': 'otpuser@test.com',
        'otp': otp_record.otp_code
    })
    assert res_verify_pass.status_code == 200

    db.session.refresh(user)
    assert user.is_verified == True

    # Try logging in now
    res_login = client.post('/api/auth/login', json={
        'email': 'otpuser@test.com',
        'password': 'Password123!'
    })
    assert res_login.status_code == 200
    assert 'access_token' in res_login.get_json()
