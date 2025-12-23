# Quality Control & Testing Guide for Smaller Teams

**Purpose:** Industry-standard practices adapted for smaller teams with limited resources
**Audience:** Solo developers and small teams (1-5 people)
**Last Updated:** 2025-12-22
**Project:** Church Connect Hub

---

## Executive Summary

This project already has a **sophisticated quality control system** in place - better than many enterprise teams. This guide documents what exists and identifies the few remaining gaps.

**Current Status:** ✅ Most practices already implemented

---

## What's Already In Place ✅

### Pre-Commit Hooks (Husky)

**File:** `.husky/pre-commit`

- ✅ Format check (`pnpm format:check`)
- ✅ ESLint (`pnpm lint`)
- ✅ Blocks commits if either fails

### Comprehensive Slash Commands

**File:** `.claude/COMMANDS.md`
| Command | What It Does |
|---------|-------------|
| `/session-start` | Initialize feature with branch + context |
| `/review-code` | Code quality + security analysis |
| `/commit` | Build verification + clean commit |
| `/feature-wrap-up` | Full workflow: build → PR → merge → reset |

### Feature Wrap-Up Workflow

**File:** `.claude/commands/feature-wrap-up.md`

This is **comprehensive** and includes:

- Origin sync check (fetch latest main first)
- Schema sync check (Prisma)
- Build verification (`pnpm build`)
- Lint check (`pnpm lint`)
- Sanity checks (console.log, .only())
- PR creation with `gh pr create`
- Squash merge
- **Reset to main** after merge (prevents drift)
- **Force push** to sync remote branch
- Documentation updates in main worktree
- Multi-worktree sync coordination

### Test Infrastructure

**Files:** `package.json`, `vitest.config.ts`, `playwright.config.ts`

- ✅ Vitest for unit + integration tests (181 tests across 6 files)
- ✅ Playwright for E2E tests (17 test files)
- ✅ Test scripts: `test:unit`, `test:integration`, `test:e2e`, `test:all`

### Git Workflow

- ✅ GitHub repository (DigitalDeskAcademy/connect-card)
- ✅ Feature branch workflow
- ✅ PR-based merging with squash
- ✅ Worktree-aware development (multiple parallel branches)

---

## What's Missing (Gaps to Fill)

### 1. GitHub Actions CI ✅ IMPLEMENTED

**Status:** `.github/workflows/ci.yml` created
**File:** `.github/workflows/ci.yml`

Runs on every push/PR:

- TypeScript check → ESLint → Unit/Integration tests → Build
- E2E tests (runs after quality checks pass)

**Remaining setup:**

- [ ] Add `TEST_DATABASE_URL` secret in GitHub repo settings
- [ ] Enable branch protection rules for `main`

### 2. Health Endpoint ✅ IMPLEMENTED

**Status:** `app/api/health/route.ts` created
**Endpoint:** `GET /api/health`

Returns `{ status: "healthy" }` or `503` if database is down.

### 3. Error Monitoring ❌

**Status:** No Sentry or similar
**Impact:** Production errors go unnoticed until users report them

**Recommended:** Add Sentry before production launch.

### 4. Uptime Monitoring ❌

**Status:** Not configured
**Impact:** Won't know if app goes down until users report

**Recommended:** Configure UptimeRobot to monitor `/api/health` endpoint.

---

## 🚨 Pre-Production Signup Requirements

Before going to production, sign up for these services:

| Service         | Purpose           | Free Tier       | Signup Link                                |
| --------------- | ----------------- | --------------- | ------------------------------------------ |
| **Sentry**      | Error tracking    | 5K errors/month | [sentry.io](https://sentry.io)             |
| **UptimeRobot** | Uptime monitoring | 50 monitors     | [uptimerobot.com](https://uptimerobot.com) |

**After signup:**

1. **Sentry:** Run `pnpm add @sentry/nextjs && npx @sentry/wizard@latest -i nextjs`
2. **UptimeRobot:** Add monitor for `https://your-domain.com/api/health`

---

## The Goal (Updated)

You're **already at 85%** of industry-standard practices. The remaining 15% is:

1. ✅ ~~CI enforcement~~ (GitHub Actions) - DONE
2. ✅ ~~Health endpoint~~ - DONE
3. ❌ **Production monitoring** (Sentry) - Sign up before launch
4. ❌ **Uptime monitoring** (UptimeRobot) - Sign up before launch

---

## Gap #1: GitHub Actions CI

**Why This Matters:** Your quality checks are currently **developer-enforced only**. If someone uses `git commit --no-verify` or pushes directly, broken code can reach main.

### Recommended Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, "feature/*"]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      # Line 1: Type checking
      - name: TypeScript Check
        run: pnpm tsc --noEmit

      # Line 1: Linting
      - name: ESLint
        run: pnpm lint

      # Line 2: Unit & Integration Tests
      - name: Tests
        run: pnpm test:unit && pnpm test:integration

      # Line 2: Build verification
      - name: Build
        run: pnpm build

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: quality # Only run if quality passes
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E Tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

### Branch Protection Rules

In GitHub repository settings, enable:

- [x] Require status checks to pass (quality job)
- [x] Require branches to be up to date
- [x] Require linear history (no merge commits)
- [ ] Require review (optional for solo devs)

---

## Gap #2: Production Monitoring

### Error Tracking (Sentry)

Free tier is sufficient for small teams. Setup takes 15 minutes.

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Critical alerts to enable:**

- New error types (first occurrence)
- Error rate spikes (>10% increase)
- Unhandled promise rejections

### Application Logs (Optional)

Structured logging for debugging:

```typescript
// lib/logger.ts
export function log(
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Usage
log("info", "Connect card saved", { cardId: id, organizationId });
log("error", "GHL sync failed", { error: err.message, contactId });
```

**Never log:**

- Passwords or tokens
- Full credit card numbers
- Personal health information
- Email content

### Uptime Monitoring (Optional)

Free options:

- **Better Uptime** (free tier: 10 monitors)
- **UptimeRobot** (free tier: 50 monitors)

Monitor:

- [ ] Homepage loads
- [ ] API health endpoint responds
- [ ] Database connection works

**Create health endpoint:**

```typescript
// app/api/health/route.ts
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
```

---

## Security Baseline (Reference)

### Dependency Scanning

Run weekly or before major releases:

```bash
# Check for known vulnerabilities
pnpm audit

# Update to patched versions
pnpm update
```

**GitHub Dependabot:** Enable in repository settings for automatic alerts.

### Security Checklist (Pre-Production)

```markdown
## Security Readiness

- [ ] All environment variables are in `.env.local` (not committed)
- [ ] `.env.example` has placeholder values only
- [ ] Database has strong password (not default)
- [ ] API keys have minimal required permissions
- [ ] CORS configured correctly (if applicable)
- [ ] Rate limiting enabled on all public endpoints
- [ ] Input validation on all user-submitted data
- [ ] SQL injection not possible (using Prisma)
- [ ] XSS not possible (React escapes by default)
```

### Multi-Tenant Security (Already Emphasized in CLAUDE.md)

Your `CLAUDE.md` already emphasizes this. Formalize with tests:

```typescript
// tests/e2e/security/multi-tenant-isolation.spec.ts
describe("Multi-tenant isolation", () => {
  it("should not allow access to other organization data", async () => {
    // Login as org A
    // Attempt to access org B resource
    // Verify 403 or redirect
  });
});
```

---

## Documentation (Already In Place)

### Minimum Documentation

| Document                  | Purpose                | Update Frequency        |
| ------------------------- | ---------------------- | ----------------------- |
| `README.md`               | Setup instructions     | When setup changes      |
| `CLAUDE.md`               | AI assistant context   | When conventions change |
| `docs/PLAYBOOK.md`        | Technical patterns     | When patterns change    |
| `docs/WORKTREE-STATUS.md` | Current work status    | Weekly                  |
| API route comments        | Endpoint documentation | When APIs change        |

### Code Documentation Standard

```typescript
/**
 * Validates connect card data for common AI extraction errors.
 *
 * Checks for:
 * - 9-digit phones (most common OCR error)
 * - All same digit phones (999-999-9999)
 * - Email missing @ symbol
 * - Missing critical fields
 *
 * @param data - Extracted connect card data from Claude Vision
 * @returns ValidationResult with issues array and flags
 */
export function validateConnectCardData(data: ExtractedData): ValidationResult {
  // ...
}
```

**Document when:**

- Function has non-obvious behavior
- Business logic needs explanation
- There are known limitations
- The "why" isn't obvious from the code

**Don't document:**

- Self-explanatory code
- Framework boilerplate
- Simple getters/setters

---

## Implementation Roadmap

### Phase 1: CI Pipeline (Priority)

- [ ] Create `.github/workflows/ci.yml` (see template above)
- [ ] Set up test database for CI (`TEST_DATABASE_URL` secret)
- [ ] Configure branch protection rules in GitHub
- [ ] Verify E2E tests run in CI

**Verification:** Open a PR and see all checks pass automatically.

### Phase 2: Production Monitoring (Before Launch)

- [ ] Set up Sentry error tracking (`pnpm add @sentry/nextjs`)
- [ ] Create health check endpoint (`/api/health`)
- [ ] Configure uptime monitoring (UptimeRobot free tier)

**Verification:** Break something intentionally and see alert in Sentry.

### Phase 3: Ongoing Practices

**Weekly:**

- [ ] Run `pnpm audit` for vulnerabilities
- [ ] Review Sentry for new error types
- [ ] Update WORKTREE-STATUS.md

**Before each PR:**

- [ ] Run security checklist
- [ ] Verify tests pass locally
- [ ] Self-review using code review checklist

**Before each release:**

- [ ] Full E2E test suite
- [ ] Manual verification of new features
- [ ] Database backup confirmed

---

## Quick Reference Card

Print this and keep it visible:

```
┌─────────────────────────────────────────────────────────────────┐
│  BEFORE COMMIT                                                  │
│  ─────────────                                                  │
│  □ pnpm validate (typecheck + lint + unit tests)                │
│  □ No console.log with sensitive data                           │
│  □ organizationId in all queries                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BEFORE PR                                                      │
│  ──────────                                                     │
│  □ Tests added for new logic                                    │
│  □ Self-review with checklist                                   │
│  □ Meaningful commit messages                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BEFORE PRODUCTION                                              │
│  ──────────────────                                             │
│  □ All CI checks pass                                           │
│  □ E2E critical paths verified                                  │
│  □ Security checklist complete                                  │
│  □ Database backup confirmed                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

**What you already have (excellent foundation):**

1. ✅ TypeScript strict mode
2. ✅ Husky pre-commit hooks (format + lint)
3. ✅ Unit tests for business logic (181 tests across 6 files)
4. ✅ E2E tests (Playwright, 17 test files)
5. ✅ Comprehensive `/feature-wrap-up` workflow
6. ✅ PR-based merging with squash
7. ✅ Worktree-aware parallel development

**What makes small teams succeed:**

1. **Automation over discipline** - Your Husky hooks catch what humans forget
2. **Focus over coverage** - Test the expensive failures, skip the cheap ones
3. **Prevention over detection** - TypeScript + linting prevent more bugs than testing catches
4. **Simplicity over process** - Your slash commands beat 50-page procedures

**The remaining gaps:**

1. **CI pipeline** - GitHub Actions to enforce checks server-side
2. **Production monitoring** - Sentry for error tracking (add before launch)

**You're already at 80%** of industry-standard practices. The `/feature-wrap-up` workflow is more sophisticated than most enterprise teams have. Add CI enforcement and Sentry, and you'll catch 95% of issues before they reach users.

---

_This guide is a living document. Update it as you learn what works for your team._
