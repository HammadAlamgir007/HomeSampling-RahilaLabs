import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ.get('DATABASE_URL')
print(f"Testing connection to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT @@VERSION"))
        print("\n✅ Connection Successful!")
        print(f"Server Version: {result.fetchone()[0]}")
except Exception as e:
    print("\n❌ Connection Failed")
    print(e)
