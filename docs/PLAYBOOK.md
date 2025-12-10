# Engineering Playbook - Single Source of Truth

**Purpose:** THE authoritative guide for building Church Connect Hub. If there's a conflict, this document wins.
**Status:** 🟡 **PRODUCTION BLOCKERS FIXED** - Phase 1 complete, ready for pilot
**Health Score:** 78/100 (C+)
**Last Updated:** 2025-12-08 (via /update-docs)
**Applies To:** All worktrees, all features, all developers

> ⚠️ **This is the law.** When in doubt, follow this document. All other docs are supplementary.

---

## ✅ Production Blockers - FIXED

**Phase 1 critical fixes are complete:**

1. ~~**No pagination**~~ → ✅ Fixed - All queries have limits
2. ~~**Subscription bypass**~~ → ✅ Fixed - Enforcement in place
3. ~~**PII in logs**~~ → ✅ Fixed - Console.error calls removed
4. ~~**Missing indexes**~~ → ✅ Fixed - Database indexes added

**Ready for pilot church deployment.** See Phase 2 for performance improvements.

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

**Rule: Single Use = Colocate, Multiple Use = Centralize**

```
/components/
├── ui/                    # shadcn/ui primitives (DO NOT MODIFY)
├── layout/                # Navbars, page containers, wrappers
├── sidebar/               # Sidebar navigation components
├── shared/                # Cross-cutting reusable components (UserDropdown, LoginForm)
└── dashboard/{feature}/   # Feature-specific shared components (tables, forms, dialogs)

/app/{route}/_components/  # Page-specific components ONLY (Next.js private folder convention)
```

**When to use `_components/` (colocated):**

- Component is used by exactly ONE page
- Component is a "client wrapper" for a server page (e.g., `DashboardClient.tsx`)
- Component contains page-specific business logic

**When to use `/components/` (centralized):**

- Component is used by 2+ unrelated pages
- Component is a reusable UI pattern (forms, tables, dialogs)
- Component could be used by platform AND church admin

**Import patterns:**

```typescript
// Colocated (relative import)
import { DashboardClient } from "./_components/DashboardClient";

// Centralized (absolute import)
import { VolunteersTable } from "@/components/dashboard/volunteers/volunteers-table";
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

| Priority        | Issue                   | Location                          | Status            |
| --------------- | ----------------------- | --------------------------------- | ----------------- |
| ~~🔴 CRITICAL~~ | No pagination           | `/lib/data/*`                     | ✅ Fixed          |
| ~~🔴 CRITICAL~~ | Subscription bypass     | `require-dashboard-access.ts:175` | ✅ Fixed          |
| ~~🔴 CRITICAL~~ | PII in logs             | 20+ server actions                | ✅ Fixed          |
| ~~🔴 CRITICAL~~ | Missing indexes         | `schema.prisma`                   | ✅ Fixed          |
| ~~🟠 HIGH~~     | Race conditions         | `connect-card-batch.ts`           | ✅ Fixed (PR #50) |
| ~~🟠 HIGH~~     | N+1 queries (prayer)    | `prayer-requests.ts`              | ✅ Fixed (PR #51) |
| 🟠 **HIGH**     | No caching              | All data fetches                  | Phase 2           |
| 🟡 **MEDIUM**   | No data abstraction     | 113 files use Prisma              | Deferred          |
| ~~🟡 MEDIUM~~   | Type safety violations  | `as never` casts                  | ✅ Fixed          |
| 🟡 **MEDIUM**   | Silent error swallowing | Empty catch blocks                | Phase 2           |

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

### ✅ FIXED: Dashboard fetches ALL TIME data

**Location:** `/lib/data/connect-card-analytics.ts`
**Impact:** Was 40MB+ per load after 1 year
**Fix:** Limited to 4 weeks, uses aggregates for totals

### ✅ FIXED: 8 Sequential COUNT queries (PR #51)

**Location:** `/lib/data/prayer-requests.ts`
**Impact:** Was 400ms latency minimum
**Fix:** Single GROUP BY query

### ✅ FIXED: Raw images in review queue

**Location:** Review queue
**Impact:** Was 30-50MB page loads
**Fix:** Added lazy loading and decoding async

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

_Last audit: 2025-12-08 | Next audit: After pilot church deployment_
