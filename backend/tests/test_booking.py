from app.models import db, Test, Booking, Appointment, BookingItem
from datetime import datetime, timedelta, timezone

def test_create_booking_success(client, app, test_db, auth_headers):
    """
    Test the complete booking creation flow via the v2 endpoint:
    1. Authenticate as a patient
    2. Submit a booking for a specific test
    3. Verify the Booking, BookingItem, and Appointment are created correctly (Phase 1 Fix Verification)
    """
    
    # 1. Fetch the test_id seeded in conftest.py
    with app.app_context():
        test_item = Test.query.first()
        test_id = test_item.id
        test_price = float(test_item.price)
        
    scheduled_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00Z")
    
    # 2. Make the API request to the CORRECT v2 endpoint
    res = client.post('/api/v2/bookings', headers=auth_headers, json={
        'test_ids': [test_id],
        'date': scheduled_date,
        'address_data': {
            'house': '123',
            'street': 'Test St',
            'area': 'Model Town',
            'city': 'Lahore',
            'state': 'Punjab',
            'zipCode': '54000'
        }
    })
    
    assert res.status_code == 201
    data = res.json
    assert 'booking' in data
    booking_data = data['booking']
    booking_id = booking_data['id']
    
    # 3. Verify Database State
    with app.app_context():
        # Verify exactly 1 Booking exists
        booking = Booking.query.get(booking_id)
        assert booking is not None
        # Verify total price via the items (Booking model computes total_price in to_dict, not as a column)
        assert sum(item.price for item in booking.items) == test_price
        
        # Verify exactly 1 BookingItem exists
        items = BookingItem.query.filter_by(booking_id=booking.id).all()
        assert len(items) == 1
        assert items[0].test_id == test_id
        
        # Verify exactly 1 Appointment (RiderVisit) exists (Phase 1 Fix Validation)
        # Use the correct attribute name: booking_order_id
        appointments = Appointment.query.filter_by(booking_order_id=booking.booking_order_id).all()
        assert len(appointments) == 1
        
        appt = appointments[0]
        assert appt.test_id is None  # Verify we use a single visit for the entire booking
        assert appt.status == 'pending'
        assert appt.address is not None
