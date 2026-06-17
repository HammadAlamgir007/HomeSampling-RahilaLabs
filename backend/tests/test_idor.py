import pytest
from app.models import db, Appointment, Test, User

def test_patient_cannot_cancel_others_booking(client, patient_headers, init_database):
    """Test IDOR protection on booking cancellation."""
    # Create another patient
    patient2 = User(username='patient2', email='patient2@test.com', role='patient')
    patient2.set_password('Patient123!')
    db.session.add(patient2)
    db.session.commit()

    test = Test.query.first()
    # Create appointment for patient2
    appt = Appointment(user_id=patient2.id, test_id=test.id, address="123 Test St", status="pending")
    db.session.add(appt)
    db.session.commit()

    # Logged in as patient1, try to delete patient2's appointment
    res = client.delete(f'/api/patient/bookings/{appt.id}')
    assert res.status_code == 403
    assert b"unauthorized" in res.data.lower()

    # Try to delete their own appointment
    patient1 = User.query.filter_by(email='patient1@test.com').first()
    my_appt = Appointment(user_id=patient1.id, test_id=test.id, address="123 Test St", status="pending")
    db.session.add(my_appt)
    db.session.commit()

    res2 = client.delete(f'/api/patient/bookings/{my_appt.id}')
    assert res2.status_code == 200
    assert b"cancelled successfully" in res2.data.lower()
