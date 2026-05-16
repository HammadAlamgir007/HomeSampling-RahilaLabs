# Docker Setup Guide - Rahila Labs

## Overview

This project is now fully containerized using Docker and Docker Compose. The setup includes:

- **Backend**: Flask API (Python 3.12)
- **Frontend**: Next.js Application (Node.js 20)
- **Database**: SQLite (development) / PostgreSQL/MySQL (production ready)
- **Reverse Proxy**: Nginx (optional, for production)

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

## Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd HomeSampling-RahilaLabs
cp .env.example .env
```

### 2. Development Environment

Start all services in development mode:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Access services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

View logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

### 3. Production Environment

Build and start services in production mode:

```bash
docker-compose up -d
```

Access services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 4. Production with Nginx (Optional)

To include Nginx reverse proxy:

```bash
docker-compose --profile prod up -d
```

## Common Commands

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Container

```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Run migrations (if applicable)
docker-compose exec backend python -m scripts.migrate_db
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (data loss)
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

## Environment Configuration

Edit `.env` file to configure:

```env
# Backend
FLASK_ENV=production
JWT_SECRET_KEY=your-secure-key
DATABASE_URL=sqlite:///rahila_labs.db

# Frontend
NEXT_PUBLIC_API_URL=http://backend:5000

# Database
DB_USER=admin
DB_PASSWORD=secure-password
DB_HOST=db
DB_PORT=5432
DB_NAME=rahila_labs
```

## Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml rahila-labs

# Check status
docker stack services rahila-labs
```

### Using Kubernetes (with Docker Desktop)

1. Enable Kubernetes in Docker Desktop settings
2. Deploy using kubectl:

```bash
kubectl apply -f k8s-deployment.yml
```

### Azure Container Instances (ACI)

```bash
# Build and push to registry
docker build -t <registry>/rahila-labs-backend:latest ./backend
docker push <registry>/rahila-labs-backend:latest

# Deploy to ACI
az container create --resource-group <rg> \
  --name rahila-labs-backend \
  --image <registry>/rahila-labs-backend:latest \
  --ports 5000
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
docker-compose -f docker-compose.dev.yml -p custom_port up -d
```

### Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Verify network connectivity
docker network inspect rahila-network
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Limit resources in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Container Won't Start

```bash
# View detailed error logs
docker-compose logs backend

# Run container interactively for debugging
docker-compose run --rm backend sh
```

## Health Checks

Both services include health checks configured in docker-compose:

```bash
# Check health status
docker-compose ps

# View health history
docker inspect <container_id>
```

## Performance Optimization

### Layer Caching
- Multi-stage builds reduce final image size
- Instructions ordered from least to most frequently changing
- `.dockerignore` excludes unnecessary files

### Resource Limits
Configure in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

## Security Considerations

✅ **Implemented:**
- Non-root user execution
- Multi-stage builds to reduce attack surface
- Health checks for automatic restart
- Volume mounts for data persistence
- Network isolation with custom bridge network

⚠️ **Recommendations:**
- Change `JWT_SECRET_KEY` in production
- Use secrets management (Docker Secrets/Kubernetes)
- Enable HTTPS with valid certificates
- Regularly update base images
- Scan images for vulnerabilities:
  ```bash
  docker scan <image>
  ```

## Development Tips

### Rebuild on Code Changes (Development)

Development compose automatically watches for changes:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Access Database

```bash
# SQLite
docker-compose exec backend sqlite3 instance/rahila_labs_dev.db

# View tables
.tables

# Exit
.quit
```

### Enable Debug Mode

```bash
# Update .env
FLASK_DEBUG=1

# Restart
docker-compose restart backend
```

## Further Documentation

For more Docker guides in this project:
- [Quick Reference](./DOCKER.md) - One-page cheat sheet
- [Complete Guide](./DOCKER_COMPLETE.md) - Comprehensive documentation
- [Setup Summary](./DOCKER_SUMMARY.md) - Overview & architecture

Official documentation:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
