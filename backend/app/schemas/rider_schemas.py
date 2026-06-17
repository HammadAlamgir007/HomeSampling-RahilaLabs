from marshmallow import Schema, fields, validate, validates, ValidationError
import re

def validate_password(password):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
    if not re.match(pattern, password):
        raise ValidationError("Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.")

class RiderCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Regexp(r"^[A-Za-z\s]{3,}$", error="Name must be at least 3 characters and contain only letters."))
    email = fields.Email(required=True)
    phone = fields.String(required=True, validate=validate.Length(min=10, max=20))
    password = fields.String(required=True, validate=validate_password)

class RiderUpdateSchema(Schema):
    name = fields.String(required=False, validate=validate.Regexp(r"^[A-Za-z\s]{3,}$", error="Name must be at least 3 characters and contain only letters."))
    email = fields.Email(required=False)
    phone = fields.String(required=False, validate=validate.Length(min=10, max=20))
    availability_status = fields.String(required=False, validate=validate.OneOf(['available', 'busy', 'offline']))
