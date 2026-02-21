import os
import smtplib
from email.message import EmailMessage

def send_email(to_email, subject, body):
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')
    
    if not email_user or not email_pass:
        print(f"Warning: Email credentials not configured. Simulating email to {to_email}:")
        print(f"Subject: {subject}")
        print(body)
        return "simulated"

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = email_user
    msg['To'] = to_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(email_user, email_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_booking_confirmation(patient_email, patient_name, mrn, booking_id, test_name, test_date):
    subject = "Rahila Labs - Booking Confirmation"
    body = f"""Hello {patient_name},

Your appointment has been successfully booked!

Booking Details:
- Patient Name: {patient_name}
- Medical Record Number (MRN): {mrn}
- Booking Order ID: {booking_id}
- Test: {test_name}
- Date: {test_date}

Thank you for choosing Rahila Labs.
"""
    return send_email(patient_email, subject, body)
