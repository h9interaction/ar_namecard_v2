#!/bin/bash

# ==============================================
# AR Namecard API - Synology NAS Deployment Script
# ==============================================

set -e  # Exit on any error

# Configuration
NAS_IP="192.168.1.93"
NAS_USER="admin"
NAS_PASSWORD="hnine0426"
NAS_BASE_PATH="/volume1/docker/ar-namecard"
LOCAL_BUILD_PATH="./build"
SERVICE_NAME="ar-namecard"

# SSH function with password
ssh_nas() {
    expect -c "
        set timeout 30
        spawn ssh -o StrictHostKeyChecking=no $NAS_USER@$NAS_IP \"$1\"
        expect \"password:\"
        send \"$NAS_PASSWORD\r\"
        expect eof
    "
}

# SCP function with password
scp_nas() {
    expect -c "
        set timeout 60
        spawn $1
        expect \"password:\"
        send \"$NAS_PASSWORD\r\"
        expect eof
    "
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if SSH key exists
    if [ ! -f ~/.ssh/id_rsa ]; then
        warning "SSH key not found. You may need to enter password multiple times."
    fi
    
    # Check if rsync is available
    if ! command -v rsync &> /dev/null; then
        error "rsync is required but not installed."
    fi
    
    # Check if Docker files exist
    if [ ! -f "./Dockerfile" ] || [ ! -f "./docker-compose.yml" ]; then
        error "Docker configuration files not found."
    fi
    
    success "Prerequisites check completed."
}

# Test NAS connection
test_connection() {
    log "Testing connection to NAS..."
    
    result=$(ssh_nas "echo 'connection_test_ok'")
    if echo "$result" | grep -q "connection_test_ok"; then
        success "SSH connection to NAS successful."
    else
        error "Cannot connect to NAS. Please check SSH configuration."
    fi
}

# Create directory structure on NAS
create_directories() {
    log "Creating directory structure on NAS..."
    
    ssh_nas "
        mkdir -p $NAS_BASE_PATH/{app,data/mongodb,data/mongodb-config,uploads,ssl,public,backups,logs}
        chmod -R 755 $NAS_BASE_PATH
    "
    
    success "Directory structure created."
}

# Build application locally
build_application() {
    log "Building application locally..."
    
    # Clean previous build
    rm -rf "$LOCAL_BUILD_PATH"
    mkdir -p "$LOCAL_BUILD_PATH"
    
    # Copy source files to build directory (Docker will handle the build)
    cp -r src package*.json tsconfig.json "$LOCAL_BUILD_PATH/"
    cp Dockerfile docker-compose.yml nas.env "$LOCAL_BUILD_PATH/"
    
    # Copy SSL certificates if they exist
    if [ -d "./ssl" ]; then
        cp -r ssl "$LOCAL_BUILD_PATH/"
    fi
    
    # Copy Firebase service account if it exists
    if [ -f "./firebase-service-account.json" ]; then
        cp firebase-service-account.json "$LOCAL_BUILD_PATH/"
    fi
    
    # Copy any additional files
    if [ -d "./scripts" ]; then
        cp -r scripts "$LOCAL_BUILD_PATH/"
    fi
    
    success "Application files prepared for Docker build."
}

# Transfer files to NAS
transfer_files() {
    log "Transferring files to NAS..."
    
    # Use expect for rsync with password
    expect -c "
        set timeout 300
        spawn rsync -avz --delete --exclude='node_modules/.cache' --exclude='*.log' $LOCAL_BUILD_PATH/ $NAS_USER@$NAS_IP:$NAS_BASE_PATH/app/
        expect \"password:\"
        send \"$NAS_PASSWORD\r\"
        expect eof
    "
    
    success "Files transferred successfully."
}

# Setup environment configuration
setup_environment() {
    log "Setting up environment configuration..."
    
    ssh_nas "
        cd $NAS_BASE_PATH/app
        
        # Copy nas.env to .env if .env doesn't exist
        if [ ! -f .env ]; then
            cp nas.env .env
            echo 'Environment file created from nas.env template.'
            echo 'Please edit .env file with your actual configuration.'
        fi
        
        # Generate JWT secret if needed
        if grep -q 'your-super-secure-jwt-secret' .env; then
            JWT_SECRET=\$(openssl rand -base64 32)
            sed -i \"s/your-super-secure-jwt-secret-for-production-use-minimum-32-characters/\$JWT_SECRET/g\" .env
            echo 'JWT secret generated automatically.'
        fi
    "
    
    success "Environment configuration completed."
}

# Generate SSL certificates
generate_ssl() {
    log "Generating SSL certificates..."
    
    ssh_nas "
        cd $NAS_BASE_PATH
        
        if [ ! -f ssl/server.crt ] || [ ! -f ssl/server.key ]; then
            openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes \
                -subj '/C=KR/ST=Seoul/L=Seoul/O=AR-Namecard/CN=$NAS_IP' \
                -addext 'subjectAltName=IP:$NAS_IP,IP:127.0.0.1,DNS:localhost,DNS:ar-namecard.local'
            
            chmod 600 ssl/server.key
            chmod 644 ssl/server.crt
            
            echo 'SSL certificates generated.'
        else
            echo 'SSL certificates already exist.'
        fi
    "
    
    success "SSL certificates ready."
}

# Deploy with Docker Compose
deploy_services() {
    log "Deploying services with Docker Compose..."
    
    ssh_nas "
        cd $NAS_BASE_PATH/app
        
        # Load environment variables
        export \$(cat .env | grep -v '^#' | xargs)
        
        # Stop existing services
        docker-compose down --remove-orphans
        
        # Pull latest images
        docker-compose pull
        
        # Build and start services
        docker-compose up -d --build
        
        # Wait for services to start
        sleep 30
        
        # Check service status
        docker-compose ps
    "
    
    success "Services deployed successfully."
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    ssh_nas "
        cd $NAS_BASE_PATH/app
        
        # Check if containers are running
        if docker-compose ps | grep -q 'Up'; then
            echo 'Containers are running.'
        else
            echo 'Some containers are not running properly.'
            docker-compose logs --tail=20
            exit 1
        fi
        
        # Test API health endpoint
        sleep 10
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            echo 'API health check passed.'
        else
            echo 'API health check failed.'
            exit 1
        fi
    "
    
    success "Deployment verification completed."
}

# Cleanup local build
cleanup() {
    log "Cleaning up local build files..."
    rm -rf "$LOCAL_BUILD_PATH"
    success "Cleanup completed."
}

# Show deployment information
show_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "📡 Service URLs:"
    echo "   HTTP:  http://$NAS_IP:3000"
    echo "   HTTPS: https://$NAS_IP:3443"
    echo "   API Docs: http://$NAS_IP:3000/api-docs"
    echo ""
    echo "🛠  Management Commands:"
    echo "   Check logs: ssh $NAS_USER@$NAS_IP 'cd $NAS_BASE_PATH/app && docker-compose logs -f'"
    echo "   Restart:    ssh $NAS_USER@$NAS_IP 'cd $NAS_BASE_PATH/app && docker-compose restart'"
    echo "   Stop:       ssh $NAS_USER@$NAS_IP 'cd $NAS_BASE_PATH/app && docker-compose down'"
    echo ""
    echo "⚙️  Configuration:"
    echo "   Edit: ssh $NAS_USER@$NAS_IP 'nano $NAS_BASE_PATH/app/.env'"
    echo ""
}

# Main deployment process
main() {
    echo "🚀 Starting AR Namecard API deployment to Synology NAS..."
    echo ""
    
    check_prerequisites
    test_connection
    create_directories
    build_application
    transfer_files
    setup_environment
    generate_ssl
    deploy_services
    verify_deployment
    cleanup
    show_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        ssh_nas "cd $NAS_BASE_PATH/app && docker-compose logs -f"
        ;;
    "restart")
        ssh_nas "cd $NAS_BASE_PATH/app && docker-compose restart"
        ;;
    "stop")
        ssh_nas "cd $NAS_BASE_PATH/app && docker-compose down"
        ;;
    "status")
        ssh_nas "cd $NAS_BASE_PATH/app && docker-compose ps"
        ;;
    "update")
        log "Updating application..."
        build_application
        transfer_files
        ssh_nas "cd $NAS_BASE_PATH/app && docker-compose up -d --build"
        cleanup
        success "Application updated successfully."
        ;;
    *)
        echo "Usage: $0 {deploy|logs|restart|stop|status|update}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  logs    - Show service logs"
        echo "  restart - Restart services"
        echo "  stop    - Stop services"
        echo "  status  - Show service status"
        echo "  update  - Update application only"
        exit 1
        ;;
esac