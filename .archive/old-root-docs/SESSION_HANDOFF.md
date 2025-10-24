# Session Passoff - Agency-Client Flow Implementation

## Current Status

**Date**: 2025-09-15
**Branch**: `feat/agency-signup-flow`
**Focus**: Ready to implement agency-client invitation flow for white-label B2B platform

## Context Summary

SideCar is a white-label B2B SaaS platform that enables agencies to onboard their clients to training courses. The platform is multi-tenant with organization-based isolation. Agencies never see SideCar branding - it's completely white-labeled.

## Just Completed

1. ✅ Created comprehensive phase plan: `/docs/phase-plans/agency-client-flow.md`
2. ✅ Created platform course documentation: `/docs/courses/healthcare-practice-management/course-content.md`
3. ✅ Made course generic (removed Digital Desk specific references)
4. ✅ Archived all old phase plans in `/docs/phase-plans/archived/`

## Ready to Implement: Agency-Client Flow

### Phase Plan Location

`/docs/phase-plans/agency-client-flow.md` - Contains full 7-phase implementation plan

### Key Decisions Made

- **Platform Courses**: Use `isPlatformCourse: Boolean` flag
- **Organization**: Platform courses have `organizationId: null`
- **Client Access**: All clients see all agency courses (no enrollment)
- **Invitation System**: Use Better Auth's organization plugin
- **White-Label**: NO SideCar branding in any client-facing content

### Implementation Order

1. **Phase 1**: Database Schema (30 min) - Add 2 Boolean flags
2. **Phase 2**: Platform Course Seeding (1.5 hrs) - Seed healthcare course
3. **Phase 3**: Better Auth Setup (2 hrs) - Configure invitations
4. **Phase 4**: Client Management UI (3 hrs) - Build agency interface
5. **Phase 5**: Course Logic (2 hrs) - Update queries
6. **Phase 6**: Client Experience (1 hr) - Update learning portal
7. **Phase 7**: Testing (1.5 hrs) - Full testing checklist

### Critical Patterns to Follow

- **Interface naming**: Always `interface iAppProps`
- **Server components**: Default unless client features needed
- **Forms**: react-hook-form with zod validation
- **Server actions**: Return `ApiResponse` type
- **Data fetching**: Server-side in `/app/data/` directory

### Healthcare Course Ready

- 8 modules, 25 lessons documented
- Generic content (no agency-specific branding)
- Located at: `/docs/courses/healthcare-practice-management/course-content.md`

### Environment

- Dev server running on port 3000 (`pnpm dev`)
- Database: Neon PostgreSQL
- Auth: Better Auth with organization plugin
- All dependencies installed and working

### Next Action

Start with Phase 1: Update Prisma schema with the two new Boolean fields:

```prisma
isPlatformCourse    Boolean @default(false)
isHiddenFromClients Boolean @default(false)
```

Then run migrations and continue through the phases sequentially.

## Commands for Next Session

```bash
# Continue where we left off
git status
pnpm dev  # if not already running

# Start Phase 1
code prisma/schema.prisma
# Add the two fields to Course model
npx prisma db push
npx prisma generate
```

---

**Total Implementation Time**: 10-12 hours
**Current Phase**: Ready to start Phase 1
**Documentation**: Complete and ready for reference
