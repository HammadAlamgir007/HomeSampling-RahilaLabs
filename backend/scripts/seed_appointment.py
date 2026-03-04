from app import app, db
from models import User, Test, Appointment
from datetime import datetime

with app.app_context():
    # Ensure we have a patient
    patient = User.query.filter_by(role='patient').first()
    if not patient:
        print("Creating patient...")
        from werkzeug.security import generate_password_hash
        patient = User(username="demo_patient", email="demo@example.com", password_hash=generate_password_hash("password"), role="patient", phone="555-0123", city="Karachi")
        db.session.add(patient)
        db.session.commit()

    # Ensure we have a test
    test = Test.query.first()
    if not test:
        print("Creating test...")
        test = Test(name="General Checkup", price=1000)
        db.session.add(test)
        db.session.commit()

    # Create Appointment
    print(f"Creating appointment for {patient.username}...")
    appt = Appointment(
        user_id=patient.id,
        test_id=test.id,
        appointment_date=datetime.utcnow(),
        status="pending",
        address="Test Address, Model Town"
    )
    db.session.add(appt)
    db.session.commit()
    print("Force seeded appointment successfully!")
