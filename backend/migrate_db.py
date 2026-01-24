import sqlite3

def migrate():
    print("Migrating database...")
    try:
        conn = sqlite3.connect('instance/rahila_labs.db')
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(appointment)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'report_path' not in columns:
            print("Adding report_path column...")
            cursor.execute("ALTER TABLE appointment ADD COLUMN report_path VARCHAR(255)")
            conn.commit()
            print("Column added successfully.")
        
        # Check User columns
        cursor.execute("PRAGMA table_info(user)")
        user_columns = [info[1] for info in cursor.fetchall()]
        
        if 'phone' not in user_columns:
            print("Adding User profile columns...")
            cursor.execute("ALTER TABLE user ADD COLUMN phone VARCHAR(20)")
            cursor.execute("ALTER TABLE user ADD COLUMN city VARCHAR(50)")
            cursor.execute("ALTER TABLE user ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
            conn.commit()
            print("User columns added.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == '__main__':
    migrate()
