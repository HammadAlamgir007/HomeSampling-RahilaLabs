import datetime
from models import db, User, Appointment

def generate_mrn():
    """Generates a unique Medical Record Number: MRN-YYYYMMDD-001"""
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    prefix = f"MRN-{today_str}-"
    
    # Find the latest MRN for today
    latest_user = User.query.filter(User.mrn.like(f"{prefix}%")).order_by(User.mrn.desc()).first()
    
    if latest_user and latest_user.mrn:
        try:
            latest_count = int(latest_user.mrn.split('-')[-1])
            new_count = latest_count + 1
        except ValueError:
            new_count = 1
    else:
        new_count = 1
        
    return f"{prefix}{new_count:03d}"

def generate_booking_id():
    """Generates a unique Booking Order ID: BK-YYYYMMDD-001"""
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    prefix = f"BK-{today_str}-"
    
    # Find the latest booking ID for today
    latest_appt = Appointment.query.filter(Appointment.booking_order_id.like(f"{prefix}%")).order_by(Appointment.booking_order_id.desc()).first()
    
    if latest_appt and latest_appt.booking_order_id:
        try:
            latest_count = int(latest_appt.booking_order_id.split('-')[-1])
            new_count = latest_count + 1
        except ValueError:
            new_count = 1
    else:
        new_count = 1
        
    return f"{prefix}{new_count:03d}"
