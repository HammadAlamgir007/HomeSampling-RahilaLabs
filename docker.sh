#!/bin/bash

################################################################################
# Rahila Labs - Unified Docker Environment Manager
# DYNAMIC: No separate .env files needed!
# All environment configurations built into this script
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.yml"

# Logging functions
log_status() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

################################################################################
# DYNAMIC ENVIRONMENT CONFIGURATION
# All settings are defined HERE - no separate .env files needed!
################################################################################

set_environment_variables() {
    local ENV=$1
    
    # COMMON for all
    export ENVIRONMENT="$ENV"
    export COMPOSE_PROJECT_NAME="rahila-labs"
    
    case "$ENV" in
        development)
            log_info "🔧 Configuring DEVELOPMENT environment..."
            
            # Ports
            export BACKEND_PORT=5000
            export FRONTEND_PORT=3000
            export NGINX_HTTP_PORT=80
            export NGINX_HTTPS_PORT=443
            export RIDER_APP_PORT=8080
            
            # Backend
            export FLASK_ENV=development
            export FLASK_DEBUG=1
            export DATABASE_URL="sqlite:///rahila_labs_dev.db"
            export JWT_SECRET_KEY="dev-secret-key-change-in-production"
            
            # Frontend
            export NODE_ENV=development
            export NEXT_PUBLIC_API_URL="http://localhost:5000"
            
            # Database
            export DB_USER=admin
            export DB_PASSWORD=dev-password
            export DB_HOST=db
            export DB_PORT=5432
            export DB_NAME=rahila_labs_dev
            
            # Volumes (mounted for live reload)
            export BACKEND_VOLUME="./backend"
            export FRONTEND_VOLUME="./frontend"
            
            # Commands (development servers)
            export BACKEND_COMMAND="flask run --host=0.0.0.0"
            export FRONTEND_COMMAND="npm run dev"
            
            # Restart policy
            export RESTART_POLICY="unless-stopped"
            
            # Features
            export ENABLE_NGINX=false
            export ENABLE_SSL=false
            
            log_status "Development configured (port 3000, debug on)"
            ;;
            
        staging)
            log_info "🎬 Configuring STAGING environment..."
            
            # Ports
            export BACKEND_PORT=5000
            export FRONTEND_PORT=3001
            export NGINX_HTTP_PORT=80
            export NGINX_HTTPS_PORT=443
            export RIDER_APP_PORT=8080
            
            # Backend
            export FLASK_ENV=staging
            export FLASK_DEBUG=0
            export DATABASE_URL="sqlite:///rahila_labs_staging.db"
            export JWT_SECRET_KEY="staging-secret-key-${RANDOM}"
            
            # Frontend
            export NODE_ENV=staging
            export NEXT_PUBLIC_API_URL="http://localhost:5000"
            
            # Database
            export DB_USER=admin
            export DB_PASSWORD="staging-password-${RANDOM}"
            export DB_HOST=db
            export DB_PORT=5432
            export DB_NAME=rahila_labs_staging
            
            # Volumes (mounted for staging tests)
            export BACKEND_VOLUME="./backend"
            export FRONTEND_VOLUME="./frontend"
            
            # Commands (production servers)
            export BACKEND_COMMAND="python run.py"
            export FRONTEND_COMMAND="node server.js"
            
            # Restart policy
            export RESTART_POLICY="always"
            
            # Features
            export ENABLE_NGINX=false
            export ENABLE_SSL=false
            
            log_status "Staging configured (port 3001, debug off)"
            ;;
            
        production)
            log_info "🚀 Configuring PRODUCTION environment..."
            
            # Ports
            export BACKEND_PORT=5000
            export FRONTEND_PORT=3001
            export NGINX_HTTP_PORT=80
            export NGINX_HTTPS_PORT=443
            export RIDER_APP_PORT=8080
            
            # Backend - use environment variables for secrets!
            export FLASK_ENV=production
            export FLASK_DEBUG=0
            export DATABASE_URL="${PROD_DATABASE_URL:-sqlite:///rahila_labs.db}"
            export JWT_SECRET_KEY="${PROD_JWT_SECRET_KEY:-change-me-in-production}"
            
            # Frontend
            export NODE_ENV=production
            export NEXT_PUBLIC_API_URL="${PROD_API_URL:-https://api.rahila-labs.com}"
            
            # Database
            export DB_USER="${PROD_DB_USER:-admin}"
            export DB_PASSWORD="${PROD_DB_PASSWORD:-change-me}"
            export DB_HOST="${PROD_DB_HOST:-db}"
            export DB_PORT="${PROD_DB_PORT:-5432}"
            export DB_NAME="${PROD_DB_NAME:-rahila_labs}"
            
            # Volumes (immutable in production)
            export BACKEND_VOLUME="/app"
            export FRONTEND_VOLUME="/app"
            
            # Commands (production servers)
            export BACKEND_COMMAND="python run.py"
            export FRONTEND_COMMAND="node server.js"
            
            # Restart policy (always)
            export RESTART_POLICY="always"
            
            # Features
            export ENABLE_NGINX=true
            export ENABLE_SSL=true
            
            log_warn "Using PRODUCTION secrets from environment variables"
            log_warn "Verify: PROD_JWT_SECRET_KEY, PROD_DATABASE_URL, PROD_API_URL"
            log_status "Production configured (Nginx enabled)"
            ;;
            
        *)
            log_error "Unknown environment: $ENV"
            log_info "Valid: development, staging, production"
            exit 1
            ;;
    esac
}

################################################################################
# DOCKER COMMANDS
################################################################################

docker_up() {
    local ENV=$1
    shift
    local EXTRA_ARGS="$@"
    
    set_environment_variables "$ENV"
    
    log_info "Starting services for $ENV environment..."
    docker-compose up -d $EXTRA_ARGS
    
    log_status "Services started!"
    echo ""
    log_info "Running containers:"
    docker-compose ps
}

docker_down() {
    local ENV=$1
    shift
    local EXTRA_ARGS="$@"
    
    set_environment_variables "$ENV"
    
    log_info "Stopping $ENV environment..."
    docker-compose down $EXTRA_ARGS
    
    log_status "Services stopped!"
}

docker_restart() {
    local ENV=$1
    local SERVICE=${2:-}
    
    set_environment_variables "$ENV"
    
    if [ -z "$SERVICE" ]; then
        log_info "Restarting all services..."
        docker-compose restart
    else
        log_info "Restarting $SERVICE..."
        docker-compose restart "$SERVICE"
    fi
    
    log_status "Restart complete!"
}

docker_logs() {
    local ENV=$1
    shift
    local EXTRA_ARGS="$@"
    
    set_environment_variables "$ENV"
    
    log_info "Showing logs for $ENV environment (press Ctrl+C to stop)"
    docker-compose logs -f $EXTRA_ARGS
}

docker_ps() {
    local ENV=$1
    
    set_environment_variables "$ENV"
    
    log_info "Containers running in $ENV:"
    docker-compose ps
}

docker_build() {
    local ENV=$1
    shift
    local EXTRA_ARGS="$@"
    
    set_environment_variables "$ENV"
    
    log_info "Building images for $ENV environment..."
    docker-compose build $EXTRA_ARGS
    
    log_status "Build complete!"
}

docker_shell() {
    local ENV=$1
    local SERVICE=$2
    
    if [ -z "$SERVICE" ]; then
        log_error "Service name required"
        log_info "Usage: ./docker.sh shell [environment] [service]"
        log_info "Services: backend, frontend, db, nginx, rider-app"
        exit 1
    fi
    
    set_environment_variables "$ENV"
    
    log_info "Accessing $SERVICE shell..."
    docker-compose exec "$SERVICE" sh
}

docker_clean() {
    local ENV=$1
    shift
    local EXTRA_ARGS="$@"
    
    set_environment_variables "$ENV"
    
    log_warn "This will REMOVE all containers, networks, and volumes for $ENV!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v $EXTRA_ARGS
        log_status "Cleanup complete!"
    else
        log_info "Cancelled"
    fi
}

show_env_vars() {
    local ENV=$1
    
    set_environment_variables "$ENV"
    
    log_info "Environment variables for $ENV:"
    echo ""
    echo "  ENVIRONMENT=$ENVIRONMENT"
    echo "  BACKEND_PORT=$BACKEND_PORT"
    echo "  FRONTEND_PORT=$FRONTEND_PORT"
    echo "  FLASK_ENV=$FLASK_ENV"
    echo "  NODE_ENV=$NODE_ENV"
    echo "  DATABASE_URL=$DATABASE_URL"
    echo "  RESTART_POLICY=$RESTART_POLICY"
    echo "  BACKEND_COMMAND=$BACKEND_COMMAND"
    echo "  FRONTEND_COMMAND=$FRONTEND_COMMAND"
    echo ""
}

################################################################################
# HELP & MAIN
################################################################################

show_help() {
    cat << 'EOF'
🐳 Rahila Labs - Unified Docker Environment Manager
   All environments configured dynamically - NO separate .env files needed!

USAGE:
  ./docker.sh [command] [environment] [options]

ENVIRONMENTS:
  development    Development (hot reload, debug on, port 3000)
  staging        Staging (production-like, port 3001)
  production     Production (optimized, Nginx, SSL)

COMMANDS:
  up              Start services
  down            Stop services
  restart         Restart services
  logs            View logs (press Ctrl+C to stop)
  ps              Show containers
  build           Build images
  shell           Access service shell
  show-env        Show environment variables
  clean           Remove containers/volumes
  help            Show this help

EXAMPLES:

  # Development with hot reload
  ./docker.sh up development
  
  # Production with Nginx
  ./docker.sh up production --profile prod-with-nginx
  
  # View logs
  ./docker.sh logs development
  ./docker.sh logs production backend
  
  # Access backend shell
  ./docker.sh shell development backend
  
  # Stop services
  ./docker.sh down staging
  
  # Rebuild images
  ./docker.sh build production
  
  # Show what's configured
  ./docker.sh show-env production
  
  # Clean up
  ./docker.sh clean development

KEY FEATURES:
  ✓ All environments built into script
  ✓ No separate .env files needed
  ✓ Dynamic variable substitution
  ✓ Automatic container naming
  ✓ Simple environment switching
  ✓ Color-coded output

EOF
}

# Main script logic
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

COMMAND=$1
ENVIRONMENT=${2:-development}
EXTRA_ARGS="${@:3}"

case $COMMAND in
    up)
        docker_up "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    down)
        docker_down "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    restart)
        docker_restart "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    logs)
        docker_logs "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    ps)
        docker_ps "$ENVIRONMENT"
        ;;
    build)
        docker_build "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    shell)
        docker_shell "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    clean)
        docker_clean "$ENVIRONMENT" $EXTRA_ARGS
        ;;
    show-env)
        show_env_vars "$ENVIRONMENT"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac

