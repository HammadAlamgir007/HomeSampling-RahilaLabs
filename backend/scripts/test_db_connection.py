import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

# Get connection string from .env
conn_str = os.getenv('DATABASE_URL')
# SQLAlchemy format: mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
# We need to parse this or construct a raw pyodbc connection string for testing
# Expected format in .env: "mssql+pyodbc://@SHAHZAIBLATIF\SQLEXPRESS/Rahila_labs?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"

print(f"Testing connection with: {conn_str}")

try:
    # Extract details for raw pyodbc (simplified parsing for testing)
    # Assuming Trusted Connection for local dev
    server = 'SHAHZAIBLATIF\\SQLEXPRESS' 
    database = 'Rahila_labs'
    driver = 'ODBC Driver 17 for SQL Server'
    
    print(f"Connecting to Server: {server}, Database: {database}...")
    
    cnxn = pyodbc.connect(f'DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;')
    cursor = cnxn.cursor()
    
    print("✅ Connection Successful!")
    
    # Check tables
    cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    tables = cursor.fetchall()
    
    print("\nExisting Tables:")
    for table in tables:
        print(f"- {table[0]}")
        
    # Check User table count
    try:
        cursor.execute("SELECT COUNT(*) FROM [user]")
        count = cursor.fetchone()[0]
        print(f"\nUser count: {count}")
    except Exception as e:
        print(f"Could not query user table: {e}")

    cnxn.close()

except Exception as e:
    print(f"\n❌ Connection Failed: {e}")
