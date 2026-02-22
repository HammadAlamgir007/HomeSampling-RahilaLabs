from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import smtplib
from email.message import EmailMessage
import os
import re

contact_bp = Blueprint('contact', __name__)

# Basic email regex validation
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

@contact_bp.route('/contact', methods=['POST'])
@cross_origin()
def handle_contact():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    
    # Validation
    if not all([name, email, subject, message]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
        
    # Get credentials
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')
    
    # Set destination email based on user request
    target_email = "hammadalamgir777@gmail.com"
    
    if not email_user or not email_pass:
        print("DEBUG Contact Error: Email credentials not configured in environment variables")
        return jsonify({'error': 'Server configuration error'}), 500
        
    try:
        msg = EmailMessage()
        
        # Format the email body professionally
        body = f"""New Contact Form Submission from Rahila Labs Website

Contact Details:
---------------
Name:    {name}
Email:   {email}
Phone:   {phone if phone else 'Not provided'}

Message Details:
---------------
Subject: {subject}

Message:
{message}
"""
        msg.set_content(body)
        msg['Subject'] = f"Website Contact Request: {subject}"
        msg['From'] = email_user
        msg['To'] = target_email
        msg['Reply-To'] = email  # Enables clicking 'Reply' to respond directly to the patient
        
        # Connect to Gmail SMTP server using TLS
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.login(email_user, email_pass)
        server.send_message(msg)
        server.quit()
        
        print(f"DEBUG: Successfully sent contact email from {email} to {target_email}")
        return jsonify({'message': 'Message sent successfully'}), 200
        
    except Exception as e:
        print(f"DEBUG Contact Email Error: {e}")
        return jsonify({'error': 'Failed to send message. Please try again later.'}), 500
