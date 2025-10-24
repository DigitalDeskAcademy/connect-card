# Scripts Directory

## Structure

```
scripts/
├── dev/                    # Development/testing (DELETE before production)
│   ├── clean-all-courses.ts       # Wipe database
│   ├── clean-s3-bucket.ts         # Wipe S3 bucket
│   ├── list-s3-contents.ts        # Inspect S3
│   ├── seed-iv-therapy-courses.ts # Seed test data
│   ├── seed-simple-users.ts       # Seed test users
│   └── setup-test-users.ts        # Setup test users
│
├── setup/                  # One-time setup (KEEP)
│   ├── get-tigris-cors.ts         # Check CORS config
│   └── update-tigris-cors.ts      # Update CORS config
│
└── backup/                 # Production backups (KEEP)
    └── backup-production-to-tigris.ts  # Manual backup
```

---

## Dev Scripts (⚠️ DELETE BEFORE PRODUCTION)

### List S3 Contents

```bash
pnpm tsx scripts/dev/list-s3-contents.ts
pnpm tsx scripts/dev/list-s3-contents.ts --prefix="organizations/digital-desk"
pnpm tsx scripts/dev/list-s3-contents.ts --verbose
```

### Clean Database

```bash
pnpm tsx scripts/dev/clean-all-courses.ts
```

### Clean S3 Bucket

```bash
pnpm tsx scripts/dev/clean-s3-bucket.ts
```

---

## Backup Script (KEEP)

### Manual Backup

```bash
pnpm tsx scripts/backup/backup-production-to-tigris.ts
```

**What it does:** Copies `sidecar-uploads` → `sidecar-uploads-backup`

**When to run:**

- Before major changes
- Weekly (manual)
- Before testing deletions

### Automated Backup (WSL Cron)

**1. Create wrapper script:**

```bash
mkdir -p ~/scripts && nano ~/scripts/backup-sidecar.sh
```

**2. Paste this:**

```bash
#!/bin/bash
LOG_FILE="$HOME/logs/sidecar-backup.log"
mkdir -p "$HOME/logs"

# Lockfile prevents duplicate runs
LOCK_FILE="/tmp/sidecar-backup.lock"
if [ -f "$LOCK_FILE" ] && ps -p $(cat "$LOCK_FILE") > /dev/null 2>&1; then
    echo "[$(date)] SKIPPED: Already running" >> "$LOG_FILE"
    exit 0
fi
echo $$ > "$LOCK_FILE"
trap "rm -f '$LOCK_FILE'" EXIT

# Run backup
cd /home/digitaldesk/Desktop/LMS_Project/lms-project
pnpm tsx scripts/backup/backup-production-to-tigris.ts >> "$LOG_FILE" 2>&1
```

**3. Make executable and schedule:**

```bash
chmod +x ~/scripts/backup-sidecar.sh
crontab -e
# Add: 0 2 * * * /home/digitaldesk/scripts/backup-sidecar.sh
sudo service cron start
```

**View logs:**

```bash
tail -f ~/logs/sidecar-backup.log
```

---

## Bucket Architecture

```
sidecar-uploads              # Production (Vercel)
sidecar-uploads-backup       # Backup (script copies here)
sidecar-uploads-dev          # Dev/Test (local .env)
```

**Setup:** Create backup/dev buckets in Tigris console, then run first backup.

---

## Recovery

**If files deleted from production:**

```bash
# Copy back from backup
aws s3 cp \
  s3://sidecar-uploads-backup/path/to/files/ \
  s3://sidecar-uploads/path/to/files/ \
  --recursive \
  --endpoint-url=https://t3.storage.tigris.dev
```
