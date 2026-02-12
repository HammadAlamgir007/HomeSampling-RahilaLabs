"""
Check rider information
"""
import sqlite3

conn = sqlite3.connect('instance/database.db')
cursor = conn.cursor()

print("\n=== All Riders ===")
cursor.execute("SELECT id, name, email, availability_status FROM rider")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Name: '{row[1]}', Email: '{row[2]}', Status: '{row[3]}'")

print("\n=== Appointments Assigned to Each Rider ===")
cursor.execute("""
    SELECT r.id, r.name, a.id as appt_id, a.status
    FROM rider r
    LEFT JOIN appointment a ON r.id = a.rider_id
    ORDER BY r.id, a.id
""")
rows = cursor.fetchall()
for row in rows:
    print(f"Rider ID: {row[0]}, Name: '{row[1]}', Appointment ID: {row[2]}, Status: '{row[3]}'")

conn.close()
