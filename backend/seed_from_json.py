import json
import os
from app import create_app
from app.models import db, Test
from sqlalchemy import text

def alter_table(app):
    from app.models import db
    from sqlalchemy import text
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

def seed_from_json(app=None):
    from app.models import db, Test
    
    if app is None:
        from app import create_app
        app = create_app('development')

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
        new_tests = []
        for test_item in tests_data:
            code = test_item.get('code')
            name = test_item.get('name')

            new_test = Test(
                code=code,
                name=name,
                category=test_item.get('category'),
                specimen=test_item.get('specimen'),
                reporting_time=test_item.get('reporting_time'),
                price=test_item.get('price'),
                description=test_item.get('description', '')
            )
            new_tests.append(new_test)
            count += 1
            
        print("Starting bulk insert to Azure SQL...")
        db.session.bulk_save_objects(new_tests)

        db.session.commit()
        print(f"Successfully seeded {count} tests from JSON.")

if __name__ == '__main__':
    from app import create_app
    app = create_app('development')
    alter_table(app)
    seed_from_json(app)
