from app.models import db, Appointment

class AppointmentRepository:
    """
    Repository for encapsulating data access logic for Appointments.
    Isolates Controllers (Routes) from SQLAlchemy ORM methods.
    """
    
    @staticmethod
    def get_by_id(appointment_id: int) -> Appointment:
        return Appointment.query.get(appointment_id)

    @staticmethod
    def get_by_booking_order_id(booking_order_id: str) -> Appointment:
        return Appointment.query.filter_by(booking_order_id=booking_order_id).first()

    @staticmethod
    def get_all_paginated(page: int, per_page: int, search: str = None):
        from sqlalchemy.orm import joinedload
        from sqlalchemy import or_
        from app.models import User, Test

        query = Appointment.query.options(
            joinedload(Appointment.user),
            joinedload(Appointment.test),
            joinedload(Appointment.rider)
        )

        if search:
            search_term = f"%{search}%"
            query = query.join(Appointment.user, isouter=True).join(Appointment.test, isouter=True).filter(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    Test.name.ilike(search_term),
                    Appointment.booking_order_id.ilike(search_term),
                    Appointment.status.ilike(search_term),
                )
            )

        return query.order_by(Appointment.appointment_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def get_by_patient(user_id: int):
        from sqlalchemy.orm import joinedload
        return Appointment.query.options(
            joinedload(Appointment.test),
            joinedload(Appointment.rider)
        ).filter_by(user_id=user_id).order_by(Appointment.appointment_date.desc()).all()

    @staticmethod
    def save(appointment: Appointment):
        db.session.add(appointment)
        db.session.commit()
        return appointment

    @staticmethod
    def delete(appointment: Appointment):
        db.session.delete(appointment)
        db.session.commit()
