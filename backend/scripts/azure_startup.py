from app import app, init_db

if __name__ == '__main__':
    print("Running database initialization...")
    init_db()
    print("Database initialization complete.")
