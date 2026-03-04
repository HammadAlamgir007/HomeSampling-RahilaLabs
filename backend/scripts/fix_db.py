import pyodbc
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=SHAHZAIBLATIF\\SQLEXPRESS;DATABASE=Rahila_labs;Trusted_Connection=yes')
conn.autocommit = True
cursor = conn.cursor()

try:
    print("Trying to drop constraint...")
    cursor.execute("ALTER TABLE [user] DROP CONSTRAINT [UQ__user__F3DBC572FCAEB8D7]")
    print("SUCCESS Dropped as constraint!")
except Exception as e:
    print("Failed as constraint:", e)

try:
    print("Trying to drop index...")
    cursor.execute("DROP INDEX [UQ__user__F3DBC572FCAEB8D7] ON [user]")
    print("SUCCESS Dropped as index!")
except Exception as e:
    print("Failed as index:", e)
    
cursor.close()
conn.close()
