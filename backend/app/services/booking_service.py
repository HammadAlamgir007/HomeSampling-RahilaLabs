import uuid
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError
from app.models import db, Booking, BookingItem, Test
from app.utils.identifiers import generate_booking_id

class BookingService:
    @staticmethod
    def create_booking(patient_id: int, test_ids: list[int], address_data: dict, scheduled_datetime: datetime, notes: str = None, idempotency_key: str = None):
        """
        Creates a booking atomically. Expects test_ids to be a list of integers.
        Returns the newly created booking.
        """
        # Validate tests
        tests = Test.query.filter(Test.id.in_(test_ids)).all()
        if len(tests) != len(test_ids):
            raise ValueError("One or more test IDs are invalid.")
            
        # Check idempotency
        if idempotency_key:
            existing_booking = Booking.query.filter_by(idempotency_key=idempotency_key).first()
            if existing_booking:
                return existing_booking

        # Generate a unified collision-safe ID
        order_id = generate_booking_id()

        booking = Booking(
            booking_order_id=order_id,
            user_id=patient_id,
            address_data=address_data,
            scheduled_datetime=scheduled_datetime,
            notes=notes,
            status='pending',
            idempotency_key=idempotency_key
        )
        
        from app.models import Appointment

        db.session.add(booking)
        db.session.flush() # Get booking ID without committing
        
        # Format address for legacy Appointment table
        addr = booking.address_data
        # Frontend uses 'state' field for Branch selection
        legacy_address = f"{addr.get('house', '')}, {addr.get('street', '')}, {addr.get('area', '')}, {addr.get('city', '')} (Branch: {addr.get('state', 'Main')}) - Zip: {addr.get('zipCode', '')}"
        
        for test in tests:
            # Create the atomic item
            item = BookingItem(
                booking_id=booking.id,
                test_id=test.id,
                price=test.price,
                item_status='pending'
            )
            db.session.add(item)
            
        # Create a single visit (legacy appointment record) for the entire booking
        appointment = Appointment(
            user_id=patient_id,
            test_id=None, # Nullable now, represents the entire booking
            appointment_date=scheduled_datetime,
            address=legacy_address,
            booking_order_id=order_id,
            status='pending'
        )
        db.session.add(appointment)
            
        try:
            db.session.commit()
            return booking
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def update_booking_status(booking_id: int, new_status: str):
        """
        Safely update booking status using optimistic locking to prevent race conditions.
        """
        booking = Booking.query.get(booking_id)
        if not booking:
            raise ValueError("Booking not found")
            
        booking.status = new_status
        try:
            db.session.commit()
            return booking
        except StaleDataError:
            db.session.rollback()
            raise ValueError("Concurrency error: Booking was modified by another transaction.")
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_patient_bookings(patient_id: int):
        from sqlalchemy.orm import joinedload
        return Booking.query.options(joinedload(Booking.items)).filter_by(user_id=patient_id).order_by(Booking.scheduled_datetime.desc()).all()
