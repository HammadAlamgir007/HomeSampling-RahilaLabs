from app import app, db
from models import User, Test, Appointment, Rider
from werkzeug.security import generate_password_hash
from datetime import datetime

with app.app_context():
    # Create all tables
    db.create_all()
    print("[OK] Database tables created")
    
    # Seed tests
    if not Test.query.first():
        tests = [
            Test(name="Complete Blood Count", description="Full blood work analysis", price=1500),
            Test(name="Thyroid Profile", description="Thyroid function tests", price=2000),
            Test(name="Lipid Profile", description="Cholesterol and lipid levels", price=1800),
            Test(name="Liver Function", description="Liver health assessment", price=2200),
        ]
        db.session.bulk_save_objects(tests)
        db.session.commit()
        print("[OK] Seeded tests")
    
    # Seed admin
    if not User.query.filter_by(role='admin').first():
        admin = User(
            username="admin",
            email="admin@rahilalabs.com",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            status="active"
        )
        db.session.add(admin)
        db.session.commit()
        print("[OK] Seeded admin user")
    
    # Seed patient
    if not User.query.filter_by(role='patient').first():
        patient = User(
            username="ali",
            email="ali@example.com",
            password_hash=generate_password_hash("password"),
            role="patient",
            phone="1234567890",
            city="Lahore"
        )
        db.session.add(patient)
        db.session.commit()
        
        # Create appointment for patient
        test = Test.query.first()
        if test:
            appt = Appointment(
                user_id=patient.id,
                test_id=test.id,
                appointment_date=datetime.utcnow(),
                status="pending",
                address="123 Main St, Lahore"
            )
            db.session.add(appt)
            db.session.commit()
            print("[OK] Seeded patient and appointment")
    
    # Seed riders
    if not Rider.query.first():
        riders = [
            Rider(
                name="Ahmed Khan",
                email="ahmed@rider.com",
                phone="03001234567",
                password_hash=generate_password_hash("rider123"),
                availability_status="available"
            ),
            Rider(
                name="Hassan Ali",
                email="hassan@rider.com",
                phone="03009876543",
                password_hash=generate_password_hash("rider123"),
                availability_status="available"
            )
        ]
        db.session.bulk_save_objects(riders)
        db.session.commit()
        print("[OK] Seeded riders")
    
    print("\n=== Database setup complete! ===")
    print("   - Admin: admin@rahilalabs.com / admin123")
    print("   - Patient: ali@example.com / password")
    print("   - Rider 1: ahmed@rider.com / rider123")
    print("   - Rider 2: hassan@rider.com / rider123")
