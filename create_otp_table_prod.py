import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.abspath('backend'))

from app import app, db
from models import OTP

# Use app context to create tables
with app.app_context():
    print("Checking database connection and creating OTP table...")
    try:
        # Create OTP table specifically if it doesn't exist
        OTP.__table__.create(db.engine, checkfirst=True)
        print("Successfully created the OTP table in the database!")
    except Exception as e:
        print(f"Error creating table: {e}")
