"""
scripts/README.md
=================
This directory contains one-off maintenance and diagnostic scripts.
These are NOT part of the application runtime.

HOW TO USE:
    cd backend
    python scripts/<script_name>.py

IMPORTANT: These scripts have been kept for reference/historical context.
Going forward, all schema changes should be done via Flask-Migrate:
    flask db migrate -m "describe your change"
    flask db upgrade
"""
