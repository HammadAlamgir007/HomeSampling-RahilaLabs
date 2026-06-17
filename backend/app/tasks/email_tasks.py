from celery import shared_task
from app.models import db, User, Booking, Appointment
from app.utils.mail import send_email, send_booking_confirmation as _send_booking_confirmation, send_approval_email as _send_approval_email

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,))
def send_otp_email(self, email, otp_code, purpose='registration'):
    """Sends an OTP email for registration or password reset."""
    if purpose == 'registration':
        subject = 'Rahila Labs - Verification Code'
        body = f"Your registration verification code for Rahila Labs is: {otp_code}\n\nThis code will expire in 10 minutes."
    else:
        subject = 'Rahila Labs - Password Reset Code'
        body = f"Your password reset code is: {otp_code}\n\nThis code will expire in 10 minutes."
    
    result = send_email(email, subject, body)
    if result is False:
        raise Exception("Failed to send OTP email via SMTP")
    return result

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,))
def send_booking_confirmation(self, booking_id):
    """Sends a booking confirmation email to the patient."""
    booking = Booking.query.get(booking_id)
    if not booking or not booking.patient:
        return False
        
    patient = booking.patient
    test_name = booking.items[0].test.name if booking.items and booking.items[0].test else "Home Collection"
    test_date = booking.scheduled_datetime.strftime("%B %d, %Y at %I:%M %p") if booking.scheduled_datetime else "TBD"
    
    result = _send_booking_confirmation(
        patient_email=patient.email,
        patient_name=patient.username,
        mrn=patient.mrn or "N/A",
        booking_id=booking.booking_order_id or str(booking.id),
        test_name=test_name,
        test_date=test_date
    )
    if result is False:
        raise Exception("Failed to send booking confirmation email via SMTP")
    return result

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,))
def send_approval_email(self, appointment_id):
    """Sends an approval email when an appointment is confirmed by admin."""
    appointment = Appointment.query.get(appointment_id)
    if not appointment or not appointment.user:
        return False
        
    patient = appointment.user
    test_name = appointment.test.name if appointment.test else "Home Collection"
    test_date = appointment.appointment_date.strftime("%B %d, %Y at %I:%M %p") if appointment.appointment_date else "TBD"
    
    result = _send_approval_email(
        patient_email=patient.email,
        patient_name=patient.username,
        mrn=patient.mrn or "N/A",
        booking_id=appointment.booking_order_id or str(appointment.id),
        test_name=test_name,
        test_date=test_date,
        address=appointment.address or "Home Address"
    )
    if result is False:
        raise Exception("Failed to send approval email via SMTP")
    return result

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,))
def send_contact_form_notification(self, name, email, phone, subject, message):
    """Sends a notification to the admin when a contact form is submitted."""
    email_subject = f"Website Contact Request: {subject}"
    body = f"New Contact Form Submission from Rahila Labs Website\n\nContact Details:\n---------------\nName:    {name}\nEmail:   {email}\nPhone:   {phone if phone else 'Not provided'}\n\nMessage Details:\n---------------\nSubject: {subject}\n\nMessage:\n{message}"
    
    import os
    admin_email = os.environ.get('CONTACT_EMAIL', 'hammadalamgir777@gmail.com')
    
    result = send_email(admin_email, email_subject, body)
    if result is False:
        raise Exception("Failed to send contact form notification via SMTP")
    return result
