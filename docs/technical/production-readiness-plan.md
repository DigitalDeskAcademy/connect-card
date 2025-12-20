# Production Readiness Plan

**Status:** Planning
**Created:** 2025-12-18
**Purpose:** Phased approach to production-ready infrastructure

---

## Current State Assessment

### What's Already Working

| Capability           | Implementation             | Notes                          |
| -------------------- | -------------------------- | ------------------------------ |
| Build verification   | `/feature-wrap-up` command | Manual but comprehensive       |
| Lint/code quality    | `/feature-wrap-up` Stage 2 | Includes console.log detection |
| PR workflow          | gh CLI in wrap-up          | Squash merges, clean history   |
| Deployments          | Vercel                     | Auto-deploy on main push       |
| Preview environments | Vercel                     | PR previews automatic          |
| Branch hygiene       | Reset after merge          | Prevents drift                 |

### Gaps to Address

| Gap                   | Impact                             | When Needed             |
| --------------------- | ---------------------------------- | ----------------------- |
| Error monitoring      | Blind to production errors         | Before pilot launch     |
| Production migrations | Data loss risk with db push        | Before pilot launch     |
| Secrets audit         | OTP logging still enabled          | Before pilot launch     |
| Uptime monitoring     | Learn about downtime from users    | Before paying customers |
| Automated CI gate     | Quality depends on running wrap-up | Nice to have            |
| Database backups      | Can't recover from data loss       | Before scale            |

---

## Phase 1: Pre-Pilot Launch (CRITICAL)

**Goal:** Don't ship to pilot church with blind spots

### 1.1 Error Monitoring - Sentry Setup

**Why:** When a user hits an error, you need to know immediately with full context (stack trace, user info, browser, etc.)

**Setup (30 minutes):**

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Run setup wizard
pnpm sentry-wizard --i nextjs
```

This creates:

- `sentry.client.config.ts` - Client-side error capture
- `sentry.server.config.ts` - Server-side error capture
- `sentry.edge.config.ts` - Edge runtime capture
- Updates `next.config.ts` with Sentry plugin

**Environment Variables:**

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=church-connect-hub
```

**Free Tier:** 5,000 errors/month - plenty for pilot

**Verification:**

1. Deploy to Vercel with Sentry configured
2. Trigger a test error: `throw new Error('Sentry test')`
3. Confirm it appears in Sentry dashboard

---

### 1.2 Production Database Migrations

**Why:** `prisma db push` is for development. It can:

- Drop columns with data
- Reset tables unexpectedly
- Create inconsistent states

**The Fix:** Use `prisma migrate` for production

**Migration Workflow:**

```bash
# Development: Create migration files
pnpm prisma migrate dev --name descriptive_name

# This creates: prisma/migrations/TIMESTAMP_descriptive_name/migration.sql

# Production: Apply migrations (Vercel build command)
pnpm prisma migrate deploy
```

**Vercel Build Command Update:**

```json
// In Vercel project settings or vercel.json
{
  "buildCommand": "pnpm prisma generate && pnpm prisma migrate deploy && pnpm build"
}
```

**First Migration Setup:**

```bash
# Create baseline from current schema
pnpm prisma migrate dev --name initial_baseline

# Commit the migrations folder
git add prisma/migrations
git commit -m "chore: add prisma migrations baseline"
```

**Important:** After this, NEVER use `db push` on production database.

---

### 1.3 Security Audit - OTP Logging

**Why:** Your docs flag this: OTP codes are logged in development. This is a security risk if logging is enabled in production.

**Location:** `lib/auth.ts` lines ~105-142

**The Fix:**

```typescript
// Before (dangerous)
console.log(`OTP Code: ${code}`);

// After (safe)
if (process.env.NODE_ENV === "development") {
  console.log(`[DEV ONLY] OTP Code: ${code}`);
}
// OR just remove entirely for production
```

**Verification:**

1. Search codebase: `grep -r "console.log" lib/auth.ts`
2. Remove or gate all OTP-related logging
3. Deploy and verify no OTP codes in Vercel logs

---

### 1.4 Resend Email Domain Verification

**Why:** Resend requires domain verification to send to any email address. Without it, you can only send to verified test emails.

**Current State:** Using `onboarding@resend.dev` (sandbox)

**The Fix:**

1. Add DNS records to your domain (provided by Resend)
2. Update `RESEND_FROM_EMAIL` to use your domain
3. Verify domain in Resend dashboard

**Example:**

```env
# Before
RESEND_FROM_EMAIL=onboarding@resend.dev

# After
RESEND_FROM_EMAIL=hello@churchconnecthub.com
```

---

## Phase 2: Pre-Scale (Before 10 Churches)

**Goal:** Infrastructure that doesn't break under load

### 2.1 Uptime Monitoring

**Why:** Know when your app is down before customers tell you

**Options (all have free tiers):**

| Service          | Free Tier                 | Recommendation   |
| ---------------- | ------------------------- | ---------------- |
| Better Uptime    | 10 monitors, 3-min checks | Best free option |
| UptimeRobot      | 50 monitors, 5-min checks | Also good        |
| Vercel Analytics | Built-in                  | Already included |

**Setup (10 minutes):**

1. Create account at betteruptime.com
2. Add monitor for your production URL
3. Configure alert (email/SMS) for downtime
4. Add status page (optional but professional)

---

### 2.2 Database Connection Pooling

**Why:** Serverless functions open new database connections on each request. Without pooling, you'll exhaust database connections under load.

**Neon already provides this!** Make sure you're using the pooled connection string:

```env
# Regular connection (for migrations)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"

# Pooled connection (for app queries)
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/db?sslmode=require&pgbouncer=true"
```

**Prisma Configuration:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED") // For migrations
}
```

---

### 2.3 Database Backups

**Why:** Neon has point-in-time recovery, but you should understand it

**Neon Free Tier:** 7 days of history
**Neon Pro:** 30 days of history

**Verification:**

1. Log into Neon dashboard
2. Confirm your branch has history enabled
3. Practice restoring to a point in time (on a test branch)

---

## Phase 3: Nice-to-Have (When You Have Time)

### 3.1 Automated CI Gate (GitHub Actions)

**Why:** Currently quality depends on developers running `/feature-wrap-up`. An automated gate prevents bad merges even if someone forgets.

**Create `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install

      - run: pnpm prisma generate

      - run: pnpm build

      - run: pnpm lint
```

**This runs automatically on every PR.** Red check = can't merge.

**Cost:** Free for public repos, 2,000 minutes/month for private

---

### 3.2 E2E Tests in CI

**Why:** Catch regressions before they hit production

**Add to CI workflow:**

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v2
      with:
        version: 8

    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: "pnpm"

    - run: pnpm install

    - run: pnpm prisma generate

    - run: npx playwright install --with-deps

    - run: pnpm test:e2e
      env:
        DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

---

### 3.3 Feature Flags

**Why:** Ship code to production without exposing it to users. Useful for:

- A/B testing
- Gradual rollouts
- Kill switches for broken features

**Options:**

| Service            | Free Tier    | Notes              |
| ------------------ | ------------ | ------------------ |
| Vercel Edge Config | Included     | Simple key-value   |
| LaunchDarkly       | 1,000 MAU    | Full featured      |
| Flagsmith          | 50k requests | Open source option |

**Recommendation:** Don't add until you need it. Your worktree approach handles feature isolation for now.

---

## Checklist Summary

### Before Pilot Launch (Week of Jan 2026)

- [ ] Sentry error monitoring configured
- [ ] Prisma migrations set up (stop using db push)
- [ ] OTP logging removed from production
- [ ] Resend domain verified
- [ ] RESEND_FROM_EMAIL updated

### Before Scaling (10+ Churches)

- [ ] Uptime monitoring active
- [ ] Database pooling confirmed
- [ ] Backup/recovery understood

### Nice-to-Have

- [ ] GitHub Actions CI
- [ ] E2E tests in CI
- [ ] Feature flags (if needed)

---

## Quick Reference

| Task              | Time   | Difficulty | Impact |
| ----------------- | ------ | ---------- | ------ |
| Sentry setup      | 30 min | Easy       | High   |
| Prisma migrations | 1 hour | Medium     | High   |
| OTP logging fix   | 15 min | Easy       | High   |
| Resend domain     | 30 min | Easy       | Medium |
| Uptime monitoring | 10 min | Easy       | Medium |
| GitHub Actions CI | 30 min | Easy       | Medium |
| Database pooling  | 15 min | Easy       | High   |

---

**Document Created:** 2025-12-18
**Last Updated:** 2025-12-18
**Related:** [PLAYBOOK.md](../PLAYBOOK.md), [testing-strategy.md](./testing-strategy.md)
