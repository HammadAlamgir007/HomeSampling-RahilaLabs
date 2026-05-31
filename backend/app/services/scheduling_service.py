from datetime import datetime, timedelta, timezone
from app.models import db, Booking, Rider

class SchedulingService:
    @staticmethod
    def get_available_slots(date_str: str, city: str):
        """
        Dynamically calculate available slots based on rider availability and current bookings.
        """
        # Parse date
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
            
        # Define operational hours (e.g., 09:00 to 18:00)
        start_hour = 9
        end_hour = 18
        slot_duration_minutes = 60
        
        # Base slots
        slots = []
        for h in range(start_hour, end_hour):
            time_str = f"{h:02d}:00"
            slots.append(time_str)
            
        # Find active riders in city (assuming availability_status == 'available')
        # In a real app, we might filter by rider.city, but let's assume global pool for now
        total_riders = Rider.query.filter_by(availability_status='available').count()
        if total_riders == 0:
            # Fallback to 2 virtual riders to ensure booking slots are always calculated and selectable
            total_riders = 2
            
        # Get bookings for this date
        start_datetime = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
        end_datetime = start_datetime + timedelta(days=1)
        
        bookings = Booking.query.filter(
            Booking.scheduled_datetime >= start_datetime,
            Booking.scheduled_datetime < end_datetime,
            Booking.status.in_(['pending', 'confirmed', 'collector_assigned'])
        ).all()
        
        # Group bookings by hour
        bookings_by_hour = {}
        for b in bookings:
            hour = b.scheduled_datetime.hour
            time_key = f"{hour:02d}:00"
            bookings_by_hour[time_key] = bookings_by_hour.get(time_key, 0) + 1
            
        # Check if the target date is today (in Pakistan Standard Time, UTC+5)
        pkt = timezone(timedelta(hours=5))
        now_pkt = datetime.now(pkt)
        is_today = target_date == now_pkt.date()
        lead_time_hours = 2  # Minimum hours buffer before a slot can be booked
        
        # Filter slots
        available_slots = []
        for slot in slots:
            slot_hour = int(slot.split(':')[0])
            
            # If the date is today, skip slots that have already passed (+ lead time buffer)
            if is_today:
                cutoff_hour = now_pkt.hour + lead_time_hours
                # Also account for partial hours: if it's 3:30 PM, the cutoff should be 5:30,
                # so a 5 PM slot (hour 17) should NOT be available since 17 < 17.5
                cutoff_with_minutes = now_pkt.hour + (now_pkt.minute / 60) + lead_time_hours
                if slot_hour < cutoff_with_minutes:
                    continue
            
            # Maximum capacity per slot is (total_riders * 2) assuming 1 rider can do 2 collections per hour
            max_capacity = total_riders * 2
            current_bookings = bookings_by_hour.get(slot, 0)
            
            if current_bookings < max_capacity:
                # Format to AM/PM for frontend
                ampm = "AM" if slot_hour < 12 else "PM"
                hour12 = slot_hour if slot_hour <= 12 else slot_hour - 12
                if hour12 == 0: hour12 = 12
                
                formatted_slot = f"{hour12:02d}:00 {ampm}"
                available_slots.append(formatted_slot)
                
        return available_slots
