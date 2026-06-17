from datetime import datetime, timezone, timedelta
from app.models import db, Appointment, Rider
from app.utils.notifications import notify_rider_assignment, notify_patient_rider_assigned
from app.utils.mail import send_sms_notification, send_whatsapp_notification
from app.tasks.email_tasks import send_approval_email

class AppointmentService:
    @staticmethod
    def update_status(appointment_id, new_status, changed_by_role='admin'):
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
            
        old_status = appointment.status
        if new_status:
            appointment.transition_status(new_status, changed_by_role=changed_by_role)
            
        # Fire approval email + SMS/WhatsApp when admin confirms an appointment
        if new_status == 'confirmed' and old_status != 'confirmed':
            patient = appointment.user
            test = appointment.test
            if patient and test:
                send_approval_email.delay(appointment.id)
                if patient.phone:
                    test_date = appointment.appointment_date.strftime('%Y-%m-%d %I:%M %p') if appointment.appointment_date else 'TBD'
                    sms_msg = (f"Rahila Labs: Your appointment for {test.name} on {test_date} "
                               f"is APPROVED. Booking ID: {appointment.booking_order_id}. "
                               f"MRN: {patient.mrn or 'N/A'}")
                    try:
                        send_sms_notification(patient.phone, sms_msg)
                        send_whatsapp_notification(patient.phone, sms_msg)
                    except Exception as e:
                        print(f"Approval SMS error (non-fatal): {e}")

        db.session.commit()
        return appointment

    @staticmethod
    def auto_assign_rider(appointment_id):
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")

        riders = Rider.query.filter(Rider.availability_status != 'offline').all()
        if not riders:
            raise ValueError("No available riders found")

        def rider_load(r):
            active = Appointment.query.filter(
                Appointment.rider_id == r.id,
                Appointment.status.in_(['rider_accepted', 'rider_on_way', 'sample_collected'])
            ).count()
            priority = 0 if r.availability_status == 'available' else 1
            return (priority, active)

        best_rider = min(riders, key=rider_load)

        now = datetime.now(timezone.utc)
        appointment.rider_id = best_rider.id
        appointment.rider_assigned_at = now
        appointment.rider_accepted_at = now
        appointment.pickup_deadline = now + timedelta(hours=1)
        appointment.delivery_deadline = now + timedelta(hours=4)
        
        appointment.transition_status('rider_accepted', changed_by_role='admin', rider_id=best_rider.id)

        if best_rider.availability_status == 'available':
            best_rider.availability_status = 'busy'

        notify_rider_assignment(best_rider.id, appointment_id, appointment.user.username, appointment.address)
        notify_patient_rider_assigned(appointment.user_id, appointment_id, best_rider.name)

        if appointment.user and appointment.user.phone:
            try:
                msg = f"Rahila Labs: Rider {best_rider.name} has been assigned to collect your sample. Contact: {best_rider.phone}"
                send_sms_notification(appointment.user.phone, msg)
                send_whatsapp_notification(appointment.user.phone, msg)
            except Exception as e:
                print(f"Auto-assign SMS error (non-fatal): {e}")

        db.session.commit()
        return best_rider, appointment

    @staticmethod
    def assign_rider(appointment_id, rider_id, priority_level='normal', pickup_deadline=None, delivery_deadline=None, patient_lat=None, patient_lng=None):
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
            
        rider = Rider.query.get(rider_id)
        if not rider:
            raise ValueError("Rider not found")
            
        if rider.availability_status == 'offline':
            raise ValueError("Rider is offline and cannot receive tasks")

        if patient_lat is not None and patient_lng is not None:
            appointment.patient_latitude = float(patient_lat)
            appointment.patient_longitude = float(patient_lng)

        now = datetime.now(timezone.utc)
        appointment.pickup_deadline = datetime.fromisoformat(pickup_deadline) if pickup_deadline else now + timedelta(hours=1)
        appointment.delivery_deadline = datetime.fromisoformat(delivery_deadline) if delivery_deadline else now + timedelta(hours=4)
        appointment.priority_level = priority_level
        appointment.rider_id = rider_id
        appointment.rider_assigned_at = now
        appointment.rider_accepted_at = now
        
        appointment.transition_status('rider_accepted', changed_by_role='admin', rider_id=rider_id)

        if rider.availability_status == 'available':
            rider.availability_status = 'busy'

        notify_rider_assignment(rider_id, appointment_id, appointment.user.username, appointment.address)
        notify_patient_rider_assigned(appointment.user_id, appointment_id, rider.name)

        db.session.commit()
        return appointment
