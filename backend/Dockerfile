# Backend API - Flask Application
# Multi-stage build for optimized production image

FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies required for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r flask && useradd -r -g flask flask

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libodbc1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/flask/.local

# Copy application code
COPY . .

# Set environment variables
ENV PATH=/home/flask/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_APP=run.py

# Change ownership to flask user
RUN chown -R flask:flask /app

# Switch to non-root user
USER flask

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/health', timeout=5)" || exit 1

# Start the application
CMD ["python", "run.py"]
