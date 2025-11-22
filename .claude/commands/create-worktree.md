---
description: Create a fully-configured feature worktree with database isolation
argument-hint: <feature-name>
model: claude-sonnet-4-5-20250929
---

# Create Feature Worktree

**Feature Name:** `$ARGUMENTS`

You're creating a new isolated worktree for feature development with industry-standard setup including database isolation, environment configuration, and documentation structure.

---

## 🎯 Your Task: Complete Worktree Setup

Follow these steps **sequentially** - each step builds on the previous one.

---

## Step 1: Validate Feature Name

**Feature Name Provided:** `$ARGUMENTS`

**Validation Rules:**

- Must be kebab-case (lowercase with hyphens)
- No spaces or special characters
- Descriptive (e.g., "analytics-dashboard", "email-campaigns", "reporting-module")

**If validation fails:**

- Ask user to provide a valid feature name
- Show examples: `analytics-dashboard`, `member-portal`, `automated-workflows`

**Once validated, proceed to Step 2.**

---

## Step 2: Check Git Worktree Status

```bash
# Show current worktrees
git worktree list

# Check for conflicts
ls -la /home/digitaldesk/Desktop/connect-card/
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
cd /home/digitaldesk/Desktop/connect-card/.bare

# Create worktree with feature branch
git worktree add -b feature/$ARGUMENTS ../FEATURE_NAME

# Example: git worktree add -b feature/analytics-dashboard ../analytics-dashboard
```

**What This Does:**

- Creates `/home/digitaldesk/Desktop/connect-card/FEATURE_NAME/` directory
- Creates branch `feature/$ARGUMENTS`
- Checks out the branch automatically

**Verify:**

```bash
# Confirm worktree created
git worktree list

# Check directory exists
ls /home/digitaldesk/Desktop/connect-card/FEATURE_NAME/
```

**Once created, add to pnpm workspace.**

---

### Step 3.5: Add Worktree to pnpm Workspace

**CRITICAL:** All worktrees must be registered in the pnpm workspace to share dependencies and prevent drift.

```bash
# Navigate to repo root
cd /home/digitaldesk/Desktop/connect-card

# Edit pnpm-workspace.yaml
```

**Add the new worktree to the packages list:**

```yaml
packages:
  - "main"
  - "prayer"
  - "volunteer"
  - "tech-debt"
  - "FEATURE_NAME" # ← Add this line
```

**Run pnpm install to register the workspace:**

```bash
cd /home/digitaldesk/Desktop/connect-card
pnpm install
```

**Why This Matters:**

- ✅ All worktrees share the same `node_modules` at repo root
- ✅ Zero dependency drift between worktrees
- ✅ One `pnpm install` updates all worktrees
- ✅ Industry-standard pattern (Vercel, Turborepo)

**Verify:**

```bash
# Check that shared node_modules exists
ls /home/digitaldesk/Desktop/connect-card/node_modules
```

**Once added to workspace, proceed to Step 4.**

---

## Step 4: Create Database for Feature

**Database Naming Convention:**

```
DATABASE_URL="postgresql://user:password@localhost:5432/connect_card_FEATURE_NAME"

Example:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/connect_card_analytics_dashboard"
```

**Steps:**

1. **Extract database credentials from main .env:**

```bash
cd /home/digitaldesk/Desktop/connect-card/main
grep DATABASE_URL .env
```

2. **Create new database:**

```bash
# Replace with actual credentials from main .env
psql -U postgres -h localhost -c "CREATE DATABASE connect_card_FEATURE_NAME;"

# Example:
# psql -U postgres -h localhost -c "CREATE DATABASE connect_card_analytics_dashboard;"
```

**If database creation fails:**

- Check PostgreSQL is running
- Verify credentials
- Suggest user creates manually

**Once database created, proceed to Step 5.**

---

## Step 5: Setup Environment Variables

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Copy main .env as template
cp ../main/.env .env

# Edit .env for worktree-specific values
```

**Required Changes in .env:**

1. **DATABASE_URL** (CRITICAL):

```bash
# OLD (main):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/connect_card"

# NEW (worktree):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/connect_card_FEATURE_NAME"
```

2. **NEXT_PUBLIC_APP_URL** (if needed):

```bash
# If running dev server on different port
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

3. **Keep same for all other values:**

- BETTER_AUTH_SECRET (same)
- AWS credentials (same - shared S3)
- ANTHROPIC_API_KEY (same)
- ARCJET keys (same)

**Edit the .env file now:**

Use the Edit tool to update:

- Line with DATABASE_URL → change database name
- Add comment at top: `# Worktree: FEATURE_NAME`

**Once .env configured, proceed to Step 6.**

---

## Step 6: Install Dependencies

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Install packages (this will take 2-3 minutes)
pnpm install
```

**What This Does:**

- Installs node_modules in worktree (isolated from main)
- Links to shared pnpm store (saves disk space)
- Ensures package versions match package.json

**Verify:**

```bash
# Check node_modules exists
ls -la node_modules/

# Verify pnpm lockfile
ls pnpm-lock.yaml
```

**Once dependencies installed, proceed to Step 7.**

---

## Step 7: Push Database Schema

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Generate Prisma client
pnpm prisma generate

# Push schema to worktree database
pnpm prisma db push

# Expected output: "Your database is now in sync with your Prisma schema."
```

**What This Does:**

- Creates all tables in worktree database
- Matches current schema from main
- Generates Prisma client types

**Verify:**

```bash
# Check tables created
psql -U postgres -h localhost -d connect_card_FEATURE_NAME -c "\dt"

# Should see: Organization, User, Member, ConnectCard, PrayerRequest, Volunteer, etc.
```

**If schema push fails:**

- Check DATABASE_URL in .env is correct
- Verify database exists
- Check PostgreSQL connection

**Once schema pushed, proceed to Step 8.**

---

## Step 8: Seed Test Data

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Seed database with test data
pnpm seed:all
```

**What This Does:**

- Creates test organization (Church Connect Demo)
- Creates test users (owner, admin, staff)
- Seeds sample data (connect cards, prayers, volunteers)

**Verify:**

```bash
# Check data exists
psql -U postgres -h localhost -d connect_card_FEATURE_NAME -c "SELECT COUNT(*) FROM \"Organization\";"

# Should return at least 1 organization
```

**Once seeded, proceed to Step 9.**

---

## Step 9: Create Development Documentation (Gitignored)

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Create worktree dev docs directory (automatically gitignored)
mkdir -p .worktree/FEATURE_NAME/docs

# Create .gitkeep to track directory structure
touch .worktree/FEATURE_NAME/.gitkeep
```

**Documentation Structure:**

```
FEATURE_NAME/
└── .worktree/FEATURE_NAME/
    ├── .gitkeep                    # COMMITTED (directory structure)
    └── docs/                       # ❌ GITIGNORED (dev notes only)
        ├── planning.md             # Feature planning
        ├── implementation.md       # Implementation notes
        ├── testing.md              # Test strategy
        └── decisions.md            # Design decisions
```

**Why This Works:**

- `.worktree/*/` is already in `.gitignore` (never commits)
- Dev docs stay local to worktree (no merge conflicts)
- Clean main branch (no dev doc pollution)
- Developers edit freely (no git sync needed)

**Create development documentation templates:**

Use Write tool to create these files:

1. **.worktree/FEATURE_NAME/docs/planning.md:**

```markdown
# FEATURE_NAME - Planning

**Worktree:** /FEATURE_NAME
**Branch:** feature/FEATURE_NAME
**Status:** Planning

---

## Feature Requirements

- [ ] List feature requirements here
- [ ] Define user stories
- [ ] Identify acceptance criteria

## Database Schema Changes

- [ ] List new tables/models needed
- [ ] Document field changes to existing models
- [ ] Note indexes to add

## UI Components Needed

- [ ] List new components to build
- [ ] Identify shadcn/ui components to use
- [ ] Note existing components to reference

## API Endpoints

- [ ] List server actions needed
- [ ] Document route parameters
- [ ] Define request/response schemas

## Technical Dependencies

- [ ] External libraries to install
- [ ] Integrations required (S3, APIs, etc.)
- [ ] Environment variables needed

## References

- Core Patterns: ../../../main/docs/essentials/coding-patterns.md
- Architecture: ../../../main/docs/essentials/architecture.md
- ADRs: ../../../main/docs/technical/architecture-decisions.md
```

2. **.worktree/FEATURE_NAME/docs/implementation.md:**

```markdown
# FEATURE_NAME - Implementation Notes

**Developer Notes:** This file tracks what was built and how.

---

## What Was Built

[Describe the implementation]

## Key Files Created

- actions/FEATURE_NAME/
- components/dashboard/FEATURE_NAME/
- lib/data/FEATURE_NAME.ts

## Database Changes

- [ ] Schema changes pushed
- [ ] Seed data updated
- [ ] Migrations created (if needed)

## Challenges & Solutions

### Challenge 1

**Problem:** [Describe problem]
**Solution:** [How you solved it]

### Challenge 2

**Problem:** [Describe problem]
**Solution:** [How you solved it]

## Code Patterns Used

- [ ] Multi-tenant organizationId filtering
- [ ] Rate limiting on server actions
- [ ] Zod schema validation
- [ ] TanStack Table for data display
- [ ] PageContainer for layout

## Testing Done

- [ ] E2E tests written
- [ ] Manual testing completed
- [ ] Edge cases covered

## Integration Notes

[Notes for when merging to main]
```

3. **.worktree/FEATURE_NAME/docs/testing.md:**

```markdown
# FEATURE_NAME - Testing Strategy

---

## E2E Test Coverage

- [ ] Happy path (main user flow)
- [ ] Error handling
- [ ] Edge cases
- [ ] Multi-tenant isolation
- [ ] Role-based permissions

## Manual Testing Checklist

### As Account Owner

- [ ] Test functionality X
- [ ] Verify permissions Y

### As Admin

- [ ] Test functionality X
- [ ] Verify restricted access

### As Staff

- [ ] Test functionality X
- [ ] Verify location filtering

## Test Data

**Database:** connect_card_FEATURE_NAME

**Test Users:**

- owner@example.com (church owner)
- admin@example.com (church admin)
- staff@example.com (church staff)

## Known Issues

- [ ] List any bugs/issues found during testing
```

4. **.worktree/FEATURE_NAME/docs/decisions.md:**

```markdown
# FEATURE_NAME - Design Decisions

**Purpose:** Document why specific choices were made.

---

## Decision 1: [Title]

**Context:** [What was the situation?]

**Options Considered:**

1. Option A - [pros/cons]
2. Option B - [pros/cons]

**Decision:** Chose Option [A/B]

**Reasoning:** [Why this choice?]

---

## Decision 2: [Title]

**Context:** [What was the situation?]

**Options Considered:**

1. Option A - [pros/cons]
2. Option B - [pros/cons]

**Decision:** Chose Option [A/B]

**Reasoning:** [Why this choice?]

---

## Important Architectural Decisions

**If any decisions affect other features or core architecture:**

- Create ADR in main: /main/docs/technical/architecture-decisions.md
- Reference the ADR number here
```

**Once dev docs created, proceed to Step 10.**

---

## Step 10: Create Worktree README (Optional)

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME
```

**Create README.md in worktree root:**

Use Write tool to create:

**FEATURE_NAME/README.md:**

````markdown
# FEATURE_NAME Worktree

**Feature Branch:** `feature/FEATURE_NAME`
**Database:** `connect_card_FEATURE_NAME`
**Dev Server:** http://localhost:3000 (or 3001 if main is running)

---

## Quick Start

\`\`\`bash

# Navigate to worktree

cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# Start dev server

pnpm dev

# Run database migrations

pnpm prisma db push

# Seed test data

pnpm seed:all
\`\`\`

## Development Documentation (Gitignored)

**Location:** `.worktree/FEATURE_NAME/docs/`

- **planning.md** - Feature requirements, schema changes, UI components
- **implementation.md** - Implementation notes, challenges, solutions
- **testing.md** - Test strategy, manual testing checklist
- **decisions.md** - Design decisions, why choices were made

**Note:** These docs are gitignored and stay local to this worktree.

## Core Documentation (Main Worktree)

Reference docs from main (shared across all worktrees):

- **Coding Patterns:** ../main/docs/essentials/coding-patterns.md
- **Architecture:** ../main/docs/essentials/architecture.md
- **ADRs:** ../main/docs/technical/architecture-decisions.md
- **shadcn/ui:** ../main/docs/essentials/shadcn.md

## Database

**Connection:**
\`\`\`
Database: connect_card_FEATURE_NAME
User: postgres
Host: localhost:5432
\`\`\`

**Seed Data:**

- Organization: Church Connect Demo
- Users: owner@example.com, admin@example.com, staff@example.com

## Git Commands

\`\`\`bash

# Check current branch

git branch --show-current

# Commit changes

git add .
git commit -m "feat: your message"

# Push to remote

git push origin feature/FEATURE_NAME

# Pull latest from main

git pull origin main
\`\`\`

## Testing

\`\`\`bash

# Run E2E tests

pnpm test:e2e

# Type check

pnpm tsc --noEmit

# Lint

pnpm lint

# Build

pnpm build
\`\`\`

## Notes

- **Isolated database** - Changes won't affect main
- **Local dependencies** - node_modules installed per worktree
- **Gitignored dev docs** - .worktree/ never commits to git
- **Clean merges** - Only code merges to main, dev docs stay local

---

**Created:** [current date]
\`\`\`

**Once README created, proceed to Step 11.**

---

## Step 11: Verify Worktree Setup

**Run verification checks:**

```bash
cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME

# 1. Check git status
git status

# 2. Check database connection
pnpm prisma db pull

# 3. Verify dependencies
pnpm list --depth=0

# 4. Check build passes
pnpm build

# 5. Verify dev server starts (don't leave running)
timeout 10 pnpm dev || true
```
````

**Expected Results:**

- ✅ Git status clean (on feature/FEATURE_NAME branch)
- ✅ Prisma connects to worktree database
- ✅ Dependencies installed (no errors)
- ✅ Build passes (no TypeScript errors)
- ✅ Dev server starts successfully

**If any check fails:**

- Report specific failure to user
- Provide troubleshooting steps
- Don't proceed until resolved

**Once all checks pass, proceed to Step 12.**

---

## Step 12: Create Integration Checklist (Gitignored)

**Create integration checklist in dev docs:**

Use Write tool to create:

**.worktree/FEATURE_NAME/docs/integration-checklist.md:**

```markdown
# Integration Checklist - FEATURE_NAME

**Purpose:** Pre-merge checklist before integrating to main

**Note:** This file is gitignored (stays local to worktree)

---

## Pre-Integration Requirements

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Build passes successfully
- [ ] No console.log/error statements in production code

### Testing

- [ ] E2E tests written and passing
- [ ] Manual testing on all user roles (owner, admin, staff)
- [ ] Multi-tenant isolation verified
- [ ] Location-based filtering tested (if applicable)

### Database

- [ ] Schema changes documented
- [ ] Migration script created (if needed)
- [ ] Seed data updated in main
- [ ] Indexes added for new queries

### Security

- [ ] All server actions have rate limiting
- [ ] Multi-tenant organizationId filtering verified
- [ ] Input validation with Zod schemas
- [ ] Error messages are generic (no data leakage)

### Documentation

- [ ] ADR created if architectural changes (in main docs)
- [ ] STATUS.md updated in main (if needed)
- [ ] ROADMAP.md updated in main (if needed)

### Performance

- [ ] No N+1 query patterns
- [ ] Composite indexes added where needed
- [ ] Bundle size impact acceptable
- [ ] No unnecessary client components

### Integration Plan

- [ ] Create integration plan with /plan-integration
- [ ] Review with team
- [ ] Schedule merge window
- [ ] Backup production database

---

## Merge Workflow

\`\`\`bash

# 1. Update from main

cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME
git pull origin main

# 2. Resolve conflicts (if any)

# ... conflict resolution ...

# 3. Run integration plan

# /plan-integration FEATURE_NAME

# 4. Test merged code

pnpm build
pnpm test:e2e

# 5. Merge to main

cd /home/digitaldesk/Desktop/connect-card/main
git merge feature/FEATURE_NAME

# 6. Verify only code merged (dev docs stay in worktree)

git status

# Should NOT show .worktree/ files (gitignored)

# 7. Push to main

git push origin main

# 8. Deploy to production

# (follow deployment checklist)

\`\`\`

---

**Complete this checklist before running /plan-integration**
\`\`\`

**Once checklist created, proceed to Step 13 (Final Summary).**

---

## Step 13: Provide Setup Summary

**Report to user:**
```

✅ Worktree Setup Complete - FEATURE_NAME

📁 Location:
/home/digitaldesk/Desktop/connect-card/FEATURE_NAME

🌿 Branch:
feature/FEATURE_NAME

🗄️ Database:
connect_card_FEATURE_NAME (isolated)

📋 Development Docs (Gitignored):
✅ .worktree/FEATURE_NAME/docs/planning.md
✅ .worktree/FEATURE_NAME/docs/implementation.md
✅ .worktree/FEATURE_NAME/docs/testing.md
✅ .worktree/FEATURE_NAME/docs/decisions.md
✅ .worktree/FEATURE_NAME/docs/integration-checklist.md
✅ README.md (worktree root)

✅ Verification:
✅ Dependencies installed
✅ Database schema pushed
✅ Test data seeded
✅ Build passes
✅ Dev server tested

🚀 Next Steps:

1.  cd /home/digitaldesk/Desktop/connect-card/FEATURE_NAME
2.  pnpm dev (start development)
3.  Edit .worktree/FEATURE_NAME/docs/planning.md (define requirements)
4.  Begin implementation (follow coding-patterns.md)

📚 Core Documentation (Main Worktree - SSoT):

- Coding Patterns: ../main/docs/essentials/coding-patterns.md
- Architecture: ../main/docs/essentials/architecture.md
- ADRs: ../main/docs/technical/architecture-decisions.md
- shadcn/ui: ../main/docs/essentials/shadcn.md

💡 Key Points:

- Dev docs are GITIGNORED (stay local to this worktree)
- Only CODE merges to main (dev docs stay in feature branch)
- No doc merge conflicts (docs never commit)
- Reference core docs from main for shared patterns

````

**Ask user:**
- "Worktree setup complete. Ready to start feature development?"
- "Would you like me to help plan the feature in .worktree/FEATURE_NAME/docs/planning.md?"

---

## 🔧 Troubleshooting

### Database Connection Failed

**Error:** "Can't reach database server"

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql

# Verify credentials
psql -U postgres -h localhost -l
````

### Port Already in Use

**Error:** "Port 3000 already in use"

**Solution:**

```bash
# Kill process on port 3000
fuser -k 3000/tcp

# OR run on different port
PORT=3001 pnpm dev
```

### Build Fails

**Error:** "TypeScript errors"

**Solution:**

```bash
# Check for missing dependencies
pnpm install

# Regenerate Prisma client
pnpm prisma generate

# Check TypeScript errors
pnpm tsc --noEmit
```

---

## 📚 Additional Resources

### Core Documentation (Main Worktree)

- **Architecture:** ../main/docs/essentials/architecture.md
- **Coding Patterns:** ../main/docs/essentials/coding-patterns.md
- **ADRs:** ../main/docs/technical/architecture-decisions.md
- **shadcn/ui:** ../main/docs/essentials/shadcn.md

### Existing Worktrees

- **Prayer:** /home/digitaldesk/Desktop/connect-card/prayer (feature/prayer-management)
- **Volunteer:** /home/digitaldesk/Desktop/connect-card/volunteer (feature/volunteer-management)

### Git Worktree Commands

```bash
# List all worktrees
git worktree list

# Remove a worktree
git worktree remove FEATURE_NAME

# Prune deleted worktrees
git worktree prune
```

---

## 📖 Documentation Architecture Summary

**Main Worktree (`/main/docs/`):**

- Core patterns that apply to ALL features
- Single source of truth (SSoT)
- Committed to main branch
- Shared across all worktrees via git pulls

**Feature Worktrees (`.worktree/FEATURE_NAME/docs/`):**

- Development docs (planning, implementation, testing, decisions)
- Gitignored (never commits, never merges)
- Stays local to worktree (no conflicts)
- Developers edit freely during active development

**When to Document Where:**

- Architectural decisions affecting multiple features → Main ADR
- Shared coding patterns → Main coding-patterns.md
- Feature planning/implementation notes → Worktree dev docs
- Design decisions → Worktree decisions.md (or Main ADR if cross-cutting)

---

**This command creates a production-ready, isolated worktree for feature development with clean documentation boundaries.**
