# ============================================================
# Rahila Labs — Flask Backend Dockerfile
# ============================================================
# This Dockerfile containerizes the Flask REST API backend.
#
# Build:  docker build -t rahila-labs-backend:v1.0 ./backend
# Run:    docker run -d -p 5000:5000 --name backend rahila-labs-backend:v1.0
# ============================================================

# ── Stage 1: Base Image ─────────────────────────────────────
FROM python:3.11-slim AS base

# Set environment variables to prevent Python from writing
# .pyc files and to ensure output is sent straight to terminal
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ── Stage 2: Install Dependencies ───────────────────────────
WORKDIR /app

# Copy requirements first for Docker layer caching —
# dependencies only re-install when requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 3: Copy Application Code ─────────────────────────
COPY . .

# Create necessary directories
RUN mkdir -p instance logs uploads

# ── Stage 4: Create Non-Root User ───────────────────────────
# Running as non-root is a Docker security best practice
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# ── Stage 5: Expose Port & Run ──────────────────────────────
EXPOSE 5000

# Health check to verify the container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Start the application with gunicorn (production WSGI server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--log-level", "info", "wsgi:application"]
