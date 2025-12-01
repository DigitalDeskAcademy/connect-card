# Tech Debt - Production Blockers

**Status:** 🟢 **Phase 1 Complete** - Ready for Phase 2
**Worktree:** `/church-connect-hub/tech-debt`
**Branch:** `feature/tech-debt`
**Last Updated:** 2025-11-28

---

## 🎯 Purpose

This worktree handles **global, cross-cutting technical issues** that affect the entire platform. These are NOT feature-specific - they impact all features equally.

**Rule:** If it touches multiple features or is infrastructure-level, it belongs here.

---

## 🚨 Phase 1: Production Blockers (CRITICAL)

**These MUST be fixed before any church uses this in production.**

### 1. Subscription Bypass

**File:** `app/data/dashboard/require-dashboard-access.ts:175-181`
**Impact:** Churches can use the platform free forever
**Risk:** Revenue = $0

**The Bug:**

```typescript
// CURRENT: Subscription check happens AFTER role check returns
// Churches with expired subscriptions still get full access
```

**The Fix:**

```typescript
// Move subscription check BEFORE role returns
if (!["ACTIVE", "TRIAL"].includes(organization.subscriptionStatus)) {
  return redirect(`/church/${slug}/subscription-expired`);
}
// THEN check roles...
```

**Status:** [x] Complete (subscription check at lines 114-121)

---

### 2. PII in Logs

**Files:** 20+ server actions with `console.error()` and `console.log()`
**Impact:** Personal data (emails, phones, prayer requests) logged to Vercel
**Risk:** GDPR fines up to $20M, trust destruction

**The Bug:**

```typescript
// Found throughout server actions:
console.error("Failed to save:", error); // May contain PII
console.log("Data:", extractedData); // Contains PII
```

**The Fix:**

```typescript
// DELETE all console.log/error with data
// Use structured logging without PII if needed
// Return generic error messages to client
```

**Files to audit:**

- [x] `/actions/connect-card/*.ts`
- [x] `/actions/prayer-requests/*.ts`
- [x] `/actions/volunteers/*.ts`
- [x] `/actions/team/*.ts`
- [x] `/app/api/**/*.ts` (only test routes have logging)

**Status:** [x] Complete (all server actions cleaned)

---

### 3. Missing Database Indexes

**File:** `prisma/schema.prisma`
**Impact:** Queries slow down exponentially as data grows
**Risk:** Unusable at 10K records

**Required Indexes:**

```prisma
// ConnectCard - most queried table
@@index([organizationId, scannedAt(sort: Desc)])
@@index([organizationId, status])
@@index([batchId])

// PrayerRequest
@@index([organizationId, status])
@@index([organizationId, createdAt(sort: Desc)])
@@index([assignedToId])

// Volunteer
@@index([organizationId, status])
@@index([organizationId, category])

// User
@@index([organizationId])
@@index([email])
```

**Status:** [x] Complete (20+ indexes added to schema.prisma)

---

### 4. No Pagination

**Files:** All `/lib/data/*.ts` files with `findMany()`
**Impact:** Out of memory crash when data grows
**Risk:** Platform crashes at ~200 users

**The Bug:**

```typescript
// CURRENT: Fetches ALL records
const cards = await prisma.connectCard.findMany({
  where: { organizationId },
});
```

**The Fix:**

```typescript
// Add pagination to EVERY list query
const cards = await prisma.connectCard.findMany({
  where: { organizationId },
  take: 50, // Default page size
  skip: offset, // Pagination offset
  orderBy: { createdAt: "desc" },
});
```

**Files to fix:**

- [x] `/lib/data/connect-card-analytics.ts`
- [x] `/lib/data/connect-card-batch.ts`
- [x] `/lib/data/connect-card-review.ts`
- [x] `/lib/data/prayer-requests.ts`
- [x] `/lib/data/volunteers.ts`
- [x] `/lib/data/shifts.ts`
- [x] `/lib/data/serving-opportunities.ts`

**Status:** [x] Complete (all queries have `take:` limits - PR #42)

---

## 🟠 Phase 2: Performance (HIGH)

**Fix after production blockers, before scaling.**

### 5. No Caching

**Impact:** Every request hits database
**Risk:** Slow performance, high database costs

**Strategy:**

- Add Redis/Upstash for hot data
- Cache organization settings
- Cache user permissions
- Cache navigation config

**Status:** [ ] Not started

---

### 6. No Data Abstraction

**Impact:** 113 files import Prisma directly
**Risk:** Can't switch databases, tight coupling

**Strategy:**

- Create repository pattern
- Abstract data access
- Enable future database flexibility

**Status:** [ ] Not started (defer until scale)

---

## 🟡 Phase 3: Code Quality (MEDIUM)

**Fix when time permits.**

### 7. Type Safety Violations

**Pattern:** `as never` casts throughout codebase
**Risk:** Runtime errors, silent failures

**Status:** [ ] Not started

---

### 8. Silent Error Swallowing

**Pattern:** Empty catch blocks
**Risk:** Can't debug production issues

```typescript
// BAD - found throughout codebase
try {
  await doSomething();
} catch (e) {
  // Silent failure - no logging, no error handling
}
```

**Status:** [ ] Not started

---

### 9. Component Organization Cleanup

**Pattern:** Misplaced components violating Single Use = Colocate rule
**Risk:** Code discoverability, import confusion, duplication

**Components to migrate:**

| Component          | From                                   | To                                 | Reason                  |
| ------------------ | -------------------------------------- | ---------------------------------- | ----------------------- |
| `UserDropdown`     | `app/(public)/_components/`            | `/components/shared/`              | Used by 2+ navbars      |
| `LoginForm`        | `app/(auth)/login/_components/`        | `/components/shared/`              | Used by 2 login pages   |
| `TrendBadge`       | `app/church/[slug]/admin/_components/` | `/components/dashboard/analytics/` | Generic, reusable       |
| `ConnectCardChart` | `app/church/[slug]/admin/_components/` | `/components/dashboard/analytics/` | Generic chart component |
| `AgencyNavbar`     | `app/church/_components/`              | `/components/layout/`              | Shared layout component |

**Convention documented in:** `docs/PLAYBOOK.md` (Component Organization section)

**Status:** [ ] Not started

---

## 📊 Progress Tracking

| Phase | Issue               | Status | PR  |
| ----- | ------------------- | ------ | --- |
| 1     | Subscription bypass | [x]    | -   |
| 1     | PII in logs         | [x]    | -   |
| 1     | Missing indexes     | [x]    | -   |
| 1     | No pagination       | [x]    | #42 |
| 2     | No caching          | [ ]    | -   |
| 2     | No data abstraction | [ ]    | -   |
| 3     | Type safety         | [ ]    | -   |
| 3     | Error swallowing    | [ ]    | -   |
| 3     | Component cleanup   | [ ]    | -   |

---

## 🔄 Workflow

1. Work in `tech-debt` worktree
2. Create branch per fix (e.g., `fix/subscription-bypass`)
3. Fix → Test → PR to main
4. Update this doc with [x] and PR link
5. Run `/feature-wrap-up` when complete

---

## 📝 Notes

- **DO NOT** add feature work here - features have their own worktrees
- **DO** add any global infrastructure issues discovered
- **DO** update PLAYBOOK.md technical debt register when items complete

---

**Last Updated:** 2025-11-28
