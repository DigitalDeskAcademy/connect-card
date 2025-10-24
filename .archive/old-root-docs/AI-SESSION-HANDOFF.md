# AI Session Handoff - January 20, 2025

## 🎯 Executive Summary for Next Session

**Current State**: Working MVP with 40% code duplication due to route-based role segregation
**Mission**: Refactor to component-based composition architecture
**Time Estimate**: 40 hours total (1 week of focused work)
**Priority**: Start with dashboard/frame unification (foundation for everything)

## 📍 Where We Left Off

### Branch Status

- **Current Branch**: `fix/public-cta-links` (can be merged/completed)
- **Next Branch to Create**: `refactor/component-composition`
- **Build Status**: ✅ Passing (14.0s)
- **Lint Status**: ✅ Clean
- **Tests**: Manual only (no automated tests yet)

### What Was Just Completed

1. Fixed agency admin access to courses
2. Implemented agency course CRUD operations
3. Created placeholder image system
4. Conducted security audit
5. Created comprehensive technical debt documentation

## 🏗️ Architecture Problem Summary

### The Core Issue

**Three separate implementations for every feature:**

- `/platform/admin/*` - Platform admin features
- `/agency/[slug]/admin/*` - Agency admin features
- `/agency/[slug]/learning/*` - End-user features

### The Impact

- Every feature implemented 3 times
- Bug fixes needed in 3 places
- 40% of codebase is duplicated
- 3x slower development

### The Solution

**Component-based composition** - Single components that adapt based on user context

```typescript
// Instead of 3 separate files, one component:
<UnifiedDashboard context={userContext} />

// Context determines what to show:
type UserContext =
  | { type: 'platform-admin' }
  | { type: 'agency-admin'; organizationId: string }
  | { type: 'end-user'; organizationId: string }
```

## 📋 Immediate Action Plan (First 10 Hours)

### Hour 1-2: Setup

```bash
git checkout -b refactor/component-composition
```

- Create MIGRATION-PLAN.md
- Set up testing checklist
- Document the three-tier user model

### Hour 3-4: Unified Dashboard Layout (FOUNDATION)

**Create**: `/components/layouts/UnifiedDashboardLayout.tsx`

This component should:

- Replace 3 separate layout files
- Handle authentication for all user types
- Render appropriate sidebar based on context
- Share common elements (SiteHeader, SidebarProvider)

**Current layout files to unify:**

- `/app/platform/admin/layout.tsx`
- `/app/agency/[slug]/admin/layout.tsx` (if exists)
- `/app/agency/[slug]/learning/layout.tsx`

### Hour 5-7: Unified CourseForm

**Create**: `/components/courses/UnifiedCourseForm.tsx`

Combines:

- `/app/platform/admin/courses/create/page.tsx`
- `/app/agency/[slug]/admin/courses/create/page.tsx`

### Hour 8-9: Abstraction Patterns

Create reusable utilities:

- `/lib/auth/context-validation.ts`
- `/lib/data/scoped-queries.ts`

### Hour 10: Testing & Documentation

- Test all three user flows
- Document patterns in CODING_PATTERNS.md

## 🔑 Key Technical Details

### Authentication Pattern

```typescript
// Current (duplicated) approach:
await requireAdmin(); // Platform admin
await requireAgencyAdmin(slug); // Agency admin

// New unified approach:
const context = await getUserContext();
await requirePermission(context, "courses.create");
```

### Data Scoping Pattern

```typescript
// Unified query with context awareness
export async function getCourses(context: UserContext) {
  const where =
    context.type === "agency-admin"
      ? { organizationId: context.organizationId }
      : {};

  return prisma.course.findMany({ where });
}
```

### Important Files to Review

1. **Technical Debt Doc**: `/docs/TECHNICAL-DEBT.md` - Full problem analysis
2. **Security Audit**: `/docs/security-audit.md` - Issues to fix
3. **Wishlist**: `/WISHLIST.md` - Future features (ignore for now)

## ⚠️ Critical Warnings

### Do NOT Break

1. **Multi-tenant isolation** - organizationId scoping is critical
2. **URL structure** - Keep same routes, change internals only
3. **Authentication flow** - Better Auth sessions must keep working

### Known Issues to Fix Along the Way

1. Console.log statements in production code
2. Missing requireAdmin() function in S3 routes
3. CSRF protection disabled in development

## 🎯 Success Criteria

After 10 hours you should have:

1. ✅ Unified dashboard layout working for all 3 user types
2. ✅ Course creation using single component
3. ✅ Clear pattern established for remaining work
4. ✅ No functionality lost
5. ✅ All existing routes still working

## 💡 Pro Tips for Next Session

1. **Start with READ operations** - Easier to test, less risky
2. **Keep old code temporarily** - Don't delete until new code is proven
3. **Test with real user accounts** - Use the seeded data
4. **Commit frequently** - Small commits easier to rollback

## 📊 Test Accounts

```
Platform Admin: admin@sidecarplatform.com
Agency Admin: clinic.owner@ivtherapy.com
End User: (create one in an agency)
```

## 🚀 The Big Picture

**Why This Matters**:

- Current: Add feature = 3 implementations = 3x time
- After: Add feature = 1 implementation = 3x faster

**ROI**: 40 hours of work saves 20+ hours/month forever

## 📝 First Command to Run

```bash
# Start here:
git checkout -b refactor/component-composition
code docs/TECHNICAL-DEBT.md  # Review the full plan
```

---

**Remember**: This is normal technical debt. You built an MVP that works. Now you're optimizing. This is the right order of operations!

Good luck! The codebase is in good shape for this refactor. 🚀
