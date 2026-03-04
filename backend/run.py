"""
Entry point for local development.
Usage:
    cd backend
    python run.py

For production use wsgi.py with gunicorn:
    gunicorn 'wsgi:application'
"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
