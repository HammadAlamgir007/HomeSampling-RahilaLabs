import sys
import os

sys.path.insert(0, os.path.abspath('backend'))

from app import app, db
from models import OTP

with app.app_context():
    print("Creating OTP table...")
    OTP.__table__.create(db.engine, checkfirst=True)
    print("Done!")
