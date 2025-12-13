# Tech Debt - Production Blockers

**Status:** 🟢 **Phase 1.5 Complete** - Caching deferred to scale
**Worktree:** `/church-connect-hub/tech-debt`
**Branch:** `feature/tech-debt`
**Last Updated:** 2025-12-12

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

## 🟢 Phase 1.5: S3 Architecture (COMPLETE)

**Completed:** PR #62 (Dec 9, 2025)

### S3 Storage Improvements

| Fix                       | Description                                                      | Status |
| ------------------------- | ---------------------------------------------------------------- | ------ |
| Path inconsistency        | `s3-cleanup.ts` now uses `organizations/{slug}` consistently     | [x]    |
| VolunteerDocument URL→Key | Migrated from storing full URLs to S3 keys                       | [x]    |
| Export expiration         | Added 30-day auto-expiration to DataExport with cleanup function | [x]    |

**Files Changed:**

- `lib/s3-cleanup.ts` - Fixed path patterns, added `cleanupExpiredExports()`
- `lib/S3Client.ts` - Added `getS3Url()` and `getS3Key()` helpers
- `prisma/schema.prisma` - `fileUrl` → `fileKey`, added `expiresAt`
- `actions/volunteers/onboarding.ts` - Updated to use `fileKey`
- `actions/export/create-export.ts` - Added 30-day expiration

**Documentation:** See `/docs/features/tech-debt/s3-enterprise-architecture-plan.md` for full enterprise S3 strategy (deferred UUID migration to 500+ churches scale).

---

## 🟠 Phase 2: Performance (HIGH)

**Fix after production blockers, before scaling.**

### 5. Caching Strategy

**Current State:** React `cache()` deduplicates within single request only. Every new page load = fresh DB queries.

**Impact:** Every request hits database (3 queries per dashboard page load)
**Risk:** Slow performance at scale, high database costs

**Status:** [ ] Deferred - Document gameplan, implement when scaling

---

#### When to Implement

**Trigger Points (implement when ANY is true):**

- [ ] 100+ active users
- [ ] 500+ daily dashboard requests
- [ ] Average page load > 500ms
- [ ] Database costs exceed $50/month
- [ ] Preparing for 10+ church pilot

**Current Reality:** <10 churches, <100 users. Neon is fast enough. Ship MVP first.

---

#### Implementation Gameplan

**Technology:** Upstash Redis (serverless, HTTP-based, Vercel-native)

**Install:**

```bash
pnpm add @upstash/redis
```

**Environment Variables:**

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Create Cache Utility:** `lib/cache.ts`

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
```

---

#### What to Cache

| Data                 | Key Pattern                   | TTL    | Invalidate When                |
| -------------------- | ----------------------------- | ------ | ------------------------------ |
| Organization by slug | `org:slug:{slug}`             | 5 min  | Org settings updated           |
| User permissions     | `user:perms:{userId}:{orgId}` | 2 min  | Role changed, location changed |
| Location list        | `org:locations:{orgId}`       | 10 min | Location added/removed         |

**Hot Path (3 queries per page load):**

```
app/data/dashboard/require-dashboard-access.ts
├── getOrganizationBySlug(slug)      → Cache: org:slug:{slug}
├── prisma.user.findUnique(userId)   → Cache: user:perms:{userId}:{orgId}
└── prisma.member.findUnique(...)    → Combined with user cache
```

---

#### Cache Invalidation Points

Add cache invalidation to these server actions:

| Action                          | Cache Keys to Invalidate                   |
| ------------------------------- | ------------------------------------------ |
| Update organization settings    | `org:slug:{slug}`, `org:locations:{orgId}` |
| Change user role                | `user:perms:{userId}:*`                    |
| Add/remove location             | `org:locations:{orgId}`                    |
| Update user location assignment | `user:perms:{userId}:{orgId}`              |

---

#### Expected Results

| Metric                | Before Cache        | After Cache                 |
| --------------------- | ------------------- | --------------------------- |
| Queries per page load | 3                   | 0-1 (cache hit)             |
| Dashboard latency     | 100-300ms           | 20-50ms                     |
| DB load at 1000 users | 30K queries/day     | 3K queries/day              |
| Monthly cost          | Scales with traffic | Fixed + $0.20/100K requests |

---

### 6. No Data Abstraction

**Impact:** 113 files import Prisma directly
**Risk:** Can't switch databases, tight coupling

**Strategy:**

- Create repository pattern
- Abstract data access
- Enable future database flexibility

**Status:** [ ] Deferred (implement only if switching databases)

---

## 🟡 Phase 3: Code Quality (MEDIUM)

**Fix when time permits.**

### 7. Type Safety Violations

**Pattern:** `as never` casts throughout codebase
**Risk:** Runtime errors, silent failures

**The Problem:**

```typescript
// BAD - bypasses all type checking
validationIssues: result.issues as never,
extractedData: z.any().nullable(),  // Accepts anything - security risk!
```

**The Fix (Industry Standard):**

1. **Created branded types for Prisma Json fields** (`lib/prisma/json-types.ts`):

   - `ValidationIssuesJson` - type-safe validation issues
   - `DuplicateMarkerJson` - type-safe duplicate markers
   - Converter functions with runtime validation

2. **Replaced `z.any()` with strict schema** (`lib/zodSchemas.ts`):

   - `extractedDataSchema` with size limits on all fields
   - Prevents storage exhaustion attacks
   - Compile-time type inference

3. **Added JSON size validation** (`lib/prisma/json-types.ts`):

   - `validateJsonSize()` - prevents >1MB payloads
   - `validateJsonDepth()` - prevents deep nesting attacks
   - Monitoring for large payloads

4. **Data normalization at boundaries** (`upload-client.tsx`):
   - `normalizeExtractedData()` - coerces AI responses to typed schema

**Files Fixed:**

- [x] `lib/zodSchemas.ts` - strict `extractedDataSchema`
- [x] `lib/prisma/json-types.ts` - NEW: branded types + converters
- [x] `actions/connect-card/save-connect-card.ts` - uses type-safe converters
- [x] `actions/connect-card/mark-duplicate.ts` - uses type-safe converters
- [x] `app/church/[slug]/admin/connect-cards/upload/upload-client.tsx` - normalizes AI data

**Status:** [x] Complete

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

| Phase | Issue                | Status | PR                |
| ----- | -------------------- | ------ | ----------------- |
| 1     | Subscription bypass  | [x]    | -                 |
| 1     | PII in logs          | [x]    | -                 |
| 1     | Missing indexes      | [x]    | -                 |
| 1     | No pagination        | [x]    | #42               |
| 1.5   | S3 path consistency  | [x]    | #62               |
| 1.5   | S3 URL→Key migration | [x]    | #62               |
| 1.5   | Export expiration    | [x]    | #62               |
| 2     | Caching              | ⏸️     | Deferred to scale |
| 2     | Data abstraction     | ⏸️     | Deferred to scale |
| 3     | Type safety          | [x]    | -                 |
| 3     | Error swallowing     | [ ]    | -                 |
| 3     | Component cleanup    | [ ]    | -                 |

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

**Last Updated:** 2025-11-30
