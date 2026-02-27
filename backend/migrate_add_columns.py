"""
migrate_add_columns.py — adds all columns introduced after initial DB creation.
Safe to run multiple times (checks if column already exists before adding).
"""
import sqlite3
import os

# Detect which DB file is in use
db_path = None
for candidate in ['instance/database.db', 'rahila_labs.db']:
    if os.path.exists(candidate):
        db_path = candidate
        print(f"Found DB: {candidate}")
        break

if not db_path:
    print("ERROR: No database file found!")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

def column_exists(table, column):
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())

def add_column(table, column, col_type, default=None):
    if column_exists(table, column):
        print(f"  SKIP  {table}.{column} (already exists)")
        return
    sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
    if default is not None:
        sql += f" DEFAULT {default}"
    cur.execute(sql)
    print(f"  ADDED {table}.{column}")

print("\n── appointment table columns ──────────────────────────")
# Geo-fence / location Phase 2-3
add_column("appointment", "patient_latitude",  "REAL")
add_column("appointment", "patient_longitude", "REAL")
# Timestamps Phase 2
add_column("appointment", "arrived_at",         "DATETIME")
add_column("appointment", "delivered_at",        "DATETIME")
# Sample collection Phase 7
add_column("appointment", "sample_photo",        "VARCHAR(255)")
add_column("appointment", "collection_notes",    "TEXT")
add_column("appointment", "collection_latitude", "REAL")
add_column("appointment", "collection_longitude","REAL")
add_column("appointment", "sample_collected_at", "DATETIME")
# SLA Phase 5
add_column("appointment", "pickup_deadline",     "DATETIME")
add_column("appointment", "delivery_deadline",   "DATETIME")
add_column("appointment", "priority_level",      "VARCHAR(20)", default="'normal'")
# Rejection Phase 2
add_column("appointment", "rider_rejected_at",   "DATETIME")
add_column("appointment", "rejection_reason",    "TEXT")
# Booking order
add_column("appointment", "booking_order_id",    "VARCHAR(100)")
# Report
add_column("appointment", "report_path",         "VARCHAR(255)")

print("\n── task_log table ─────────────────────────────────────")
cur.execute("""
CREATE TABLE IF NOT EXISTS task_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL REFERENCES appointment(id),
    rider_id INTEGER REFERENCES rider(id),
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by_role VARCHAR(20) NOT NULL,
    changed_by_id INTEGER,
    latitude REAL,
    longitude REAL,
    log_meta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
print("  OK    task_log table (created or already exists)")

conn.commit()
conn.close()
print("\n✅ Migration complete.")
