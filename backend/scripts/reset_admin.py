from app import app
from models import db, User
from werkzeug.security import generate_password_hash

def reset_admin():
    with app.app_context():
        user = User.query.filter_by(username='admin').first()
        if user:
            print(f"Found admin user. Role: {user.role}")
            user.password_hash = generate_password_hash('admin123')
            user.role = 'admin' # Ensure role is correct
            db.session.commit()
            print("Password reset to: admin123")
        else:
            print("Admin user not found! Creating one...")
            user = User(username='admin', email='admin@rahilalabs.com', role='admin', password_hash=generate_password_hash('admin123'))
            db.session.add(user)
            db.session.commit()
            print("Admin user created with password: admin123")

if __name__ == '__main__':
    reset_admin()
