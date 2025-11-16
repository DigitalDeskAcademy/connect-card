# Worktree Database Setup Guide

**Last Updated**: 2025-11-14
**Status**: Active - Critical Infrastructure Documentation

---

## Overview

This project uses **git worktrees** for parallel feature development. Each worktree **MUST** have its own isolated Neon PostgreSQL database branch to prevent cross-contamination of data during development.

---

## Current Database Mapping

| Worktree    | Database Endpoint           | Purpose                      |
| ----------- | --------------------------- | ---------------------------- |
| `main`      | `ep-falling-unit-adhn1juc`  | Production-like environment  |
| `volunteer` | `ep-bitter-recipe-ad3v8ovt` | Volunteer management feature |
| `prayer`    | `ep-long-feather-ad7s8ao0`  | Prayer management feature    |

---

## Critical: Prisma Environment Variable Loading

### The Problem

**Prisma loads `.env` files from parent directories**, which can cause schema changes to be applied to the wrong database.

**Example of what goes wrong**:

```bash
cd /path/to/prayer-worktree
pnpm prisma db push
# ❌ This connects to parent's DATABASE_URL, not prayer's!
```

### The Solution

**Always use explicit DATABASE_URL environment variable** when running Prisma commands:

```bash
DATABASE_URL="postgresql://..." pnpm prisma db push
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
DATABASE_URL="postgresql://..." npx prisma db execute --schema=...
```

### Alternative: Use .env.local (Next.js Only)

Next.js loads `.env.local` which can override parent `.env` files:

```bash
# In /path/to/prayer-worktree/.env.local
DATABASE_URL="postgresql://neondb_owner:...@ep-long-feather-ad7s8ao0.../neondb?sslmode=require"
PORT=3002
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

**Note**: `.env.local` works for Next.js app runtime, but **Prisma CLI may still load parent `.env`**. Always use explicit environment variables for Prisma operations.

---

## Pre-Flight Checklist for Schema Changes

Before running any Prisma command that modifies the database:

### 1. Verify Current Worktree

```bash
pwd
# Expected: /home/digitaldesk/Desktop/connect-card/{worktree-name}
```

### 2. Verify DATABASE_URL

```bash
grep "DATABASE_URL" .env | grep -o "ep-[a-z0-9-]*"
```

Expected results:

- `main`: `ep-falling-unit-adhn1juc`
- `volunteer`: `ep-bitter-recipe-ad3v8ovt`
- `prayer`: `ep-long-feather-ad7s8ao0`

### 3. Use Explicit DATABASE_URL

```bash
# ✅ CORRECT - Explicitly set DATABASE_URL
DATABASE_URL="postgresql://...@ep-long-feather-ad7s8ao0..." pnpm prisma db push

# ❌ WRONG - May load parent .env
pnpm prisma db push
```

### 4. Verify Connected Database

After running a Prisma command, check the output for:

```
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-XXXXX.c-2.us-east-1.aws.neon.tech"
```

Confirm `ep-XXXXX` matches your worktree's expected database endpoint.

---

## Setting Up a New Worktree

When creating a new feature worktree that needs database changes:

### Step 1: Create Neon Database Branch

1. Go to https://neon.tech
2. Navigate to your project
3. Create new database branch from `main`
4. Name it descriptively (e.g., `feature-notifications`)
5. Copy the connection string (starts with `postgresql://`)

### Step 2: Configure Worktree Environment

Create or update `.env` in the worktree:

```bash
cd /path/to/new-worktree
vim .env
```

Set the DATABASE_URL to your new branch:

```env
DATABASE_URL="postgresql://neondb_owner:...@ep-XXXXX-XXXXX.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Step 3: Create .env.local for Overrides

```bash
# Create .env.local
cat > .env.local <<EOF
# Worktree-specific configuration
DATABASE_URL="postgresql://neondb_owner:...@ep-XXXXX-XXXXX.../neondb?sslmode=require"
PORT=300X  # Unique port for this worktree
NEXT_PUBLIC_APP_URL=http://localhost:300X
BETTER_AUTH_URL=http://localhost:300X
PLAYWRIGHT_BASE_URL=http://localhost:300X
WORKTREE_NAME=feature-name
EOF
```

### Step 4: Verify Isolation

```bash
# Check DATABASE_URL
grep "DATABASE_URL" .env | grep -o "ep-[a-z0-9-]*"

# Verify it's different from parent
grep "DATABASE_URL" ../.env | grep -o "ep-[a-z0-9-]*"
```

### Step 5: Apply Schema

```bash
# Use explicit DATABASE_URL
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" pnpm prisma db push
```

### Step 6: Seed Data (if needed)

```bash
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" npx tsx prisma/seed.ts
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgot to Set DATABASE_URL Explicitly

**Problem**:

```bash
cd prayer
pnpm prisma db push
# Connects to parent's database (volunteer's)
```

**Solution**:

```bash
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" pnpm prisma db push
```

### Pitfall 2: Parent .env Overrides Worktree .env

**Problem**: Prisma loads parent directory's `.env` file first.

**Solution**:

- Use explicit `DATABASE_URL=...` prefix on all Prisma commands
- OR add `DATABASE_URL` to `.env.local` (but still verify with explicit var)

### Pitfall 3: Dev Server Using Wrong Database

**Problem**: Next.js dev server connects to wrong database.

**Solution**: `.env.local` works for Next.js runtime:

```bash
# In .env.local
DATABASE_URL="postgresql://...@ep-correct-database..."
```

Then restart dev server:

```bash
PORT=3002 pnpm dev
```

### Pitfall 4: Tests Using Wrong Database

**Problem**: Tests connect to different worktree's database.

**Solution**: Use `PLAYWRIGHT_BASE_URL` in `.env.local` and ensure test database matches:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3002
DATABASE_URL="postgresql://...@ep-prayer-database..."
```

---

## Cleanup After Database Contamination

If you accidentally pushed schema/data to the wrong database:

### 1. Document Current State

```bash
# Check all worktrees
for wt in main volunteer prayer; do
  echo "=== $wt ==="
  cd /path/to/$wt
  grep "DATABASE_URL" .env | grep -o "ep-[a-z0-9-]*"
done
```

### 2. Drop Contaminated Tables

```bash
# Switch to contaminated worktree
cd /path/to/contaminated-worktree

# Drop the incorrect table
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" npx prisma db execute --schema=prisma/schema.prisma --stdin <<'EOF'
DROP TABLE IF EXISTS "incorrect_table_name" CASCADE;
EOF
```

### 3. Apply to Correct Database

```bash
# Switch to correct worktree
cd /path/to/correct-worktree

# Verify .env
grep "DATABASE_URL" .env | grep -o "ep-[a-z0-9-]*"

# Push schema
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" pnpm prisma db push

# Seed data
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" npx tsx prisma/seed.ts
```

### 4. Verify Isolation

```bash
# Confirm each database has correct schema
for wt in main volunteer prayer; do
  echo "=== $wt ==="
  cd /path/to/$wt
  db_url=$(grep DATABASE_URL .env | cut -d'"' -f2)
  DATABASE_URL="$db_url" npx prisma db execute --schema=prisma/schema.prisma --stdin <<'EOF'
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
EOF
done
```

---

## Incident Report: 2025-11-14

### What Happened

- Prayer worktree schema changes were accidentally applied to volunteer's database
- Root cause: Prisma loaded parent directory's `.env` instead of worktree-specific `.env`
- Result: `prayer_request` table created in volunteer database with 30 seed records

### How It Was Fixed

1. Reverted prayer's `.env` to correct database URL (ep-long-feather-ad7s8ao0)
2. Dropped `prayer_request` table from volunteer's database
3. Added `DATABASE_URL` to prayer's `.env.local` for Next.js runtime
4. Re-applied schema to prayer's correct database using explicit `DATABASE_URL=...` prefix
5. Re-seeded prayer database with 30 test records
6. Verified isolation across all three worktrees

### Lessons Learned

1. **Never trust Prisma to load the correct .env** - Always use explicit environment variable
2. **Verify database connection before schema changes** - Check Prisma output for connected endpoint
3. **Document database mappings** - Keep this file up to date
4. **Use .env.local for Next.js** - But still use explicit vars for Prisma CLI

### Prevention Measures

1. Created this documentation file
2. Updated pre-flight checklist
3. Added DATABASE_URL verification step to worktree setup guide
4. Documented cleanup procedures for future incidents

---

## Quick Reference Commands

```bash
# Verify which database you're connected to
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" pnpm prisma db push --dry-run

# Check connected database from Prisma output
pnpm prisma db push | grep "Datasource"

# List all tables in current database
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" npx prisma db execute --schema=prisma/schema.prisma --stdin <<'EOF'
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
EOF

# Count records in a table
DATABASE_URL="$(grep DATABASE_URL .env | cut -d'"' -f2)" npx prisma db execute --schema=prisma/schema.prisma --stdin <<'EOF'
SELECT COUNT(*) FROM table_name;
EOF

# Verify all worktree databases
cd /home/digitaldesk/Desktop/connect-card
for wt in main volunteer prayer; do
  echo "=== $wt ==="
  cd $wt
  grep "DATABASE_URL" .env | grep -o "ep-[a-z0-9-]*"
  cd ..
done
```

---

## Support

If you encounter database isolation issues:

1. **STOP** - Don't make more changes
2. **Document** - Record which database was affected and what commands were run
3. **Verify** - Check all worktree `.env` files for correct DATABASE_URL
4. **Consult** - Review this guide's cleanup procedures
5. **Execute** - Follow cleanup steps methodically with verification at each step

---

**Remember**: Database isolation is critical for parallel development. Always verify before you execute.
