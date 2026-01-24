from app import app
from models import db, User, Test, Appointment
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

def seed_data():
    with app.app_context():
        print("Seeding data...")

        # 1. Ensure Admin exists
        if not User.query.filter_by(role='admin').first():
            admin = User(username='admin', email='admin@rahilalabs.com', role='admin', password_hash=generate_password_hash('admin123'))
            db.session.add(admin)

        # 2. Add Patients
        p1 = User.query.filter_by(email='ali@example.com').first()
        if not p1:
            p1 = User(username='Ali Ahmed', email='ali@example.com', role='patient', phone='03001234567', city='Karachi', password_hash=generate_password_hash('123456'))
            db.session.add(p1)
        
        p2 = User.query.filter_by(email='sara@example.com').first()
        if not p2:
            p2 = User(username='Sara Khan', email='sara@example.com', role='patient', phone='03217654321', city='Lahore', password_hash=generate_password_hash('123456'))
            db.session.add(p2)

        # 3. Add Tests
        tests_data = [
            ("CBC (Complete Blood Count)", "Comprehensive blood analysis", 1500),
            ("Lipid Profile", "Cholesterol and triglycerides check", 2000),
            ("COVID-19 PCR", "Standard PCR test for COVID-19", 4500),
            ("Liver Function Test", "Assess liver health", 1800),
            ("Thyroid Profile", "T3, T4, TSH levels", 2500)
        ]
        
        tests = []
        for name, desc, price in tests_data:
            t = Test.query.filter_by(name=name).first()
            if not t:
                t = Test(name=name, description=desc, price=price)
                db.session.add(t)
            tests.append(t)
        
        db.session.commit() # Commit to get IDs

        # 4. Add Appointments
        # Get users again to ensure attached to session? no need if session active
        p1 = User.query.filter_by(email='ali@example.com').first()
        p2 = User.query.filter_by(email='sara@example.com').first()
        
        # Test appointments
        # P1 - Pending for Tomorrow
        a1 = Appointment(user_id=p1.id, test_id=tests[0].id, appointment_date=datetime.now() + timedelta(days=1), status='pending', address='Clifton, Karachi')
        # P2 - Confirmed for Today
        a2 = Appointment(user_id=p2.id, test_id=tests[1].id, appointment_date=datetime.now(), status='confirmed', address='Gulberg, Lahore')
        # P1 - Completed Yesterday
        a3 = Appointment(user_id=p1.id, test_id=tests[2].id, appointment_date=datetime.now() - timedelta(days=1), status='completed', address='Clifton, Karachi')

        db.session.add(a1)
        db.session.add(a2)
        db.session.add(a3)

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_data()
