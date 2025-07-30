#!/bin/bash

# ICSHD GENIUSES Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="icshd-geniuses"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
LOG_FILE="/var/log/${PROJECT_NAME}/deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    echo "[ERROR] $1" >> "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
    echo "[INFO] $1" >> "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    # Check if .env.production exists
    if [[ ! -f "backend/.env.production" ]]; then
        error "Production environment file not found: backend/.env.production"
    fi
    
    log "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "/var/log/${PROJECT_NAME}"
    sudo mkdir -p "/var/uploads/${PROJECT_NAME}"
    sudo mkdir -p "/etc/ssl/certs"
    sudo mkdir -p "/etc/ssl/private"
    
    # Set proper permissions
    sudo chown -R $USER:$USER "/var/log/${PROJECT_NAME}"
    sudo chown -R $USER:$USER "/var/uploads/${PROJECT_NAME}"
    
    log "Directories created successfully"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker ps | grep -q "${PROJECT_NAME}-mongodb"; then
        info "Backing up MongoDB..."
        docker exec "${PROJECT_NAME}-mongodb" mongodump --out /tmp/backup
        docker cp "${PROJECT_NAME}-mongodb:/tmp/backup" "${BACKUP_PATH}/mongodb"
    fi
    
    # Backup uploads
    if [[ -d "/var/uploads/${PROJECT_NAME}" ]]; then
        info "Backing up uploads..."
        cp -r "/var/uploads/${PROJECT_NAME}" "${BACKUP_PATH}/uploads"
    fi
    
    # Backup configuration
    if [[ -f "backend/.env.production" ]]; then
        cp "backend/.env.production" "${BACKUP_PATH}/"
    fi
    
    log "Backup completed: $BACKUP_PATH"
    echo "$BACKUP_PATH" > .last_backup
}

# Pull latest code
pull_code() {
    log "Pulling latest code from repository..."
    
    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)"
    
    # Pull latest changes
    git pull origin main
    
    log "Code updated successfully"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Stop existing containers
    info "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Remove old images (optional)
    info "Cleaning up old Docker images..."
    docker image prune -f
    
    # Build and start new containers
    info "Building and starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check if containers are running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        error "Some containers failed to start"
    fi
    
    # Check API health
    MAX_RETRIES=10
    RETRY_COUNT=0
    
    while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
        if curl -f http://localhost:3001/api/health &> /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        info "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
        sleep 10
    done
    
    error "Health check failed after $MAX_RETRIES attempts"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    if [[ -f ".last_backup" ]]; then
        LAST_BACKUP=$(cat .last_backup)
        warning "Rolling back to: $LAST_BACKUP"
        
        # Stop current containers
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        
        # Restore database
        if [[ -d "${LAST_BACKUP}/mongodb" ]]; then
            info "Restoring database..."
            # Implementation depends on your backup strategy
        fi
        
        # Restore uploads
        if [[ -d "${LAST_BACKUP}/uploads" ]]; then
            info "Restoring uploads..."
            sudo rm -rf "/var/uploads/${PROJECT_NAME}"
            sudo cp -r "${LAST_BACKUP}/uploads" "/var/uploads/${PROJECT_NAME}"
        fi
        
        warning "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    find "$BACKUP_DIR" -name "backup_*" -type d | sort -r | tail -n +6 | xargs rm -rf
    
    log "Backup cleanup completed"
}

# SSL certificate setup
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [[ ! -f "/etc/ssl/certs/icshd-geniuses.crt" ]]; then
        warning "SSL certificate not found. Please install SSL certificates manually."
        info "Expected locations:"
        info "  Certificate: /etc/ssl/certs/icshd-geniuses.crt"
        info "  Private Key: /etc/ssl/private/icshd-geniuses.key"
    else
        log "SSL certificates found"
    fi
}

# Main deployment process
main() {
    log "Starting ICSHD GENIUSES deployment process..."
    
    # Trap errors for rollback
    trap rollback ERR
    
    check_root
    check_prerequisites
    create_directories
    setup_ssl
    backup_current
    pull_code
    deploy
    health_check
    cleanup_backups
    
    log "Deployment completed successfully!"
    info "Application is now running at:"
    info "  API: https://api.icshd-geniuses.com"
    info "  Web: https://icshd-geniuses.com"
    info "  Monitoring: http://localhost:3000 (Grafana)"
    info "  Logs: http://localhost:5601 (Kibana)"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        backup_current
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "status")
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        ;;
    "stop")
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        ;;
    "start")
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        ;;
    *)
        echo "Usage: $0 {deploy|backup|rollback|health|logs|status|stop|start}"
        exit 1
        ;;
esac
