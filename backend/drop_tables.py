"""
One-time script: Drop all tables and recreate them with the current SQLAlchemy schema.
Run from the backend/ directory:
    python drop_tables.py
"""

from app import app
from models import db

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("All tables dropped.")

    print("Recreating all tables with updated schema...")
    db.create_all()
    print("All tables created successfully.")
