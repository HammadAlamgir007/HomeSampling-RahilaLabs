import datetime
import uuid

def generate_mrn():
    """Generates a unique Medical Record Number: MRN-YYYYMMDD-XXXX"""
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    unique_suffix = uuid.uuid4().hex[:4].upper()
    return f"MRN-{today_str}-{unique_suffix}"

def generate_booking_id():
    """Generates a unique Booking Order ID: BK-YYYYMMDD-XXXX"""
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    unique_suffix = uuid.uuid4().hex[:4].upper()
    return f"BK-{today_str}-{unique_suffix}"
