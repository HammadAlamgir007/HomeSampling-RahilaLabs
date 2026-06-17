from marshmallow import Schema, fields, validate, validates, ValidationError, validates_schema
import re

def validate_password(password):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
    if not re.match(pattern, password):
        raise ValidationError("Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.")

class UserRegistrationSchema(Schema):
    username = fields.String(required=True, validate=validate.Regexp(r"^[A-Za-z\s]{3,}$", error="Name must be at least 3 characters and contain only letters."))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate_password)
    otp_code = fields.String(required=True, validate=validate.Length(equal=6, error="OTP must be exactly 6 digits."))
    phone = fields.String(required=False, validate=validate.Length(min=10, max=20))
    city = fields.String(required=False, validate=validate.Length(max=50))

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)
    remember_me = fields.Boolean(missing=False)

class PasswordChangeSchema(Schema):
    email = fields.Email(required=True)
    otp_code = fields.String(required=True, validate=validate.Length(equal=6))
    new_password = fields.String(required=True, validate=validate_password)
    confirm_password = fields.String(required=True)

    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        if data.get('new_password') != data.get('confirm_password'):
            raise ValidationError("Passwords do not match.", field_name="confirm_password")
