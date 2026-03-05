from .base import db


class Test(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(200))
    specimen = db.Column(db.String(100), nullable=True)
    reporting_time = db.Column(db.String(50), nullable=True)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'specimen': self.specimen,
            'reporting_time': self.reporting_time,
            'price': self.price,
        }
