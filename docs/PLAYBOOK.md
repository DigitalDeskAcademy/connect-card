# Engineering Playbook - Single Source of Truth

**Purpose:** THE authoritative guide for building Church Connect Hub. If there's a conflict, this document wins.
**Status:** 🔴 **NOT PRODUCTION READY** - Critical blockers exist
**Health Score:** 62/100 (D+)
**Last Updated:** 2025-11-25 (via feature-wrap-up)
**Applies To:** All worktrees, all features, all developers

> ⚠️ **This is the law.** When in doubt, follow this document. All other docs are supplementary.

---

## 🚨 STOP - Read This First

**The platform will CRASH in production without these fixes:**

1. **No pagination** → Out of memory at 200 users [[Fix]](#emergency-fix-1-pagination)
2. **Subscription bypass** → Churches use free forever [[Fix]](#emergency-fix-2-revenue)
3. **PII in logs** → GDPR fines up to $20M [[Fix]](#emergency-fix-3-compliance)

**DO NOT SHIP TO PRODUCTION** until Phase 1 is complete.

---

## 🎯 Quick References

| What You Need               | Where To Find It                                     |
| --------------------------- | ---------------------------------------------------- |
| **Setup project locally**   | [Development Setup](#development-setup)              |
| **Write a server action**   | [Patterns → Server Actions](#server-actions-pattern) |
| **Add a new feature**       | [How We Build](#how-we-build)                        |
| **Fix performance issue**   | [Performance Fixes](#current-performance-issues)     |
| **Understand architecture** | [System Architecture](#system-architecture)          |
| **Check what's broken**     | [Technical Debt Register](#technical-debt-register)  |

---

## 🏗️ System Architecture

### Tech Stack

- **Framework:** Next.js 15.3 (App Router)
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Auth:** Better Auth (GitHub OAuth + Email OTP)
- **Storage:** Tigris S3
- **AI:** Anthropic Claude Vision API
- **Hosting:** Vercel
- **Rate Limiting:** Arcjet

### Multi-Tenant Architecture

```typescript
// EVERY query must be scoped
where: {
  organizationId: organization.id,  // REQUIRED - No exceptions
  ...locationFilter                 // Multi-campus support
}
```

### Git Worktree Structure

```
/church-connect-hub/
├── .bare/            # Bare repository
├── main/             # Main branch (port 3000)
├── connect-card/     # Feature worktree (port 3001)
├── prayer/           # Feature worktree (port 3002)
├── volunteer/        # Feature worktree (port 3003)
└── tech-debt/        # Tech debt fixes (port 3004)
```

**Each worktree:**

- Separate database (Neon branch)
- Own `node_modules` (no pnpm workspaces)
- Independent `.env.local`

---

## 📋 How We Build

### The Only Patterns That Matter

#### Server Actions Pattern

```typescript
"use server";

export async function actionName(
  slug: string,
  data: SchemaType
): Promise<ApiResponse> {
  // 1. Auth - ALWAYS FIRST
  const { organization } = await requireDashboardAccess(slug);

  // 2. Rate limit - ALWAYS SECOND
  const aj = arcjet.withRule(
    fixedWindow({ mode: "LIVE", window: "1m", max: 5 })
  );
  const decision = await aj.protect(req, { fingerprint: `${userId}_${orgId}` });
  if (decision.isDenied())
    return { status: "error", message: "Rate limit exceeded" };

  // 3. Validate - ALWAYS THIRD
  const validation = schema.safeParse(data);
  if (!validation.success) return { status: "error", message: "Invalid data" };

  // 4. Execute with organizationId - ALWAYS SCOPED
  await prisma.model.create({
    data: { ...validation.data, organizationId: organization.id },
  });

  // 5. Revalidate
  revalidatePath(`/church/${slug}/admin/...`);

  return { status: "success", message: "..." };
}
```

#### Component Organization

```
/components/dashboard/{feature}/     # Shared components
/app/church/[slug]/admin/{feature}/  # Pages only, no _components folders
```

#### Data Access

```typescript
// Direct Prisma is fine for now (technical debt noted)
// ALWAYS include organizationId
const data = await prisma.model.findMany({
  where: { organizationId }, // NEVER FORGET THIS
});
```

---

## 🔥 Production Blockers (Phase 1 - MUST FIX)

### Emergency Fix 1: Pagination

**File:** `/lib/data/*.ts` - All `findMany()` calls
**Time:** 2-3 days

```typescript
// Add to EVERY list query
const items = await prisma.model.findMany({
  take: 50, // DEFAULT LIMIT
  skip: offset,
  // ... rest of query
});
```

### Emergency Fix 2: Revenue

**File:** `/app/data/dashboard/require-dashboard-access.ts:175-181`
**Time:** 30 minutes

```typescript
// Move subscription check BEFORE role returns
if (!["ACTIVE", "TRIAL"].includes(organization.subscriptionStatus)) {
  return redirect(`/church/${slug}/subscription-expired`);
}
// THEN check roles...
```

### Emergency Fix 3: Compliance

**Files:** All server actions with `console.error()`
**Time:** 1 day

```typescript
// DELETE all of these:
console.error("Failed to save:", error); // ❌ REMOVE
console.log("Data:", extractedData); // ❌ REMOVE
```

### Emergency Fix 4: Database Indexes

**File:** `prisma/schema.prisma`
**Time:** 4 hours

```sql
-- Run these migrations
CREATE INDEX idx_card_org_scan ON connect_card(organization_id, scanned_at DESC);
CREATE INDEX idx_prayer_org_status ON prayer_request(organization_id, status);
-- (13 more indexes needed - see register below)
```

---

## 📊 Technical Debt Register

| Priority        | Issue                   | Location                          | Breaking Point     | Fix Time |
| --------------- | ----------------------- | --------------------------------- | ------------------ | -------- |
| 🔴 **CRITICAL** | No pagination           | `/lib/data/*`                     | 200 users          | 2-3 days |
| 🔴 **CRITICAL** | Subscription bypass     | `require-dashboard-access.ts:175` | Day 1              | 30 mins  |
| 🔴 **CRITICAL** | PII in logs             | 20+ server actions                | GDPR audit         | 1 day    |
| 🔴 **CRITICAL** | Missing indexes         | `schema.prisma`                   | 10K records        | 4 hours  |
| 🔴 **CRITICAL** | Race conditions         | `connect-card-batch.ts:72`        | Concurrent uploads | 4 hours  |
| 🟠 **HIGH**     | N+1 queries             | Prayer/volunteer stats            | 100 concurrent     | 2 days   |
| 🟠 **HIGH**     | No caching              | All data fetches                  | Every request      | 2 days   |
| 🟠 **HIGH**     | No data abstraction     | 113 files use Prisma              | Can't switch DB    | 1 week   |
| 🟡 **MEDIUM**   | Type safety violations  | `as never` casts                  | Runtime errors     | 3 days   |
| 🟡 **MEDIUM**   | Silent error swallowing | Empty catch blocks                | Can't debug        | 2 days   |

---

## 🚀 Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL (via Neon)
- pnpm

### Quick Start

```bash
# Clone and setup
git clone [repo]
cd church-connect-hub/main
cp .env.example .env.local

# Install and run
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm seed:all
pnpm dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://..." # Neon connection string
BETTER_AUTH_SECRET="..."        # Auth secret
ANTHROPIC_API_KEY="..."         # Claude Vision API
NEXT_PUBLIC_APP_URL="..."       # App URL
```

---

## ⚠️ Common Pitfalls

### The #1 Mistake: Forgetting organizationId

```typescript
// ❌ WRONG - Data leak waiting to happen
await prisma.connectCard.findMany({ where: { status: "PENDING" } });

// ✅ RIGHT - Always scoped
await prisma.connectCard.findMany({
  where: {
    organizationId: org.id,
    status: "PENDING",
  },
});
```

### The #2 Mistake: No Rate Limiting

```typescript
// ❌ WRONG - DDoS vulnerability
export async function deleteCard(id: string) {
  await prisma.card.delete({ where: { id } });
}

// ✅ RIGHT - Rate limited
export async function deleteCard(id: string) {
  const decision = await aj.protect(req, { fingerprint });
  if (decision.isDenied()) return { status: "error" };
  // ... rest
}
```

### The #3 Mistake: Direct Imports from /app

```typescript
// ❌ WRONG - Circular dependency risk
import { SomeUtil } from "@/app/church/[slug]/utils";

// ✅ RIGHT - Utils in /lib
import { SomeUtil } from "@/lib/utils";
```

---

## 📈 Performance Targets

| Metric                    | Current   | Acceptable | Target |
| ------------------------- | --------- | ---------- | ------ |
| **Dashboard Load**        | 2-5s ❌   | <1s        | <500ms |
| **Connect Card Review**   | 30-60s ❌ | <5s        | <2s    |
| **Concurrent Users**      | 50 ❌     | 500        | 1000+  |
| **Database Queries/Page** | 20-30 ❌  | <10        | <5     |
| **Bundle Size**           | Unknown   | <1MB       | <500KB |

---

## 🔄 Current Performance Issues

### Issue: Dashboard fetches ALL TIME data

**Location:** `/lib/data/connect-card-analytics.ts:80-115`
**Impact:** 40MB+ per load after 1 year
**Fix:** Limit to 4 weeks, use aggregates for totals

### Issue: 8 Sequential COUNT queries

**Location:** `/lib/data/prayer-requests.ts:228-300`
**Impact:** 400ms latency minimum
**Fix:** Single GROUP BY query

### Issue: Raw images in review queue

**Location:** Review queue using `<img>` not `<Image>`
**Impact:** 30-50MB page loads
**Fix:** Use Next.js Image component

---

## 🎨 Code Quality Standards

### What We Care About

- ✅ **Multi-tenant isolation** - Every query filtered
- ✅ **Rate limiting** - Every action protected
- ✅ **Type safety** - No `any`, use Zod schemas
- ✅ **Error handling** - Return ApiResponse, no throws

### What We Don't Care About (Yet)

- ❌ 100% test coverage
- ❌ Perfect DRY (some duplication is OK)
- ❌ Micro-optimizations
- ❌ Complex abstractions

---

## 🚨 When To Stop and Fix

**Drop everything and fix if you see:**

1. **Query without organizationId** - Security breach
2. **Server action without rate limiting** - DDoS vulnerability
3. **Console.log with PII** - Compliance violation
4. **findMany without limit** - Memory bomb
5. **Empty catch block** - Silent failures

---

## 📝 Decision Log

| Date       | Decision                     | Why                            | Impact                 |
| ---------- | ---------------------------- | ------------------------------ | ---------------------- |
| 2025-11-25 | No repository pattern yet    | Ship MVP first, refactor later | Tech debt accepted     |
| 2025-11-25 | Direct Prisma OK for now     | Faster development             | Will refactor at scale |
| 2025-11-25 | Cursor pagination everywhere | Prevent OOM crashes            | All list views         |

---

## 🔧 How to Update This Document

### Automatically Updated

- **After each feature-wrap-up** - New technical debt added
- **After incidents** - New entries in register
- **After performance tests** - Updated metrics

### Manually Update When

- Making architectural decisions
- Changing core patterns
- Discovering critical issues
- Establishing new standards

---

## The Bottom Line

**We have 5 critical issues that WILL crash production.** Fix those first. Everything else is negotiable.

**The order:**

1. Emergency fixes (Phase 1) - Ship or die
2. Performance fixes (Phase 2) - Keep customers
3. Code quality (Phase 3) - Maintain sanity
4. Nice to haves (Phase 4) - When we're profitable

**This document is the law. When in doubt, check here. If it conflicts with other docs, this wins.**

---

_Last audit: 2025-11-25 | Next audit: After Phase 1 completion_
