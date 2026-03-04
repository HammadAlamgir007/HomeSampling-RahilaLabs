"""
Production WSGI entry point.
Usage: gunicorn 'wsgi:application'
"""
from app import create_app

application = create_app('production')
