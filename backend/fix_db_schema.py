import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ.get('DATABASE_URL')
print(f"Connecting to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as connection:
        print("Fixing User table password_hash column...")
        connection.execute(text("ALTER TABLE [user] ALTER COLUMN password_hash VARCHAR(255)"))
        
        print("Fixing Rider table password_hash column...")
        connection.execute(text("ALTER TABLE [rider] ALTER COLUMN password_hash VARCHAR(255)"))
        
        connection.commit()
        print("✅ Database schema fixed successfully!")
except Exception as e:
    print("\n❌ Failed to fix database")
    print(e)
