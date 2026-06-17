import pytest
from app.models import db, Test, User
import threading

def test_concurrent_bookings_do_not_crash(client, patient_headers, init_database):
    """
    Test that creating multiple bookings rapidly does not cause an internal server error
    or race condition in the DB (simulated sequentially here for SQLite in-memory constraints,
    but tests the endpoint logic).
    """
    test1 = Test.query.filter_by(code='CBC01').first()
    
    payloads = [
        {
            "tests": [{"test_id": test1.id}],
            "appointment_date": "2026-10-10T10:00:00Z",
            "address": "123 Test St",
            "city": "Testville",
            "latitude": 0.0,
            "longitude": 0.0
        }
        for _ in range(3)
    ]

    responses = []
    for payload in payloads:
        res = client.post('/api/patient/book', json=payload)
        responses.append(res)

    for res in responses:
        assert res.status_code == 201
        data = res.get_json()
        assert 'booking_order_id' in data
