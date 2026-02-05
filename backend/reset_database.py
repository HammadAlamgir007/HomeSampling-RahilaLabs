import os
from app import app, db
from models import User, Test, Appointment, Rider
from werkzeug.security import generate_password_hash
from datetime import datetime

# Delete the database file if it exists
db_path = 'instance/database.db'
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"[OK] Deleted old database: {db_path}")

with app.app_context():
    # Create all tables fresh
    db.create_all()
    print("[OK] Created all database tables")
    
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
        print("[OK] Seeded 4 tests")
    
    # Seed admin
    if not User.query.filter_by(email='admin@rahilalabs.com').first():
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
    if not User.query.filter_by(email='ali@example.com').first():
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
        print("[OK] Seeded 2 riders")
    
    # Verify appointment table has rider_id
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(appointment)")
    cols = cursor.fetchall()
    has_rider_id = any('rider_id' in str(col) for col in cols)
    conn.close()
    
    print(f"\n[VERIFY] Appointment table has {len(cols)} columns")
    print(f"[VERIFY] rider_id column present: {has_rider_id}")
    
    if has_rider_id:
        print("\n=== SUCCESS! Database ready ===")
        print("   - Admin: admin@rahilalabs.com / admin123")
        print("   - Patient: ali@example.com / password")
        print("   - Rider 1: ahmed@rider.com / rider123")
        print("   - Rider 2: hassan@rider.com / rider123")
    else:
        print("\n[ERROR] rider_id column not found!")
