from flask import Blueprint

booking_bp = Blueprint('booking_api', __name__)

from . import booking_controller
