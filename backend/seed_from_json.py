import json
import os
from app import create_app
from app.models import db, Test
from sqlalchemy import text

app = create_app('development')

def alter_table():
    with app.app_context():
        try:
            db.session.execute(text("ALTER TABLE test ADD COLUMN code VARCHAR(20)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN category VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN specimen VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN reporting_time VARCHAR(50)"))
            db.session.commit()
            print("Table altered successfully!")
        except Exception as e:
            db.session.rollback()
            # Already altered or error
            pass

def seed_from_json():
    json_path = os.path.join(os.path.dirname(__file__), 'tests_seed.json')
    if not os.path.exists(json_path):
        print(f"File {json_path} not found.")
        return

    with open(json_path, 'r') as f:
        tests_data = json.load(f)

    with app.app_context():
        # Safeguard: Do NOT seed if there are already tests in the database
        # This prevents overwriting any changes made by the admin in production.
        existing_count = Test.query.count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} tests. Skipping JSON seed to preserve edits.")
            return

        count = 0
        for test_item in tests_data:
            code = test_item.get('code')
            name = test_item.get('name')
            
            existing = None
            if code:
                existing = Test.query.filter_by(code=code).first()
            if not existing and name:
                existing = Test.query.filter_by(name=name).first()

            # We only arrive here if db is 0, so we know it doesn't exist.
            new_test = Test(
                code=code,
                name=name,
                category=test_item.get('category'),
                specimen=test_item.get('specimen'),
                reporting_time=test_item.get('reporting_time'),
                price=test_item.get('price'),
                description=test_item.get('description', '')
            )
            db.session.add(new_test)
            count += 1

        db.session.commit()
        print(f"Successfully seeded {count} tests from JSON.")

if __name__ == '__main__':
    alter_table()
    seed_from_json()
