import os
import re
import subprocess
from app import create_app
from app.models import db, Test
from sqlalchemy import text

app = create_app('development')

def alter_table():
    with app.app_context():
        # Alter SQLite/Postgres table
        try:
            db.session.execute(text("ALTER TABLE test ADD COLUMN code VARCHAR(20)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN category VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN specimen VARCHAR(100)"))
            db.session.execute(text("ALTER TABLE test ADD COLUMN reporting_time VARCHAR(50)"))
            db.session.commit()
            print("Table altered successfully!")
        except Exception as e:
            db.session.rollback()
            print("Table might already be altered or error:", e)

def import_catalog():
    pdf_path = "../RATELIST - amc.pdf"
    result = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], stdout=subprocess.PIPE, text=True)
    
    with app.app_context():
        count = 0
        for line in result.stdout.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            # Split by 2 or more spaces
            parts = re.split(r'\s{2,}', line)
            
            # A valid row typically has 7 parts and starts with a number (Sr.#)
            if len(parts) >= 7 and parts[0].isdigit() and parts[-1].isdigit():
                code = parts[1]
                
                # Sometime test name contains multiple parts if there are spaces, but \s{2,} handles it usually.
                # parts: [sr_num, code, name, category, specimen, reporting_time, price]
                # If len is exactly 7
                if len(parts) == 7:
                    name = parts[2]
                    category = parts[3]
                    specimen = parts[4]
                    reporting_time = parts[5]
                    price = float(parts[6])
                else:
                    # if there's more than 7 parts, they probably had large spaces inside.
                    # Price is last, reporting_time is -2, specimen is -3, category is -4, name is joined remaining.
                    # Wait, let's just join the middle parts.
                    sr = parts[0]
                    code = parts[1]
                    price = float(parts[-1])
                    reporting_time = parts[-2]
                    specimen = parts[-3]
                    category = parts[-4]
                    name = " ".join(parts[2:-4])
                
                # Check if test with this code already exists
                existing = Test.query.filter_by(code=code).first()
                if not existing:
                    # also fallback check by name
                    existing = Test.query.filter_by(name=name).first()
                
                if existing:
                    existing.code = code
                    existing.category = category
                    existing.specimen = specimen
                    existing.reporting_time = reporting_time
                    existing.price = price
                else:
                    new_test = Test(
                        code=code,
                        name=name,
                        category=category,
                        specimen=specimen,
                        reporting_time=reporting_time,
                        price=price,
                        description=""
                    )
                    db.session.add(new_test)
                count += 1
                
        db.session.commit()
        print(f"Successfully processed {count} tests from catalog.")

if __name__ == '__main__':
    alter_table()
    import_catalog()
