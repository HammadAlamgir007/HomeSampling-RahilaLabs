import pyodbc

conn_string = "Driver={ODBC Driver 17 for SQL Server};Server=tcp:rahila-labs-server.database.windows.net,1433;Database=rahila-labs-db;Uid=sqladmin;Pwd=optiplex@780;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

cols_to_add = [
    ("is_verified", "BIT DEFAULT 0"),
    ("failed_login_attempts", "INT DEFAULT 0"),
    ("locked_until", "DATETIME NULL")
]

print("Connecting to live Database to add missing columns...")
try:
    conn = pyodbc.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    for col_name, col_type in cols_to_add:
        # Check if the column exists to avoid errors on multiple runs
        cursor.execute(f"""
            SELECT count(*) 
            FROM sys.columns 
            WHERE Name = N'{col_name}' 
              AND Object_ID = Object_ID(N'[user]')
        """)
        row = cursor.fetchone()
        
        if row[0] == 0:
            print(f"Column '{col_name}' not found. Adding it now...")
            cursor.execute(f"ALTER TABLE [user] ADD {col_name} {col_type}")
            print(f"Successfully added the '{col_name}' column!")
        else:
            print(f"The '{col_name}' column already exists in the table.")
            
except Exception as e:
    print(f"Error altering table: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
