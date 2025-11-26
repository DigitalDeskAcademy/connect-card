---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
model: claude-opus-4-5-20251101
---

# Feature Wrap-Up (Worktree-Aware + Optional Sync)

Complete feature workflow: build → commit → conflict forecast → PR → merge → sync worktrees → handoff.

**Key Features:**

- ✅ Detects merge conflicts BEFORE creating PR
- ✅ Updates main worktree after merge (always)
- ✅ **NEW:** Optional sync of other worktrees (safety-first with smart detection)
- ✅ Warns about active worktrees (uncommitted changes)
- ✅ NO doc updates in feature branch (prevents conflicts)
- ✅ Generates copyable handoff text

---

## Stage 1: Schema Sync Verification

**Purpose:** Prevent merge conflicts by ensuring your Prisma schema matches main before wrapping up.

**Step 1: Check Schema Sync**

Check if schema differs from main, and offer to sync if needed:

```bash
# Check schema sync (execute step-by-step, not as single block)
diff -q prisma/schema.prisma ../main/prisma/schema.prisma
```

If schemas differ, show the differences and ask user if they want to sync:

```bash
# Show differences
diff prisma/schema.prisma ../main/prisma/schema.prisma | head -30
```

If user wants to sync:

```bash
# Copy schema from main
cp ../main/prisma/schema.prisma prisma/schema.prisma

# Regenerate Prisma client
pnpm prisma generate
```

**Why This Matters:**

- Schema changes in main (from other merged features) will conflict with your branch
- Syncing now prevents PR conflicts and failed builds
- Worktree best practice: Always sync shared infrastructure before merging

---

## Stage 1.5: Documentation Enforcement (STRICT)

**Purpose:** Ensure feature worktrees ONLY edit their own `/docs/features/{feature}/` directory and never touch PLAYBOOK.md or PROJECT.md

**Step 1: Check for Forbidden Documentation Changes**

Detect if feature branch modified core documentation:

```bash
# Check if PLAYBOOK.md or PROJECT.md were modified
git diff main...HEAD --name-only | grep -E "docs/(PLAYBOOK|PROJECT)\.md"
```

If core docs were modified, **STOP IMMEDIATELY**:

```
🚨 DOCUMENTATION VIOLATION DETECTED 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This feature branch modified FORBIDDEN documentation:
- docs/PLAYBOOK.md (ONLY editable in main)
- docs/PROJECT.md (ONLY editable in main)

THESE ARE CORE DOCUMENTS THAT MUST NEVER BE EDITED IN FEATURE BRANCHES.

Why this is a problem:
1. Creates merge conflicts with other features
2. Violates single source of truth principle
3. Core docs should only update AFTER features merge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required Actions:

Option 1: REVERT changes to core docs (RECOMMENDED)
  → We'll remove the changes to PLAYBOOK/PROJECT
  → Keep your feature code changes
  → Continue with wrap-up

Option 2: MOVE content to feature docs
  → Extract your updates to /docs/features/{your-feature}/
  → Revert core doc changes
  → Apply to main AFTER merge

Option 3: ABORT wrap-up
  → Manually fix the issue
  → Run feature-wrap-up again

What would you like to do? (1/2/3)
```

If Option 1 (Revert):

```bash
# Revert changes to core docs
git checkout main -- docs/PLAYBOOK.md docs/PROJECT.md

# Stage the reversion
git add docs/PLAYBOOK.md docs/PROJECT.md

# Commit the fix
git commit -m "fix: revert forbidden changes to core documentation

Core docs (PLAYBOOK.md, PROJECT.md) must only be edited in main branch.
Moving content to feature docs or will apply after merge."
```

If Option 2 (Move):

```bash
# Show the changes that need to be moved
git diff main...HEAD docs/PLAYBOOK.md docs/PROJECT.md

# Ask user: "Where should this content go?"
# 1. /docs/features/{feature}/implementation.md
# 2. /docs/features/{feature}/notes.md
# 3. Let me create a new file

# Create/update the feature doc with the content
# Then revert core docs as in Option 1
```

**Step 2: Check Feature Documentation Scope**

Verify feature only edited its own docs:

```bash
# Get all doc changes
git diff main...HEAD --name-only | grep "^docs/"

# Check if any docs outside their feature directory
git diff main...HEAD --name-only | grep "^docs/" | grep -v "^docs/features/$(basename $(pwd))/"
```

If editing other feature's docs:

```
⚠️ DOCUMENTATION SCOPE VIOLATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This feature branch modified ANOTHER feature's documentation:

Modified files outside your scope:
- docs/features/prayer-management/vision.md
- docs/features/volunteer-management/vision.md

You should ONLY edit:
- /docs/features/{your-feature}/*

This prevents conflicts and maintains clear ownership.

Continue anyway? (not recommended) (yes/no)
```

**Step 3: Validate Documentation Structure**

If feature added new docs, ensure they follow structure:

```bash
# Check for .worktree directories (FORBIDDEN)
find . -type d -name ".worktree" 2>/dev/null
```

If .worktree found:

```
❌ FORBIDDEN: .worktree directories detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found .worktree directories that must be removed:
- .worktree/prayer/docs/

These directories:
- Are gitignored and don't travel with PRs
- Create confusion about where docs live
- Violate project documentation structure

Removing .worktree directories now...
```

```bash
# Remove all .worktree directories
rm -rf .worktree/

# Verify removal
ls -la | grep worktree || echo "✅ No .worktree directories found"
```

**Step 4: Documentation Compliance Report**

Show compliance status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENTATION COMPLIANCE CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core Docs (PLAYBOOK/PROJECT):      ✅ Not modified (correct)
Feature Docs Scope:                ✅ Only edited own feature docs
Documentation Structure:           ✅ No .worktree directories
Git-Native Structure:              ✅ Using /docs/ properly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DOCUMENTATION COMPLIANCE: PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature branch follows documentation rules.
Ready to proceed with quality verification.
```

**Documentation Rules Summary:**

| Rule                                     | Enforcement             |
| ---------------------------------------- | ----------------------- |
| NEVER edit PLAYBOOK.md in features       | AUTO-REVERT if detected |
| NEVER edit PROJECT.md in features        | AUTO-REVERT if detected |
| ONLY edit /docs/features/{your-feature}/ | WARNING if violated     |
| NO .worktree directories                 | AUTO-DELETE if found    |
| Update core docs AFTER merge in main     | Handled in Stage 8      |

---

## Stage 2: Quality Verification

**Step 1: Run Build**

```bash
pnpm build
```

If build fails:

- Report TypeScript errors with file:line references
- STOP workflow
- Ask: "Build failed. Fix errors? (yes/no)"

**Step 2: Run ESLint**

```bash
pnpm lint
```

If lint fails:

- Report errors/warnings
- Ask: "Run `pnpm lint --fix`? (yes/no)"

**Step 3: Check for Critical Issues**

Scan for:

- `console.log`/`console.error` statements
- `TODO`/`FIXME` in critical paths
- `.only()` in test files

If found, report and ask if acceptable to proceed.

---

## Stage 3: Commit Feature Code

**Step 4: Git Status**

```bash
git status
git diff --stat
```

Show user summary of changes.

**Step 5: Draft Commit Message**

Analyze changes and create commit:

```
<type>: <short summary>

<optional details>
```

**NO** AI attribution (CLAUDE.md policy)

**Step 6: Commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
<message>
EOF
)"
```

**Step 7: Verify**

```bash
git log -1 --oneline
git status
```

Should show clean working tree.

---

## Stage 4: Conflict Forecast & Analysis

**CRITICAL**: This project uses git worktrees. Multiple features modify docs simultaneously.

**Step 8: Analyze Potential Conflicts**

Get files changed in current branch:

```bash
git diff main...HEAD --name-only > /tmp/current-changes.txt
```

Check other worktrees:

```bash
git worktree list
```

For each other worktree, check for overlaps:

```bash
# Save current directory
cd /path/to/other-worktree

# Get files changed in that worktree
git diff main...HEAD --name-only > /tmp/other-changes.txt

# Find overlapping files
comm -12 <(sort /tmp/current-changes.txt) <(sort /tmp/other-changes.txt)
```

**Step 9: Generate Conflict Forecast**

Create forecast report and show to user:

```
⚠️  MERGE CONFLICT FORECAST

Detected potential conflicts with other feature branches:

HIGH RISK (Same files modified):
- tests/helpers/auth.ts (also modified in: volunteer)
  Strategy: COMBINE both changes during merge

EXPECTED (Documentation):
- docs/ROADMAP.md (also modified in: volunteer)
  Strategy: Keep both task lists, merge sections
- docs/STATUS.md (also modified in: volunteer)
  Strategy: Combine completion notes from both features

CLEAN (No conflicts):
- lib/data/prayer-requests.ts (feature-specific)
- components/dashboard/prayer-requests/* (feature-specific)

RECOMMENDATION:
These conflicts are EXPECTED in worktree workflow. During PR merge:
1. Resolve via GitHub UI (visual diff editor)
2. COMBINE content from both branches (don't replace)
3. Keep all feature documentation and code changes

Proceed with PR creation? (yes/no)
```

**If user says NO:**

- Ask what they'd like to adjust
- Offer to help resolve conflicts pre-merge
- Wait for confirmation before proceeding

---

## Stage 5: Pull Request

**Step 10: Push Branch**

```bash
git push origin <branch-name> -u
```

**Step 11: Generate PR Description**

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Draft PR:

```markdown
## Summary

<1-3 bullets describing feature>

## Changes

- <key files>
- <new functionality>

## Testing

<how to test>

## Merge Conflict Notes

<If conflicts detected in Stage 3>

⚠️ **Expected Conflicts**

This PR modifies files also changed in other feature branches:

- `tests/helpers/auth.ts` (volunteer branch)
- `docs/ROADMAP.md` (volunteer branch)

**Resolution Strategy**: COMBINE changes from both branches

- Auth file: Merge both improvements
- Docs: Keep all task lists and completion notes

## Checklist

- [x] Build passes
- [x] ESLint clean
- [x] Conflict forecast reviewed
- [x] Multi-tenant isolation verified
- [ ] Manual testing (if needed)
```

**Step 12: Create PR**

**NO** AI attribution (CLAUDE.md policy) - Keep PR descriptions clean and professional

```bash
gh pr create --title "<type>: <feature>" --body "$(cat <<'EOF'
<PR description>
EOF
)"
```

Store PR number for later.

---

## Stage 6: Testing & Merge

**Step 13: Manual Testing?**

Ask: "Need manual testing before merge? (yes/no)"

If YES:

- Show testing checklist
- Wait for confirmation

**Step 14: Merge PR**

Ask: "Ready to squash and merge? (yes/no)"

```bash
gh pr merge <pr-number> --squash --delete-branch
```

**Step 15: Verify Merge**

```bash
gh pr view <pr-number> --json state,mergedAt
```

Should show "MERGED" with timestamp.

---

## Stage 7: Post-Merge - Update Main Worktree ONLY

**CRITICAL**: Only update the main worktree. DO NOT touch other feature worktrees.

**Why**: Other worktrees may be on different feature branches still in progress. Merging main into them could cause conflicts or overwrite work.

**Step 16: Update Main Worktree Only**

```bash
cd ../main
git fetch origin main
git pull origin main
git status
```

Main worktree now has your merged feature.

**Step 16.5: Check for Schema Changes**

If `prisma/schema.prisma` was modified in your feature:

```bash
# Check if schema.prisma changed
git log -1 --name-only | grep "prisma/schema.prisma"
```

If schema was modified, **you must update the database**:

```
⚠️  SCHEMA CHANGES DETECTED

Your PR modified prisma/schema.prisma.

REQUIRED: Run database migration in main worktree:

  pnpm prisma generate
  pnpm prisma db push

This adds the new columns/tables to main's database.

Without this, your code will fail when it tries to use the new schema.
```

**Step 17: Verify Main Worktree State**

```bash
git status
git log -3 --oneline
```

Should show clean working tree with your merged commit.

**Step 18: Other Worktrees - DO NOT UPDATE**

```bash
git worktree list
```

**IMPORTANT**: Do NOT automatically update other worktrees.

Show user:

```
📋 WORKTREE STATUS

✅ main: Updated with your merged feature
⏭️  volunteer: SKIPPED (different feature in progress)
⏭️  prayer: SKIPPED (current feature worktree, can be cleaned up later)

Other worktrees are working on separate features and should NOT be automatically updated.

If you need to update another worktree with main changes:
1. Manually cd to that worktree
2. Ensure working tree is clean (git status)
3. Merge main: git merge main
4. Resolve any conflicts manually

This prevents accidentally overwriting work in progress.
```

---

## Stage 7.5: Sync Other Worktrees (Optional - Safety First)

**Purpose:** Give user the option to update other worktrees with latest main, but with strong safety checks.

**Step 19: Detect Other Worktrees**

```bash
git worktree list | grep -v "$(pwd)" | grep -v "/main"
```

If no other worktrees found, skip to Stage 8.

**Step 19.5: Analyze Each Worktree Status**

For each worktree, check status (execute commands separately):

```bash
# Navigate to worktree
cd /path/to/other-worktree

# Get branch name
git branch --show-current

# Count uncommitted files
git status --short | wc -l

# Check if behind main
git rev-list HEAD..main --count
```

**Step 20: Present Options to User**

Show user the worktree status table:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OTHER WORKTREES STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Worktree: volunteer
├─ Branch: feature/volunteer-management
├─ Uncommitted: 5 files ⚠️  ACTIVE - DO NOT UPDATE
└─ Behind main: 3 commits

Worktree: prayer
├─ Branch: feature/prayer-management
├─ Uncommitted: 0 files ✅ CLEAN - Safe to update
└─ Behind main: 2 commits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Only update worktrees that are CLEAN (no uncommitted work)

Updating an active worktree can:
- Cause merge conflicts
- Interrupt your work
- Require manual conflict resolution

SAFE PRACTICE:
- ✅ Update CLEAN/IDLE worktrees now
- ❌ Skip ACTIVE worktrees (you'll sync them manually later)

Options:
1. Update all CLEAN worktrees (skip active ones) - RECOMMENDED
2. Ask me for each worktree individually
3. Skip all (I'll sync manually later)

What would you like to do? (1/2/3)
```

**Step 21: Handle User Choice**

**If Option 1 (Update all clean):**

For each worktree, check if clean and update:

```bash
# Navigate to worktree
cd /path/to/worktree

# Check if clean
git status --short

# If clean (output empty), merge main
git merge main --no-edit
```

If merge conflicts occur:

```bash
# Abort the merge
git merge --abort

# User will need to resolve manually later
```

**If Option 2 (Ask each):**

For each worktree:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Worktree: volunteer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Branch: feature/volunteer-management
Uncommitted files: 5

⚠️  WARNING: This worktree has UNCOMMITTED changes!

Uncommitted files:
- actions/volunteers/volunteers.ts (modified)
- components/dashboard/volunteers/... (modified)
- app/church/[slug]/admin/volunteer/page.tsx (modified)
- public/test-image.png (untracked)
- .env.local (modified)

Merging main now will:
- Require resolving merge conflicts (if any)
- Mix your uncommitted work with main's changes
- Potentially break your current work-in-progress

RECOMMENDATION: Skip this worktree and sync manually when ready.

Update this worktree? (yes/no/skip) [default: skip]
```

Wait for user response. If yes, attempt merge. If no/skip, move to next.

**If Option 3 (Skip all):**

Show instructions:

```
✅ Skipped all worktrees

When you're ready to sync a worktree manually:

1. Finish your work and commit changes:
   cd /path/to/worktree
   git add .
   git commit -m "your message"

2. Merge latest main:
   git merge main

3. Resolve any conflicts if they occur

4. Continue working with latest code

This gives you full control over WHEN to integrate main's changes.
```

**Step 22: Summary Report**

After processing, show final status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 WORKTREE SYNC SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ main: Updated with your merged feature
✅ prayer: Updated successfully (merged main)
⏭️  volunteer: Skipped (5 uncommitted files - active work)

Manual sync needed:
- volunteer: cd /home/.../volunteer && git merge main (when ready)

All critical worktrees are synced or have instructions!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 8: Documentation Update (REQUIRED - Industry Standard)

**Purpose:** Ensure documentation ALWAYS reflects reality. Every PR must update relevant docs.

**Philosophy:** Documentation drift causes AI confusion and wasted hours. Make doc updates **required, comprehensive, and validated**.

---

**Step 20: Switch to Main Worktree**

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

**Step 21: Documentation Impact Analysis**

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

1. `docs/PROJECT.md` - Current State and Roadmap sections
2. `docs/PLAYBOOK.md` - Technical Debt Register and any new issues found

**Conditionally update:** 3. `docs/features/{feature}/vision.md` - If scope changed or feature completed 4. Remove stale content - TODOs, planning docs, outdated references

### 21.3: Read Current Documentation State

```bash
# Read all potentially affected docs
cat docs/PROJECT.md | grep -A 20 "Current Phase\|In Progress"
cat docs/PROJECT.md | grep -A 10 "Active Work\|Priorities"
cat docs/features/<feature>/vision.md | head -50
```

**Analyze:**

- Is feature still marked "In Progress" in PROJECT.md?
- Is feature still in "Active Work" section in PROJECT.md?
- Does feature vision match what was actually built?
- Are there TODOs for features just completed?

---

**Step 22: Generate Documentation Updates**

**Generate precise diffs for each affected file.**

### 22.1: PROJECT.md Updates - Current Status Section

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

### 22.2: PROJECT.md Updates - Roadmap Section

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

### 22.3: Technical Roadmap Updates

**Rule:** Add any new technical debt discovered during development.

**Check for:**

- Performance issues found (N+1 queries, missing indexes, slow queries)
- Security issues discovered (missing auth checks, validation gaps)
- Code quality issues (duplication, magic strings, poor error handling)
- Scalability concerns (missing pagination, memory issues)
- Architecture problems (circular dependencies, poor separation)

**Template for adding to Technical Debt Register:**

```markdown
| Date Found | Issue               | Severity        | Component        | Estimated Fix |
| ---------- | ------------------- | --------------- | ---------------- | ------------- |
| 2025-XX-XX | <issue description> | HIGH/MEDIUM/LOW | <file/component> | X days        |
```

**Also update:**

- Fire Drills section if urgent issues found
- Performance metrics if measured
- Decision Log if architectural decisions made

### 22.4: Feature Vision Updates (If Scope Changed)

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

**Step 23: Show Documentation Diff & Get Approval**

**Present comprehensive diff to user with color-coded changes:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 DOCUMENTATION UPDATE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This PR completed: <Feature Name>
PR #<number>: <PR title>

The following documentation MUST be updated to reflect reality:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 1. docs/PROJECT.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGES:
- Current Status: Move from "In Progress" → "Complete"
- Roadmap: Mark Phase 3 task as complete

[Show exact diff with - and + markers]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 2. docs/PLAYBOOK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Update Technical Debt Register if new issues found

[Show exact diff if applicable]

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
git add docs/PROJECT.md docs/PLAYBOOK.md docs/features/*/vision.md

# Verify staged changes
git diff --cached --stat

# Commit
git commit -m "docs: update PROJECT/PLAYBOOK/vision after <feature> merge (PR #<number>)

- Mark <feature> as complete in PROJECT.md status section
- Update PROJECT.md roadmap priorities
- Update PLAYBOOK.md technical debt if issues found
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

Committed: docs: update PROJECT/PLAYBOOK/vision after <feature> merge (PR #<number>)
Pushed to: main
```

#### Option 2: Edit Proposed Changes

Ask user:

```
Which file would you like to edit?

1. PROJECT.md (status and roadmap sections)
2. PLAYBOOK.md (technical debt register)
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
- PROJECT.md won't reflect current state
- PLAYBOOK.md technical debt won't be tracked
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
- [ ] Update PROJECT.md (status and roadmap sections)
- [ ] Update PLAYBOOK.md (technical debt register)
- [ ] Update feature vision docs

@<username> Please update docs manually to prevent drift."

echo "⚠️  Documentation update skipped. Added reminder to PR."
echo "   You'll need to update docs manually later."
```

---

**Step 24: Documentation Validation**

**After committing docs, validate they match reality:**

### 24.1: Check for Stale References

Search for TODOs related to completed feature:

```bash
grep -r "TODO.*<feature-keyword>" docs/ --include="*.md"
```

Search for "planned" references:

```bash
grep -ri "planned.*<feature-keyword>" docs/ --include="*.md"
```

Search for status markers that should be updated:

```bash
grep -r "🔄.*<feature-keyword>\|⚠️.*<feature-keyword>" docs/ --include="*.md"
```

### 24.2: Validate Last Updated Dates

Check PROJECT.md last updated:

```bash
grep "Last Updated" docs/PROJECT.md
```

Check PLAYBOOK.md last updated:

```bash
grep "Last Updated" docs/PLAYBOOK.md
```

Get today's date:

```bash
date +%Y-%m-%d
```

### 24.3: Validate Feature Status Consistency

```bash
# Check feature appears in PROJECT.md complete section
grep -A 20 "Working Features\|Completed" docs/PROJECT.md | grep -i "<feature>" > /dev/null

# Check PROJECT.md roadmap marks feature complete
grep "COMPLETE.*<feature>\|<feature>.*COMPLETE" docs/PROJECT.md > /dev/null
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
   - PROJECT.md: 2025-11-16 (today)
   - PLAYBOOK.md: 2025-11-16 (today)

✅ Feature Status Consistency:
   - Feature marked complete in PROJECT.md ✅
   - Feature roadmap updated in PROJECT.md ✅
   - Feature vision updated ✅
   - Technical debt tracked in PLAYBOOK.md ✅

✅ Cross-Reference Check:
   - PROJECT.md links to feature vision ✅
   - PLAYBOOK.md documents any new debt ✅
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
  → Files: docs/technical/integrations.md:45, docs/features/volunteer/vision.md:102

- PROJECT.md last updated: 2025-11-10 (6 days old)
  → Should be updated to today's date

Fix these issues now? (yes/no)
```

---

**Step 25: Final Documentation State Report**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DOCUMENTATION UPDATE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATED FILES:
✅ docs/PROJECT.md - Feature moved to "Complete", roadmap updated
✅ docs/PLAYBOOK.md - Technical debt register updated (if needed)
✅ docs/features/volunteer-management/vision.md - Status updated

COMMIT:
📝 docs: update PROJECT/PLAYBOOK/vision after volunteer UI merge (PR #26)
🔗 https://github.com/org/repo/commit/<sha>

VALIDATION:
✅ All checks passed
✅ No stale content remaining
✅ Docs reflect current reality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT AI SESSION WILL HAVE ACCURATE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core documents (PROJECT.md, PLAYBOOK.md) are current
Feature visions match what was actually built
No contradictory or stale planning text

Ready to proceed to Stage 9 (Handoff Generation)
```

---

**Key Improvements Over Original Stage 8:**

**Original:**

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

**When Documentation Updates Are NOT Needed:**

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

---

## Stage 9: Handoff Generation

**Step 23: Ask About Next Feature**

Ask: "What feature should we work on next?"

Wait for user input.

**Step 24: Generate Handoff Document**

Create comprehensive handoff text (copyable, not saved to file):

````
Feature Wrap-Up Complete! ✅
============================

## What Was Accomplished

**Feature**: <feature-name>
**PR**: #<number> - Merged to main
**Date**: <date>

**What Was Built**:
<summary from PR>

**Files Changed**:
<key files from git diff>

**Merge Conflicts Encountered**:
<if any, how they were resolved>

**Worktree Status**:
- main: Updated with merged feature ✅
- Other worktrees: Skipped (separate features in progress)

---

## 📋 AI SESSION HANDOFF

**Copy/paste this into your next Claude Code session:**

---START HANDOFF---

# AI Session Handoff

**Date**: <current-date>
**Completed Feature**: <feature-name>
**Next Feature**: <user-provided-next>
**Current Worktree**: <path>
**Current Branch**: main (synced)

## Just Completed: <feature-name>

**Status**: ✅ Merged to main (PR #<number>)

**Summary**:
<what was built>

**Key Files**:
- <file 1>
- <file 2>
- <file 3>

**Patterns Used**:
- Multi-tenant: organizationId scoping
- Server actions: Rate limiting + auth
- TanStack Table: Data display
- <others>

**Merge Conflicts Resolved**:
<if any, document what and how>

**Lessons Learned**:
<anything notable>

## Worktree Architecture

This project uses git worktrees for parallel development:

```
/connect-card/.bare                    (bare repo)
/connect-card/main                     (main branch)
/connect-card/volunteer                (feature/volunteer-management)
/connect-card/prayer                   (feature/prayer-management)
```

**Database Isolation**:
- main: ep-falling-unit-adhn1juc (port 3000)
- volunteer: ep-bitter-recipe-ad3v8ovt (port 3001)
- prayer: ep-long-feather-ad7s8ao0 (port 3002)

**Critical Commands**:
```bash
git worktree list                    # See all worktrees
cd /path/to/worktree                # Switch context
git merge main                      # Update feature with main changes
DATABASE_URL="..." pnpm prisma ...  # Explicit DB for Prisma
```

**Documentation Workflow**:
- ❌ DON'T update /docs in feature branches
- ✅ DO update docs in main AFTER merge
- Conflicts in docs are EXPECTED - combine, don't replace

## Current Project State

**Working Features**:
- Connect Card AI Vision extraction ✅
- Review Queue with manual correction ✅
- Team Management with invitations ✅
- <just-completed-feature> ✅

**In Progress** (Other Worktrees):
- <list features in other worktrees>

**Next Feature**:
- <next-feature>

**Known Issues**:
<tech debt or blockers>

## Next Feature: <next-feature>

**Objective**:
<what needs to be built>

**Recommended Approach**:
<implementation suggestions>

**Worktree Strategy**:

Option 1: Use existing worktree (if related to ongoing feature)
```bash
cd /path/to/existing/worktree
git checkout -b feature/<name>
```

Option 2: Create new worktree (for new domain)
```bash
cd /path/to/.bare
git worktree add ../connect-card/<name> -b feature/<name>
cd ../connect-card/<name>
cp ../main/.env.local .  # Modify DATABASE_URL + PORT
```

**Files to Review**:
<similar existing code>

**Patterns to Follow**:
- Server actions: `/add-server-action` command
- Multi-tenant: `requireDashboardAccess()`
- Tables: TanStack Table pattern
- Forms: react-hook-form + Zod

## Quick Reference

**Documentation**:
- `CLAUDE.md` - Core AI instructions
- `docs/essentials/coding-patterns.md` - Implementation guide
- `docs/worktree-database-setup.md` - Worktree workflows
- `docs/STATUS.md` - Current state
- `docs/ROADMAP.md` - Feature roadmap

**Slash Commands**:
- `/session-start <feature>` - Initialize new feature
- `/feature-wrap-up` - This command
- `/add-server-action <name>` - Generate server action
- `/review-code` - Code quality check

**Worktree Workflow**:
1. Work in dedicated worktree on feature branch
2. Commit code (NO doc updates in branch)
3. Run `/feature-wrap-up` (conflict detection + merge)
4. Update docs in main AFTER merge
5. Only main worktree updates (other feature worktrees stay independent)

**Never**:
- ❌ Update /docs in feature branches
- ❌ Auto-update other feature worktrees (destroys work in progress)
- ❌ Run Prisma without explicit DATABASE_URL
- ❌ Commit without running build first

**Always**:
- ✅ Verify DATABASE_URL before Prisma ops
- ✅ Check current worktree (`pwd`)
- ✅ Build before commit
- ✅ Combine docs during merge conflicts
- ✅ Update ONLY main worktree after merge (other worktrees are on different features)

## Starting Next Session

**First command**:
```
/session-start <next-feature>
```

This will set up branch/worktree and explore relevant code.

**Good luck! Previous session completed successfully.**

---END HANDOFF---

Copy text between START/END markers for next session.

Great work on <feature-name>! 🎉
````

---

## Error Handling

**Build Failures**:

- Stop workflow
- Report errors with file:line
- Offer to help fix
- Resume from Stage 1

**Merge Conflicts**:

- Detected in Stage 3 (forecast)
- Guided resolution in Stage 5 (merge)
- COMBINE content strategy (don't replace)

**Worktree Update Failures**:

- Uncommitted changes: Offer options (skip/stash/commit)
- Merge conflicts: Show guide, skip worktree
- Missing worktree: Continue gracefully

**Documentation Conflicts (EXPECTED)**:

- Warn in conflict forecast (Stage 3)
- Guide manual resolution during merge
- Emphasis: COMBINE all updates, keep everything

---

## When to Use This Command

✅ **Use when**:

- Feature complete and tested
- Ready to merge to main
- Need automated wrap-up workflow
- Want conflict detection before PR
- Need worktree synchronization
- Need handoff for next session

❌ **Don't use if**:

- Feature incomplete
- Build broken
- Critical bugs present
- Not working in worktree setup

---

## Key Improvements Over Standard Workflow

**Conflict Detection**:

- Forecasts conflicts BEFORE creating PR
- Identifies overlapping file changes across worktrees
- Provides resolution strategy recommendations

**Worktree Sync**:

- Automatically updates all worktrees after merge
- Handles uncommitted changes gracefully
- Detects and guides through merge conflicts

**Documentation Workflow**:

- NO doc updates in feature branches (prevents conflicts)
- Docs updated in main AFTER merge
- Clear guidance on combining vs replacing content

**Result**: Clean merges, synchronized codebase, comprehensive handoff documentation.
