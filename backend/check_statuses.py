"""
Quick script to check and fix appointment statuses
"""
import sqlite3

# Connect to database
conn = sqlite3.connect('instance/database.db')
cursor = conn.cursor()

print("\n=== All Appointments ===")
cursor.execute("SELECT id, status, rider_id FROM appointment")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Status: '{row[1]}', Rider ID: {row[2]}")

print("\n=== Appointments with Rider Assigned ===")
cursor.execute("SELECT id, status, rider_id FROM appointment WHERE rider_id IS NOT NULL")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Status: '{row[1]}', Rider ID: {row[2]}")

# Fix statuses with incorrect casing
print("\n=== Fixing Status Casing ===")
status_fixes = [
    ('Assigned_to_rider', 'assigned_to_rider'),
    ('Rider_accepted', 'rider_accepted'),
    ('Rider_on_way', 'rider_on_way'),
    ('Sample_collected', 'sample_collected'),
    ('Delivered_to_lab', 'delivered_to_lab'),
    ('Rider_rejected', 'rider_rejected'),
]

for old_status, new_status in status_fixes:
    cursor.execute("UPDATE appointment SET status = ? WHERE status = ?", (new_status, old_status))
    if cursor.rowcount > 0:
        print(f"Fixed {cursor.rowcount} appointments: '{old_status}' → '{new_status}'")

conn.commit()

print("\n=== After Fixes ===")
cursor.execute("SELECT id, status, rider_id FROM appointment WHERE rider_id IS NOT NULL")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Status: '{row[1]}', Rider ID: {row[2]}")

conn.close()
print("\n✅ Done!")
