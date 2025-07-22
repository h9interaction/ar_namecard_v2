#!/bin/bash

# ==============================================
# AR Namecard API - Backup Script for Synology NAS
# ==============================================

set -e

# Configuration
NAS_IP="192.168.1.93"
NAS_USER="admin"
NAS_BASE_PATH="/volume1/docker/ar-namecard"
BACKUP_BASE="/volume1/docker/ar-namecard/backups"
SERVICE_NAME="ar-namecard"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Backup MongoDB data
backup_mongodb() {
    local timestamp="$1"
    local backup_dir="$BACKUP_BASE/mongodb/$timestamp"
    
    log "Backing up MongoDB data..."
    
    ssh "$NAS_USER@$NAS_IP" "
        cd $NAS_BASE_PATH/app
        
        # Create backup directory
        mkdir -p $backup_dir
        
        # Get MongoDB connection details from environment
        export \$(cat .env | grep -v '^#' | xargs)
        
        # Create MongoDB dump
        docker-compose exec -T mongodb mongodump \
            --host localhost:27017 \
            --username \$MONGO_ROOT_USERNAME \
            --password \$MONGO_ROOT_PASSWORD \
            --authenticationDatabase admin \
            --db \$MONGO_DB_NAME \
            --out /tmp/backup
        
        # Copy backup from container to host
        docker cp ar-namecard-mongodb:/tmp/backup/$MONGO_DB_NAME $backup_dir/
        
        # Compress backup
        cd $BACKUP_BASE/mongodb
        tar -czf ${timestamp}_mongodb.tar.gz $timestamp/
        rm -rf $timestamp/
        
        echo 'MongoDB backup completed: ${timestamp}_mongodb.tar.gz'
    "
    
    success "MongoDB backup completed."
}

# Backup uploaded files
backup_uploads() {
    local timestamp="$1"
    local backup_dir="$BACKUP_BASE/uploads"
    
    log "Backing up uploaded files..."
    
    ssh "$NAS_USER@$NAS_IP" "
        mkdir -p $backup_dir
        cd $NAS_BASE_PATH
        
        if [ -d uploads ] && [ \"\$(ls -A uploads 2>/dev/null)\" ]; then
            tar -czf $backup_dir/${timestamp}_uploads.tar.gz uploads/
            echo 'Uploads backup completed: ${timestamp}_uploads.tar.gz'
        else
            echo 'No files to backup in uploads directory.'
        fi
    "
    
    success "Uploads backup completed."
}

# Backup configuration files
backup_config() {
    local timestamp="$1"
    local backup_dir="$BACKUP_BASE/config"
    
    log "Backing up configuration files..."
    
    ssh "$NAS_USER@$NAS_IP" "
        mkdir -p $backup_dir
        cd $NAS_BASE_PATH/app
        
        # Backup configuration files
        tar -czf $backup_dir/${timestamp}_config.tar.gz \
            .env \
            docker-compose.yml \
            nas.env \
            firebase-service-account.json 2>/dev/null || \
        tar -czf $backup_dir/${timestamp}_config.tar.gz \
            .env \
            docker-compose.yml \
            nas.env
        
        echo 'Configuration backup completed: ${timestamp}_config.tar.gz'
    "
    
    success "Configuration backup completed."
}

# Backup SSL certificates
backup_ssl() {
    local timestamp="$1"
    local backup_dir="$BACKUP_BASE/ssl"
    
    log "Backing up SSL certificates..."
    
    ssh "$NAS_USER@$NAS_IP" "
        mkdir -p $backup_dir
        cd $NAS_BASE_PATH
        
        if [ -d ssl ] && [ -f ssl/server.crt ] && [ -f ssl/server.key ]; then
            tar -czf $backup_dir/${timestamp}_ssl.tar.gz ssl/
            echo 'SSL backup completed: ${timestamp}_ssl.tar.gz'
        else
            echo 'No SSL certificates to backup.'
        fi
    "
    
    success "SSL backup completed."
}

# Create full backup
full_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    log "Starting full backup with timestamp: $timestamp"
    
    # Create backup directories
    ssh "$NAS_USER@$NAS_IP" "
        mkdir -p $BACKUP_BASE/{mongodb,uploads,config,ssl,logs}
    "
    
    # Perform backups
    backup_mongodb "$timestamp"
    backup_uploads "$timestamp"
    backup_config "$timestamp"
    backup_ssl "$timestamp"
    
    # Create backup manifest
    ssh "$NAS_USER@$NAS_IP" "
        cat > $BACKUP_BASE/backup_${timestamp}.manifest << EOF
AR Namecard Backup Manifest
Timestamp: $timestamp
Date: \$(date)
NAS: $NAS_IP

Backup Contents:
- MongoDB: ${timestamp}_mongodb.tar.gz
- Uploads: ${timestamp}_uploads.tar.gz
- Config:  ${timestamp}_config.tar.gz
- SSL:     ${timestamp}_ssl.tar.gz

Backup Sizes:
\$(du -h $BACKUP_BASE/*/${timestamp}_*.tar.gz 2>/dev/null || echo 'No backup files found')

Total Backup Size: \$(du -sh $BACKUP_BASE | cut -f1)
EOF
    "
    
    success "Full backup completed with timestamp: $timestamp"
}

# Restore MongoDB data
restore_mongodb() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file name (without path and extension)"
    fi
    
    log "Restoring MongoDB from backup: $backup_file"
    
    ssh "$NAS_USER@$NAS_IP" "
        cd $NAS_BASE_PATH/app
        
        if [ ! -f $BACKUP_BASE/mongodb/${backup_file}_mongodb.tar.gz ]; then
            echo 'Backup file not found: ${backup_file}_mongodb.tar.gz'
            exit 1
        fi
        
        # Extract backup
        cd /tmp
        tar -xzf $BACKUP_BASE/mongodb/${backup_file}_mongodb.tar.gz
        
        # Get environment variables
        cd $NAS_BASE_PATH/app
        export \$(cat .env | grep -v '^#' | xargs)
        
        # Stop API service temporarily
        docker-compose stop api
        
        # Drop existing database
        docker-compose exec -T mongodb mongosh \
            --username \$MONGO_ROOT_USERNAME \
            --password \$MONGO_ROOT_PASSWORD \
            --authenticationDatabase admin \
            --eval \"use \$MONGO_DB_NAME; db.dropDatabase();\"
        
        # Copy backup to container
        docker cp /tmp/$backup_file/ ar-namecard-mongodb:/tmp/restore/
        
        # Restore database
        docker-compose exec -T mongodb mongorestore \
            --username \$MONGO_ROOT_USERNAME \
            --password \$MONGO_ROOT_PASSWORD \
            --authenticationDatabase admin \
            --db \$MONGO_DB_NAME \
            /tmp/restore/
        
        # Restart API service
        docker-compose start api
        
        # Cleanup
        rm -rf /tmp/$backup_file/
        
        echo 'MongoDB restore completed.'
    "
    
    success "MongoDB restore completed."
}

# Restore uploaded files
restore_uploads() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file name (without path and extension)"
    fi
    
    log "Restoring uploads from backup: $backup_file"
    
    ssh "$NAS_USER@$NAS_IP" "
        if [ ! -f $BACKUP_BASE/uploads/${backup_file}_uploads.tar.gz ]; then
            echo 'Backup file not found: ${backup_file}_uploads.tar.gz'
            exit 1
        fi
        
        cd $NAS_BASE_PATH
        
        # Backup current uploads
        if [ -d uploads ]; then
            mv uploads uploads_backup_\$(date +%Y%m%d_%H%M%S)
        fi
        
        # Restore uploads
        tar -xzf $BACKUP_BASE/uploads/${backup_file}_uploads.tar.gz
        
        echo 'Uploads restore completed.'
    "
    
    success "Uploads restore completed."
}

# List available backups
list_backups() {
    log "Available backups:"
    
    ssh "$NAS_USER@$NAS_IP" "
        if [ -d $BACKUP_BASE ]; then
            echo ''
            echo 'Backup Files:'
            find $BACKUP_BASE -name '*.tar.gz' -exec basename {} \; | sort -r | head -20
            
            echo ''
            echo 'Backup Manifests:'
            find $BACKUP_BASE -name '*.manifest' -exec basename {} \; | sort -r | head -10
            
            echo ''
            echo 'Backup Directory Size:'
            du -sh $BACKUP_BASE
        else
            echo 'No backup directory found.'
        fi
    "
}

# Cleanup old backups
cleanup_backups() {
    local retention_days="${1:-30}"
    
    log "Cleaning up backups older than $retention_days days..."
    
    ssh "$NAS_USER@$NAS_IP" "
        if [ -d $BACKUP_BASE ]; then
            # Remove backup files older than retention period
            find $BACKUP_BASE -name '*.tar.gz' -type f -mtime +$retention_days -delete
            find $BACKUP_BASE -name '*.manifest' -type f -mtime +$retention_days -delete
            
            # Remove empty directories
            find $BACKUP_BASE -type d -empty -delete
            
            echo 'Backup cleanup completed.'
            echo 'Remaining backup size: \$(du -sh $BACKUP_BASE | cut -f1)'
        else
            echo 'No backup directory found.'
        fi
    "
    
    success "Backup cleanup completed."
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file name (without path and extension)"
    fi
    
    log "Verifying backup integrity: $backup_file"
    
    ssh "$NAS_USER@$NAS_IP" "
        cd $BACKUP_BASE
        
        echo 'Checking backup files...'
        
        # Check MongoDB backup
        if [ -f mongodb/${backup_file}_mongodb.tar.gz ]; then
            echo '✓ MongoDB backup exists'
            if tar -tzf mongodb/${backup_file}_mongodb.tar.gz >/dev/null 2>&1; then
                echo '✓ MongoDB backup is valid'
            else
                echo '✗ MongoDB backup is corrupted'
            fi
        else
            echo '✗ MongoDB backup missing'
        fi
        
        # Check uploads backup
        if [ -f uploads/${backup_file}_uploads.tar.gz ]; then
            echo '✓ Uploads backup exists'
            if tar -tzf uploads/${backup_file}_uploads.tar.gz >/dev/null 2>&1; then
                echo '✓ Uploads backup is valid'
            else
                echo '✗ Uploads backup is corrupted'
            fi
        else
            echo '- Uploads backup not found (may be empty)'
        fi
        
        # Check config backup
        if [ -f config/${backup_file}_config.tar.gz ]; then
            echo '✓ Config backup exists'
            if tar -tzf config/${backup_file}_config.tar.gz >/dev/null 2>&1; then
                echo '✓ Config backup is valid'
            else
                echo '✗ Config backup is corrupted'
            fi
        else
            echo '✗ Config backup missing'
        fi
        
        # Check SSL backup
        if [ -f ssl/${backup_file}_ssl.tar.gz ]; then
            echo '✓ SSL backup exists'
            if tar -tzf ssl/${backup_file}_ssl.tar.gz >/dev/null 2>&1; then
                echo '✓ SSL backup is valid'
            else
                echo '✗ SSL backup is corrupted'
            fi
        else
            echo '- SSL backup not found (may not exist)'
        fi
        
        # Check manifest
        if [ -f backup_${backup_file}.manifest ]; then
            echo '✓ Backup manifest exists'
        else
            echo '✗ Backup manifest missing'
        fi
    "
    
    success "Backup verification completed."
}

# Main function
main() {
    case "${1:-backup}" in
        "backup"|"full")
            full_backup
            ;;
        "restore-db")
            restore_mongodb "$2"
            ;;
        "restore-uploads")
            restore_uploads "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "verify")
            verify_backup "$2"
            ;;
        *)
            echo "Usage: $0 {backup|restore-db|restore-uploads|list|cleanup|verify}"
            echo ""
            echo "Commands:"
            echo "  backup           - Create full backup"
            echo "  restore-db <id>  - Restore MongoDB from backup"
            echo "  restore-uploads <id> - Restore uploads from backup"
            echo "  list             - List available backups"
            echo "  cleanup [days]   - Remove backups older than X days (default: 30)"
            echo "  verify <id>      - Verify backup integrity"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore-db 20250121_143000"
            echo "  $0 cleanup 7"
            echo "  $0 verify 20250121_143000"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"