---
description: Create a fully-configured feature worktree with database isolation
argument-hint: <feature-name>
---

# Create Feature Worktree

**Feature Name:** `$ARGUMENTS`

You're creating a new isolated worktree for feature development with industry-standard setup including database isolation and environment configuration.

---

## 🎯 Your Task: Complete Worktree Setup

Follow these steps **sequentially** - each step builds on the previous one.

---

## Step 0: Gather Feature Description (REQUIRED FIRST)

**Before doing ANYTHING else, ask the user:**

> "What is this feature meant to accomplish? Please describe:
>
> 1. The problem it solves
> 2. The key functionality it provides
> 3. Any specific requirements or constraints"

**Wait for user response.** Do not proceed until you have a clear understanding of:

- What the feature does
- Why it's needed
- How it fits into the project

**Use this description to:**

- Validate the feature name makes sense
- Pre-populate the vision doc in Step 9
- Guide any technical decisions

**Once you have a clear description, proceed to Step 1.**

---

## Step 1: Validate Feature Name

**Feature Name Provided:** `$ARGUMENTS`

**Validation Rules:**

- Must be kebab-case (lowercase with hyphens)
- No spaces or special characters
- Descriptive (e.g., "analytics-dashboard", "email-campaigns", "reporting-module")
- Name should align with the description provided in Step 0

**If validation fails:**

- Ask user to provide a valid feature name
- Show examples: `analytics-dashboard`, `member-portal`, `automated-workflows`

**Once validated, proceed to Step 2.**

---

## Step 2: Check Git Worktree Status

```bash
# Show current worktrees
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree list

# Check for conflicts
ls -la /home/digitaldesk/Desktop/church-connect-hub/
```

**Verify:**

- No existing worktree with same name
- No directory conflict in parent folder
- Main worktree is clean (no uncommitted changes)

**If conflicts found:**

- Report to user
- Suggest alternative feature name or cleanup steps

**Once verified clean, proceed to Step 3.**

---

## Step 3: Create Git Worktree

```bash
# Navigate to bare repo
cd /home/digitaldesk/Desktop/church-connect-hub/.bare

# Create worktree with feature branch from main
git worktree add -b feature/$ARGUMENTS ../FEATURE_NAME main

# Example: git worktree add -b feature/integrations ../integrations main
```

**What This Does:**

- Creates `/home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME/` directory
- Creates branch `feature/$ARGUMENTS` based on main
- Checks out the branch automatically

**Verify:**

```bash
# Confirm worktree created
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree list

# Check directory exists
ls /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME/
```

**Once created, proceed to Step 4.**

---

## Step 4: Create Neon Database Branch

**⚠️ This project uses Neon PostgreSQL (cloud database), NOT local PostgreSQL**

**Pattern from existing worktrees:**

- Main worktree: `ep-falling-unit-adhn1juc` (production branch)
- Each worktree gets an **isolated Neon database branch** with its own endpoint.

---

### Option A: Neon Dashboard (Manual) ⭐ RECOMMENDED

**Most common approach:**

1. Go to https://console.neon.tech
2. Select project: **Church Connect Card**
3. Click **"Branches"** → **"New Branch"**
4. **Name:** `FEATURE_NAME` (e.g., `integrations`)
5. **Parent branch:** `main`
6. Click **"Create Branch"**
7. **Copy the DATABASE_URL** (looks like `postgresql://neondb_owner:...@ep-RANDOM-ID.../neondb?sslmode=require`)

**Save this DATABASE_URL - you'll need it in Step 5.**

---

### Option B: Neon CLI (If installed)

```bash
# Check if Neon CLI exists
which neonctl

# Create branch from main
neonctl branches create --name FEATURE_NAME --parent main

# Get the new DATABASE_URL
neonctl connection-string FEATURE_NAME
```

---

**Once Neon branch created and DATABASE_URL copied, proceed to Step 5.**

---

## Step 5: Setup Environment Variables

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

# Copy main .env as template
cp ../main/.env .env
```

**Required Changes in .env:**

1. **DATABASE_URL** (CRITICAL - Neon branch endpoint):

```bash
# OLD (main - production branch):
DATABASE_URL="postgresql://neondb_owner:npg_...@ep-falling-unit-adhn1juc.../neondb?sslmode=require"

# NEW (worktree - from Neon dashboard Step 4):
DATABASE_URL="postgresql://neondb_owner:npg_...@ep-NEW-ENDPOINT-HERE.../neondb?sslmode=require"
```

**⚠️ IMPORTANT:** Only the endpoint changes (`ep-XXXXX`). Credentials stay the same.

2. **All other values** (NO CHANGE):

- BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL (keep at localhost:3000)
- BETTER_AUTH_SECRET (same)
- AWS credentials (same - shared S3)
- ANTHROPIC_API_KEY (same)
- ARCJET keys (same)

**Why all worktrees use port 3000:**

- You only run ONE dev server at a time
- Switch worktrees by stopping one server, starting another

**Edit the .env file now with the new DATABASE_URL.**

**Once .env configured, proceed to Step 6.**

---

## Step 6: Install Dependencies

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

# Install packages
pnpm install
```

**Verify:**

```bash
# Check node_modules exists
ls -la node_modules/ | head -5
```

**Once dependencies installed, proceed to Step 7.**

---

## Step 7: Push Database Schema

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

# Generate Prisma client
pnpm prisma generate

# Push schema to worktree database
pnpm prisma db push
```

**Expected output:** "Your database is now in sync with your Prisma schema."

**Once schema pushed, proceed to Step 8.**

---

## Step 8: Seed Test Data

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

# Seed database with test data
pnpm seed:all
```

**What This Does:**

- Creates test organization (Church Connect Demo)
- Creates test users (owner, admin, staff)
- Seeds sample data (connect cards, prayers, volunteers)

**Once seeded, proceed to Step 9.**

---

## Step 9: Create Feature Vision Doc

**IMPORTANT: Do NOT create .worktree/ directories. Use /docs/features/ instead.**

Check if feature vision doc already exists:

```bash
ls /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME/docs/features/
```

If the feature needs a new vision doc, create it at:
`/docs/features/FEATURE_NAME/vision.md`

**Template:**

```markdown
# FEATURE_NAME Feature Vision

**Status:** Planning
**Owner:** [Team/Person]
**Related Features:** [List related features]

---

## Purpose

[Brief description of what this feature does]

---

## Problems Solved

1. [Problem 1]
2. [Problem 2]

---

## Technical Approach

### Database Schema

- [List new tables/models]

### UI Components

- [List components to build]

### Server Actions

- [List server actions needed]

---

## Feature Roadmap

### Phase 1: [Name]

- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]

- [ ] Task 1
- [ ] Task 2

---

## Success Metrics

- [Metric 1]
- [Metric 2]

---

**Last Updated:** [Date]
```

**Once vision doc reviewed/created, proceed to Step 10.**

---

## Step 10: Verify Worktree Setup

**Run verification checks:**

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

# 1. Check git status
git status

# 2. Check branch
git branch --show-current

# 3. Verify dependencies
ls node_modules | head -5

# 4. Test database connection
pnpm prisma db pull --print 2>&1 | head -5
```

**Expected Results:**

- ✅ Git status clean (on feature/FEATURE_NAME branch)
- ✅ Branch is `feature/FEATURE_NAME`
- ✅ Dependencies installed
- ✅ Prisma connects to worktree database

**Once all checks pass, provide summary.**

---

## Step 11: Provide Setup Summary

**Report to user:**

```
✅ Worktree Setup Complete - FEATURE_NAME

📁 Location:
/home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME

🌿 Branch:
feature/FEATURE_NAME

🗄️ Database:
Neon branch (isolated from main)

✅ Setup Complete:
✅ Git worktree created
✅ Dependencies installed
✅ Database schema pushed
✅ Test data seeded

🚀 Next Steps:
1. cd /home/digitaldesk/Desktop/church-connect-hub/FEATURE_NAME
2. pnpm dev (start development)
3. Review /docs/features/FEATURE_NAME/vision.md
4. Begin implementation (follow coding-patterns.md)

📚 Core Documentation:
- Coding Patterns: docs/essentials/coding-patterns.md
- Architecture: docs/essentials/architecture.md
- Feature Vision: docs/features/FEATURE_NAME/vision.md
```

---

## 🔧 Troubleshooting

### Database Connection Failed

**Error:** "Can't connect to database"

**Solution:**

- Check DATABASE_URL in .env
- Verify Neon branch was created
- Check Neon dashboard for connection string

### Port Already in Use

**Error:** "Port 3000 already in use"

**Solution:**

```bash
# Kill process on port 3000
fuser -k 3000/tcp

# OR stop other dev servers first
```

### Build Fails

**Error:** "TypeScript errors"

**Solution:**

```bash
pnpm install
pnpm prisma generate
pnpm tsc --noEmit
```

---

## 📚 Additional Resources

### Core Documentation (Main Worktree)

- **Architecture:** docs/essentials/architecture.md
- **Coding Patterns:** docs/essentials/coding-patterns.md
- **ADRs:** docs/technical/architecture-decisions.md

### Git Worktree Commands

```bash
# List all worktrees
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree list

# Remove a worktree
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree remove FEATURE_NAME

# Prune deleted worktrees
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree prune
```

---

**This command creates a production-ready, isolated worktree for feature development.**
