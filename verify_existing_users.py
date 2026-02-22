import pyodbc

conn_string = "Driver={ODBC Driver 17 for SQL Server};Server=tcp:rahila-labs-server.database.windows.net,1433;Database=rahila-labs-db;Uid=sqladmin;Pwd=optiplex@780;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

print("Connecting to live Database to verify existing accounts...")
try:
    conn = pyodbc.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Update all unverified users to verified so they can log in
    cursor.execute("UPDATE [user] SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL")
    rows_affected = cursor.rowcount
    print(f"Successfully verified {rows_affected} existing accounts!")
    
except Exception as e:
    print(f"Error updating table: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
