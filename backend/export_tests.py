import json
from app import create_app
from app.models import Test

app = create_app('development')

with app.app_context():
    tests = Test.query.all()
    tests_list = []
    for t in tests:
        tests_list.append({
            'code': t.code,
            'name': t.name,
            'category': t.category,
            'specimen': t.specimen,
            'reporting_time': t.reporting_time,
            'price': t.price,
            'description': t.description
        })
        
    with open('tests_seed.json', 'w') as f:
        json.dump(tests_list, f, indent=4)
        
    print(f"Exported {len(tests_list)} tests to tests_seed.json")
