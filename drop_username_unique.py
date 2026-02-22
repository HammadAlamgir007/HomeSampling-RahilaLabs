"""Drop the unique constraint on the username column in the User table."""
import sys
sys.path.insert(0, 'backend')

from app import app, db
from sqlalchemy import text

with app.app_context():
    # Find and drop unique constraint/index on username
    result = db.session.execute(text(
        "SELECT name FROM sys.indexes "
        "WHERE object_id = OBJECT_ID('[user]') "
        "AND is_unique = 1 "
        "AND name != 'PK__user__3213E83F%'"  
    ))
    rows = result.fetchall()
    print("Found unique indexes:", rows)
    
    for row in rows:
        idx_name = row[0]
        if 'username' in idx_name.lower() or 'uq__user__' in idx_name.lower():
            print(f"Dropping index: {idx_name}")
            db.session.execute(text(f'DROP INDEX [{idx_name}] ON [user]'))
            db.session.commit()
            print(f"Dropped: {idx_name}")

    # Also try dropping by a common naming pattern
    try:
        db.session.execute(text(
            "DECLARE @constraint_name NVARCHAR(256); "
            "SELECT @constraint_name = name FROM sys.indexes "
            "WHERE object_id = OBJECT_ID('[user]') AND is_unique = 1 "
            "AND name LIKE '%username%'; "
            "IF @constraint_name IS NOT NULL "
            "EXEC('DROP INDEX [' + @constraint_name + '] ON [user]')"
        ))
        db.session.commit()
        print("Username unique constraint dropped (if existed)")
    except Exception as e:
        db.session.rollback()
        print(f"Note: {e}")

    # Verify
    result = db.session.execute(text(
        "SELECT name, is_unique FROM sys.indexes "
        "WHERE object_id = OBJECT_ID('[user]')"
    ))
    print("\nRemaining indexes on [user]:")
    for row in result.fetchall():
        print(f"  {row[0]} (unique={row[1]})")
    
    print("\nDone!")
