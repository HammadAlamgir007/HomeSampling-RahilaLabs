from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from app.models import User, Rider

def require_admin():
    """
    Decorator to require a valid JWT token and verify the user has the 'admin' role.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('type') != 'user':
                return jsonify({'error': 'Unauthorized access'}), 403
                
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def require_rider():
    """
    Decorator to require a valid JWT token and verify the user is a rider.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('type') != 'rider':
                return jsonify({'error': 'Unauthorized access'}), 403
                
            rider_id = get_jwt_identity()
            rider = Rider.query.get(rider_id)
            if not rider:
                return jsonify({'error': 'Rider not found'}), 404
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper
