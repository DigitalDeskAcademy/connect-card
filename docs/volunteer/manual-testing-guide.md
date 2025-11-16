# Volunteer Management - Manual Testing Guide

**Environment:** Volunteer worktree on port 3001
**Database:** `ep-bitter-recipe-ad3v8ovt` (volunteer feature branch)
**Test User:** `test@playwright.dev` (Church Owner)
**Login URL:** `http://localhost:3001/church/newlife/login`

---

## Test Group 1: Login & Navigation (5 min)

**Goal:** Verify basic access and navigation works

- [ ] Navigate to `http://localhost:3001/church/newlife/login`
- [ ] Enter email: `test@playwright.dev`
- [ ] Check dev server console for OTP code
- [ ] Complete login successfully
- [ ] Click "Volunteer" in sidebar
- [ ] Verify lands on volunteer directory page at `/church/newlife/admin/volunteer`
- [ ] Verify page title shows "Volunteer" in header

**Pass Criteria:** Can log in and access volunteer directory without errors

---

## Test Group 2: Volunteer Directory - Search & Sort (5 min)

**Goal:** Verify table search and sorting works

**Search:**

- [ ] If volunteers exist, type a name in search box
- [ ] Verify table filters to matching volunteers
- [ ] Clear search, verify all volunteers return

**Sorting:**

- [ ] Click "Name" column header
- [ ] Verify sorts A→Z (ascending arrow shows)
- [ ] Click "Name" again
- [ ] Verify sorts Z→A (descending arrow shows)
- [ ] Click "Status" column
- [ ] Verify sorts by status alphabetically
- [ ] Click "Start Date" column
- [ ] Verify sorts by date (newest first)

**Pass Criteria:** Search filters correctly, sorting changes order as expected

---

## Test Group 3: Create Volunteer - Happy Path (10 min)

**Goal:** Successfully create a volunteer with minimal required fields

- [ ] Click "New Volunteer" button in header
- [ ] Verify dialog opens with form title "Create Volunteer Profile"
- [ ] Select "Church Member" from dropdown (pick any member)
- [ ] Status should default to "Active"
- [ ] Start Date should default to today
- [ ] Background Check Status should default to "Not Started"
- [ ] Click "Create Volunteer"
- [ ] Verify success toast: "Volunteer profile created successfully"
- [ ] Verify dialog closes
- [ ] Verify new volunteer appears in directory table
- [ ] Verify volunteer row shows correct member name and status

**Pass Criteria:** Can create volunteer with just required fields, appears in directory

---

## Test Group 4: Create Volunteer - Conditional Fields (10 min)

**Goal:** Verify conditional fields show/hide correctly

**Test Status = Inactive:**

- [ ] Open "New Volunteer" dialog
- [ ] Change Status to "Inactive"
- [ ] Verify "End Date" field appears
- [ ] Verify "Reason for Inactivity" textarea appears
- [ ] Change Status back to "Active"
- [ ] Verify both fields disappear

**Test Background Check = Cleared:**

- [ ] Change "Background Check Status" to "Cleared"
- [ ] Verify "Background Check Date" field appears
- [ ] Verify "Background Check Expiry" field appears
- [ ] Change back to "Not Started"
- [ ] Verify both fields disappear

**Test Multi-Campus Location:**

- [ ] If you see "Campus Location" dropdown, select "Bainbridge"
- [ ] Verify selection works
- [ ] (If only 1 location, this field won't appear - that's correct)

**Pass Criteria:** Conditional fields appear/disappear based on selections

---

## Test Group 5: Create Volunteer - Full Form (10 min)

**Goal:** Create volunteer with all optional fields filled

- [ ] Open "New Volunteer" dialog
- [ ] Fill ALL fields:
  - Church Member: (select one)
  - Status: "Active"
  - Start Date: (pick a date 6 months ago)
  - Emergency Contact Name: "Jane Smith"
  - Emergency Contact Phone: "+12065551234"
  - Background Check Status: "Cleared"
  - Background Check Date: (1 year ago)
  - Background Check Expiry: (1 year from now)
  - Notes: "Experienced volunteer, prefers morning shifts"
- [ ] Click "Create Volunteer"
- [ ] Verify success toast appears
- [ ] Navigate to volunteer detail page (click on the volunteer)
- [ ] Verify ALL data displays correctly in Overview tab

**Pass Criteria:** All fields save and display correctly

---

## Test Group 6: Volunteer Detail - Overview Tab (5 min)

**Goal:** Verify detail page displays volunteer information correctly

- [ ] Click on any volunteer in directory
- [ ] Verify URL changes to `/church/newlife/admin/volunteer/[id]`
- [ ] Verify 5 tabs appear at top
- [ ] Verify "Overview" tab is selected by default
- [ ] Verify 4 cards display:
  - **Profile Information:** Status badge, Start Date, Church Member name, Edit button
  - **Background Check:** Status badge with correct color
  - **Emergency Contact:** Shows name and phone (or "No emergency contact")
  - **Contact Information:** Shows email, phone, address from member record

**Pass Criteria:** Overview tab shows all volunteer data in organized cards

---

## Test Group 7: Edit Volunteer (10 min)

**Goal:** Successfully edit volunteer and verify optimistic locking

**Basic Edit:**

- [ ] On Overview tab, click "Edit" button
- [ ] Verify dialog opens with pre-filled data
- [ ] Change Status from "Active" to "On Break"
- [ ] Click "Save Changes"
- [ ] Verify success toast appears
- [ ] Verify dialog closes
- [ ] Verify Overview tab shows updated status

**Optimistic Locking Test:**

- [ ] Open same volunteer in TWO browser tabs/windows
- [ ] Tab 1: Click Edit, change Emergency Contact Name, Save
- [ ] Tab 2: Click Edit, change Notes field, try to Save
- [ ] Verify Tab 2 shows error about data being modified
- [ ] Refresh Tab 2 page
- [ ] Verify sees latest data from Tab 1

**Pass Criteria:** Edits save correctly, version conflicts are detected

---

## Test Group 8: Skills Tab - Empty State (3 min)

**Goal:** Verify empty state when no skills exist

- [ ] Navigate to volunteer detail page (or stay on current)
- [ ] Click "Skills & Certifications" tab
- [ ] Verify tab count badge shows "(0)"
- [ ] Verify empty state displays:
  - Certificate icon
  - "No skills added yet" heading
  - Helpful description text
  - "Add First Skill" button

**Pass Criteria:** Empty state is friendly and actionable

---

## Test Group 9: Add Skill - Basic (10 min)

**Goal:** Add a simple skill without verification

- [ ] On Skills tab, click "Add Skill" (or "Add First Skill")
- [ ] Verify dialog opens: "Add Skill or Certification"
- [ ] Enter Skill Name: "Sound Engineering"
- [ ] Select Proficiency: "Advanced"
- [ ] Leave "Verified or Certified" unchecked
- [ ] Leave Notes empty
- [ ] Click "Add Skill"
- [ ] Verify success toast: "Skill added successfully"
- [ ] Verify dialog closes
- [ ] Verify skill card appears with:
  - Title: "Sound Engineering"
  - Proficiency badge: "Advanced" (darker color)
  - No "Verified" badge
  - No dates shown
  - Delete button (trash icon)
- [ ] Verify tab count badge shows "(1)"

**Pass Criteria:** Skill adds and displays correctly without verification fields

---

## Test Group 10: Add Skill - With Verification (10 min)

**Goal:** Add a certified skill with verification and expiry dates

- [ ] Click "Add Skill" button
- [ ] Enter Skill Name: "CPR Certified"
- [ ] Select Proficiency: "Expert"
- [ ] Check "Verified or Certified" checkbox
- [ ] Verify "Verification Date" field appears
- [ ] Verify "Expiry Date" field appears
- [ ] Click "Verification Date", select date from 1 year ago
- [ ] Try selecting future date (should be disabled)
- [ ] Click "Expiry Date", select date 1 year from now
- [ ] Try selecting past date (should be disabled)
- [ ] Enter Notes: "American Red Cross certification"
- [ ] Click "Add Skill"
- [ ] Verify skill card shows:
  - Title: "CPR Certified"
  - Green "Verified" badge
  - Proficiency badge: "Expert"
  - Verified date with calendar icon
  - Expires date with calendar icon
  - Notes text at bottom
- [ ] Verify tab count badge shows "(2)"

**Pass Criteria:** Verified skill adds with all dates and displays correctly

---

## Test Group 11: Skills - Multiple & Display (5 min)

**Goal:** Add several skills and verify grid layout

- [ ] Add 2 more skills with different proficiency levels:
  - "Childcare" - Intermediate, not verified
  - "Worship Leading" - Beginner, not verified
- [ ] Verify skills display in 2-column grid on desktop
- [ ] Verify each skill has different proficiency badge colors:
  - Expert/Advanced: darker/default color
  - Intermediate: secondary gray
  - Beginner: outlined
- [ ] Verify tab badge shows "(4)"

**Pass Criteria:** Multiple skills display in organized grid with correct badge styling

---

## Test Group 12: Delete Skill (5 min)

**Goal:** Remove a skill and verify confirmation

- [ ] Click trash icon on "Sound Engineering" skill
- [ ] Verify browser confirmation dialog: "Are you sure you want to remove this skill?"
- [ ] Click "Cancel"
- [ ] Verify skill NOT deleted (still shows)
- [ ] Click trash icon again
- [ ] Click "OK" to confirm
- [ ] Verify success toast: "Skill removed successfully"
- [ ] Verify skill disappears from list
- [ ] Verify tab count badge decrements to "(3)"

**Pass Criteria:** Delete requires confirmation, skill removes correctly

---

## Test Group 13: Form Validation (5 min)

**Goal:** Verify form validation works

**Create Volunteer Validation:**

- [ ] Open "New Volunteer" dialog
- [ ] Click "Create Volunteer" without filling any fields
- [ ] Verify validation errors show for required fields:
  - Church Member
  - Status
  - Start Date
  - Background Check Status
- [ ] Fill required fields, submit
- [ ] Verify success (validation passes)

**Add Skill Validation:**

- [ ] Open "Add Skill" dialog
- [ ] Leave Skill Name empty, click "Add Skill"
- [ ] Verify error: "Skill name must be at least 2 characters"
- [ ] Enter "A" (1 character), try submit
- [ ] Verify error still shows
- [ ] Enter "AB" (2 characters), submit
- [ ] Verify success (validation passes)

**Pass Criteria:** Required fields and minimum length validation works

---

## Test Group 14: Multi-Campus Permissions (10 min)

**Goal:** Verify location-based filtering works

**As Church Owner (sees all):**

- [ ] Currently logged in as `test@playwright.dev`
- [ ] Create volunteer assigned to "Bainbridge" location
- [ ] Create volunteer assigned to "Bremerton" location
- [ ] Verify both volunteers appear in directory

**As Staff (sees only one location):**

- [ ] Log out
- [ ] Log in as `staff@newlife.test` (assigned to Bremerton)
- [ ] Navigate to volunteers
- [ ] Verify ONLY sees volunteers from Bremerton location
- [ ] Try directly accessing Bainbridge volunteer via URL (copy ID from earlier)
- [ ] Verify 404 or Access Denied

**Pass Criteria:** Location-based access control works correctly

---

## Test Group 15: Tab Navigation (3 min)

**Goal:** Verify all tabs are accessible

- [ ] Navigate to any volunteer detail page
- [ ] Click "Skills & Certifications" tab
- [ ] Verify tab content changes
- [ ] Click "Availability & Schedule" tab
- [ ] Verify shows "Coming soon" placeholder
- [ ] Click "Shift History" tab
- [ ] Verify shows "Coming soon" placeholder
- [ ] Click "Notes" tab
- [ ] Verify shows "Coming soon" placeholder
- [ ] Click "Overview" tab
- [ ] Verify returns to overview content

**Pass Criteria:** All tabs are clickable and show correct content

---

## Bug Reporting Template

If you find issues during testing:

```markdown
**Test Group:** [Number and name]
**Issue:** Brief description
**Steps:**

1. Step 1
2. Step 2
   **Expected:** What should happen
   **Actual:** What happened
   **Browser Console Errors:** (if any)
```

---

## Testing Progress Tracker

Mark completed test groups:

- [ ] Group 1: Login & Navigation
- [ ] Group 2: Directory - Search & Sort
- [ ] Group 3: Create Volunteer - Happy Path
- [ ] Group 4: Create Volunteer - Conditional Fields
- [ ] Group 5: Create Volunteer - Full Form
- [ ] Group 6: Detail - Overview Tab
- [ ] Group 7: Edit Volunteer
- [ ] Group 8: Skills Tab - Empty State
- [ ] Group 9: Add Skill - Basic
- [ ] Group 10: Add Skill - With Verification
- [ ] Group 11: Skills - Multiple & Display
- [ ] Group 12: Delete Skill
- [ ] Group 13: Form Validation
- [ ] Group 14: Multi-Campus Permissions
- [ ] Group 15: Tab Navigation

**Total Time Estimate:** ~2 hours for complete testing
