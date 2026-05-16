def test_admin_dashboard(client, admin_headers):
    res = client.get('/api/admin/dashboard/stats', headers=admin_headers)
    assert res.status_code == 200
    assert 'total_patients' in res.json
    assert 'total_appointments' in res.json

def test_admin_get_patients(client, admin_headers):
    res = client.get('/api/admin/patients', headers=admin_headers)
    assert res.status_code == 200
    assert 'patients' in res.json

def test_admin_get_riders(client, admin_headers):
    res = client.get('/api/admin/riders', headers=admin_headers)
    assert res.status_code == 200
    assert 'riders' in res.json

def test_admin_create_test(client, admin_headers):
    res = client.post('/api/admin/tests', headers=admin_headers, json={
        'name': 'Liver Function Test',
        'price': 1000.0,
        'description': 'Tests liver health',
        'sample_type': 'Blood'
    })
    assert res.status_code == 201
    assert 'Test created successfully' in res.json['message']

def test_admin_get_appointments(client, admin_headers):
    res = client.get('/api/admin/appointments', headers=admin_headers)
    assert res.status_code == 200
    assert 'appointments' in res.json
