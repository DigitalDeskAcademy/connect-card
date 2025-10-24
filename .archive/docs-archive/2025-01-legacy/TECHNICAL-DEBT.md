# Technical Debt Documentation - January 2025

## 🚀 MVP SHIP REQUIREMENTS - DO THESE FIRST!

### Critical for Launch (Before Architecture Refactor)

**These must be done to ship MVP - architecture can wait:**

1. **Record First Course Content** ⏰ URGENT

   - [ ] Record/create your first complete course
   - [ ] Upload videos and materials
   - [ ] Test full learning flow with real content
   - **Why Critical**: Can't sell platform without content!

2. **Fix Production Blockers Only**

   - [ ] Remove console.log statements (security risk)
   - [ ] Fix Stripe webhook for production
   - [ ] Ensure CSRF protection enabled in production
   - **Time**: 2-3 hours max

3. **Basic Customer Onboarding**
   - [ ] Ensure signup → organization setup → course access works
   - [ ] Test with real email (not just console OTP)
   - [ ] Verify Stripe subscription flow
   - **Why Critical**: Core business loop must work

### Can Wait Until Post-Launch

**These are important but not launch blockers:**

- ❌ Architecture refactoring (40 hours)
- ❌ Component unification
- ❌ Test automation
- ❌ Performance optimization
- ❌ Additional features from WISHLIST.md

**Ship First, Optimize Later!** The duplication isn't breaking anything - it's just inefficient.

---

## 🚨 CRITICAL: Architecture Review Findings

**Date**: 2025-01-20
**Severity**: HIGH - 40% of codebase is duplicated
**Impact**: 3x maintenance burden, high bug risk, scaling nightmare
**When to Fix**: AFTER MVP ships with real customers

## Executive Summary

This LMS platform has a fundamental architecture flaw: **route-based role segregation** instead of **component-based composition**. This has resulted in massive code duplication between `/platform` and `/agency` routes, creating a maintenance nightmare that will only get worse as features are added.

## Current State Analysis

### The Duplication Crisis

**Duplicated Components (Exact Measurements):**

- `EditCourseForm.tsx`: 664 lines total (331 × 2 duplicates)
- `CourseStructure.tsx`: 998 lines total (497 × 2 duplicates)
- **Total Immediate Duplication**: 1,662 lines
- Every CRUD operation exists twice with 95% identical code

**Scale of Problem:**

- **40% of application code is duplicated**
- **Every new feature must be implemented twice**
- **Bug fixes must be applied in multiple places**
- **Testing effort doubled for identical functionality**

### Root Cause: Route-Based Role Segregation

Current architecture uses URL paths to determine user context:

```
/platform/admin/* → Platform admins managing global courses
/agency/[slug]/admin/* → Agency admins managing org-specific courses
```

This seemed logical initially but created massive duplication because:

1. Both roles perform identical CRUD operations
2. Only difference is data scoping (global vs organizationId)
3. UI components are 95% identical
4. Business logic is 90% identical

## Impact Assessment

### Development Velocity

- **3x slower feature development** (implement everything twice)
- **2x slower bug fixes** (fix in multiple places)
- **High risk of drift** (fixes applied inconsistently)

### Code Quality

- **Inconsistent patterns** emerging between duplicated code
- **Testing burden doubled** for identical functionality
- **Refactoring nightmare** - changes cascade to multiple files

### Business Impact

- **Delayed feature delivery** due to duplication overhead
- **Increased bug rate** from inconsistent fixes
- **Higher development costs** from maintenance burden

## Proposed Solution: Component-Based Composition

### The Right Architecture

Instead of route-based segregation, use **component composition**:

```typescript
// Single CourseCreateForm component
<CourseCreateForm
  context={userContext} // 'platform' | 'agency'
  organizationId={org?.id} // Optional for agencies
/>

// Single server action with context awareness
async function createCourse(data, context: CourseContext) {
  const validation = await validateUserContext(context);

  const course = await prisma.course.create({
    data: {
      ...data,
      organizationId: context.type === 'agency' ? context.orgId : null,
      stripePriceId: context.type === 'platform' ? await createStripePrice() : null,
    }
  });
}
```

### Benefits

- **80% code reduction** in duplicated areas
- **Single source of truth** for business logic
- **Easier testing** - test once, works everywhere
- **Faster development** - implement once, configure for context

## 📋 10-HOUR TASK LIST - IMMEDIATE WORK

### Hour 1-2: Setup & Planning

**Task**: Create feature branch and detailed migration plan

```bash
git checkout -b refactor/component-composition
```

- [ ] Create `MIGRATION-PLAN.md` with step-by-step approach
- [ ] Identify first component to refactor as proof of concept
- [ ] Set up testing checklist for validation
- [ ] Document rollback strategy

**Deliverable**: Clear migration plan and branch ready for work

### Hour 3-5: Proof of Concept - Extract EditCourseForm

**Task**: Extract single EditCourseForm component replacing both 331-line duplicates

**Files to create:**

- `/components/courses/EditCourseForm.tsx` - Unified form component
- `/components/courses/CourseStructure.tsx` - Unified drag-drop component
- `/lib/contexts/course-context.ts` - Context type definitions

**Implementation:**

```typescript
// EditCourseForm.tsx
interface EditCourseFormProps {
  course: CourseData;
  onSave: (data: CourseSchemaType) => Promise<ApiResponse>;
  onCancel: () => void;
  showPricing?: boolean; // Platform-specific
  showVisibility?: boolean; // Agency-specific
}

export function EditCourseForm({
  course,
  onSave,
  onCancel,
  showPricing,
  showVisibility,
}: EditCourseFormProps) {
  // Single implementation with cancel button!
}
```

**Success Criteria**: Both platform and agency course creation using same component

### Hour 6-7: Extract CourseStructure Component

**Task**: Extract drag-and-drop CourseStructure component (497 lines)

- [ ] Extract `CourseStructure.tsx` to `/components/courses/`
- [ ] Make it accept `basePath` prop for edit links
- [ ] Update both platform and agency pages to use shared component
- [ ] Test drag-and-drop in both contexts

**Critical**: Ensure organizationId scoping works correctly for agencies

### Hour 8-9: Create Abstraction Layer

**Task**: Build reusable patterns for other duplicated features

**Create utilities:**

- `/lib/auth/context-validation.ts` - Unified auth checking
- `/lib/data/scoped-queries.ts` - Organization-scoped database queries
- `/components/layouts/AdminLayout.tsx` - Shared admin layout

**Pattern to establish:**

```typescript
// scoped-queries.ts
export async function getCourses(context: CourseContext) {
  const where = context.type === 'agency'
    ? { organizationId: context.organizationId }
    : {};

  // Use select pattern per project standards, never include
  return prisma.course.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      // ... specific fields needed
    }
}
```

### Hour 10: Documentation & Testing

**Task**: Document new patterns and test thoroughly

- [ ] Update `CODING_PATTERNS.md` with composition examples
- [ ] Create comprehensive test checklist
- [ ] Test all CRUD operations in both contexts
- [ ] Document any edge cases found
- [ ] Update CLAUDE.md with new architecture patterns

**Final validation:**

1. Platform admin can create/edit/delete courses
2. Agency admin can create/edit/delete courses
3. Organization scoping enforced correctly
4. No functionality lost in migration

## Additional Technical Debt Items

### Security Issues (from security-audit.md)

1. **Missing `requireAdmin()` function** in S3 routes
2. **Console logging in production** (OTP codes, slugs)
3. **CSRF protection disabled** in development
4. **Inconsistent error messages** leaking information

### Performance Issues

1. **No caching strategy** for frequently accessed data
2. **Unoptimized database queries** (missing indexes)
3. **Large bundle size** from duplicated code

### Testing Gaps

1. **No integration tests** for critical paths
2. **No E2E tests** for user workflows
3. **Manual testing only** for multi-tenant scenarios

## Migration Strategy

### Phase 1: Stop the Bleeding (Hours 1-10)

- Create unified components for courses
- Establish composition patterns
- Document new architecture

### Phase 2: Systematic Migration (Next 20 hours)

- Migrate all duplicated CRUD operations
- Create shared layouts and navigation
- Unify server actions

### Phase 3: Cleanup & Optimization (Final 10 hours)

- Remove all duplicated code
- Optimize bundle size
- Add comprehensive tests

## Success Metrics

### Immediate (After 10 hours)

- [ ] Course CRUD using single component set
- [ ] Clear pattern established for migration
- [ ] No functionality regression

### Short-term (After full migration)

- [ ] 80% reduction in duplicated code
- [ ] 50% faster feature development
- [ ] Consistent behavior across contexts

### Long-term

- [ ] Single source of truth for all features
- [ ] Easy to add new user contexts
- [ ] Maintainable, scalable architecture

## Risk Mitigation

### Rollback Strategy

- Keep original routes temporarily
- Feature flag for new components
- Gradual migration with validation

### Testing Strategy

- Test both old and new paths in parallel
- Automated regression tests
- User acceptance testing for both contexts

## Context for Future AI Sessions

**Current Problem**: This LMS has route-based role segregation causing 40% code duplication. Platform admins use `/platform/*` routes while agency admins use `/agency/[slug]/*` routes. Nearly identical code exists in both places.

**Work in Progress**: Migrating to component-based composition where single components handle multiple contexts through props and context objects.

**Key Files to Review**:

- `/app/platform/admin/courses/[courseId]/edit/_components/EditCourseForm.tsx` - 331 lines to extract
- `/app/platform/admin/courses/[courseId]/edit/_components/CourseStructure.tsx` - 497 lines to extract
- `/app/agency/[slug]/admin/courses/` - Duplicated versions of above
- `/components/courses/` - Where extracted components will live
- **Reference**: `/docs/architecture/component-refactoring-plan.md` - Detailed implementation guide

**Testing Focus**: Ensure organization scoping works correctly - agency admins should only see their org's data, platform admins see all data.

**Architecture Goal**: Single components configured by context, not duplicate components for each role.

---

_Last Updated: 2025-01-21_
_Aligned with: `/docs/architecture/component-refactoring-plan.md`_
_Estimated Debt Resolution Time: 40 hours_
_Priority: CRITICAL - Blocking efficient development_
