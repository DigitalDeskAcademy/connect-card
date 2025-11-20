# Volunteer Management Feature - Phase Plan

**Worktree:** `/volunteer`
**Feature Branch:** `feature/volunteer-management`
**Database:** Isolated volunteer database (port 3003)
**Dev Server:** http://localhost:3001

---

## Documentation Architecture

### Worktree-Specific Docs (THIS FILE)

**Location:** `/volunteer/docs/`
**Tracked:** ✅ Yes (committed to feature branch)
**Purpose:** Feature-specific planning and implementation details
**Scope:** Only volunteer management feature

**Files:**

- `VOLUNTEER-PHASES.md` (this file) - Phase breakdown
- `STATUS.md` - Current implementation status
- `ROADMAP.md` - Feature priorities

### Core Project Docs (MAIN WORKTREE ONLY)

**Location:** `/main/docs/`
**Tracked:** ✅ Yes (main branch only)
**Purpose:** Cross-cutting architecture and patterns
**Updated:** Only through main worktree merges

**Files:**

- `docs/essentials/coding-patterns.md`
- `docs/essentials/architecture.md`
- `docs/technical/architecture-decisions.md`

### Gitignored Worktree Docs (NOT TRACKED)

**Location:** `/.worktree/volunteer/docs/{session-notes,testing,wip}/`
**Tracked:** ❌ No (gitignored)
**Purpose:** Temporary notes and work-in-progress

---

## Current PR Scope: Phase 1 (MVP Volunteer Directory)

**Goal:** Ship basic volunteer onboarding and directory with E2E tests passing

### ✅ Completed (Ready to Ship)

1. **Database Schema**

   - Volunteer model with emergency contacts
   - Background check tracking
   - ChurchMember relationship (one-to-one)
   - VolunteerStatus enum

2. **Server Actions**

   - `createVolunteer()` with rate limiting
   - `getVolunteers()` with multi-tenant filtering
   - Validation with Zod schemas

3. **UI Components**

   - Volunteer directory (TanStack Table)
   - Create volunteer dialog (inline member creation)
   - Stats cards (total, active, background checks, new this month)

4. **E2E Tests**
   - 7/7 tests passing ✅
   - Directory page load
   - Create dialog open/close
   - Form validation
   - Full workflow (create → verify in table)
   - Search, sort, pagination

### 🔧 To Finish Before PR Merge

#### 1. Remove Skills Column from Table

**Why:** Not needed in volunteer directory (skills managed separately)
**Files:**

- `components/dashboard/volunteers/columns.tsx` - Remove skills column definition
- Tests still pass (no Skills-specific assertions)

**Estimated:** 5 minutes

#### 2. Add Volunteer Category Multi-Select

**Why:** Volunteers can serve in multiple areas (greeter + usher + kids ministry)

**Schema Change:**

```prisma
// Already have Volunteer model, add:
model VolunteerCategory {
  id           String   @id @default(cuid())
  volunteerId  String
  volunteer    Volunteer @relation(fields: [volunteerId], references: [id], onDelete: Cascade)
  category     VolunteerCategoryType
  assignedAt   DateTime @default(now())
  assignedBy   String?
  notes        String?

  @@unique([volunteerId, category])
  @@index([volunteerId])
}

enum VolunteerCategoryType {
  GREETER
  USHER
  KIDS_MINISTRY
  WORSHIP_TEAM
  PARKING
  HOSPITALITY
  AV_TECH
  PRAYER_TEAM
  OTHER
}
```

**UI Changes:**

- Volunteer form: Multi-select combobox for categories
- Volunteer table: Show categories as badges (comma-separated)

**Estimated:** 30 minutes (schema + UI + tests)

#### 3. Update Table Styling

**Issue:** Table doesn't match payment table styling (no horizontal scroll warning)
**Fix:** Verify table overflow behavior, add min-width to columns if needed

**Estimated:** 10 minutes

#### 4. Final E2E Test Run

**Action:** Re-run tests after changes to ensure 7/7 still passing

**Estimated:** 5 minutes

---

## Total Remaining Work: ~50 minutes

**Ship Criteria:**

- ✅ 7/7 E2E tests passing
- ✅ Skills column removed
- ✅ Volunteer categories working (multi-select)
- ✅ Table styling matches other tables
- ✅ No console errors
- ✅ Build passes

---

## Future Phases (Separate PRs)

### Phase 2: Unified Member Management (NEW PR - Architecture)

**Branch:** `feature/unified-member-profiles`
**Scope:** Cross-cutting refactor affecting Team, Volunteers, Members, Connect Cards

**Goals:**

- Consolidate `ChurchMember` as base entity
- Role composition (one person, multiple roles)
- Profile pages with role-specific sections
- Eliminate data duplication

**Database Changes:**

```prisma
// ChurchMember becomes base entity (already exists)
model ChurchMember {
  id              String   @id
  organizationId  String

  // Core identity (single source of truth)
  firstName       String
  lastName        String
  email           String?
  phone           String?
  photo           String?

  // Role extensions (one-to-one relationships)
  volunteer       Volunteer?      // Extends with volunteer data
  staffProfile    StaffProfile?   // Extends with staff data
  leaderProfile   LeaderProfile?  // Extends with leader data

  // Membership tracking
  memberType      MemberType
  firstVisitDate  DateTime?
  lastAttendance  DateTime?
}

// Volunteer extends ChurchMember (one-to-one)
model Volunteer {
  id                  String   @id
  churchMemberId      String   @unique // One-to-one with ChurchMember
  churchMember        ChurchMember @relation(fields: [churchMemberId])

  // Volunteer-specific fields
  status              VolunteerStatus
  startDate           DateTime
  backgroundCheck     BackgroundCheckStatus
  emergencyContact    String?
  categories          VolunteerCategory[]
}

// Staff extends ChurchMember (one-to-one)
model StaffProfile {
  id             String   @id
  churchMemberId String   @unique
  churchMember   ChurchMember @relation(fields: [churchMemberId])

  position       String
  department     String
  hireDate       DateTime
  employmentType EmploymentType
}

// Leader extends ChurchMember (one-to-one)
model LeaderProfile {
  id             String   @id
  churchMemberId String   @unique
  churchMember   ChurchMember @relation(fields: [churchMemberId])

  teamId         String
  role           LeaderRole
}
```

**Impact:**

- Team management uses ChurchMember base
- Volunteer onboarding uses ChurchMember base
- Connect cards create ChurchMember records
- Member directory shows all roles per person

**Estimated:** 2-3 days
**Dependencies:** None (can start after Phase 1 ships)

---

### Phase 3: Member Profile Pages (NEW PR - After Phase 2)

**Branch:** `feature/member-profiles`
**Depends On:** Phase 2 (unified member management)

**Goals:**

- `/church/[slug]/admin/members/[memberId]` profile page
- Role-specific sections (volunteer, staff, leadership)
- Activity timeline (attendance, connect cards, serving history)
- Edit capabilities

**Components:**

```
/components/dashboard/members/profile/
  ├── member-profile-page.tsx      # Main container
  ├── basic-info-section.tsx       # Core identity (always shown)
  ├── volunteer-section.tsx        # If has volunteer role
  ├── staff-section.tsx            # If has staff role
  ├── leadership-section.tsx       # If has leader role
  └── activity-timeline.tsx        # All activity
```

**Estimated:** 3-4 days
**Dependencies:** Phase 2 complete

---

### Phase 4: Advanced Volunteer Features (NEW PR - Independent)

**Branch:** `feature/volunteer-scheduling`
**Depends On:** Phase 1 (can run in parallel with Phase 2)

**Goals:**

- Volunteer shift scheduling (ServingOpportunity, VolunteerShift)
- Skills management with certifications
- Availability tracking (recurring schedules, blackout dates)
- Check-in/check-out tracking

**Estimated:** 4-5 days
**Dependencies:** Phase 1 complete

---

### Phase 5: Volunteer Analytics (NEW PR - After Phase 4)

**Branch:** `feature/volunteer-analytics`
**Depends On:** Phase 4 (scheduling data)

**Goals:**

- Retention metrics
- Coverage heatmaps
- Skills gap analysis
- No-show tracking
- Volunteer burnout prediction (AI)

**Estimated:** 2-3 days
**Dependencies:** Phase 4 complete

---

## Decision Log

### Why Remove Skills from Phase 1?

**Reason:** Skills management requires certification tracking, expiration dates, and verification workflows - too complex for MVP. Ship basic directory first, add skills in Phase 4.

### Why Volunteer Categories in Phase 1?

**Reason:** Essential for routing volunteer inquiries from connect cards to ministry leaders. Without categories, we can't assign greeters to greeting coordinator or kids volunteers to children's ministry director.

### Why Unified Profiles in Phase 2 (Separate PR)?

**Reason:** Architectural refactor affecting 4+ features (Team, Volunteers, Members, Connect Cards). Too risky to bundle with volunteer MVP. Ship volunteer directory first, consolidate later.

### Why Not Build Scheduling in Phase 1?

**Reason:** MVP goal is volunteer onboarding from connect cards. Scheduling (shifts, opportunities, availability) is a separate workflow used by Planning Center. Phase 1 focuses on "get volunteers into the system", Phase 4 adds "schedule their serving".

---

## Success Metrics

### Phase 1 (This PR)

- ✅ 7/7 E2E tests passing
- ✅ Volunteer creation time < 60 seconds (inline member creation)
- ✅ Support 100+ volunteers per church without performance issues
- ✅ Multi-tenant data isolation verified (no cross-org data leakage)

### Phase 2 (Unified Members)

- Zero duplicate member records after migration
- Profile pages load < 2 seconds
- All 4 features use shared ChurchMember base
- E2E tests passing for Team, Volunteers, Members, Connect Cards

### Phase 3 (Profiles)

- Profile pages cover 100% of use cases (volunteer, staff, leader, member)
- Activity timeline shows all interactions
- Edit capabilities functional
- Mobile responsive

### Phase 4 (Advanced Volunteer)

- Scheduling supports 50+ shifts per week
- Availability tracking prevents double-booking
- Skills matching recommends qualified volunteers
- Check-in system works on mobile

---

## Cross-Worktree Dependencies

### Prayer Worktree

**No dependencies** - Prayer and Volunteer are independent features

### Main Worktree

**Dependencies:**

- Core docs (coding-patterns.md, architecture.md) - READ ONLY
- Shared components (if any) - coordinate changes
- Database schema - migrations must be compatible

**Merge Strategy:**

1. Volunteer PR merges first (isolated feature)
2. Main worktree pulls changes
3. Unified Member Management PR starts from updated main
4. Cross-feature coordination happens in main

---

## Next Steps (Immediate)

1. **Remove Skills Column** (5 min)

   - Update `columns.tsx`
   - Verify table renders correctly

2. **Add Volunteer Categories** (30 min)

   - Run schema migration
   - Add multi-select to form
   - Update table to show categories
   - Re-run tests

3. **Fix Table Styling** (10 min)

   - Verify overflow behavior
   - Match payment table styling

4. **Final Test Run** (5 min)

   - `pnpm playwright test` - all 7 tests must pass

5. **Ship PR** ✅
   - Feature branch → main
   - Volunteer database migrated to production
   - E2E tests running in CI

---

**Last Updated:** 2025-11-19
**Author:** Claude Code
**Status:** Phase 1 - Final Polish Before Ship
