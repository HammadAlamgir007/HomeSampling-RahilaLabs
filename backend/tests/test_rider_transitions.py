import pytest
from app.models import db, Appointment, Test, User, Rider

def test_appointment_status_transitions(client, admin_headers, init_database):
    """Test valid and invalid state transitions for an appointment."""
    patient = User.query.filter_by(email='patient1@test.com').first()
    test = Test.query.first()
    appt = Appointment(user_id=patient.id, test_id=test.id, address="123 Test St", status="pending")
    db.session.add(appt)
    db.session.commit()

    # Valid transition: pending -> confirmed
    res = client.put(f'/api/admin/appointments/{appt.id}/status', json={'status': 'confirmed'})
    assert res.status_code == 200
    assert res.get_json()['appointment']['status'] == 'confirmed'

    # Valid transition: confirmed -> rider_accepted (using auto-assign)
    rider = Rider.query.filter_by(name='rider1').first()
    res = client.post(f'/api/admin/appointments/{appt.id}/auto-assign-rider')
    assert res.status_code == 200
    assert res.get_json()['appointment']['status'] == 'rider_accepted'

    # Rider simulates accepting/on-way (since rider routes use JWT, we use admin route here or mock rider)
    # We'll just test the state machine logic in the model directly for the rest
    from app.models import db
    db.session.refresh(appt)
    
    # Valid: rider_accepted -> rider_on_way
    appt.transition_status('rider_on_way', changed_by_role='rider', rider_id=rider.id)
    assert appt.status == 'rider_on_way'

    # Invalid: rider_on_way -> pending (cannot go backwards)
    with pytest.raises(ValueError) as exc:
        appt.transition_status('pending', changed_by_role='admin')
    assert "Cannot revert" in str(exc.value)

    # Valid: rider_on_way -> sample_collected
    appt.transition_status('sample_collected', changed_by_role='rider', rider_id=rider.id)
    
    # Valid: sample_collected -> delivered_to_lab
    appt.transition_status('delivered_to_lab', changed_by_role='rider', rider_id=rider.id)
    assert appt.status == 'delivered_to_lab'
