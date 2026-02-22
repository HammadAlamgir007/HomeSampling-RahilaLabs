import pyodbc

conn_string = "Driver={ODBC Driver 17 for SQL Server};Server=tcp:rahila-labs-server.database.windows.net,1433;Database=rahila-labs-db;Uid=sqladmin;Pwd=optiplex@780;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

print("Connecting to Azure SQL Server via pyodbc...")
try:
    conn = pyodbc.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Checking if 'mrn' column exists...")
    # Check if mrn exists
    cursor.execute("""
        SELECT count(*) 
        FROM sys.columns 
        WHERE Name = N'mrn' 
          AND Object_ID = Object_ID(N'user')
    """)
    row = cursor.fetchone()
    
    if row[0] == 0:
        print("Column 'mrn' not found. Adding it now...")
        cursor.execute("ALTER TABLE [user] ADD mrn VARCHAR(255) NULL")
        print("Successfully added the 'mrn' column!")
    else:
        print("The 'mrn' column already exists in the table.")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
