# Semester Project Report
## Virtual System and Services Lab — Spring 2026

---

**Course Title:** Virtual System and Services Lab  
**Instructor:** Ms. Bibi Amna  
**Semester:** Spring 2026  
**Submission Date:** 22nd May 2026  

### Group Members

| # | Name | Roll Number |
|---|------|-------------|
| 1 | ___________________ | ___________________ |
| 2 | ___________________ | ___________________ |
| 3 | ___________________ | ___________________ |
| 4 | ___________________ | ___________________ |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Literature Review](#2-literature-review)
3. [Project Overview](#3-project-overview)
4. [System Architecture](#4-system-architecture)
5. [Docker Implementation](#5-docker-implementation)
6. [Step-by-Step Deployment Guide](#6-step-by-step-deployment-guide)
7. [Azure Cloud Deployment](#7-azure-cloud-deployment)
8. [Image Versioning Strategy](#8-image-versioning-strategy)
9. [Testing and Verification](#9-testing-and-verification)
10. [Challenges and Solutions](#10-challenges-and-solutions)
11. [Conclusion and Future Work](#11-conclusion-and-future-work)
12. [References](#12-references)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Background

In modern software development, deploying applications consistently across different environments has always been a challenge. The phrase "it works on my machine" has been a long-standing problem in the software industry. Docker, an open-source containerization platform, solves this problem by packaging applications and their dependencies into standardized units called containers.

This project demonstrates the practical application of Docker containerization by taking an existing full-stack web application — **Rahila Labs**, a healthcare home-sampling platform — and containerizing it using Docker. The project showcases how Docker can be used to create reproducible, portable, and scalable deployment environments.

### 1.2 Problem Statement

Rahila Labs is a health-tech platform that enables patients to book medical tests for home sample collection. The application consists of a Next.js frontend and a Flask backend API. Deploying this application requires:

- Installing Node.js 20.x for the frontend
- Installing Python 3.11 for the backend
- Configuring environment variables
- Managing dependencies for both services
- Ensuring consistent environments across development, testing, and production

Without containerization, each developer must manually configure their environment, leading to inconsistencies and deployment failures.

### 1.3 Objectives

1. Containerize the Rahila Labs frontend (Next.js) and backend (Flask) using Docker
2. Create Docker Compose configuration for multi-container orchestration
3. Implement Docker best practices (multi-stage builds, non-root users, health checks)
4. Demonstrate manual Docker CLI and Docker Desktop usage
5. Document the versioned image tagging strategy
6. Showcase Azure cloud deployment integration

### 1.4 Scope

This project focuses on:
- **Docker**: Containerization of all application services
- **Azure**: Cloud deployment using Azure App Services
- **VMware** is excluded from the scope of this project

---

## 2. Literature Review

### 2.1 What is Docker?

Docker is an open-source platform that automates the deployment, scaling, and management of applications using containerization technology. Launched in 2013 by Solomon Hykes, Docker has revolutionized how developers build, ship, and run applications.

**Key Concept:** A Docker container packages an application with all its dependencies, libraries, and configuration files into a single, portable unit that runs consistently on any machine with Docker installed.

### 2.2 Docker Architecture

Docker uses a client-server architecture consisting of:

```
┌─────────────────────────────────────────────────┐
│                  Docker Client                   │
│         (docker build, run, pull, push)          │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  Docker Daemon                   │
│              (dockerd - background)              │
├─────────────┬──────────────┬────────────────────┤
│   Images    │  Containers  │    Networks        │
│   Volumes   │  Registries  │    Compose         │
└─────────────┴──────────────┴────────────────────┘
```

- **Docker Client**: The command-line interface (CLI) that users interact with
- **Docker Daemon (dockerd)**: The background service that manages Docker objects
- **Docker Images**: Read-only templates used to create containers
- **Docker Containers**: Running instances of Docker images
- **Docker Registry**: A repository for storing and distributing Docker images (e.g., Docker Hub)

### 2.3 Docker vs Virtual Machines

| Feature | Docker Containers | Virtual Machines |
|---------|------------------|-----------------|
| **OS** | Shares host kernel | Full guest OS |
| **Size** | MBs (lightweight) | GBs (heavy) |
| **Startup** | Seconds | Minutes |
| **Performance** | Near-native | Overhead from hypervisor |
| **Isolation** | Process-level | Hardware-level |
| **Portability** | Highly portable | Less portable |
| **Resource Usage** | Minimal | Significant |

### 2.4 Key Docker Concepts

**Dockerfile**: A text file containing instructions to build a Docker image. Each instruction creates a layer in the image, enabling efficient caching and rebuilds.

**Docker Compose**: A tool for defining and running multi-container Docker applications. Using a YAML file, you can configure all services, networks, and volumes, then start everything with a single command.

**Docker Volumes**: Persistent storage mechanisms that exist outside the container lifecycle. Data in volumes survives container restarts and removals.

**Docker Networks**: Virtual networks that enable communication between containers. Docker provides bridge, host, and overlay network drivers.

**Multi-Stage Builds**: A Dockerfile technique where multiple FROM statements are used to create intermediate stages. Only the final stage is kept, resulting in smaller production images.

### 2.5 Docker in Industry

Docker has become the industry standard for containerization:
- Used by 55% of professional developers (Stack Overflow Survey 2024)
- Over 20 million developers and 7 million applications on Docker Hub
- Adopted by major companies including Google, Microsoft, Amazon, and Netflix
- Essential skill for DevOps and cloud-native development

---

## 3. Project Overview

### 3.1 About Rahila Labs

Rahila Labs is a comprehensive healthcare home-sampling platform that digitizes the medical test booking process. The platform allows patients to browse available medical tests, book appointments for home sample collection, and track their booking status — all from the comfort of their homes.

### 3.2 Key Features

| Feature | Description |
|---------|-------------|
| **Patient Registration** | Email-based registration with OTP verification |
| **Test Catalogue** | Browse 700+ medical tests with pricing |
| **Online Booking** | Multi-step booking flow with date/time selection |
| **Admin Dashboard** | Manage appointments, patients, riders, and reports |
| **Rider Management** | Assign sample collection tasks to riders |
| **Rider Mobile App** | Flutter-based app for riders to manage tasks |
| **JWT Authentication** | Secure token-based auth for all user roles |
| **PDF Reports** | Generate appointment and financial reports |

### 3.3 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 15 (React 18) | Patient portal, admin dashboard |
| **Backend** | Flask (Python 3.11) | REST API, business logic |
| **Database** | SQLite (dev) / MySQL (prod) | Data persistence |
| **Mobile App** | Flutter/Dart | Rider task management |
| **Styling** | TailwindCSS + Radix UI | UI components |
| **State Mgmt** | Zustand | Frontend state |
| **Auth** | Flask-JWT-Extended | Token-based authentication |
| **Deployment** | Azure App Services | Cloud hosting |
| **CI/CD** | GitHub Actions | Automated deployments |

### 3.4 Application Pages

**Public Pages:**
- Home Page — Landing page with service overview
- Services Page — Browse available medical tests
- About Page — Company information
- Contact Page — Contact form and branch locations

**Patient Portal:**
- Dashboard — View upcoming appointments
- Book Test — Multi-step test booking wizard
- My Bookings — Track booking history
- Profile — Manage account settings

**Admin Dashboard:**
- Dashboard — Analytics and statistics overview
- Appointments — Manage all appointments
- Patients — View and manage patient records
- Riders — Manage rider assignments
- Tests — Manage test catalogue
- Reports — Generate PDF reports
- Settings — System configuration

---

## 4. System Architecture

### 4.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Docker Host Machine                      │
│                                                                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │  Frontend Container  │    │    Backend Container         │  │
│  │                      │    │                              │  │
│  │  ┌────────────────┐  │    │  ┌────────────────────────┐ │  │
│  │  │   Next.js 15   │  │    │  │    Flask + Gunicorn    │ │  │
│  │  │   (React 18)   │──┼────┼──│    (Python 3.11)       │ │  │
│  │  │                │  │    │  │                        │ │  │
│  │  │  Port: 3000    │  │    │  │  Port: 5000            │ │  │
│  │  └────────────────┘  │    │  └───────────┬────────────┘ │  │
│  └─────────────────────┘    │               │              │  │
│                              │  ┌────────────▼───────────┐ │  │
│                              │  │   SQLite Database      │ │  │
│                              │  │   (Volume Mounted)     │ │  │
│                              │  └────────────────────────┘ │  │
│                              └─────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Docker Network: rahila-network               │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Component Communication

1. **User** opens browser and navigates to `http://localhost:3000`
2. **Frontend Container** serves the Next.js web application
3. Frontend makes API calls to `http://localhost:5000/api/*`
4. **Backend Container** processes requests, queries the SQLite database
5. Backend returns JSON responses to the frontend
6. Frontend renders the data and presents it to the user

### 4.3 Docker Network Architecture

Both containers are connected via a custom Docker bridge network called `rahila-network`. This provides:
- **DNS Resolution**: Containers can reference each other by service name
- **Isolation**: Containers are isolated from the host network by default
- **Security**: Only explicitly mapped ports are accessible from the host

---

## 5. Docker Implementation

### 5.1 Backend Dockerfile

The backend Dockerfile containerizes the Flask REST API:

```dockerfile
# Base Image: Python 3.11 slim variant (minimal size)
FROM python:3.11-slim AS base

# Prevent Python from writing .pyc files and buffer output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements first (Docker layer caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create necessary directories
RUN mkdir -p instance logs uploads

# Security: Run as non-root user
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Run with Gunicorn (production WSGI server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "wsgi:application"]
```

**Key Design Decisions:**
- **`python:3.11-slim`**: Uses the slim variant to minimize image size (~150MB vs ~900MB for full image)
- **Layer Caching**: `requirements.txt` is copied before source code, so dependencies are only reinstalled when requirements change
- **Non-root User**: `appuser` runs the application, following the principle of least privilege
- **Health Check**: Automatically verifies the container is healthy by hitting the `/health` endpoint
- **Gunicorn**: Production-grade WSGI server with 2 workers for concurrent request handling

### 5.2 Frontend Dockerfile

The frontend uses a multi-stage build for optimal image size:

```dockerfile
# Stage 1: Install Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# Stage 2: Build the Application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# Stage 3: Production Runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
```

**Multi-Stage Build Benefits:**

| Stage | Purpose | Contents |
|-------|---------|----------|
| `deps` | Install node_modules | All npm dependencies |
| `builder` | Build production bundle | Compiled Next.js output |
| `runner` | Run the application | Only standalone output (~200MB vs ~1.5GB) |

The final image contains only the production build output, dramatically reducing image size.

### 5.3 Docker Compose Configuration

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: rahila-labs-backend:v1.0
    container_name: rahila-labs-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - SECRET_KEY=docker-dev-secret-key-2026
      - JWT_SECRET_KEY=docker-jwt-secret-key-2026
    volumes:
      - backend-data:/app/instance
      - backend-uploads:/app/uploads
    networks:
      - rahila-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:5000
    image: rahila-labs-frontend:v1.0
    container_name: rahila-labs-frontend
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - rahila-network
    restart: unless-stopped

volumes:
  backend-data:
    driver: local
  backend-uploads:
    driver: local

networks:
  rahila-network:
    driver: bridge
```

**Configuration Explained:**
- **`depends_on` with `service_healthy`**: Frontend waits until backend passes its health check before starting
- **Named Volumes**: `backend-data` and `backend-uploads` persist data across container restarts
- **Custom Network**: `rahila-network` provides isolated communication between services
- **`restart: unless-stopped`**: Containers automatically restart on failure

### 5.4 .dockerignore Files

The `.dockerignore` file works like `.gitignore` but for Docker builds. It prevents unnecessary files from being copied into the Docker build context:

**Frontend .dockerignore:**
```
node_modules/
.next/
backend/
rahila_labs_rider_app/
.git/
*.log
docs/
```

**Backend .dockerignore:**
```
venv/
.venv/
__pycache__/
instance/
*.db
.env
.git/
```

**Impact:** Without `.dockerignore`, the build context could be 500MB+. With it, the context is reduced to ~20MB, making builds significantly faster.

---

## 6. Step-by-Step Deployment Guide

### 6.1 Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Git installed
- The Rahila Labs source code cloned from GitHub

### 6.2 Phase 1 — Verify Docker Installation

```bash
# Check Docker version
docker --version
# Output: Docker version 27.x.x

# Check Docker is running
docker info

# Check Docker Compose
docker-compose --version
```

### 6.3 Phase 2 — Build Docker Images

```bash
# Build the Backend image
docker build -t rahila-labs-backend:v1.0 ./backend

# Build the Frontend image
docker build -t rahila-labs-frontend:v1.0 \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 .

# Verify images were created
docker images
```

**Expected Output:**
```
REPOSITORY              TAG    IMAGE ID       SIZE
rahila-labs-frontend    v1.0   abc123...      ~200MB
rahila-labs-backend     v1.0   def456...      ~150MB
```

### 6.4 Phase 3 — Run Containers Individually

```bash
# Start Backend
docker run -d --name rahila-backend -p 5000:5000 \
  -e SECRET_KEY=docker-dev-secret-key \
  -e JWT_SECRET_KEY=docker-jwt-secret-key \
  rahila-labs-backend:v1.0

# Start Frontend
docker run -d --name rahila-frontend -p 3000:3000 \
  rahila-labs-frontend:v1.0

# Verify containers are running
docker ps
```

### 6.5 Phase 4 — Use Docker Compose

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### 6.6 Phase 5 — Docker Desktop GUI

Docker Desktop provides a graphical interface for all Docker operations:

1. **Images Tab**: View all built images, run new containers
2. **Containers Tab**: Monitor running containers, view logs, open terminal
3. **Volumes Tab**: Inspect persistent data storage
4. **Networks Tab**: View container networking

*(Insert screenshots of Docker Desktop here)*

### 6.7 Phase 6 — Verify Application

Open a web browser and navigate to:
- **Frontend**: `http://localhost:3000` — The Rahila Labs website
- **Backend Health**: `http://localhost:5000/health` — API health check

**Test Credentials:**
- Admin: `admin@rahilalabs.com` / `admin123`
- Patient: `ali@example.com` / `demo123`

---

## 7. Azure Cloud Deployment

### 7.1 Azure App Services Overview

Rahila Labs is deployed on Microsoft Azure using Azure App Services:

| Service | Azure Resource | URL |
|---------|---------------|-----|
| Frontend | `rahila-labs-web` | https://rahila-labs-web.azurewebsites.net |
| Backend | `rahila-labs-api` | https://rahila-labs-api.azurewebsites.net |
| Database | Azure MySQL Flexible Server | `rahila-labs-db.mysql.database.azure.com` |

### 7.2 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

**Backend Pipeline (`deploy-api.yml`):**
1. Checkout code from GitHub
2. Set up Python 3.12
3. Install dependencies and run tests
4. Zip backend application
5. Deploy to Azure App Service using Publish Profile

**Frontend Pipeline (`deploy-web.yml`):**
1. Checkout code from GitHub
2. Set up Node.js 20.x
3. Install dependencies and build Next.js (standalone mode)
4. Package the standalone output
5. Deploy to Azure App Service using Publish Profile

### 7.3 Azure Environment Configuration

Azure App Services are configured with environment variables for:
- Database connection strings (MySQL)
- JWT secret keys
- CORS allowed origins
- Email service credentials

---

## 8. Image Versioning Strategy

### 8.1 Tagging Convention

We use semantic versioning for Docker image tags:

```
rahila-labs-backend:v<MAJOR>.<MINOR>
rahila-labs-frontend:v<MAJOR>.<MINOR>
```

| Version | Description |
|---------|-------------|
| `v1.0` | Initial Dockerized version |
| `v1.1` | Bug fixes and configuration updates |
| `latest` | Always points to the most recent stable version |

### 8.2 Versioning Commands

```bash
# Build with specific version
docker build -t rahila-labs-backend:v1.1 ./backend

# Tag as latest
docker tag rahila-labs-backend:v1.1 rahila-labs-backend:latest

# List all versions
docker images rahila-labs-backend
```

### 8.3 Update Workflow

1. Make code changes in the application
2. Rebuild the Docker image with a new version tag
3. Stop the old container
4. Start a new container with the updated image
5. Verify the application works correctly

### 8.4 Docker Hub Registry

The Docker images are published to Docker Hub for public access and distribution:

**Docker Hub Account:** `ihammad786`  
**Repository URL:** https://hub.docker.com/u/ihammad786

| Image | Docker Hub Path | Pull Command |
|-------|----------------|-------------|
| Backend | `ihammad786/rahila-labs-backend:v1.0` | `docker pull ihammad786/rahila-labs-backend:v1.0` |
| Frontend | `ihammad786/rahila-labs-frontend:v1.0` | `docker pull ihammad786/rahila-labs-frontend:v1.0` |

**Publishing Workflow:**

```bash
# Login to Docker Hub
docker login

# Tag images for Docker Hub
docker tag rahila-labs-backend:v1.0 ihammad786/rahila-labs-backend:v1.0
docker tag rahila-labs-frontend:v1.0 ihammad786/rahila-labs-frontend:v1.0

# Push images to Docker Hub
docker push ihammad786/rahila-labs-backend:v1.0
docker push ihammad786/rahila-labs-frontend:v1.0
```

By pushing images to Docker Hub, anyone can pull and run the application with a single command without needing the source code:

```bash
docker pull ihammad786/rahila-labs-backend:v1.0
docker pull ihammad786/rahila-labs-frontend:v1.0
```

---

## 9. Testing and Verification

### 9.1 Container Health Checks

Both containers include built-in health checks:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' rahila-labs-backend
# Output: healthy

docker inspect --format='{{.State.Health.Status}}' rahila-labs-frontend
# Output: healthy
```

### 9.2 API Endpoint Testing

```bash
# Backend health check
curl http://localhost:5000/health
# Response: {"status": "ok", "message": "Rahila Labs Backend is running", "db": "connected"}

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rahilalabs.com", "password": "admin123"}'
```

### 9.3 Frontend Verification

- Navigate to `http://localhost:3000`
- Verify the home page loads with test catalogue
- Test patient registration and login flow
- Verify admin dashboard accessibility

### 9.4 Container Resource Monitoring

```bash
# View real-time resource usage
docker stats

# Expected output:
# CONTAINER           CPU%   MEM USAGE
# rahila-labs-backend  0.5%   ~80MB
# rahila-labs-frontend 0.3%   ~120MB
```

---

## 10. Challenges and Solutions

### Challenge 1: Multi-Stage Build Complexity
**Problem:** The initial frontend Docker image was over 1.5GB due to including all `node_modules` and build tools.

**Solution:** Implemented a 3-stage build (deps → builder → runner) where only the standalone Next.js output is copied to the final image, reducing size to ~200MB.

### Challenge 2: Frontend-Backend Communication
**Problem:** The frontend container couldn't communicate with the backend container using `localhost`.

**Solution:** Used Docker Compose networking with a custom bridge network. Both containers are on the same `rahila-network`, enabling DNS-based service discovery.

### Challenge 3: Database Persistence
**Problem:** SQLite database was stored inside the container and lost on container restart.

**Solution:** Used Docker named volumes (`backend-data`) to mount the database directory outside the container, ensuring data persists across restarts.

### Challenge 4: Environment Variable Management
**Problem:** Sensitive configuration (API keys, secrets) shouldn't be hardcoded in Dockerfiles.

**Solution:** Used environment variables via Docker Compose and `.env.docker` file, keeping secrets separate from the codebase.

### Challenge 5: Build Context Size
**Problem:** Docker build was slow due to large build context (node_modules, .git, etc.).

**Solution:** Created `.dockerignore` files to exclude unnecessary files, reducing build context from 500MB+ to ~20MB.

---

## 11. Conclusion and Future Work

### 11.1 Conclusion

This project successfully demonstrated the containerization of the Rahila Labs healthcare platform using Docker. Key achievements include:

1. **Successful Containerization**: Both the Next.js frontend and Flask backend were containerized with production-ready Dockerfiles
2. **Multi-Stage Builds**: Implemented efficient multi-stage builds reducing image sizes by 85%
3. **Docker Compose Orchestration**: Created a compose configuration for single-command deployment
4. **Security Best Practices**: Implemented non-root users, health checks, and environment variable management
5. **Azure Integration**: Demonstrated cloud deployment alongside local Docker deployment
6. **Comprehensive Documentation**: Provided detailed documentation of the entire containerization process

### 11.2 Future Work

- **Kubernetes**: Migrate from Docker Compose to Kubernetes for production-grade orchestration
- **Docker Swarm**: Implement container clustering for high availability
- **CI/CD with Docker**: Integrate Docker builds into the GitHub Actions pipeline
- **Monitoring**: Add Prometheus + Grafana for container monitoring
- **Container Registry**: Push images to Azure Container Registry for private hosting
- **SSL/TLS**: Add nginx reverse proxy with Let's Encrypt certificates

---

## 12. References

1. Docker Inc. (2024). *Docker Documentation*. https://docs.docker.com/
2. Docker Inc. (2024). *Dockerfile Reference*. https://docs.docker.com/engine/reference/builder/
3. Docker Inc. (2024). *Docker Compose Reference*. https://docs.docker.com/compose/
4. Microsoft. (2024). *Azure App Service Documentation*. https://learn.microsoft.com/en-us/azure/app-service/
5. Vercel. (2024). *Next.js Docker Deployment*. https://nextjs.org/docs/deployment
6. Pallets Projects. (2024). *Flask Documentation*. https://flask.palletsprojects.com/
7. Burns, B., Beda, J., & Hightower, K. (2022). *Kubernetes: Up and Running*. O'Reilly Media.
8. Turnbull, J. (2023). *The Docker Book*. turnbull press.
9. Stack Overflow. (2024). *Developer Survey Results*. https://survey.stackoverflow.co/2024/

---

## 13. Appendices

### Appendix A: Complete Backend Dockerfile

See file: `backend/Dockerfile`

### Appendix B: Complete Frontend Dockerfile

See file: `Dockerfile` (project root)

### Appendix C: Docker Compose Configuration

See file: `docker-compose.yml`

### Appendix D: Docker CLI Quick Reference

| Command | Description |
|---------|-------------|
| `docker build -t name:tag .` | Build an image |
| `docker run -d -p host:container name` | Run a container |
| `docker ps` | List running containers |
| `docker stop <container>` | Stop a container |
| `docker rm <container>` | Remove a container |
| `docker images` | List images |
| `docker rmi <image>` | Remove an image |
| `docker logs <container>` | View container logs |
| `docker exec -it <container> /bin/bash` | Open shell in container |
| `docker-compose build` | Build all services |
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose ps` | Check service status |
| `docker-compose logs` | View all logs |
| `docker stats` | Monitor resource usage |
| `docker network ls` | List networks |
| `docker volume ls` | List volumes |
| `docker system prune -a` | Clean up everything |

### Appendix E: Project File Structure

```
Rahila-Labs-website/
├── Dockerfile                    # Frontend Docker configuration
├── .dockerignore                 # Frontend Docker ignore rules
├── docker-compose.yml            # Multi-container orchestration
├── .env.docker                   # Docker environment variables
├── next.config.mjs               # Next.js configuration (standalone)
├── package.json                  # Frontend dependencies
├── src/                          # Frontend source code
│   ├── app/                      # Next.js pages
│   │   ├── page.tsx              # Home page
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── patient/              # Patient dashboard
│   │   ├── admin/                # Admin dashboard
│   │   ├── services/             # Test catalogue
│   │   ├── about/                # About page
│   │   └── contact/              # Contact page
│   ├── components/               # Reusable UI components
│   └── lib/                      # Utility functions
├── backend/                      # Backend application
│   ├── Dockerfile                # Backend Docker configuration
│   ├── .dockerignore             # Backend Docker ignore rules
│   ├── requirements.txt          # Python dependencies
│   ├── wsgi.py                   # Production entry point
│   ├── run.py                    # Development entry point
│   ├── app/                      # Flask application
│   │   ├── __init__.py           # App factory
│   │   ├── config.py             # Configuration classes
│   │   ├── models/               # Database models
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   └── utils/                # Helper functions
│   └── tests/                    # Test suite
├── .github/workflows/            # CI/CD pipelines
│   ├── deploy-api.yml            # Backend deployment
│   └── deploy-web.yml            # Frontend deployment
└── docs/                         # Documentation
    ├── VSS_Lab_Project_Report.md  # This report
    └── docker-cli-guide.sh       # CLI command reference
```

---

*End of Report*
