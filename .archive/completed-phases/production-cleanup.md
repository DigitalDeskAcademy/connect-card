# Production Cleanup Phase Plan

## Overview

Complete cleanup of test data and implementation of proper multi-tenant seed data for production testing. This includes making course pricing optional (B2B subscription model), updating categories, and ensuring proper data isolation between organizations.

## Success Criteria

- [ ] Course creation works without requiring Stripe pricing
- [ ] Database can be reset cleanly with new seed data
- [ ] Three test organizations with proper role hierarchy
- [ ] No data crossover between organizations
- [ ] S3 files organized by organization

---

## Phase 1: Schema Updates (Database Foundation)

**Goal**: Make price optional and stripePriceId nullable to support B2B subscription model

### Implementation

1. Update `prisma/schema.prisma`:
   - Make `stripePriceId` field nullable
   - Keep `price` field but allow 0 as default
2. Run `npx prisma generate`
3. Create and run migration: `npx prisma migrate dev --name make-stripe-price-optional`

### Testing Checklist

- [ ] Existing courses still load correctly
- [ ] Can query courses without stripePriceId
- [ ] No TypeScript errors after generation
- [ ] Database migration applies cleanly

### Rollback

- Revert schema changes
- Run `npx prisma migrate reset` if needed

---

## Phase 2: Course Categories Update

**Goal**: Update categories to be generic but software-focused

### Implementation

1. Update `lib/zodSchemas.ts`:
   ```typescript
   export const courseCategories = [
     "CRM & Sales",
     "Marketing",
     "Project Management",
     "Communication",
     "Analytics",
     "E-commerce",
     "Customer Support",
     "Development",
     "Operations",
     "Finance",
   ] as const;
   ```
2. Make price field optional in courseSchema:
   ```typescript
   price: z.coerce.number().min(0).default(0).optional();
   ```

### Testing Checklist

- [ ] Course creation form shows new categories
- [ ] Can create course with price = 0
- [ ] Can create course without specifying price
- [ ] Validation passes for all scenarios

---

## Phase 3: Course Creation Logic Updates

**Goal**: Handle optional pricing gracefully

### Implementation

1. Update `app/platform/admin/courses/create/actions.ts`:
   - Check if price > 0 before creating Stripe product
   - Set stripePriceId to null when no Stripe product created
2. Update `app/platform/admin/courses/create/page.tsx`:
   - Mark price field as optional in UI
   - Add helper text: "Leave as 0 for platform subscription courses"

### Testing Checklist

- [ ] Create course WITH price - verify Stripe product created
- [ ] Create course WITHOUT price - verify NO Stripe product created
- [ ] Both course types save correctly to database
- [ ] UI clearly indicates price is optional

---

## Phase 4: Create Database Reset Script

**Goal**: Clean slate for testing

### Implementation

1. Create `scripts/reset-database.ts`:
   ```typescript
   // Delete in order (respect foreign keys):
   // 1. LessonProgress
   // 2. Enrollments
   // 3. Lessons
   // 4. Chapters
   // 5. Courses
   // 6. Sessions
   // 7. Accounts
   // 8. Members
   // 9. Invitations
   // 10. Users
   // 11. Organizations
   ```
2. Add S3 cleanup for test files
3. Add to package.json scripts: `"db:reset": "tsx scripts/reset-database.ts"`

### Testing Checklist

- [ ] Script runs without foreign key errors
- [ ] All tables are empty after running
- [ ] S3 test files are removed
- [ ] Can run seed scripts after reset

---

## Phase 5: Create Comprehensive Seed Data

**Goal**: Multi-tenant test data setup

### Organizations to Create

1. **SideCar Platform** (slug: sidecar)
   - Type: PLATFORM
   - For platform admin users
2. **IV Therapy Pro** (slug: ivtherapypro)
   - Type: AGENCY
   - First test agency
3. **Wellness Center Hub** (slug: wellnesshub)
   - Type: AGENCY
   - Second test agency

### Users to Create (with Better Auth IDs)

```
Platform:
- admin@sidecar.com (PLATFORM_ADMIN)

IV Therapy Pro:
- admin@ivtherapypro.com (AGENCY_ADMIN)
- john.doe@client1.com (END_USER)

Wellness Center Hub:
- admin@wellnesshub.com (AGENCY_ADMIN)
- jane.smith@client2.com (END_USER)
```

### Implementation

1. Update `prisma/seed-organizations.ts` with all 3 orgs
2. Update `prisma/seed-users.ts` with all users and proper roles
3. Create `prisma/seed-courses.ts` with sample platform courses

### Testing Checklist

- [ ] All organizations created
- [ ] All users created with correct roles
- [ ] Each user can log in
- [ ] Sample courses visible to agencies

---

## Phase 6: Test Multi-Tenant Isolation

**Goal**: Verify no data crossover

### Test Scenarios

1. **Platform Admin** (admin@sidecar.com):
   - [ ] Can access /platform/admin
   - [ ] Can see all organizations
   - [ ] Can create platform courses
2. **Agency Admin** (admin@ivtherapypro.com):
   - [ ] Can access /agency/ivtherapypro/admin
   - [ ] Cannot access /agency/wellnesshub/admin
   - [ ] Sees only their organization's data
3. **End User** (john.doe@client1.com):
   - [ ] Can access /agency/ivtherapypro/learning
   - [ ] Cannot access admin routes
   - [ ] Sees only their enrolled courses

### Data Isolation Tests

- [ ] IV Therapy Pro users cannot see Wellness Hub data
- [ ] Wellness Hub users cannot see IV Therapy Pro data
- [ ] End users cannot see other end users' progress

---

## Phase 7: S3 Organization Review

**Goal**: Implement proper file organization

### Current Structure Analysis

- Document existing file paths
- Identify orphaned files

### New Structure

```
/organizations/{org-slug}/
  /courses/{course-slug}/
    /thumbnails/
    /videos/
    /resources/
```

### Implementation

1. Update upload endpoints to use organization context
2. Create migration script for existing files (optional)
3. Document S3 organization strategy

### Testing Checklist

- [ ] New uploads follow org-based structure
- [ ] Files are accessible with signed URLs
- [ ] No unauthorized cross-org access

---

## Phase 8: Cleanup and Documentation

**Goal**: Remove old code and document changes

### Cleanup Tasks

1. Remove backward compatibility code:
   - Old role checks (platform_admin vs PLATFORM_ADMIN)
   - Temporary migration helpers
2. Update documentation:
   - README with new seed instructions
   - Add database reset instructions
3. Create runbook for database operations

### Final Testing

- [ ] Full application test with fresh data
- [ ] All user flows work correctly
- [ ] No console errors or warnings
- [ ] Performance acceptable

### Completion

- [ ] Commit all changes
- [ ] Push to repository
- [ ] **DELETE THIS PHASE PLAN DOCUMENT**
- [ ] Merge to main when ready

---

## Rollback Plan

If any phase fails:

1. Git stash or reset changes
2. Restore database from backup
3. Document issue in phase plan
4. Fix and retry

## Notes

- Each phase should be completed and tested before moving to next
- Run `pnpm build` after major changes to catch TypeScript errors
- Keep dev server running to test changes immediately
