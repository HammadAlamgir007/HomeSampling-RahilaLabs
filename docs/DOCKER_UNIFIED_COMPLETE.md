# 🐳 Unified Docker Compose System - Complete

## ✅ What Has Changed

Your project now uses a **single, unified `docker-compose.yml`** that automatically adapts to different environments based on the `ENVIRONMENT` variable.

### Old System (Removed ❌)
```
docker-compose.dev.yml     ← Separate dev config
docker-compose.prod.yml    ← Separate prod config
docker-compose.yml         ← Default config
```

### New System (Unified ✅)
```
docker-compose.yml         ← Single unified file (uses ENV variables)
docker.sh                  ← Helper script for easy switching
.env.development           ← Development configuration
.env.staging               ← Staging configuration
.env.production            ← Production configuration
.env.example               ← Template
```

---

## 📦 New Files Created

### 1. **Unified docker-compose.yml**
- Single file for all environments
- Environment variables control behavior
- Automatic container naming based on ENVIRONMENT
- Profiles for optional services (nginx, rider-app)
- Dynamic port mapping
- Conditional restart policies

### 2. **docker.sh Helper Script**
Executable shell script with commands:
```bash
./docker.sh up [environment]            # Start services
./docker.sh down [environment]          # Stop services
./docker.sh logs [environment]          # View logs
./docker.sh shell [environment] [service]  # Access shell
./docker.sh restart [environment]       # Restart services
./docker.sh build [environment]         # Build images
./docker.sh ps [environment]            # Show containers
./docker.sh clean [environment]         # Clean up
```

### 3. **Environment Configuration Files**

#### `.env.development`
- Debug mode enabled
- Live code mounting (hot reload)
- Development commands (flask run, npm run dev)
- Ports: 5000 (backend), 3000 (frontend)
- SQLite dev database

#### `.env.staging`
- Production-like configuration
- Debug disabled
- Staging database
- Ports: 5000 (backend), 3001 (frontend)

#### `.env.production`
- Fully optimized for production
- Debug disabled
- Production database (configurable)
- Nginx reverse proxy support
- Always restart policy
- SSL/HTTPS ready

### 4. **Comprehensive Documentation**

**New:**
- `docs/DOCKER_UNIFIED.md` - Complete guide to unified system

**Updated:**
- `README.md` - Updated to show new quick start

---

## 🚀 Quick Start

### Method 1: Using Helper Script (Recommended)

```bash
# Start development
./docker.sh up development
# Access: http://localhost:3000 (frontend), http://localhost:5000 (backend)

# Start staging
./docker.sh up staging
# Access: http://localhost:3001 (frontend)

# Start production with Nginx
./docker.sh up production --profile prod-with-nginx
# Access: http://localhost (through Nginx)

# Stop any environment
./docker.sh down development
```

### Method 2: Direct Docker Compose Commands

```bash
# Development
ENVIRONMENT=development docker-compose up -d

# Production with Nginx
ENVIRONMENT=production docker-compose --profile prod-with-nginx up -d

# Staging
ENVIRONMENT=staging docker-compose up -d
```

### Method 3: Load Environment File

```bash
# Load development environment
env $(cat .env.development | xargs) docker-compose up -d

# Load production environment
env $(cat .env.production | xargs) docker-compose up -d
```

---

## 🎯 How It Works

### Environment-Based Configuration

The unified `docker-compose.yml` uses environment variables with defaults:

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
```

**When ENVIRONMENT=production:**
```
Container name: rahila-labs-backend-production
Port: 5000 (from .env.production)
FLASK_ENV: production
Volume: /app (immutable container)
Restart: always
```

**When ENVIRONMENT=development:**
```
Container name: rahila-labs-backend-development
Port: 5000 (default)
FLASK_ENV: development
Volume: ./backend:/app (live code mounting)
Restart: unless-stopped
```

### Environment File Loading

The `.env.[environment]` files are automatically loaded:

1. Place environment-specific values in `.env.development`, `.env.staging`, or `.env.production`
2. When you run `./docker.sh up [environment]`, it loads the corresponding `.env.[environment]` file
3. All variables are exported to docker-compose
4. docker-compose substitutes them into the configuration

### Profiles for Optional Services

Some services are optional and only start with specific profiles:

```bash
# Start with Nginx reverse proxy (production)
./docker.sh up production --profile prod-with-nginx

# Start with Flutter rider app
./docker.sh up development --profile rider-web

# Start with both
./docker.sh up production --profile prod-with-nginx --profile rider-web
```

---

## 📋 Environment-Specific Configurations

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **ENVIRONMENT** | development | staging | production |
| **FLASK_ENV** | development | staging | production |
| **NODE_ENV** | development | staging | production |
| **DEBUG** | Enabled | Disabled | Disabled |
| **Frontend Port** | 3000 | 3001 | 3001 |
| **Backend Port** | 5000 | 5000 | 5000 |
| **Volume Mounts** | Full (./backend) | Full (./backend) | None (/app) |
| **Restart Policy** | unless-stopped | always | always |
| **Commands** | Dev servers | Prod commands | Prod commands |
| **Database** | SQLite (dev) | SQLite (staging) | Configurable |
| **Use Case** | Local development | Testing before prod | Live deployment |

---

## 🛠️ Helper Script Features

### Colored Output
```
✓ Green checkmarks for success
✗ Red X for errors
ℹ Blue info messages
⚠ Yellow warnings
```

### Automatic Environment Loading
```bash
./docker.sh up production

# Script automatically:
# 1. Validates environment name
# 2. Loads .env.production
# 3. Exports all variables
# 4. Runs docker-compose with those variables
# 5. Shows running containers
```

### Error Handling
```bash
./docker.sh up invalid-environment

# Output:
# ✗ Invalid environment: invalid-environment
# Valid environments: development, staging, production
```

### Interactive Cleanup
```bash
./docker.sh clean production

# Output:
# ⚠ Removing containers, networks, and volumes for production...
# Are you sure? (y/n) _
```

---

## 📊 Examples

### Typical Development Workflow

```bash
# Start development environment
./docker.sh up development

# Check what's running
./docker.sh ps development

# View logs
./docker.sh logs development

# Access backend shell to run migrations
./docker.sh shell development backend
python scripts/migrate_db.py

# When done, stop services
./docker.sh down development
```

### Switch from Development to Production

```bash
# Stop development
./docker.sh down development

# Build production images
./docker.sh build production --no-cache

# Start production with Nginx
./docker.sh up production --profile prod-with-nginx

# Verify it's running
./docker.sh ps production

# Monitor logs
./docker.sh logs production
```

### Run Multiple Environments Simultaneously

```bash
# Terminal 1: Development
./docker.sh up development

# Terminal 2: Staging (in separate terminal)
ENVIRONMENT=staging docker-compose up -d

# Terminal 3: Production (in another terminal)
ENVIRONMENT=production docker-compose --profile prod-with-nginx up -d

# All three running side by side on different ports!
```

---

## 🔄 Migration from Old System

If you were using the old system:

```bash
# Old way (no longer needed)
docker-compose -f docker-compose.dev.yml up -d

# New way
./docker.sh up development
# OR
ENVIRONMENT=development docker-compose up -d
```

**All old compose files have been removed:**
- ❌ `docker-compose.dev.yml` - REMOVED
- ❌ `docker-compose.prod.yml` - REMOVED
- ✅ `docker-compose.yml` - UNIFIED (replaces both)

---

## ✨ Benefits of Unified System

✅ **Single Source of Truth**
   - One docker-compose.yml for all environments
   - No duplication, easier maintenance

✅ **Easy Environment Switching**
   - Change environment with one variable
   - No need to remember which compose file to use

✅ **Clear Configuration**
   - Each .env file documents its environment
   - Easy to see what's different between environments

✅ **Better Consistency**
   - All environments use same structure
   - Same services, just different configurations

✅ **Flexible Customization**
   - Override any variable without modifying files
   - Create custom environment files as needed

✅ **Helper Script**
   - Don't remember long docker-compose commands
   - Colored output makes status clear
   - Built-in error checking

✅ **Profile Support**
   - Optional services (Nginx, Rider App)
   - Only start what you need

---

## 🎓 Understanding Container Names

Container names automatically include the environment:

```bash
# Development
rahila-labs-backend-development
rahila-labs-frontend-development
rahila-labs-db-development
rahila-labs-nginx-development      # Only with --profile prod-with-nginx

# Staging
rahila-labs-backend-staging
rahila-labs-frontend-staging
rahila-labs-db-staging
rahila-labs-nginx-staging          # Only with --profile prod-with-nginx

# Production
rahila-labs-backend-production
rahila-labs-frontend-production
rahila-labs-db-production
rahila-labs-nginx-production       # Only with --profile prod-with-nginx
```

This prevents name conflicts when running multiple environments!

---

## 🔍 Viewing Configuration

See what's actually being used:

```bash
# Show what environment variables are loaded
env | grep ENVIRONMENT
env | grep BACKEND_PORT
env | grep JWT_SECRET_KEY

# Show what docker-compose sees
docker-compose config
```

---

## 📝 Customizing Environments

### Create a Custom Environment

```bash
# Copy an existing environment
cp .env.production .env.custom-prod

# Edit for your needs
# - Change ports
# - Change database URL
# - Change secrets
# - etc.

# Use it
ENVIRONMENT=custom-prod docker-compose up -d
```

### Override Specific Variables

```bash
# Set at command line
export BACKEND_PORT=8000
export FRONTEND_PORT=8080
./docker.sh up development
```

### Extend Environment Files

```bash
# .env.staging-extended
source .env.staging
BACKEND_PORT=8000
EXTRA_CONFIG=value
```

---

## 🚨 Troubleshooting

### "Command not found: ./docker.sh"
```bash
# Make it executable
chmod +x docker.sh

# Or run it directly
bash docker.sh up development
```

### "ENVIRONMENT variable not set"
```bash
# Set it explicitly
export ENVIRONMENT=development
./docker.sh up

# Or use helper script (auto-sets it)
./docker.sh up development
```

### "Port already in use"
```bash
# Use custom port
export BACKEND_PORT=8000
./docker.sh up development
```

### "Can't connect services"
```bash
# Check container is running
./docker.sh ps development

# Check logs
./docker.sh logs development

# Verify NEXT_PUBLIC_API_URL in frontend
docker-compose config | grep NEXT_PUBLIC_API_URL
```

---

## 📚 See Also

For more detailed information:
- [Unified Docker Guide](./DOCKER_UNIFIED.md) - Complete reference
- [Docker Quick Ref](./DOCKER.md) - One-page cheat sheet
- [Docker Setup](./DOCKER_SETUP.md) - Detailed setup
- [Docker Complete](./DOCKER_COMPLETE.md) - Comprehensive guide
- [Project Setup](./SETUP.md) - Project structure

---

## ✅ Unified System Status

**Unified docker-compose.yml:** ✅ Complete
**Helper Script (docker.sh):** ✅ Complete
**Environment Files (.env.*):** ✅ Complete
**Documentation:** ✅ Complete
**Old Files Cleaned Up:** ✅ Complete

### Your project is now using a modern, unified Docker configuration! 🎉
