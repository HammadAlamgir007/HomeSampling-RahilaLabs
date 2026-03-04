import pyodbc

# Connection string
conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=SHAHZAIBLATIF\\SQLEXPRESS;DATABASE=Rahila_labs;Trusted_Connection=yes'

try:
    conn = pyodbc.connect(conn_str)
    conn.autocommit = True
    cursor = conn.cursor()

    # Step 1: Find the name of the unique constraint on 'username' column
    find_constraint_sql = """
    SELECT kc.name
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID('[user]')
      AND kc.type = 'UQ'
      AND c.name = 'username';
    """
    
    cursor.execute(find_constraint_sql)
    row = cursor.fetchone()
    
    if row:
        constraint_name = row[0]
        print(f"Found unique constraint on username: {constraint_name}")
        
        # Step 2: Drop it
        drop_sql = f"ALTER TABLE [user] DROP CONSTRAINT [{constraint_name}]"
        print(f"Executing: {drop_sql}")
        cursor.execute(drop_sql)
        print("SUCCESS! Constraint dropped.")
    else:
        # If not found there, it might be a unique index (not a constraint)
        print("No unique constraint found via sys.key_constraints. Checking sys.indexes...")
        find_index_sql = """
        SELECT i.name
        FROM sys.indexes i
        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('[user]')
          AND i.is_unique = 1
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0
          AND c.name = 'username';
        """
        cursor.execute(find_index_sql)
        row = cursor.fetchone()
        
        if row:
            index_name = row[0]
            print(f"Found unique index on username: {index_name}")
            drop_sql = f"DROP INDEX [{index_name}] ON [user]"
            print(f"Executing: {drop_sql}")
            cursor.execute(drop_sql)
            print("SUCCESS! Index dropped.")
        else:
            print("No unique index or constraint found on 'username' column.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
