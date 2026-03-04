from flask import Blueprint, request, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies
from email_validator import validate_email, EmailNotValidError
import random
import re
from datetime import datetime, timedelta

from app.models import db, User, OTP
from app.extensions import limiter
from app.utils.api import api_response, sanitize_email, sanitize_string
from app.utils.identifiers import generate_mrn
from app.utils.mail import send_email

auth_bp = Blueprint('auth', __name__)


def is_strong_password(password):
    """Min 8 chars, 1 upper, 1 lower, 1 num, 1 special character."""
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
    return re.match(pattern, password) is not None


def is_valid_name(name):
    """Letters and spaces only, min 3 chars."""
    return bool(re.match(r"^[A-Za-z\s]{3,}$", name))


@auth_bp.route('/send-otp', methods=['POST'])
@limiter.limit("5 per minute", error_message="Too many requests. Please wait a minute before trying again.", scope="send-otp")
def send_otp():
    data = request.get_json()
    if not data or not data.get('email'):
        return api_response(False, "Email is required", field="email", status_code=400)

    email = sanitize_email(data.get('email'))

    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return api_response(False, "Invalid email format", field="email", status_code=400)

    if User.query.filter_by(email=email).first():
        return api_response(False, "Email already exists", field="email", status_code=409)

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    existing_otp = OTP.query.filter_by(email=email, purpose='registration').first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expires_at
        existing_otp.attempts = 0
    else:
        db.session.add(OTP(email=email, otp_code=otp_code, expires_at=expires_at, purpose='registration'))

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_response(False, "Failed to process request. Please try again.", status_code=500)

    mail_result = send_email(
        email,
        'Rahila Labs - Verfication Code',
        f"Your registration verification code for Rahila Labs is: {otp_code}\n\nThis code will expire in 10 minutes."
    )
    if mail_result and mail_result != "simulated":
        return api_response(True, "OTP sent successfully to your email", status_code=200)
    return api_response(False, "Failed to send OTP email. Please check your email address and try again.", status_code=500)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return api_response(False, "Missing data", status_code=400)

    username = sanitize_string(data.get('username'))
    email = sanitize_email(data.get('email'))
    password = sanitize_string(data.get('password'))
    otp_code = sanitize_string(data.get('otp_code'))
    phone = sanitize_string(data.get('phone'))
    city = sanitize_string(data.get('city'))

    if not username or not email or not password or not otp_code:
        return api_response(False, "Missing required fields", status_code=400)

    if not is_valid_name(username):
        return api_response(False, "Name must be at least 3 characters and contain only letters.", field="name", status_code=400)

    if not is_strong_password(password):
        return api_response(False, "Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.", field="password", status_code=400)

    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return api_response(False, "Invalid email format", field="email", status_code=400)

    if User.query.filter_by(email=email).first():
        return api_response(False, "Email already exists", field="email", status_code=409)

    otp_record = OTP.query.filter_by(email=email, purpose='registration').first()
    if not otp_record:
        return api_response(False, "No OTP requested for this email", field="otp_code", status_code=400)

    if datetime.utcnow() > otp_record.expires_at:
        return api_response(False, "OTP code has expired", field="otp_code", status_code=400)

    if otp_record.attempts >= 5:
        db.session.delete(otp_record)
        db.session.commit()
        return api_response(False, "Too many failed OTP attempts. Please request a new code.", field="otp_code", status_code=403)

    if otp_record.otp_code != otp_code:
        otp_record.attempts += 1
        db.session.commit()
        return api_response(False, "Invalid OTP code", field="otp_code", status_code=400)

    new_user = User(
        username=username, email=email,
        password_hash=generate_password_hash(password),
        role='patient', mrn=generate_mrn(),
        phone=phone, city=city, is_verified=True,
    )

    try:
        db.session.add(new_user)
        db.session.delete(otp_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_response(False, "Registration failed due to a database error. Please try again.", status_code=500)

    return api_response(True, "User registered successfully", data={'user': new_user.to_dict()}, status_code=201)


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute", error_message="Too many login attempts. Please wait.", scope="login")
def login():
    data = request.get_json()
    if not data:
        return api_response(False, "Missing data", status_code=400)

    email = sanitize_email(data.get('email'))
    password = sanitize_string(data.get('password'))
    remember_me = data.get('remember_me', False)

    if not email or not password:
        return api_response(False, "Missing email or password", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return api_response(False, "Invalid credentials", status_code=401)

    if user.locked_until and user.locked_until > datetime.utcnow():
        return api_response(False, "Too many attempts. Try again in 15 minutes.", status_code=429)
    elif user.locked_until and user.locked_until <= datetime.utcnow():
        user.locked_until = None
        user.failed_login_attempts = 0
        db.session.commit()

    if not check_password_hash(user.password_hash, password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            db.session.commit()
            return api_response(False, "Too many attempts. Try again in 15 minutes.", status_code=429)
        db.session.commit()
        return api_response(False, "Invalid email or password", status_code=401)

    if not user.is_verified:
        return api_response(False, "Account not verified. Please verify your email.", status_code=403)

    try:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_response(False, "Login failed due to an internal error.", status_code=500)

    expires_delta = timedelta(days=30) if remember_me else None
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'type': 'user'},
        expires_delta=expires_delta,
    )

    response, status = api_response(True, "Login successful", data={
        'user': user.to_dict(),
        'access_token': access_token,  # fallback for mobile app
    }, status_code=200)

    response_obj = make_response(response)
    set_access_cookies(response_obj, access_token, max_age=(30 * 24 * 60 * 60) if remember_me else None)
    return response_obj, status


@auth_bp.route('/logout', methods=['POST'])
def logout():
    response, status = api_response(True, "Successfully logged out", status_code=200)
    response_obj = make_response(response)
    unset_jwt_cookies(response_obj)
    return response_obj, status


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data:
        return api_response(False, "Missing data", status_code=400)

    email = sanitize_email(data.get('email'))
    if not email:
        return api_response(False, "Email is required", field="email", status_code=400)

    user = User.query.filter_by(email=email).first()
    generic_msg = 'If the email is registered, you will receive a reset code shortly.'
    if not user:
        return api_response(True, generic_msg, status_code=200)

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    existing_otp = OTP.query.filter_by(email=email, purpose='reset_password').first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expires_at
        existing_otp.attempts = 0
    else:
        db.session.add(OTP(email=email, otp_code=otp_code, expires_at=expires_at, purpose='reset_password'))

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_response(False, "Failed to process forgot password request.", status_code=500)

    mail_result = send_email(email, 'Rahila Labs - Password Reset Code',
                             f"Your password reset code is: {otp_code}\n\nThis code will expire in 10 minutes.")
    if mail_result == "simulated":
        generic_msg = f'If the email is registered, you will receive a reset code shortly. (Simulated: {otp_code})'

    return api_response(True, generic_msg, status_code=200)


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data:
        return api_response(False, "Missing data", status_code=400)

    email = sanitize_email(data.get('email'))
    otp_code = sanitize_string(data.get('otp_code'))
    new_password = sanitize_string(data.get('new_password'))

    if not email or not otp_code or not new_password:
        return api_response(False, "Missing required fields", status_code=400)

    if not is_strong_password(new_password):
        return api_response(False, "Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.", field="password", status_code=400)

    otp_record = OTP.query.filter_by(email=email, purpose='reset_password').first()
    if not otp_record or datetime.utcnow() > otp_record.expires_at:
        return api_response(False, "Invalid or expired OTP", field="otp_code", status_code=400)

    if otp_record.attempts >= 5:
        db.session.delete(otp_record)
        db.session.commit()
        return api_response(False, "Too many failed attempts. Please request a new reset code.", field="otp_code", status_code=403)

    if otp_record.otp_code != otp_code:
        otp_record.attempts += 1
        db.session.commit()
        return api_response(False, "Invalid OTP code", field="otp_code", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return api_response(False, "User not found", status_code=404)

    user.password_hash = generate_password_hash(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None

    try:
        db.session.delete(otp_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_response(False, "Failed to reset password due to an internal error.", status_code=500)

    return api_response(True, "Password has been reset successfully. You can now login.", status_code=200)
