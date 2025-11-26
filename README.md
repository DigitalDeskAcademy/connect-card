# Tech-Debt Worktree - Security Fixes & Code Quality

**Feature Branch:** `feature/tech-debt`
**Database:** Shared with main (no schema changes)
**Dev Server:** http://localhost:3000

⚠️ **Purpose:** Fix critical security vulnerabilities and high-priority code quality issues identified in the 2025-11-21 codebase audit.

---

## 🚨 Critical Security Fixes

This worktree addresses:

1. **CRITICAL-001:** Multi-tenant data isolation bug in remove-member.ts
2. **CRITICAL-002:** PII logging to production monitoring systems (13 files)
3. **CRITICAL-003:** Volunteer creation accepts user input for organizationId
4. **CRITICAL-004:** Missing organizationId filters in volunteer queries
5. **HIGH-001:** Validation errors leak schema details to clients
6. **HIGH-002:** Permission errors expose permission system structure

**See:** `.worktree/tech-debt/docs/planning.md` for complete fix list

---

## Quick Start

```bash
# Navigate to worktree
cd /home/digitaldesk/Desktop/connect-card/tech-debt

# Start dev server
pnpm dev

# Run tests
pnpm test:e2e

# Build verification
pnpm build
```

---

## Development Documentation (Gitignored)

**Location:** `.worktree/tech-debt/docs/`

- **planning.md** - Security fixes checklist, affected files
- **implementation.md** - Fix patterns, code changes, challenges
- **testing.md** - E2E tests, manual testing, security verification
- **decisions.md** - Why we chose specific approaches
- **integration-checklist.md** - Pre-merge verification steps

**Note:** These docs are gitignored and stay local to this worktree (no merge conflicts).

---

## Core Documentation (Main Worktree - SSoT)

Reference docs from main (shared across all worktrees):

- **Codebase Audit:** ../main/docs/technical/codebase-audit-2025-11-21.md
- **Coding Patterns:** ../main/docs/essentials/coding-patterns.md
- **Architecture:** ../main/docs/essentials/architecture.md
- **ADRs:** ../main/docs/technical/architecture-decisions.md

---

## Database Configuration

⚠️ **Shared Database:** This worktree shares the main database

**Why?**

- Bug fixes only (no schema changes)
- Faster iteration on security fixes
- Test against real data structure

**Connection:**

```
Database: neondb (shared with main)
Provider: Neon PostgreSQL
SSL: Required
```

**If you need schema changes:** Create a new feature worktree with isolated database.

---

## Git Commands

```bash
# Check current branch
git branch --show-current

# Commit changes (one commit per CRITICAL fix)
git add .
git commit -m "fix(security): description (CRITICAL-001)"

# Push to remote
git push origin feature/tech-debt

# Pull latest from main
git pull origin main
```

---

## Testing Commands

```bash
# Build verification (must pass before merge)
pnpm build

# TypeScript checks (must be clean)
pnpm tsc --noEmit

# ESLint (should show ZERO console warnings)
pnpm lint

# E2E tests (multi-tenant isolation tests)
pnpm test:e2e

# Security verification (zero results expected)
grep -r "console\\.log\|console\\.error" actions/ app/api/
grep -r "validatedData\\.organizationId" actions/
```

---

## Files to Modify (13+)

### Server Actions

- `actions/team/remove-member.ts` (CRITICAL-001)
- `actions/team/update-member.ts` (HIGH-002)
- `actions/volunteers/volunteers.ts` (CRITICAL-003)
- `actions/volunteers/skills.ts` (CRITICAL-004)
- `actions/volunteers/availability.ts` (CRITICAL-004)
- `actions/connect-card/save-connect-card.ts` (CRITICAL-002)
- `actions/connect-card/update-connect-card.ts` (HIGH-001)
- `actions/prayer-requests/create-prayer-request.ts` (CRITICAL-002)
- `actions/prayer-requests/toggle-privacy.ts` (HIGH-002)
- (See planning.md for complete list)

### API Routes

- `app/api/connect-cards/extract/route.ts` (CRITICAL-002)
- `app/api/test/auth/bypass/route.ts` (review security)

---

## Fix Patterns to Follow

### Multi-Tenant Isolation (CRITICAL-001)

**Before:**

```typescript
await prisma.user.update({
  where: { id: memberId }, // ❌ Missing org check
  data: { organizationId: null },
});
```

**After:**

```typescript
await prisma.user.update({
  where: {
    id: memberId,
    organizationId: organization.id, // ✅ Required
  },
  data: { organizationId: null },
});
```

### Remove PII Logging (CRITICAL-002)

**Before:**

```typescript
console.error("Validation failed:", validation.error.errors);
```

**After:**

```typescript
// ✅ Remove console statement entirely
return { status: "error", message: "Invalid form data" };
```

### Organization Context (CRITICAL-003)

**Before:**

```typescript
organizationId: validatedData.organizationId; // ❌ From user input
```

**After:**

```typescript
organizationId: organization.id; // ✅ From auth context
```

---

## Merge Strategy

✅ **Single PR with all security fixes**

**Commit Structure:**

```
fix(security): add organizationId to remove-member WHERE clause (CRITICAL-001)
fix(security): remove PII logging from 13 files (CRITICAL-002)
fix(security): use auth context for volunteer organizationId (CRITICAL-003)
fix(security): add organizationId to volunteer queries (CRITICAL-004)
fix(security): generic validation error messages (HIGH-001)
fix(security): standardize permission error messages (HIGH-002)
```

**Pre-Merge Checklist:** See `.worktree/tech-debt/docs/integration-checklist.md`

---

## Notes

- **Isolated worktree** - Changes won't affect main until merged
- **Shared database** - Use caution with data modifications
- **Gitignored dev docs** - .worktree/ never commits to git
- **Clean merges** - Only code merges to main, dev docs stay local

---

**Created:** 2025-11-21
**Audit Reference:** docs/technical/codebase-audit-2025-11-21.md
**Estimated Fix Time:** 6-9 hours (2-3h CRITICAL + 4-6h HIGH)
