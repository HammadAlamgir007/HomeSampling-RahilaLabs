# ============================================================
# Rahila Labs — Docker CLI Command Guide
# ============================================================
# Step-by-step commands to build, run, and manage the
# Dockerized Rahila Labs application.
# Use this as your DEMO SCRIPT during the project presentation.
# ============================================================


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 1: VERIFY DOCKER INSTALLATION                     ║
# ╚═══════════════════════════════════════════════════════════╝

# Check Docker is installed and running
docker --version
docker info

# Check Docker Compose is available
docker compose --version


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 2: BUILD DOCKER IMAGES                            ║
# ╚═══════════════════════════════════════════════════════════╝

# Navigate to the project root directory
# cd /path/to/Rahila-Labs-website

# Build the Backend image (Flask API)
# -t = tag the image with a name and version
docker build -t rahila-labs-backend:v1.0 ./backend

# Build the Frontend image (Next.js)
# --build-arg = pass build-time variables
docker build -t rahila-labs-frontend:v1.0 --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 .

# Verify images were created
docker images

# Expected output:
# REPOSITORY              TAG       SIZE
# rahila-labs-frontend    v1.0      ~200MB
# rahila-labs-backend     v1.0      ~150MB


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 3: RUN INDIVIDUAL CONTAINERS                      ║
# ╚═══════════════════════════════════════════════════════════╝

# Run the Backend container
# -d = detached mode (runs in background)
# -p = port mapping (host:container)
# --name = give the container a friendly name
# -e = pass environment variables
docker run -d \
  --name rahila-backend \
  -p 5000:5000 \
  -e SECRET_KEY=docker-dev-secret-key-2026 \
  -e JWT_SECRET_KEY=docker-jwt-secret-key-2026 \
  -e DEFAULT_ADMIN_PASSWORD=admin123 \
  rahila-labs-backend:v1.0

# Run the Frontend container
docker run -d \
  --name rahila-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000 \
  rahila-labs-frontend:v1.0

# Check running containers
docker ps

# View container logs
docker logs rahila-backend
docker logs rahila-frontend

# Follow logs in real-time (Ctrl+C to stop)
docker logs -f rahila-backend

# Stop containers
docker stop rahila-backend rahila-frontend

# Remove containers
docker rm rahila-backend rahila-frontend


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 4: DOCKER COMPOSE (MULTI-CONTAINER)               ║
# ╚═══════════════════════════════════════════════════════════╝

# Build all services defined in docker compose.yml
docker compose build

# Start all services in detached mode
docker compose up -d

# Check status of all services
docker compose ps

# View logs of all services
docker compose logs

# View logs of a specific service
docker compose logs backend
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes too (clean reset)
docker compose down -v


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 5: INSPECT & MANAGE CONTAINERS                    ║
# ╚═══════════════════════════════════════════════════════════╝

# Inspect a container (see config, network, mounts)
docker inspect rahila-labs-backend

# Execute a command inside a running container
docker exec -it rahila-labs-backend /bin/bash

# Check container resource usage
docker stats

# View Docker networks
docker network ls

# Inspect the custom network
docker network inspect rahila-labs-website_rahila-network

# View Docker volumes
docker volume ls

# Inspect a volume
docker volume inspect rahila-labs-website_backend-data


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 6: IMAGE VERSIONING & UPDATES                     ║
# ╚═══════════════════════════════════════════════════════════╝

# After making code changes, rebuild with a new version tag
docker build -t rahila-labs-backend:v1.1 ./backend
docker build -t rahila-labs-frontend:v1.1 .

# Tag an existing image with a new tag
docker tag rahila-labs-backend:v1.0 rahila-labs-backend:latest

# List all image versions
docker images rahila-labs-backend

# Remove old images to free space
docker rmi rahila-labs-backend:v1.0


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 7: TESTING & VERIFICATION                         ║
# ╚═══════════════════════════════════════════════════════════╝

# Test backend health endpoint
curl http://localhost:5000/health

# Test frontend is accessible
curl -s http://localhost:3000 | head -20

# Open in browser
# http://localhost:3000        → Frontend (Patient Portal)
# http://localhost:5000/health → Backend Health Check

# Test credentials:
# Admin:   admin@rahilalabs.com / admin123
# Patient: ali@example.com / demo123


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 8: DOCKER DESKTOP (GUI ALTERNATIVE)               ║
# ╚═══════════════════════════════════════════════════════════╝

# Everything above can also be done in Docker Desktop:
#
# 1. Open Docker Desktop
# 2. Go to "Images" tab → See built images
# 3. Click "Run" on an image → Configure ports, env vars
# 4. Go to "Containers" tab → See running containers
# 5. Click on a container → View logs, terminal, stats
# 6. "Volumes" tab → See persistent data
# 7. "Networks" tab → See custom networks


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 9: PUSH TO DOCKER HUB                             ║
# ╚═══════════════════════════════════════════════════════════╝

# Login to Docker Hub
docker login

# Tag images with your Docker Hub username
docker tag rahila-labs-backend:v1.0 ihammad786/rahila-labs-backend:v1.0
docker tag rahila-labs-frontend:v1.0 ihammad786/rahila-labs-frontend:v1.0

# Push backend image to Docker Hub
docker push ihammad786/rahila-labs-backend:v1.0

# Push frontend image to Docker Hub
docker push ihammad786/rahila-labs-frontend:v1.0

# Verify pushed images
docker search ihammad786

# View on Docker Hub: https://hub.docker.com/u/ihammad786


# ╔═══════════════════════════════════════════════════════════╗
# ║  PHASE 10: CLEANUP                                       ║
# ╚═══════════════════════════════════════════════════════════╝

# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Nuclear option: remove EVERYTHING
docker system prune -a --volumes
