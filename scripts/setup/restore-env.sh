#!/bin/bash

# Environment Restore Script
# Restores environment files from backup

BACKUP_DIR=".env-backups"

# Function to list available backups
list_backups() {
    echo "📋 Available backups:"
    echo "===================="
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        echo "❌ No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    # Group backups by manifest
    for manifest in "$BACKUP_DIR"/manifest.*.txt; do
        if [ -f "$manifest" ]; then
            backup_name=$(basename "$manifest" .txt | sed 's/manifest\.//')
            echo ""
            echo "🔹 Backup: $backup_name"
            
            # Show backup details
            if [ -f "$manifest" ]; then
                grep -E "(Date:|Branch:|Commit:)" "$manifest" | sed 's/^/   /'
            fi
            
            # Show available files
            echo "   Files:"
            ls -la "$BACKUP_DIR"/*."$backup_name" 2>/dev/null | sed 's/^/   /' || echo "   No files found"
        fi
    done
}

# Function to restore from backup
restore_backup() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        echo "❌ Please specify a backup name"
        echo "Usage: $0 restore <backup_name>"
        echo ""
        list_backups
        exit 1
    fi
    
    echo "🔄 Restoring from backup: $backup_name"
    
    # Create current backup before restoring
    echo "🛡️  Creating safety backup first..."
    ./scripts/backup-env.sh
    
    # Restore .env
    if [ -f "$BACKUP_DIR/.env.$backup_name" ]; then
        cp "$BACKUP_DIR/.env.$backup_name" .env
        echo "✅ Restored .env"
    else
        echo "⚠️  No .env backup found for $backup_name"
    fi
    
    # Restore .env.local
    if [ -f "$BACKUP_DIR/.env.local.$backup_name" ]; then
        cp "$BACKUP_DIR/.env.local.$backup_name" .env.local
        echo "✅ Restored .env.local"
    else
        echo "⚠️  No .env.local backup found for $backup_name"
    fi
    
    echo ""
    echo "🎉 Restore complete!"
    echo "💡 Remember to restart your dev server: pnpm dev"
    
    # Show manifest if available
    if [ -f "$BACKUP_DIR/manifest.$backup_name.txt" ]; then
        echo ""
        echo "📋 Restored backup details:"
        cat "$BACKUP_DIR/manifest.$backup_name.txt"
    fi
}

# Main script logic
case "${1:-list}" in
    "list"|"ls"|"")
        list_backups
        ;;
    "restore"|"r")
        restore_backup "$2"
        ;;
    *)
        echo "Usage: $0 [list|restore] [backup_name]"
        echo ""
        echo "Commands:"
        echo "  list     - List available backups (default)"
        echo "  restore  - Restore from backup"
        echo ""
        echo "Examples:"
        echo "  $0                                    # List backups"
        echo "  $0 restore feature-branch_20231201   # Restore specific backup"
        exit 1
        ;;
esac