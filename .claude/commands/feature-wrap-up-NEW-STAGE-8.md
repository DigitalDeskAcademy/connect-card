# Stage 8: Documentation Update (REQUIRED - Industry Standard)

**Purpose:** Ensure documentation ALWAYS reflects reality. Every PR must update relevant docs.

**Philosophy:** Documentation drift causes AI confusion and wasted hours. Make doc updates **required, comprehensive, and validated**.

---

## Step 20: Switch to Main Worktree

```bash
cd /path/to/main-worktree
git pull origin main  # Get latest merged PR
```

Verify you're on main and synced:

```bash
git branch --show-current  # Should show "main"
git status                 # Should be clean
```

---

## Step 21: Documentation Impact Analysis

**CRITICAL:** Analyze what was built vs what was planned to identify ALL affected docs.

### 21.1: Read the Merged PR

```bash
# Get PR details
gh pr view <pr-number> --json title,body,files

# See what was actually built
git log -1 --stat
```

Extract:

- Feature area (connect-cards, volunteer, prayer, member-management)
- What was built (new components, server actions, database changes)
- Scope changes (did direction change from original plan?)

### 21.2: Identify Affected Documentation

**Always update:**

1. `docs/STATUS.md` - Health dashboard
2. `docs/ROADMAP.md` - Priority list

**Conditionally update:** 3. `docs/features/{feature}/vision.md` - If scope changed or feature completed 4. Remove stale content - TODOs, planning docs, outdated references

### 21.3: Read Current Documentation State

```bash
# Read all potentially affected docs
cat docs/STATUS.md | grep -A 20 "In Progress"
cat docs/ROADMAP.md | grep -A 10 "Active Work"
cat docs/features/<feature>/vision.md | head -50
```

**Analyze:**

- Is feature still marked "In Progress" in STATUS.md?
- Is feature still in "Active Work" in ROADMAP.md?
- Does feature vision match what was actually built?
- Are there TODOs for features just completed?

---

## Step 22: Generate Documentation Updates

**Generate precise diffs for each affected file.**

### 22.1: STATUS.md Updates

**Rule:** Move feature from "In Progress" → "Complete" with summary.

**Template:**

```markdown
## ✅ Working Features

### <Feature Name> ✅ COMPLETE (<Month> <Year>)

**<One-line description>**

- <Key accomplishment 1>
- <Key accomplishment 2>
- <Key accomplishment 3>

**See `/docs/features/<feature>/vision.md` for full details**
```

**Example Update:**

```diff
-## 🔄 In Progress
-
-### Volunteer Management UI
-
-- 🔄 **Volunteer Directory** - Building TanStack Table UI
-- 🔄 **Create Forms** - Dialog-based volunteer creation

+## ✅ Working Features
+
+### Volunteer Management ✅ COMPLETE (Nov 2025)
+
+**Volunteer directory and CRUD operations**
+
+- Volunteer directory with TanStack Table (sorting, search, filtering)
+- Create volunteer form with validation (emergency contacts, background checks)
+- Volunteer detail page with tabbed interface and edit capability
+- Skills management UI with proficiency levels
+
+**See `/docs/features/volunteer-management/vision.md` for full details**
```

**Also check "Blockers" section** - remove if PR resolved blockers.

### 22.2: ROADMAP.md Updates

**Rule:** Mark task/phase as ✅ COMPLETE, update "Active Work" section.

**Template:**

```diff
 ### Active Work

-- **<Feature>** 🔄 IN PROGRESS - <description>
+- **<Feature>** ✅ COMPLETE - <what was delivered>
```

**If phase completed, update "Current Phase":**

```diff
-**Current Phase:** Phase 3 (Production Launch Prep)
+**Current Phase:** Phase 4 (Member Management)
```

**Move completed tasks to "Completed Phases" if major milestone:**

```diff
+### Phase 3: Production Launch ✅ COMPLETE (Nov 2025)
+
+**Goal:** Launch to first pilot church with production-ready system
+
+- ✅ Connect Card Enhancements - Review queue, batch management
+- ✅ Team Management - Multi-campus permissions
+- ✅ Volunteer Management - Directory, forms, detail pages
```

### 22.3: Feature Vision Updates (If Scope Changed)

**Only update if:**

- Feature direction changed during development
- Planned features were cut or modified
- New features were added that weren't planned

**Updates:**

1. **Status header** - Change from "IN PROGRESS" → "COMPLETE"
2. **Current Status section** - Mark completed items with ✅
3. **Planned Features** - Move completed checkboxes to done
4. **Next Steps** - Remove if fully complete, update if partial

**Example:**

```diff
 # Volunteer Management - Product Vision

-**Status:** 🔄 **IN PROGRESS**
+**Status:** ✅ **COMPLETE - Phase 3**
 **Last Updated:** 2025-11-16

 ## 🚀 Current Status (Phase 3)

-### Volunteer Directory (IN PROGRESS)
+### Volunteer Directory ✅ COMPLETE

-- [ ] Directory with TanStack Table
-- [ ] Create volunteer form
-- [ ] Volunteer detail page
+- [x] Directory with TanStack Table (sorting, search, filtering)
+- [x] Create volunteer form with validation
+- [x] Volunteer detail page with tabbed interface
+- [x] Edit volunteer dialog with optimistic locking
+- [x] Skills management UI
```

### 22.4: Stale Content Cleanup

**Search for stale references to completed feature:**

```bash
# Find TODOs related to feature
grep -r "TODO.*volunteer" docs/ --include="*.md"

# Find "planned" or "in progress" references
grep -r "planned.*volunteer\|in progress.*volunteer" docs/ --include="*.md" -i

# Find outdated status markers
grep -r "🔄.*volunteer\|⚠️.*volunteer" docs/ --include="*.md"
```

**Remove or update stale content:**

- TODOs that were just completed
- "Planned for Phase X" text for features now built
- Outdated architecture notes
- References to old approaches that were changed

---

## Step 23: Show Documentation Diff & Get Approval

**Present comprehensive diff to user with color-coded changes:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 DOCUMENTATION UPDATE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This PR completed: <Feature Name>
PR #<number>: <PR title>

The following documentation MUST be updated to reflect reality:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 1. docs/STATUS.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Move from "In Progress" → "Complete"

[Show exact diff with - and + markers]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 2. docs/ROADMAP.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Mark Phase 3 task as complete

[Show exact diff]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 3. docs/features/volunteer-management/vision.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Update status and mark completed features

[Show exact diff]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️  4. Stale Content Cleanup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMOVE: Outdated TODOs and planning text

[List files with stale content]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
- Files to update: 3
- Lines added: <count>
- Lines removed: <count>
- Stale content cleaned: <count> references

⚠️  Documentation updates are REQUIRED for every PR.
    Skipping causes documentation drift and confuses future AI sessions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTIONS:

1. Apply all updates (RECOMMENDED)
   → Updates all docs, commits, pushes to main

2. Let me edit the proposed changes
   → Review and modify before applying

3. Skip documentation update (NOT RECOMMENDED)
   → Causes documentation drift, requires manual cleanup later

What would you like to do? (1/2/3)
```

### Handle User Response:

#### Option 1: Apply All Updates (RECOMMENDED)

```bash
# Apply all changes
<apply each diff to respective file>

# Stage all doc changes
git add docs/STATUS.md docs/ROADMAP.md docs/features/*/vision.md

# Verify staged changes
git diff --cached --stat

# Commit
git commit -m "docs: update STATUS/ROADMAP/vision after <feature> merge (PR #<number>)

- Mark <feature> as complete in STATUS.md
- Update ROADMAP.md active work section
- Update feature vision status and completed items
- Remove stale TODOs and planning references

Ensures documentation reflects actual state after PR #<number> merge."

# Push
git push origin main

# Verify
git log -1 --oneline
```

Show success:

```
✅ DOCUMENTATION UPDATED

All documentation now reflects the actual state of the codebase.

Committed: docs: update STATUS/ROADMAP/vision after <feature> merge (PR #<number>)
Pushed to: main
```

#### Option 2: Edit Proposed Changes

Ask user:

```
Which file would you like to edit?

1. STATUS.md
2. ROADMAP.md
3. features/<feature>/vision.md
4. All of them

Choice: _
```

For each file:

- Show current proposed diff
- Ask: "What changes would you like?"
- Regenerate based on feedback
- Show updated diff
- Confirm: "Apply this version? (yes/no)"

Once all edits confirmed, apply and commit.

#### Option 3: Skip Documentation Update

**Show strong warning:**

```
⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️

Skipping documentation updates is STRONGLY DISCOURAGED.

CONSEQUENCES:
- STATUS.md won't reflect current state
- ROADMAP.md will show incorrect priorities
- Feature visions will be stale
- Future AI sessions will waste hours on wrong information
- Next developer will be confused about project state

This is the ROOT CAUSE of documentation drift you just fixed.

Are you ABSOLUTELY SURE you want to skip? (yes/no)
```

If user still says yes:

```bash
# Add comment to PR about skipped docs
gh pr comment <pr-number> --body "⚠️ **Documentation updates skipped**

Manual update required:
- [ ] Update STATUS.md
- [ ] Update ROADMAP.md
- [ ] Update feature vision docs

@<username> Please update docs manually to prevent drift."

echo "⚠️  Documentation update skipped. Added reminder to PR."
echo "   You'll need to update docs manually later."
```

---

## Step 24: Documentation Validation

**After committing docs, validate they match reality:**

### 24.1: Check for Stale References

```bash
# Search for TODOs related to completed feature
STALE_TODOS=$(grep -r "TODO.*<feature-keyword>" docs/ --include="*.md" || echo "none")

# Search for "planned" references
STALE_PLANNED=$(grep -ri "planned.*<feature-keyword>" docs/ --include="*.md" || echo "none")

# Search for status markers that should be updated
STALE_STATUS=$(grep -r "🔄.*<feature-keyword>\|⚠️.*<feature-keyword>" docs/ --include="*.md" || echo "none")
```

### 24.2: Validate Last Updated Dates

```bash
# Check STATUS.md last updated
STATUS_DATE=$(grep "Last Updated" docs/STATUS.md | cut -d: -f2 | xargs)

# Check ROADMAP.md last updated
ROADMAP_DATE=$(grep "Last Updated" docs/ROADMAP.md | cut -d: -f2 | xargs)

# Should both be today
TODAY=$(date +%Y-%m-%d)
```

### 24.3: Validate Feature Status Consistency

```bash
# Check feature appears in STATUS.md complete section
grep -A 20 "Working Features" docs/STATUS.md | grep -i "<feature>" > /dev/null

# Check ROADMAP marks feature complete
grep "COMPLETE.*<feature>\|<feature>.*COMPLETE" docs/ROADMAP.md > /dev/null
```

### 24.4: Show Validation Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENTATION VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Stale Content Check:
   - No stale TODOs found for this feature
   - No "planned" references remaining
   - No outdated status markers (🔄, ⚠️)

✅ Last Updated Dates:
   - STATUS.md: 2025-11-16 (today)
   - ROADMAP.md: 2025-11-16 (today)

✅ Feature Status Consistency:
   - Feature marked complete in STATUS.md ✅
   - Feature marked complete in ROADMAP.md ✅
   - Feature vision updated ✅

✅ Cross-Reference Check:
   - STATUS.md links to feature vision ✅
   - ROADMAP.md references correct phase ✅
   - No contradictory status markers ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL VALIDATION CHECKS PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation is up-to-date and consistent with codebase reality.
Future AI sessions will have accurate context! 🎉
```

**If validation fails:**

```
⚠️  VALIDATION WARNINGS

Found issues:
- 3 stale TODOs still reference volunteer feature
  → Files: docs/technical/integrations.md:45, docs/STATUS.md:102

- STATUS.md last updated: 2025-11-10 (6 days old)
  → Should be updated to today's date

Fix these issues now? (yes/no)
```

---

## Step 25: Final Documentation State Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DOCUMENTATION UPDATE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATED FILES:
✅ docs/STATUS.md - Feature moved to "Complete"
✅ docs/ROADMAP.md - Phase 3 marked complete
✅ docs/features/volunteer-management/vision.md - Status updated

COMMIT:
📝 docs: update STATUS/ROADMAP/vision after volunteer UI merge (PR #26)
🔗 https://github.com/org/repo/commit/<sha>

VALIDATION:
✅ All checks passed
✅ No stale content remaining
✅ Docs reflect current reality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT AI SESSION WILL HAVE ACCURATE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status dashboards (STATUS.md, ROADMAP.md) are current
Feature visions match what was actually built
No contradictory or stale planning text

Ready to proceed to Stage 9 (Handoff Generation)
```

---

## Key Improvements Over Original Stage 8

**Original (Lines 464-505):**

- ❌ Optional ("Update docs now? yes/no")
- ❌ Only touches STATUS.md and ROADMAP.md
- ❌ No feature vision updates
- ❌ No stale content cleanup
- ❌ No validation checks
- ❌ No enforcement

**New Industry-Standard Stage 8:**

- ✅ **REQUIRED** - Strong warnings if skipped
- ✅ **Comprehensive** - STATUS, ROADMAP, feature visions, stale content
- ✅ **Systematic** - Analyzes what was built vs planned
- ✅ **Validated** - Checks for stale references, consistency
- ✅ **Enforced** - Won't complete without updates (or explicit skip with warning)
- ✅ **Visible** - Shows exact diffs before applying
- ✅ **Auditable** - Clean commit message with PR reference

**Result:** Documentation ALWAYS reflects reality. No more drift, no more AI confusion.

---

## When Documentation Updates Are NOT Needed

**Only skip if PR is:**

- Pure refactor (no feature changes)
- Bug fix (already-working feature)
- Code cleanup (no user-visible changes)
- Test additions (no new functionality)

**Even then, consider:**

- Does STATUS.md mention this as broken? → Update to show fixed
- Does ROADMAP.md list this as todo? → Mark complete
- Does this resolve a blocker? → Remove from blockers list

**Default: When in doubt, update docs.**
