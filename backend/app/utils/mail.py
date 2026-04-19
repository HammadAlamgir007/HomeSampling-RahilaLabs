import os
import smtplib
from email.message import EmailMessage


def send_email(to_email, subject, body, html_body=None):
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')

    if not email_user or not email_pass:
        print(f"[EMAIL SIM] To: {to_email} | Subject: {subject}")
        print(body)
        return "simulated"

    msg = EmailMessage()
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype='html')
    msg['Subject'] = subject
    msg['From'] = f"Rahila Labs <{email_user}>"
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
    subject = "Rahila Labs – Booking Received ✅"
    body = f"""Hello {patient_name},\n\nYour appointment request has been received!\n\nBooking ID: {booking_id}\nMRN: {mrn}\nTest: {test_name}\nDate: {test_date}\n\nWe will confirm your appointment shortly.\n\nThank you,\nRahila Labs Team"""
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:24px">
      <div style="background:#1e3a8a;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Rahila Labs</h1>
        <p style="color:#93c5fd;margin:4px 0 0">Home Sample Collection</p>
      </div>
      <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <h2 style="color:#1e3a8a">Booking Received ✅</h2>
        <p>Hello <strong>{patient_name}</strong>, your appointment request has been received.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;font-weight:bold;color:#64748b">Booking ID</td><td style="padding:8px"><code style="background:#e2e8f0;padding:2px 6px;border-radius:4px">{booking_id}</code></td></tr>
          <tr style="background:#f1f5f9"><td style="padding:8px;font-weight:bold;color:#64748b">MRN</td><td style="padding:8px"><code style="background:#e2e8f0;padding:2px 6px;border-radius:4px">{mrn}</code></td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#64748b">Test</td><td style="padding:8px">{test_name}</td></tr>
          <tr style="background:#f1f5f9"><td style="padding:8px;font-weight:bold;color:#64748b">Date</td><td style="padding:8px">{test_date}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px">We'll send another email once your appointment is approved.</p>
      </div>
    </body></html>"""
    return send_email(patient_email, subject, body, html_body)


def send_approval_email(patient_email, patient_name, mrn, booking_id, test_name, test_date, address):
    """Sent when admin approves (confirms) an appointment."""
    subject = "Rahila Labs – Appointment Approved 🎉"
    body = f"""Hello {patient_name},\n\nGreat news! Your appointment has been APPROVED.\n\nBooking ID: {booking_id}\nMRN: {mrn}\nTest: {test_name}\nDate: {test_date}\nAddress: {address}\n\nOur phlebotomist will visit you at the above address on the scheduled date.\n\nThank you,\nRahila Labs Team"""
    html_body = f"""
    <html><body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:24px">
      <div style="background:#1e3a8a;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Rahila Labs</h1>
        <p style="color:#93c5fd;margin:4px 0 0">Home Sample Collection</p>
      </div>
      <div style="background:#f0fdf4;padding:28px;border-radius:0 0 12px 12px;border:1px solid #bbf7d0">
        <h2 style="color:#166534">Appointment Approved 🎉</h2>
        <p>Hello <strong>{patient_name}</strong>, your appointment has been <strong style="color:#16a34a">confirmed</strong>!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;font-weight:bold;color:#64748b">Booking ID</td><td style="padding:8px"><code style="background:#dcfce7;padding:2px 6px;border-radius:4px">{booking_id}</code></td></tr>
          <tr style="background:#f0fdf4"><td style="padding:8px;font-weight:bold;color:#64748b">MRN</td><td style="padding:8px"><code style="background:#dcfce7;padding:2px 6px;border-radius:4px">{mrn}</code></td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#64748b">Test</td><td style="padding:8px">{test_name}</td></tr>
          <tr style="background:#f0fdf4"><td style="padding:8px;font-weight:bold;color:#64748b">Date</td><td style="padding:8px">{test_date}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#64748b">Address</td><td style="padding:8px">{address}</td></tr>
        </table>
        <p style="color:#166534;font-size:14px">Our phlebotomist will arrive at the scheduled time. Please be available.</p>
      </div>
    </body></html>"""
    return send_email(patient_email, subject, body, html_body)


def send_sms_notification(phone_number, message):
    """Send SMS via Twilio. Configure TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM in .env"""
    sid = os.environ.get('TWILIO_SID')
    token = os.environ.get('TWILIO_TOKEN')
    from_number = os.environ.get('TWILIO_FROM')
    if not all([sid, token, from_number]):
        print(f"[SMS SIM] To: {phone_number} | {message}")
        return "simulated"
    try:
        from twilio.rest import Client
        client = Client(sid, token)
        msg = client.messages.create(body=message, from_=from_number, to=phone_number)
        return msg.sid
    except Exception as e:
        print(f"SMS failed: {e}")
        return False


def send_whatsapp_notification(phone_number, message):
    """Send WhatsApp via Twilio sandbox. phone_number should be +92XXXXXXXXXX"""
    sid = os.environ.get('TWILIO_SID')
    token = os.environ.get('TWILIO_TOKEN')
    wa_from = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')  # Twilio sandbox
    if not all([sid, token]):
        print(f"[WHATSAPP SIM] To: {phone_number} | {message}")
        return "simulated"
    try:
        from twilio.rest import Client
        client = Client(sid, token)
        msg = client.messages.create(
            body=message,
            from_=wa_from,
            to=f"whatsapp:{phone_number}"
        )
        return msg.sid
    except Exception as e:
        print(f"WhatsApp failed: {e}")
        return False


