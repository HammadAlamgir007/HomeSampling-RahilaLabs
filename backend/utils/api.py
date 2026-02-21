from flask import jsonify

def api_response(success, message, data=None, field=None, status_code=200):
    """
    Standardized API Response Format.
    """
    response = {
        "success": success,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
        
    if field is not None:
        response["field"] = field
        
    return jsonify(response), status_code

def sanitize_email(email):
    return email.strip().lower() if email else None

def sanitize_string(string_val):
    return string_val.strip() if string_val else None
