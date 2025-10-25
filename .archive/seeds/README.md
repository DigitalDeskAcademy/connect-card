# Archived Seed Scripts

**Date Archived**: October 25, 2025
**Reason**: Legacy seed scripts from forked SideCar Platform project

## Contents

### `/prisma/` - Main Seed Scripts

- `seed-organizations.ts` - Creates test organizations
- `seed-users.ts` - Creates platform admin, agency owner, end user accounts
- `seed-courses.ts` - Creates 4 multi-chapter courses (Digital Desk, RestaurantOS, PropertyPro, BookKeepPro)
- `seed-platform-courses.ts` - Creates IV Therapy Quick Start course
- `seed-platform-courses-OLD.ts` - Legacy version of platform courses
- `seed-test-admin.ts` - Creates test admin user
- `seed-test-course.ts` - Creates single test course
- `seed-test-enduser.ts` - Creates test end user
- `seed-test-organizations.ts` - Creates test organizations
- `update-test-user.ts` - Updates test user data

### `/scripts/` - Development Helper Scripts

- `add-test-payments.ts` - Creates test payment records
- `seed-iv-clinic-course.ts` - IV clinic specific course seeding
- `seed-iv-therapy-courses.ts` - IV therapy course collection
- `seed-simple-users.ts` - Simplified user creation
- `setup-test-users.ts` - Full user setup workflow

## Why Archived

These scripts were designed for the **SideCar Platform** (IV therapy clinic vertical SaaS) and don't align with **Church Connect Card** needs:

1. **Wrong Domain**: IV therapy courses, clinic workflows vs church operations
2. **Wrong Data Models**: Focus on learners/clinics vs church members/visitors
3. **Wrong Organization Structure**: Medical practice hierarchy vs church multi-site structure

## Replacement Strategy

Create new seed scripts for Church Connect Card:

1. **Churches (Organizations)**

   - Multi-site church with 6 locations
   - Single-site church examples
   - Organization types: CHURCH (not CLINIC)

2. **Church Staff (Users)**

   - Senior Pastor (church_owner)
   - Youth Pastor (church_admin)
   - Volunteer Coordinator (volunteer_leader)
   - Church member (user)

3. **Connect Cards**

   - First-time visitor cards
   - Member update cards
   - Prayer request cards

4. **Church Members**

   - Contact type: VISITOR, REGULAR_ATTENDER, MEMBER, VOLUNTEER
   - Include realistic church member data

5. **Training Courses** (Optional)
   - Volunteer onboarding
   - Church staff training
   - New member orientation

## Reference

These scripts can be referenced for:

- Stripe integration patterns (customer creation, product setup)
- User seeding with Better Auth
- Course structure examples
- Multi-tenant data isolation patterns

**Do not run these scripts** - they will create incorrect data for Church Connect Card platform.

## Related Files

The following package.json commands reference these archived scripts (needs updating):

```json
"seed:organizations": "npx tsx prisma/seed-organizations.ts",
"seed:users": "npx tsx prisma/seed-users.ts",
"seed:courses": "npx tsx prisma/seed-courses.ts",
"seed:platform": "npx tsx prisma/seed-platform-courses.ts",
"seed:all": "npm run seed:organizations && npm run seed:users && npm run seed:courses && npm run seed:platform"
```

These commands should be updated or removed when new church-specific seed scripts are created.
