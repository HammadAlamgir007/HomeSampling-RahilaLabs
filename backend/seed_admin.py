from app import app
from models import db, User
from werkzeug.security import generate_password_hash

def seed_admin():
    with app.app_context():
        # Check if admin exists
        admin = User.query.filter_by(role='admin').first()
        if admin:
            print(f"Admin already exists: {admin.username}")
            return

        print("Creating admin user...")
        new_admin = User(
            username='admin',
            email='admin@rahilalabs.com',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(new_admin)
        db.session.commit()
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")

if __name__ == '__main__':
    seed_admin()
