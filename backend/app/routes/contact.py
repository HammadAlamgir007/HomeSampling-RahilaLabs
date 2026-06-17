import os
import re
from app.tasks.email_tasks import send_contact_form_notification

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

from app.extensions import limiter

contact_bp = Blueprint('contact', __name__)

_EMAIL_PATTERN = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')

# SECURITY: Input length limits to prevent abuse
_MAX_NAME_LENGTH = 100
_MAX_EMAIL_LENGTH = 120
_MAX_PHONE_LENGTH = 20
_MAX_SUBJECT_LENGTH = 200
_MAX_MESSAGE_LENGTH = 2000


def is_valid_email(email):
    return bool(_EMAIL_PATTERN.match(email))


@contact_bp.route('/contact', methods=['POST'])
@cross_origin()
@limiter.limit("3 per minute", error_message="Too many messages. Please wait before trying again.")
def handle_contact():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()[:_MAX_NAME_LENGTH]
    email = data.get('email', '').strip()[:_MAX_EMAIL_LENGTH]
    phone = data.get('phone', '').strip()[:_MAX_PHONE_LENGTH]
    subject = data.get('subject', '').strip()[:_MAX_SUBJECT_LENGTH]
    message = data.get('message', '').strip()[:_MAX_MESSAGE_LENGTH]

    if not all([name, email, subject, message]):
        return jsonify({'error': 'Missing required fields'}), 400
    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    try:
        send_contact_form_notification.delay(name, email, phone, subject, message)
        return jsonify({'message': 'Message sent successfully'}), 200
    except Exception:
        return jsonify({'error': 'Failed to send message. Please try again later.'}), 500
