#!/bin/bash

# Environment Backup Script
# Creates timestamped backups of environment files for easy rollback

# Create backup directory if it doesn't exist
mkdir -p .env-backups

# Get timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BRANCH=$(git rev-parse --abbrev-ref HEAD | tr '/' '-')

# Create descriptive backup name
BACKUP_NAME="${BRANCH}_${TIMESTAMP}"

echo "🔄 Creating environment backup: ${BACKUP_NAME}"

# Backup .env if it exists
if [ -f ".env" ]; then
    cp .env ".env-backups/.env.${BACKUP_NAME}"
    echo "✅ Backed up .env"
else
    echo "⚠️  No .env file found"
fi

# Backup .env.local if it exists
if [ -f ".env.local" ]; then
    cp .env.local ".env-backups/.env.local.${BACKUP_NAME}"
    echo "✅ Backed up .env.local"
else
    echo "⚠️  No .env.local file found"
fi

# Create backup manifest
cat > ".env-backups/manifest.${BACKUP_NAME}.txt" << EOF
Environment Backup Manifest
==========================
Backup Name: ${BACKUP_NAME}
Date: $(date)
Branch: ${BRANCH}
Commit: $(git rev-parse HEAD)

Files backed up:
$(ls -la .env* 2>/dev/null || echo "No .env files found")

Git Status at backup time:
$(git status --porcelain)
EOF

echo "✅ Created backup manifest"
echo "📁 Backup location: .env-backups/"

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -t .env-backups/ | head -5