import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.abspath('backend'))

from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Connecting to live Database to add 'mrn' column...")
    try:
        # Check if the column exists to avoid errors on multiple runs
        check_col = db.session.execute(text(
            """
            SELECT count(*) 
            FROM sys.columns 
            WHERE Name = N'mrn' 
              AND Object_ID = Object_ID(N'user')
            """
        )).scalar()
        
        if check_col == 0:
            print("Column 'mrn' not found. Adding it now...")
            db.session.execute(text("ALTER TABLE [user] ADD mrn VARCHAR(255) NULL"))
            db.session.commit()
            print("Successfully added the 'mrn' column!")
        else:
            print("The 'mrn' column already exists in the table.")
            
    except Exception as e:
        db.session.rollback()
        print(f"Error altering table: {e}")
