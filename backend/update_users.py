from app import app, db
from models import User

with app.app_context():
    # Update Shahzaib
    user1 = User.query.filter_by(username="Shahzaib Latif").first()
    if not user1:
        # Try finding by email if username doesn't match exactly
        user1 = User.query.filter_by(email="shahzaib001@gmail.com").first()
    
    if user1:
        user1.phone = "03001234567"
        user1.city = "Karachi"
        print(f"Updated {user1.username}")

    # Update Hammad
    user2 = User.query.filter_by(username="Hammad Alamgir").first()
    if not user2:
        user2 = User.query.filter_by(email="hammad123@gmail.com").first()

    if user2:
        user2.phone = "03217654321"
        user2.city = "Lahore"
        print(f"Updated {user2.username}")
    
    db.session.commit()
    print("Database updated!")
