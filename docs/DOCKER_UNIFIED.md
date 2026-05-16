# Unified Docker Compose - Environment-Based Configuration

## Overview

The project now uses a **single, unified `docker-compose.yml`** that automatically switches between environments based on the `ENVIRONMENT` variable.

**Supported Environments:**
- `development` - Hot reload, debug enabled, live code changes
- `staging` - Near-production configuration, optimized builds
- `production` - Production-ready, with optional Nginx reverse proxy

## Quick Start

### Method 1: Using the Helper Script (Recommended)

```bash
# Start development
./docker.sh up development

# Start staging
./docker.sh up staging

# Start production with Nginx
./docker.sh up production --profile prod-with-nginx

# View logs
./docker.sh logs development

# Stop services
./docker.sh down development
```

### Method 2: Direct Docker Compose Commands

```bash
# Development
export ENVIRONMENT=development
docker-compose up -d

# Staging
export ENVIRONMENT=staging
docker-compose up -d

# Production with Nginx
export ENVIRONMENT=production
docker-compose --profile prod-with-nginx up -d
```

### Method 3: Using .env Files

The system automatically loads environment-specific `.env` files:

```bash
# Load development environment
env $(cat .env.development | xargs) docker-compose up -d

# Load production environment
env $(cat .env.production | xargs) docker-compose up -d
```

## Environment Configuration Files

Each environment has its own `.env` file:

### `.env.development`
- **Purpose:** Local development with hot reload
- **Features:** Debug enabled, live code mounting, development commands
- **Ports:** 3000 (frontend), 5000 (backend)
- **Database:** SQLite (dev instance)
- **Volume Mounts:** Full access to source code

```bash
ENVIRONMENT=development
BACKEND_PORT=5000
FRONTEND_PORT=3000
FLASK_DEBUG=1
NODE_ENV=development
DATABASE_URL=sqlite:///rahila_labs_dev.db
BACKEND_COMMAND=flask run --host=0.0.0.0
FRONTEND_COMMAND=npm run dev
```

### `.env.staging`
- **Purpose:** Pre-production testing
- **Features:** Production-like but on local machine
- **Ports:** 5000 (backend), 3001 (frontend)
- **Database:** Staging SQLite instance
- **Volume Mounts:** Source code available

```bash
ENVIRONMENT=staging
BACKEND_PORT=5000
FRONTEND_PORT=3001
FLASK_DEBUG=0
NODE_ENV=staging
DATABASE_URL=sqlite:///rahila_labs_staging.db
BACKEND_COMMAND=python run.py
FRONTEND_COMMAND=node server.js
```

### `.env.production`
- **Purpose:** Production deployment
- **Features:** Optimized, with Nginx, SSL ready
- **Ports:** 5000 (backend), 3001 (frontend), 80/443 (Nginx)
- **Database:** Production database (configurable)
- **Volume Mounts:** Minimal or none
- **Restart Policy:** Always

```bash
ENVIRONMENT=production
FLASK_ENV=production
FLASK_DEBUG=0
NODE_ENV=production
DATABASE_URL=${PROD_DATABASE_URL}
JWT_SECRET_KEY=${PROD_JWT_SECRET_KEY}
NEXT_PUBLIC_API_URL=https://api.rahila-labs.com
BACKEND_COMMAND=python run.py
FRONTEND_COMMAND=node server.js
```

## Docker Helper Script (docker.sh)

The included `docker.sh` script provides a convenient interface for managing services across environments.

### Available Commands

```bash
./docker.sh [command] [environment] [options]
```

#### Start Services
```bash
./docker.sh up development
./docker.sh up staging
./docker.sh up production --profile prod-with-nginx
```

#### Stop Services
```bash
./docker.sh down development
./docker.sh down staging
./docker.sh down production
```

#### Restart Services
```bash
./docker.sh restart development
./docker.sh restart backend  # Restart specific service
```

#### View Logs
```bash
./docker.sh logs development              # All services
./docker.sh logs development backend      # Specific service
./docker.sh logs production frontend      # Last 50 lines
```

#### Show Running Containers
```bash
./docker.sh ps development
./docker.sh ps production
```

#### Build Images
```bash
./docker.sh build development
./docker.sh build production --no-cache
```

#### Access Service Shell
```bash
./docker.sh shell development backend
./docker.sh shell production frontend
```

#### Clean Everything
```bash
./docker.sh clean development    # Remove containers and volumes
./docker.sh clean production -v  # Force removal with -v flag
```

### Script Help
```bash
./docker.sh help
```

## Unified docker-compose.yml Structure

The single `docker-compose.yml` uses environment variables for all dynamic configurations:

```yaml
services:
  backend:
    container_name: rahila-labs-backend-${ENVIRONMENT:-development}
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    environment:
      - FLASK_ENV=${ENVIRONMENT:-development}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-change-me}
    volumes:
      - ${BACKEND_VOLUME:-./backend}:/app
    command: ${BACKEND_COMMAND:-python run.py}
    restart: ${RESTART_POLICY:-unless-stopped}

  frontend:
    container_name: rahila-labs-frontend-${ENVIRONMENT:-development}
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    environment:
      - NODE_ENV=${ENVIRONMENT:-development}
    volumes:
      - ${FRONTEND_VOLUME:-./frontend}:/app
    command: ${FRONTEND_COMMAND:-npm run dev}
    restart: ${RESTART_POLICY:-unless-stopped}

  nginx:
    profiles:
      - prod-with-nginx
    # Only starts with: --profile prod-with-nginx

  rider-app:
    profiles:
      - rider-web
    # Only starts with: --profile rider-web
```

## Key Features

### 1. Environment-Based Container Names
```bash
# Development
rahila-labs-backend-development
rahila-labs-frontend-development

# Production
rahila-labs-backend-production
rahila-labs-frontend-production
```

### 2. Dynamic Port Mapping
```yaml
ports:
  - "${BACKEND_PORT:-5000}:5000"
```
- Defaults to 5000 if `BACKEND_PORT` not set
- Can be overridden via environment variables

### 3. Conditional Service Startup (Profiles)

Optional services can be included with profiles:

```bash
# Include Nginx only in production
docker-compose --profile prod-with-nginx up

# Include Rider App (Flutter Web)
docker-compose --profile rider-web up

# Include both
docker-compose --profile prod-with-nginx --profile rider-web up
```

### 4. Volume Mount Flexibility

**Development:** Full code access for hot reload
```bash
BACKEND_VOLUME=./backend
FRONTEND_VOLUME=./frontend
```

**Production:** No volume mounts (immutable containers)
```bash
BACKEND_VOLUME=/app
FRONTEND_VOLUME=/app
```

### 5. Custom Commands per Environment

**Development:** Uses development servers with debug
```bash
BACKEND_COMMAND=flask run --host=0.0.0.0
FRONTEND_COMMAND=npm run dev
```

**Production:** Uses production servers
```bash
BACKEND_COMMAND=python run.py
FRONTEND_COMMAND=node server.js
```

## Common Workflows

### Development Workflow

```bash
# Start development
./docker.sh up development

# Check logs (follows output)
./docker.sh logs development

# Access backend shell to run migrations
./docker.sh shell development backend
python scripts/migrate_db.py

# View running containers
./docker.sh ps development

# Stop services
./docker.sh down development
```

### Staging Workflow

```bash
# Start staging (production-like)
./docker.sh up staging

# Verify services are running
./docker.sh ps staging

# View logs for debugging
./docker.sh logs staging backend

# Stop for testing
./docker.sh down staging
```

### Production Workflow

```bash
# Build fresh images
./docker.sh build production --no-cache

# Start with Nginx reverse proxy
./docker.sh up production --profile prod-with-nginx

# Monitor logs
./docker.sh logs production

# Access shell if needed
./docker.sh shell production backend

# Graceful shutdown
./docker.sh down production
```

## Switching Environments

### Quick Switch Examples

```bash
# Was running development, switch to production
./docker.sh down development
./docker.sh up production --profile prod-with-nginx

# Pause staging, start development
./docker.sh down staging
./docker.sh up development

# Run both staging and production (on different ports)
# Terminal 1
export ENVIRONMENT=staging
docker-compose up -d --project-name rahila-staging

# Terminal 2
export ENVIRONMENT=production
docker-compose up -d --project-name rahila-prod
```

## Environment Variables Reference

| Variable | Development | Staging | Production | Purpose |
|----------|-------------|---------|------------|---------|
| ENVIRONMENT | development | staging | production | Active environment |
| BACKEND_PORT | 5000 | 5000 | 5000 | Backend port |
| FRONTEND_PORT | 3000 | 3001 | 3001 | Frontend port |
| FLASK_DEBUG | 1 | 0 | 0 | Python debug mode |
| NODE_ENV | development | staging | production | Node environment |
| RESTART_POLICY | unless-stopped | always | always | Restart behavior |
| BACKEND_VOLUME | ./backend | ./backend | /app | Code mount point |
| FRONTEND_VOLUME | ./frontend | ./frontend | /app | Code mount point |
| DATABASE_URL | sqlite:///dev.db | sqlite:///staging.db | ${PROD_DB_URL} | Database connection |

## Troubleshooting

### Container Won't Start
```bash
# Check environment variables are set
env | grep ENVIRONMENT

# Check logs for errors
./docker.sh logs development backend

# Rebuild the image
./docker.sh build development --no-cache
```

### Port Conflicts
```bash
# Check what's using the port
lsof -i :3000

# Use custom port
FRONTEND_PORT=3001 docker-compose up -d
```

### Switching Environments Fails
```bash
# Stop all services first
./docker.sh down development
./docker.sh down staging
./docker.sh down production

# Clean volumes if needed
./docker.sh clean development -v

# Restart fresh
./docker.sh up production
```

### Database Issues
```bash
# Reset database
./docker.sh clean development -v
./docker.sh up development

# Check database file
./docker.sh shell development db sh
```

## Migration from Old System

The old system used separate compose files:
- `docker-compose.dev.yml` ❌ (removed)
- `docker-compose.prod.yml` ❌ (removed)
- `docker-compose.yml` ✅ (unified)

**Old commands → New commands:**

```bash
# Old
docker-compose -f docker-compose.dev.yml up -d

# New
./docker.sh up development
# or
ENVIRONMENT=development docker-compose up -d
```

```bash
# Old
docker-compose -f docker-compose.prod.yml up -d

# New
./docker.sh up production --profile prod-with-nginx
# or
ENVIRONMENT=production docker-compose --profile prod-with-nginx up -d
```

## Benefits of Unified System

✅ **Single Source of Truth** - One docker-compose.yml for all environments
✅ **Easy Switching** - Change environments instantly with one variable
✅ **Better Maintainability** - Update once, apply everywhere
✅ **Consistent Configuration** - Same structure across all environments
✅ **Reduced Duplication** - No code duplication across compose files
✅ **Clear Environment Separation** - Each .env file documents its environment
✅ **Helper Script** - Easy-to-use wrapper for common tasks
✅ **Profiles Support** - Optional services for specific scenarios

## Advanced Usage

### Running Multiple Environments Simultaneously

```bash
# Terminal 1: Development
export ENVIRONMENT=development
docker-compose -p rahila-dev up -d

# Terminal 2: Staging
export ENVIRONMENT=staging
docker-compose -p rahila-staging up -d

# Terminal 3: Production
export ENVIRONMENT=production
docker-compose -p rahila-prod --profile prod-with-nginx up -d

# View all running projects
docker ps | grep rahila
```

### Custom Environment Variables

Extend any .env file with custom variables:

```bash
# .env.custom-production
source .env.production

# Override specific variables
ENVIRONMENT=production
BACKEND_PORT=8000
FRONTEND_PORT=8080
JWT_SECRET_KEY=your-secure-key
DATABASE_URL=postgresql://user:pass@db:5432/prod
```

Then use:
```bash
env $(cat .env.custom-production | xargs) docker-compose up -d
```

## See Also

- [DOCKER.md](./DOCKER.md) - Quick reference
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Detailed setup guide
- [DOCKER_COMPLETE.md](./DOCKER_COMPLETE.md) - Comprehensive documentation
