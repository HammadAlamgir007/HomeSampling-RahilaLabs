from app import app, db
from models import User, Test, Appointment
from datetime import datetime
from werkzeug.security import generate_password_hash

with app.app_context():
    print("Starting seed...")
    
    # Ensure Test Exists
    test = Test.query.first()
    if not test:
        print("Creating test...")
        test = Test(name="General Checkup", price=1000, description="Routine health check")
        db.session.add(test)
        db.session.commit()
    
    # Ensure Patient Exists
    patient = User.query.filter_by(role='patient').first()
    if not patient:
        print("Creating patient...")
        patient = User(
            username="demo_patient", 
            email="demo@example.com", 
            password_hash=generate_password_hash("password"), 
            role="patient", 
            phone="555-0123", 
            city="Karachi"
        )
        db.session.add(patient)
        db.session.commit()
    else:
        print(f"Using existing patient: {patient.username}")

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
