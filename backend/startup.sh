#!/bin/bash
# Azure App Service startup script for the Flask backend.
set -e

echo "=== Rahila Labs Backend Startup ==="
echo "Working directory: $(pwd)"

# Install/ensure dependencies are up to date
pip install -r requirements.txt --quiet

# Run gunicorn pointing at the wsgi.py application object
# Azure injects $PORT via environment; default to 8000 if not set
export PORT="${PORT:-8000}"

echo "Starting gunicorn on port $PORT..."
exec gunicorn \
  --bind "0.0.0.0:$PORT" \
  --timeout 120 \
  --workers 2 \
  --log-level info \
  wsgi:application
