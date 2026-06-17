import pytest
from app.models import Appointment, Test, User

def test_admin_can_view_appointments(client, admin_headers, init_database):
    """Test that an admin can view the paginated list of appointments."""
    # Create an appointment first
    patient = User.query.filter_by(email='patient1@test.com').first()
    test = Test.query.first()
    from app.models import db
    appt = Appointment(user_id=patient.id, test_id=test.id, address="123 Test St", booking_order_id="TEST1234")
    db.session.add(appt)
    db.session.commit()

    # Admin makes request (cookie is preserved in client session)
    res = client.get('/api/admin/appointments')
    assert res.status_code == 200
    data = res.get_json()
    assert 'appointments' in data
    assert len(data['appointments']) == 1
    assert data['appointments'][0]['booking_order_id'] == "TEST1234"

def test_patient_cannot_view_admin_appointments(client, patient_headers):
    """Test that RBAC decorator prevents patient from accessing admin routes."""
    res = client.get('/api/admin/appointments')
    # Because of @require_admin, this should be 403 Forbidden
    assert res.status_code == 403
    assert b"admin privilege required" in res.data.lower() or b"unauthorized" in res.data.lower() or b"forbidden" in res.data.lower() or b"msg" in res.data.lower()
