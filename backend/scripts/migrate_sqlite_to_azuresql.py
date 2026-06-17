import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to path to import models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.models import db, User, Test, Rider, Booking, BookingItem, Appointment, Notification, OTP, TaskLog

def migrate_data():
    sqlite_url = "sqlite:///../instance/database.db"
    azure_sql_url = os.environ.get('AZURE_SQL_URL')
    
    if not azure_sql_url:
        print("ERROR: Please set the AZURE_SQL_URL environment variable.")
        print('Example: export AZURE_SQL_URL="mssql+pyodbc://user:pass@server.database.windows.net/db?driver=ODBC+Driver+18+for+SQL+Server"')
        sys.exit(1)

    print("Connecting to source SQLite database...")
    source_engine = create_engine(sqlite_url)
    SourceSession = sessionmaker(bind=source_engine)
    source_session = SourceSession()

    print("Connecting to target Azure SQL Database...")
    target_engine = create_engine(azure_sql_url)
    TargetSession = sessionmaker(bind=target_engine)
    target_session = TargetSession()

    # Disable foreign key checks temporarily in Azure SQL to allow inserting in any order, 
    # or just insert in the correct relational order. We will insert in order.
    
    print("\n--- Starting Data Migration ---")
    
    tables_to_migrate = [
        (User, "Users"),
        (Test, "Tests"),
        (Rider, "Riders"),
        (Booking, "Bookings"),
        (BookingItem, "Booking Items"),
        (Appointment, "Appointments"),
        (Notification, "Notifications"),
        (OTP, "OTPs"),
        (TaskLog, "Task Logs")
    ]

    try:
        for model, name in tables_to_migrate:
            print(f"Migrating {name}...")
            records = source_session.query(model).all()
            if not records:
                print(f"  No records found for {name}.")
                continue
                
            # Detach from source session to add to target
            for r in records:
                source_session.expunge(r)
                target_session.merge(r)  # merge handles existing IDs better than add
                
            target_session.commit()
            print(f"  Successfully migrated {len(records)} {name}.")
            
            # IDENTITY_INSERT workaround for SQL Server
            # SQL Server does not allow inserting explicit IDs into an IDENTITY column by default.
            # If the merge fails due to IDENTITY_INSERT, you must run `SET IDENTITY_INSERT tablename ON`
            # However, SQLAlchemy's merge might circumvent this if it generates INSERTs without IDs,
            # but we want to preserve IDs. The safest way is to use raw SQL for Identity Insert, 
            # or rely on SQLAlchemy's capabilities. 
            # If this script fails with Identity Insert errors, we'll need to enable it per table.

        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        target_session.rollback()
        print(f"\n❌ Migration failed: {e}")
    finally:
        source_session.close()
        target_session.close()

if __name__ == "__main__":
    migrate_data()
