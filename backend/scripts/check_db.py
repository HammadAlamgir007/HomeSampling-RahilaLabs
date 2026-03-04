from app import app
from models import db, Appointment, Rider

with app.app_context():
    riders = Rider.query.all()
    print("RIDERS:")
    for r in riders:
        print(f"ID={r.id}, Email={r.email}, Name={r.name}")
    
    apps = Appointment.query.all()
    print("\nAPPOINTMENTS:")
    for a in apps:
        print(f"ApptID={a.id} | Status={a.status} | AssignedRiderID={a.rider_id}")
