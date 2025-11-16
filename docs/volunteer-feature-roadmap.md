# Volunteer Management - Complete Implementation Roadmap

**Status:** In Progress (Phase 3 - Skills/Availability/Shifts UI)
**Last Updated:** 2025-11-15

---

## ✅ PHASE 1: DATABASE & BACKEND (COMPLETE)

- [x] Design database schema (6 models, 5 enums)
- [x] Create ADR-010 documenting decisions
- [x] Update Prisma schema with volunteer models
- [x] Run database migration
- [x] Generate Prisma client
- [x] Create Zod validation schemas
- [x] Build server actions (volunteers.ts, serving-opportunities.ts, skills.ts, availability.ts, shifts.ts)
- [x] Add optimistic locking (version fields)
- [x] Add transaction handling (shift scheduling)
- [x] Add comprehensive validation (5 checks: conflicts, blackouts, skills, background checks, capacity)
- [x] Improve error messages (security)

---

## ✅ PHASE 2: DATA ACCESS LAYER (COMPLETE)

- [x] Create `/lib/data/volunteers.ts` (6 functions)
- [x] Create `/lib/data/serving-opportunities.ts` (6 functions)
- [x] Create `/lib/data/shifts.ts` (8 functions)

---

## 🔄 PHASE 3: VOLUNTEER UI (IN PROGRESS)

### ✅ Volunteer Directory (COMPLETE)

- [x] `/components/dashboard/volunteers/columns.tsx`
- [x] `/components/dashboard/volunteers/volunteers-table.tsx`
- [x] `/components/dashboard/volunteers/volunteers-client.tsx`
- [x] `/app/church/[slug]/admin/volunteer/page.tsx`

### ✅ Create Volunteer Form (COMPLETE)

- [x] `/components/dashboard/volunteers/volunteer-form.tsx` - Full form with all fields (18KB)

  - Church member selection dropdown
  - Status selection (Active, On Break, Inactive, Pending)
  - Start date picker with conditional end date
  - Emergency contact fields (name, phone)
  - Background check status with conditional dates
  - Notes textarea with validation
  - Submit button calling `createVolunteer()` server action
  - Toast notifications for success/error
  - Form validation with Zod schema

- [x] `/components/dashboard/volunteers/create-volunteer-dialog.tsx` - Dialog wrapper (2KB)

  - Dialog wrapper with "New Volunteer" button trigger
  - Contains VolunteerForm
  - Handles dialog open/close state
  - Refreshes table on success (router.refresh)

- [x] Updated `/components/dashboard/volunteers/volunteers-client.tsx`
  - "New Volunteer" button in header (line 125-131)
  - CreateVolunteerDialog fully wired up

### ✅ Volunteer Detail Page (COMPLETE - PR #24)

- [x] `/app/church/[slug]/admin/volunteer/[id]/page.tsx` (41 lines)

  - Fetch volunteer by ID with `getVolunteerById()`
  - Server component with multi-tenant isolation
  - PageContainer with tabs variant

- [x] `/components/dashboard/volunteers/volunteer-detail-client.tsx` (176 lines)

  - Client component with controlled tabs
  - 5 tabs: Overview, Skills, Availability, Shifts, Notes
  - Tab counts (skills.length, shifts.length)
  - Uses Tabler icons

- [x] `/components/dashboard/volunteers/volunteer-overview-tab.tsx` (254 lines)

  - 4 cards: Profile Info, Background Check, Emergency Contact, Contact Info
  - Edit button opens EditVolunteerDialog
  - Background check status badges with color coding
  - Emergency contact display with icons
  - Notes section (full-width card)

- [x] `/components/dashboard/volunteers/edit-volunteer-dialog.tsx` (514 lines)
  - Pre-filled form with current volunteer data
  - Uses `updateVolunteer()` with optimistic locking (version field)
  - Handles version mismatch errors
  - Conditional fields (status-based, background check-based)
  - Scrollable dialog with max-height

### 🔲 Skills Management UI (NEXT)

- [ ] `/components/dashboard/volunteers/skills-tab.tsx`

  - List of current skills with badges (skillName + proficiency)
  - Remove skill button (calls `deleteVolunteerSkill()`)
  - Add skill button opens AddSkillDialog
  - Skills displayed in card layout with verification status
  - Shows verification date and expiry date if applicable

- [ ] `/components/dashboard/volunteers/add-skill-dialog.tsx`
  - Skill name input (combobox with suggestions from existing skills)
  - Proficiency level dropdown (Beginner, Intermediate, Advanced, Expert)
  - Verified checkbox (isVerified)
  - Verification date picker (conditional on isVerified)
  - Expiry date picker (conditional on isVerified)
  - Submit calls `addVolunteerSkill()` server action
  - Toast notifications and dialog close on success

### 🔲 Availability Management UI

- [ ] `/components/dashboard/volunteers/availability-tab.tsx`

  - Section 1: Recurring Availability (weekly schedule)
  - Section 2: Blackout Dates (vacations, conflicts)
  - Section 3: One-Time Availability (special events)

- [ ] `/components/dashboard/volunteers/add-recurring-dialog.tsx`

  - Day of week selector (Sunday-Saturday)
  - Start time picker
  - End time picker
  - Recurrence pattern dropdown (Weekly, Biweekly, Monthly, etc.)
  - Submit calls `addRecurringAvailability()`

- [ ] `/components/dashboard/volunteers/add-blackout-dialog.tsx`
  - Date range picker (start/end dates)
  - Reason input
  - Submit calls `addBlackoutDate()`

### 🔲 Shift History UI

- [ ] `/components/dashboard/volunteers/shifts-tab.tsx`
  - TanStack Table showing past/upcoming shifts
  - Columns: Date, Time, Opportunity, Status
  - Filter by date range
  - Shows reliability metrics (completed vs no-shows)

---

## 🔲 PHASE 4: SERVING OPPORTUNITIES UI

### Serving Opportunities Directory

- [ ] `/components/dashboard/opportunities/columns.tsx`

  - Name, Category, Volunteers Needed, Status, Actions
  - Sortable columns

- [ ] `/components/dashboard/opportunities/opportunities-table.tsx`

  - TanStack Table wrapper
  - Search by name
  - Filter by category, status

- [ ] `/components/dashboard/opportunities/opportunities-client.tsx`

  - Summary cards (Total Opportunities, Active, Volunteers Needed, Upcoming Shifts)
  - OpportunitiesTable

- [ ] `/app/church/[slug]/admin/volunteer/opportunities/page.tsx`
  - Fetch with `getServingOpportunitiesForScope()`
  - Render OpportunitiesClient

### Create Opportunity Form

- [ ] `/components/dashboard/opportunities/opportunity-form.tsx`

  - Name input
  - Description textarea
  - Category input (combobox with suggestions: Hospitality, Kids Ministry, Worship, etc.)
  - Volunteers needed number input
  - Day of week selector (optional)
  - Service time input (optional)
  - Duration minutes input
  - Recurring checkbox
  - Recurrence pattern dropdown
  - Submit calls `createServingOpportunity()`

- [ ] `/components/dashboard/opportunities/create-opportunity-dialog.tsx`
  - Dialog wrapper
  - Contains OpportunityForm

### Opportunity Detail Page

- [ ] `/app/church/[slug]/admin/volunteer/opportunities/[id]/page.tsx`

  - Fetch with `getServingOpportunityById()`
  - Display opportunity details
  - List required skills
  - Show upcoming shifts
  - Edit button

- [ ] `/components/dashboard/opportunities/edit-opportunity-dialog.tsx`
  - Pre-filled form
  - Uses `updateServingOpportunity()` with version

### Required Skills Management

- [ ] `/components/dashboard/opportunities/required-skills-section.tsx`

  - List current required skills
  - Add/remove buttons
  - Mark as required vs preferred

- [ ] `/components/dashboard/opportunities/add-required-skill-dialog.tsx`
  - Skill name input
  - Required vs Preferred radio
  - Submit calls `addServingOpportunitySkill()`

---

## 🔲 PHASE 5: SHIFT SCHEDULING UI

### Schedule Calendar View

- [ ] `/app/church/[slug]/admin/volunteer/schedule/page.tsx`

  - Calendar component showing all shifts
  - Fetch with `getShiftsByDateRange()`

- [ ] `/components/dashboard/schedule/schedule-calendar.tsx`

  - Full calendar view (use shadcn Calendar or similar)
  - Color-coded by opportunity
  - Click date to see/add shifts

- [ ] `/components/dashboard/schedule/day-view.tsx`
  - Shows all shifts for a specific date
  - Grouped by serving opportunity
  - Shows staffing gaps

### Create Shift Assignment

- [ ] `/components/dashboard/schedule/create-shift-dialog.tsx`
  - Serving opportunity dropdown
  - Date picker
  - Start/end time pickers
  - Available volunteers list (filtered by conflicts/skills)
  - Shows volunteer status indicators (available, conflict, missing skills)
  - Submit calls `createVolunteerShift()`
  - Handles validation errors (conflicts, blackouts, capacity, skills, background checks)

### Shift Management

- [ ] `/components/dashboard/schedule/shift-card.tsx`

  - Displays shift details
  - Status badge (Scheduled, Confirmed, Checked In, Completed, Cancelled, No Show)
  - Actions dropdown:
    - Mark Confirmed
    - Check In
    - Check Out
    - Mark No Show
    - Cancel Shift
    - Edit Shift

- [ ] `/components/dashboard/schedule/edit-shift-dialog.tsx`
  - Change volunteer
  - Change time
  - Add notes
  - Uses `updateVolunteerShift()` with version

### Shift Confirmation Flow

- [ ] `/components/dashboard/schedule/unconfirmed-shifts-alert.tsx`
  - Shows banner if shifts need confirmation
  - List shifts needing reminders
  - Send confirmation button

---

## 🔲 PHASE 6: NAVIGATION & POLISH

- [ ] Update `/lib/navigation.ts`

  - Add submenu under "Volunteer":
    - Volunteers (directory)
    - Serving Opportunities
    - Schedule
    - Reports (future)

- [ ] Add breadcrumbs to detail pages

  - Volunteers > [Volunteer Name]
  - Opportunities > [Opportunity Name]

- [ ] Add quick actions
  - "Schedule Shift" button on volunteer detail
  - "View Schedule" button on opportunity detail

---

## 🔲 PHASE 7: TESTING & DOCUMENTATION

- [ ] Manual testing

  - Create volunteer → View in directory → Edit → Delete
  - Add skills → Verify display → Remove skill
  - Add recurring availability → Add blackout date
  - Create serving opportunity → Add required skills
  - Schedule shift → Verify conflict detection
  - Test optimistic locking (open 2 tabs, edit simultaneously)

- [ ] Update `/docs/STATUS.md`

  - Mark volunteer management as complete
  - Document known limitations

- [ ] Update `/docs/ROADMAP.md`

  - Move Phase 6 tasks to completed
  - Add future enhancements section

- [ ] Create user guide (optional)
  - How to add volunteers
  - How to manage skills/background checks
  - How to schedule shifts

---

## TASK EXECUTION ORDER

**Current Position:** Phase 3, Task 2 (Create Volunteer Form)

**Next 10 Tasks:**

1. Create `/components/dashboard/volunteers/volunteer-form.tsx`
2. Create `/components/dashboard/volunteers/create-volunteer-dialog.tsx`
3. Update `/components/dashboard/volunteers/volunteers-client.tsx` (add button)
4. Test: Add a volunteer, verify it appears in directory
5. Create `/app/church/[slug]/admin/volunteer/[id]/page.tsx`
6. Create `/components/dashboard/volunteers/volunteer-detail-client.tsx`
7. Create `/components/dashboard/volunteers/volunteer-overview-tab.tsx`
8. Create `/components/dashboard/volunteers/edit-volunteer-dialog.tsx`
9. Test: View volunteer detail, edit volunteer
10. Create `/components/dashboard/volunteers/skills-tab.tsx`

---

## ESTIMATES (For Planning Only - Not Blocking)

- Phase 3: ~15-20 components
- Phase 4: ~8-10 components
- Phase 5: ~10-12 components
- Phase 6: ~2-3 files
- Phase 7: Testing & docs

**Total:** ~35-45 components + testing

---

## DECISION LOG

- Using TanStack Table pattern (established in payments)
- Using shadcn Dialog for all forms
- Using optimistic locking for concurrent edits
- Using Zod for form validation
- Following server actions pattern (no prop drilling)
- All dates in ISO format, displayed with date-fns
