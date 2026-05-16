def test_register_patient(client, test_db):
    from app.models import OTP
    import datetime
    # Insert an OTP first
    otp = OTP(email='newpatient@example.com', otp_code='123456', purpose='registration', expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10))
    test_db.session.add(otp)
    test_db.session.commit()

    res = client.post('/api/auth/register', json={
        'username': 'newpatient',
        'email': 'newpatient@example.com',
        'password': 'Password123!',
        'otp_code': '123456',
        'phone': '03009999999',
        'dateOfBirth': '1990-01-01',
        'city': 'Lahore'
    })
    assert res.status_code == 201
    assert 'User registered successfully' in res.json['message']

def test_login_success(client, test_db):
    res = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })
    assert res.status_code == 200
    assert res.json['success'] is True
    assert 'access_token' in res.json['data']

def test_login_wrong_password(client, test_db):
    res = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401
    assert res.json['success'] is False
    assert 'Invalid email or password' in res.json['message']

def test_logout(client, auth_headers):
    res = client.post('/api/auth/logout', headers=auth_headers)
    assert res.status_code == 200
    assert 'Successfully logged out' in res.json['message']

def test_admin_login(client, test_db):
    res = client.post('/api/admin/auth/login', json={
        'username': 'testadmin',
        'password': 'password123'
    })
    assert res.status_code == 200
    assert 'token' in res.json
    assert res.json['user']['role'] == 'admin'

def test_rider_login(client, test_db):
    res = client.post('/api/rider/auth/login', json={
        'email': 'rider@example.com',
        'password': 'password123'
    })
    assert res.status_code == 200
    assert 'token' in res.json
