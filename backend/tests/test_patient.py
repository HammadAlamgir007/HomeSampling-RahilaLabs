def test_list_tests(client):
    res = client.get('/api/patient/tests')
    assert res.status_code == 200
    assert 'tests' in res.json or isinstance(res.json, list)

def test_book_appointment(client, auth_headers, test_db):
    from app.models import Test
    test = Test(name="CBC", price=500.0, reporting_time="24h")
    test_db.session.add(test)
    test_db.session.commit()

    res = client.post('/api/v2/bookings', headers=auth_headers, json={
        'test_ids': [test.id],
        'date': '2026-10-10T10:00:00Z',
        'address_data': {
            'house': '12A',
            'street': 'Test Street',
            'city': 'Lahore',
            'state': 'Main Branch',
            'zipCode': '54000'
        }
    })
    
    assert res.status_code == 201
    assert 'Booking created successfully' in res.json['message']
    assert res.json['booking']['status'] == 'pending'

def test_list_appointments(client, auth_headers, test_db):
    res = client.get('/api/v2/bookings', headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json, list)

