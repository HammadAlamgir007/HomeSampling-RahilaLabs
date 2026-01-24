from app import app
from models import db, User, Test, Appointment

def check_data():
    with app.app_context():
        u_count = User.query.count()
        t_count = Test.query.count()
        a_count = Appointment.query.count()
        
        print(f"Users: {u_count}")
        print(f"Tests: {t_count}")
        print(f"Appointments: {a_count}")
        
        if u_count > 0:
            print("Sample User:", User.query.first().to_dict())

if __name__ == '__main__':
    check_data()
