import pyodbc
import uuid

conn_string = "Driver={ODBC Driver 17 for SQL Server};Server=tcp:rahila-labs-server.database.windows.net,1433;Database=rahila-labs-db;Uid=sqladmin;Pwd=optiplex@780;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

print("Connecting to live Database to safely add 'booking_order_id'...")
try:
    conn = pyodbc.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add the column without the UNIQUE constraint first
    cursor.execute("""
        SELECT count(*) 
        FROM sys.columns 
        WHERE Name = N'booking_order_id' 
          AND Object_ID = Object_ID(N'appointment')
    """)
    row = cursor.fetchone()
    
    if row[0] == 0:
        print("Adding column 'booking_order_id' without constraints...")
        cursor.execute("ALTER TABLE appointment ADD booking_order_id VARCHAR(50) NULL")
        
        # 2. Update existing rows with a unique value (like UUID) so they don't share NULL
        print("Populating existing rows with unique booking IDs...")
        cursor.execute("SELECT id FROM appointment WHERE booking_order_id IS NULL")
        rows = cursor.fetchall()
        for r in rows:
            unique_id = "RL-" + str(uuid.uuid4())[:8].upper()
            cursor.execute("UPDATE appointment SET booking_order_id = ? WHERE id = ?", unique_id, r[0])
            
        # 3. Add the UNIQUE constraint now that there are no duplicates
        print("Adding UNIQUE constraint to 'booking_order_id'...")
        cursor.execute("ALTER TABLE appointment ADD CONSTRAINT UQ_app_booking_order UNIQUE (booking_order_id)")
        print("Successfully added the 'booking_order_id' column seamlessly!")
    else:
        print("The 'booking_order_id' column already exists in the table.")
            
except Exception as e:
    print(f"Error altering table: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
