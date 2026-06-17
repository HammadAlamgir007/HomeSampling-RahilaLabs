from marshmallow import Schema, fields, validate, validates, ValidationError, validates_schema
from datetime import datetime, timezone

class AddressSchema(Schema):
    house = fields.String(required=False, allow_none=True)
    street = fields.String(required=True)
    area = fields.String(required=False, allow_none=True)
    city = fields.String(required=False, allow_none=True)
    state = fields.String(required=False, allow_none=True) # Used for branch
    zipCode = fields.String(required=False, allow_none=True)

class BookingCreateSchema(Schema):
    test_ids = fields.List(fields.Integer(validate=validate.Range(min=1)), required=False)
    test_id = fields.Integer(required=False, validate=validate.Range(min=1)) # For v1 fallback
    date = fields.String(required=False) # For v1 fallback
    scheduled_datetime = fields.String(required=False)
    address_data = fields.Nested(AddressSchema, required=False)
    address = fields.String(required=False) # For v1 fallback
    notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=1000))
    idempotency_key = fields.String(required=False, allow_none=True)

    @validates_schema
    def validate_inputs(self, data, **kwargs):
        test_ids = data.get('test_ids')
        if not test_ids:
            if not data.get('test_id'):
                raise ValidationError("Missing required field: test_ids or test_id")
                
        date_str = data.get('date') or data.get('scheduled_datetime')
        if not date_str:
            raise ValidationError("Missing required field: scheduled_datetime or date")
            
        try:
            date_str_clean = date_str.replace('Z', '+00:00')
            scheduled = datetime.fromisoformat(date_str_clean)
            if scheduled < datetime.now(timezone.utc):
                pass
                # We won't block past dates yet in case admins book retroactively,
                # but ideally we validate it's in the future.
        except ValueError:
            raise ValidationError("Invalid date format. Use ISO format.")
            
        if not data.get('address_data') and not data.get('address'):
            raise ValidationError("Missing required field: address_data or address")

class AppointmentStatusUpdateSchema(Schema):
    status = fields.String(validate=validate.OneOf(['pending', 'confirmed', 'collected', 'completed', 'cancelled', 'rider_accepted', 'rider_on_way', 'rider_arrived', 'sample_collected']), required=False)
    rider_id = fields.Integer(validate=validate.Range(min=1), required=False)
    address = fields.String(required=False)
    date = fields.String(required=False)
