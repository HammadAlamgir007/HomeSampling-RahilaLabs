import pyodbc
import re

conn_string = "Driver={ODBC Driver 17 for SQL Server};Server=tcp:rahila-labs-server.database.windows.net,1433;Database=rahila-labs-db;Uid=sqladmin;Pwd=optiplex@780;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

print("Connecting to live Database to validate verified accounts...")
try:
    conn = pyodbc.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Fetch all currently verified users
    cursor.execute("SELECT id, email FROM [user] WHERE is_verified = 1")
    users = cursor.fetchall()
    
    invalid_users = []
    
    # Basic regex for a standard email domain (ends with .com, .net, .org, .co, etc)
    email_regex = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    
    for user_id, email in users:
        # Check if email is valid and has a standard TLD
        is_valid = False
        if email and email_regex.match(email):
            tld = email.split('.')[-1].lower()
            if len(tld) >= 2: # At least .co, .net, etc
                is_valid = True
                
        if not is_valid:
            print(f"Flagging invalid email for reset: {email}")
            invalid_users.append(user_id)
            
    # 2. Revert verification for invalid users
    if invalid_users:
        placeholders = ','.join(['?'] * len(invalid_users))
        update_sql = f"UPDATE [user] SET is_verified = 0 WHERE id IN ({placeholders})"
        cursor.execute(update_sql, invalid_users)
        print(f"Reverted verification for {cursor.rowcount} accounts with invalid emails.")
    else:
        print("All verified accounts have valid email formats. No action needed.")
    
except Exception as e:
    print(f"Error checking accounts: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
