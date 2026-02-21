from flask import Blueprint, request, jsonify
from models import db, User, OTP
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from email_validator import validate_email, EmailNotValidError
import random
import smtplib
from email.message import EmailMessage
import os
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

def send_otp_email(to_email, otp_code):
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')
    
    msg = EmailMessage()
    msg.set_content(f"Your verification code for Rahila Labs is: {otp_code}\n\nThis code will expire in 10 minutes.")
    msg['Subject'] = 'Rahila Labs - Verification Code'
    msg['From'] = email_user
    msg['To'] = to_email

    try:
        # Use port 587 and STARTTLS as port 465 SSL is often blocked by Azure
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.login(email_user, email_pass)
        server.send_message(msg)
        server.quit()
        print(f"DEBUG: Successfully sent email to {to_email}")
        return True
    except Exception as e:
        print(f"DEBUG Email Error for {to_email}: {e}")
        return False

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
        
    email = data.get('email')
    
    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409
        
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Check if existing OTP for this email exists, if so update it, else create new
    existing_otp = OTP.query.filter_by(email=email).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expires_at
    else:
        new_otp = OTP(email=email, otp_code=otp_code, expires_at=expires_at)
        db.session.add(new_otp)
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"OTP DB error: {e}")
        return jsonify({'error': 'Failed to process request. Please try again.'}), 500

    if send_otp_email(email, otp_code):
        return jsonify({'message': 'OTP sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP email'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validation
    if not data or not data.get('username') or not data.get('email') or not data.get('password') or not data.get('otp_code'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    otp_code = data['otp_code']

    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    # Verify OTP
    otp_record = OTP.query.filter_by(email=email, otp_code=otp_code).first()
    if not otp_record:
        return jsonify({'error': 'Invalid OTP code'}), 400
        
    if datetime.utcnow() > otp_record.expires_at:
        return jsonify({'error': 'OTP code has expired'}), 400

    # Create User
    hashed_password = generate_password_hash(password)
    phone = data.get('phone')
    city = data.get('city')
    new_user = User(
        username=username, 
        email=email, 
        password_hash=hashed_password, 
        role='patient',
        phone=phone,
        city=city
    )
    
    db.session.add(new_user)
    try:
        # Delete used OTP
        if otp_record:
            db.session.delete(otp_record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Registration DB error: {e}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

    return jsonify({'message': 'User registered successfully', 'user': new_user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
        
    email = data['email']
    password = data['password']
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200
