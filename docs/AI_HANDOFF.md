# AI Handoff - Volunteer Management Feature

**Date:** 2025-11-21
**Status:** Phase 2 In Progress (50% complete)
**Branch:** `feature/volunteer-management`
**Worktree:** `/home/digitaldesk/Desktop/connect-card/volunteer`

---

## 🎯 Current State Summary

### Completed Work (This Session)

1. **Volunteer Category Synchronization** ✅
   - Synchronized volunteer categories between Review Queue and Volunteer Management
   - Updated `/lib/types/connect-card.ts` to import categories from single source of truth
   - Commit: `bf4b9b4` - "fix: synchronize volunteer categories across Review Queue and management"

2. **Row Click Navigation** ✅
   - Implemented clickable table rows to navigate to volunteer detail pages
   - Event filtering prevents navigation when clicking checkboxes/buttons
   - Visual feedback with hover states and transitions
   - Type-safe implementation (no explicit `any`)
   - Commit: `faaa1e7` - "feat: add row click navigation to volunteer detail pages"

### Git Status

```bash
Branch: feature/volunteer-management
Commits ahead: 3 (ready to push when PR is created)
  - bf4b9b4: fix: synchronize volunteer categories
  - faaa1e7: feat: add row click navigation

Unstaged changes:
  - Various files modified during development (not critical, can be reverted if needed)
```

---

## 📋 Remaining Phase 2 Tasks

**Priority Order:**

### 1. Tab Navigation (HIGHEST PRIORITY - Foundational)
**Why First:** Enables the core differentiator - "Pending Volunteers" workflow

**Implementation:**
- Add URL-based navigation tabs using `NavTabs` component (see ADR-006)
- Two tabs: "All Volunteers" (default) / "Pending Volunteers"
- Location: `/app/church/[slug]/admin/volunteer/page.tsx`
- Pattern: Same as contacts page with tabs

**Reference:**
- ADR-006 in `/docs/technical/architecture-decisions.md`
- Existing tab pattern: `/app/church/[slug]/admin/contacts/page.tsx`

**Files to Modify:**
- `/app/church/[slug]/admin/volunteer/page.tsx` - Add tab navigation
- `/components/dashboard/volunteers/volunteers-client.tsx` - Support tab filtering

**Acceptance Criteria:**
- [ ] URL reflects active tab (`?tab=all` or `?tab=pending`)
- [ ] Bookmarkable URLs work correctly
- [ ] "All Volunteers" shows volunteers with status ACTIVE, INACTIVE
- [ ] "Pending Volunteers" shows volunteers with status PENDING
- [ ] Tab counts display (e.g., "Pending (5)")

---

### 2. Pending Volunteers Workflow (HIGH PRIORITY - Core Feature)
**Why Next:** This is our competitive advantage vs Planning Center/Breeze

**Implementation:**
- Create "Process Volunteer" action button in pending tab
- Dialog to assign categories, set background check status
- Update volunteer status from PENDING → ACTIVE
- Optionally trigger "Send Onboarding Package" (Phase 3 feature)

**Reference:**
- Vision doc: Lines 41-48 (Step 2: Shows in "Pending Volunteers" Tab)
- Vision doc: Lines 50-62 (Step 3: Automated Onboarding)

**Files to Create:**
- `/components/dashboard/volunteers/process-volunteer-dialog.tsx`
- `/actions/volunteers/process-volunteer.ts`

**Acceptance Criteria:**
- [ ] "Process" button visible in pending volunteers tab
- [ ] Dialog shows volunteer info (name, email, phone)
- [ ] Can assign volunteer categories (multi-select)
- [ ] Can set background check status
- [ ] Status changes from PENDING → ACTIVE after processing
- [ ] Volunteer moves from "Pending" tab to "All" tab

---

### 3. Category Filtering (MEDIUM PRIORITY - Usability)
**Why Next:** Helps staff find volunteers by ministry quickly

**Implementation:**
- Multi-select dropdown for volunteer categories
- Filter volunteers by assigned categories (AND logic or OR logic?)
- Location: Action bar in data table

**Reference:**
- Vision doc: Lines 152-157 (Tab 1 features)
- Vision doc: Lines 177-183 (Tab 2 features)

**Files to Modify:**
- `/components/dashboard/volunteers/data-table.tsx` - Add category filter dropdown
- Reuse existing `statusFilter` pattern as reference

**Acceptance Criteria:**
- [ ] Multi-select dropdown shows all volunteer categories
- [ ] Can select multiple categories to filter by
- [ ] "Clear filters" button resets category selection
- [ ] Filter persists when switching between tabs
- [ ] Shows count: "Showing 15 of 45 volunteers"

---

### 4. CSV Export (MEDIUM PRIORITY - Integration)
**Why Next:** Enables Planning Center/Breeze integration

**Implementation:**
- Export button in action bar
- Generate CSV with industry-standard format
- Export selected volunteers (checkbox) or all filtered volunteers

**Reference:**
- Vision doc: Lines 184-190 (Export Format)
- Vision doc: Lines 348-401 (Export Queue Architecture)

**CSV Format:**
```csv
First Name, Last Name, Email, Phone, Background Check Status, Background Check Date, Background Check Expiration, Categories, Start Date, Emergency Contact Name, Emergency Contact Phone
```

**Files to Create:**
- `/components/dashboard/volunteers/export-volunteers-button.tsx`
- `/actions/volunteers/export-volunteers.ts`

**Acceptance Criteria:**
- [ ] Export button visible in action bar
- [ ] Can export selected volunteers (checkbox selection)
- [ ] Can export all filtered volunteers (if no selection)
- [ ] CSV format matches Planning Center/Breeze import format
- [ ] File downloads with name: `volunteers-{church-slug}-{date}.csv`

---

### 5. Background Check Actions (LOWER PRIORITY - Phase 3 Feature)
**Why Later:** Requires email integration (GHL or similar)

**Implementation:**
- "Send Background Check Info" button for volunteers with NOT_STARTED status
- Status changes to IN_PROGRESS when email sent
- Email template with background check instructions

**Reference:**
- Vision doc: Lines 194-227 (Background Check Workflow)

**Files to Create:**
- `/components/dashboard/volunteers/send-background-check-button.tsx`
- `/actions/volunteers/send-background-check-info.ts`
- Email template (future - Phase 3)

**Note:** This may be deferred to Phase 3 if it requires GHL integration for email sending.

---

### 6. UI Polish (LOWER PRIORITY - Visual)
**Why Later:** Non-blocking, cosmetic improvements

**Implementation:**
- Add bottom border to table (prevent "open" look)
- Ensure horizontal scroll on mobile for wide tables
- Responsive column hiding on smaller screens

**Files to Modify:**
- `/components/dashboard/volunteers/data-table.tsx` - CSS adjustments

---

## 📚 Key Documentation References

### Primary Vision Document
**Location:** `/docs/volunteer-feature-vision.md`

**Key Sections:**
- Lines 9-26: The Differentiator (why we're building this)
- Lines 29-68: Core User Journey (workflow from connect card → onboarding)
- Lines 135-160: Two-Tab Structure (Pending vs All Volunteers)
- Lines 288-306: Development Phases (current progress)

### Architecture Decisions
**Location:** `/docs/technical/architecture-decisions.md`

**Relevant ADRs:**
- ADR-006: URL-Based Navigation Tabs (lines 386-518)
- ADR-010: Volunteer Management Schema (lines 815-999)

### Project Patterns
**Location:** `/docs/essentials/coding-patterns.md`

**Key Patterns:**
- PageContainer usage (lines 144-387)
- Server Actions pattern (lines 46-111)
- Multi-tenant data scoping (lines 571-669)

---

## 🚀 Quick Start for Next Session

### 1. Verify Environment
```bash
cd /home/digitaldesk/Desktop/connect-card/volunteer
git status  # Confirm on feature/volunteer-management branch
pnpm dev    # Start dev server on port 3001 (worktree uses 3001)
```

### 2. Review Current State
```bash
# View recent commits
git log --oneline -5

# Check what's staged vs unstaged
git status
```

### 3. Read Key Documents (In Order)
1. `/docs/AI_HANDOFF.md` (this file)
2. `/docs/volunteer-feature-vision.md` (full feature spec)
3. `/docs/technical/architecture-decisions.md` (ADR-006, ADR-010)

### 4. Start with Tab Navigation
- Read ADR-006 for URL-based tab pattern
- Reference `/app/church/[slug]/admin/contacts/page.tsx` for implementation
- Modify `/app/church/[slug]/admin/volunteer/page.tsx`

---

## 🎯 Success Criteria for Phase 2 Complete

**MVP Definition:**
- [ ] Tab navigation (All Volunteers / Pending Volunteers)
- [ ] Pending volunteers workflow ("Process" action)
- [ ] Category filtering (multi-select)
- [ ] CSV export (PCO/Breeze format)
- [ ] Background check actions (if time permits)

**When to Create PR:**
After completing items 1-4 above. Background check actions can be deferred to Phase 3.

---

## 🐛 Known Issues / Technical Debt

1. **Arcjet Mode Configuration** - Currently in DRY_RUN for development, needs LIVE mode config check
2. **Playwright Tests** - Multiple background test processes running (can be killed)
3. **Husky Deprecation Warning** - Pre-commit hook works but needs v10 migration

**None of these are blocking for Phase 2 work.**

---

## 💡 Tips for Next Session

1. **Tab Navigation is Foundational** - Do this first, it unlocks Pending Volunteers workflow
2. **Follow Existing Patterns** - Contacts page has tabs, prayer requests has similar table structure
3. **Test with Real Data** - Volunteer feature has seeded data, use dev server to test
4. **Commit Frequently** - Small, focused commits like we did this session
5. **Update This Handoff** - As work progresses, update this file for future sessions

---

## 📞 Questions for User (When Session Starts)

Before starting implementation, clarify:

1. **Category Filtering Logic:** AND or OR when multiple categories selected?
   - AND: Show volunteers who have ALL selected categories
   - OR: Show volunteers who have ANY selected category (recommended)

2. **Export Scope:** What should export button export?
   - Option A: Export all filtered volunteers (current view)
   - Option B: Export selected volunteers (checkbox selection)
   - Option C: Both (dropdown menu: "Export Selected" / "Export All")

3. **Background Check Priority:** Phase 2 or defer to Phase 3?
   - If Phase 2: Needs email sending capability (mock for now?)
   - If Phase 3: Focus on tabs, filtering, export first

---

**Last Updated:** 2025-11-21
**Next Session:** Continue with Tab Navigation → Pending Volunteers → Category Filter → CSV Export
