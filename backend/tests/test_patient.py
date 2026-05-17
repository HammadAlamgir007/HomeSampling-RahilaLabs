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

def test_book_multiple_tests(client, auth_headers, test_db):
    from app.models import Test
    test1 = Test(name="Test One", price=400.0, reporting_time="12h")
    test2 = Test(name="Test Two", price=600.0, reporting_time="24h")
    test_db.session.add_all([test1, test2])
    test_db.session.commit()

    res = client.post('/api/v2/bookings', headers=auth_headers, json={
        'test_ids': [test1.id, test2.id],
        'date': '2026-10-11T11:00:00Z',
        'address_data': {
            'house': '12B',
            'street': 'Multi Street',
            'city': 'Lahore',
            'state': 'Main Branch',
            'zipCode': '54000'
        }
    })
    
    assert res.status_code == 201
    assert 'Booking created successfully' in res.json['message']
    assert len(res.json['booking']['items']) == 2

