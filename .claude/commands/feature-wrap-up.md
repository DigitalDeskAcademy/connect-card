---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
model: claude-sonnet-4-5-20250929
---

# Feature Wrap-Up (Worktree-Aware + Documentation Enforced)

Complete feature workflow: build → commit → conflict forecast → PR → merge → sync worktrees → **REQUIRED doc updates** → handoff.

**Key Features:**

- ✅ Detects merge conflicts BEFORE creating PR
- ✅ Syncs all worktrees after merge
- ✅ **ENFORCED documentation updates** (STATUS, ROADMAP, feature visions)
- ✅ **Validation checks** for stale content and consistency
- ✅ NO doc updates in feature branch (prevents conflicts)
- ✅ Generates copyable handoff text

**New in v2:** Industry-standard documentation workflow prevents drift and AI confusion.

---

## Stage 1: Schema Sync Verification

**Purpose:** Prevent merge conflicts by ensuring your Prisma schema matches main before wrapping up.

**Step 1: Check Schema Sync**

```bash
# Compare with main worktree schema
MAIN_SCHEMA="../main/prisma/schema.prisma"

if [ -f "$MAIN_SCHEMA" ]; then
  if diff -q prisma/schema.prisma "$MAIN_SCHEMA" > /dev/null 2>&1; then
    echo "✓ Schema in sync with main"
  else
    echo ""
    echo "⚠️  SCHEMA DRIFT DETECTED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Your schema differs from main branch."
    echo "This will cause merge conflicts when creating PR."
    echo ""
    echo "Differences:"
    diff prisma/schema.prisma "$MAIN_SCHEMA" | head -20
    echo ""
    read -p "Sync schema from main? [y/N]: " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "📋 Copying schema from main..."
      cp "$MAIN_SCHEMA" prisma/schema.prisma

      echo "🔄 Regenerating Prisma client..."
      pnpm prisma generate > /dev/null 2>&1

      echo "✅ Schema synced successfully"
      echo ""
    else
      echo "⚠️  Continuing with schema drift"
      echo "   You may encounter merge conflicts in your PR."
      echo ""
    fi
  fi
else
  echo "⚠️  Main worktree not found at ../main"
  echo "   Skipping schema sync check"
fi
```

**Why This Matters:**

- Schema changes in main (from other merged features) will conflict with your branch
- Syncing now prevents PR conflicts and failed builds
- Worktree best practice: Always sync shared infrastructure before merging

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

```bash
# Get files changed in current branch
git diff main...HEAD --name-only > /tmp/current-changes.txt

# Check each other worktree for overlaps
git worktree list
```

For each other worktree:

```bash
cd /path/to/other-worktree
git diff main...HEAD --name-only > /tmp/other-changes.txt

# Find overlaps
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

## Stage 7: Post-Merge - Update All Worktrees

**CRITICAL**: After merging to main, ALL worktrees need the latest changes.

**Step 16: Update Current Worktree**

```bash
# Current worktree was on feature branch, now sync to main
git fetch origin main
git reset --hard origin/main
git status
```

Current worktree now has merged feature.

**Step 16.5: Check for Schema Changes**

If `prisma/schema.prisma` was modified in your feature:

```bash
# Check if schema.prisma changed
git diff <feature-branch>...main --name-only | grep "prisma/schema.prisma"
```

If schema was modified, **you must update the database** before testing:

```
⚠️  SCHEMA CHANGES DETECTED

Your PR modified prisma/schema.prisma.

REQUIRED: Run database migration in main worktree:

  cd ../main
  pnpm prisma db push

This adds the new columns/tables to main's database.

Without this, your code will fail when it tries to use the new schema.
```

**Step 17: Identify Other Worktrees**

```bash
git worktree list
```

Show user:

```
📋 WORKTREE SYNC REQUIRED

Detected worktrees:
- /path/to/main (already updated ✅)
- /path/to/volunteer (needs update)
- /path/to/prayer (needs update)

These worktrees need your merged changes to avoid falling behind.

Update all worktrees now? (yes/no)
```

**Step 18: Update Each Worktree**

For each worktree (except current):

```bash
cd /path/to/worktree
git status  # Check for uncommitted work
```

**If uncommitted changes found:**

Show warning:

```
⚠️  UNCOMMITTED CHANGES in <worktree-name>

Files:
<list modified files>

Options:
1. Skip this worktree (you'll merge main manually later)
2. Stash changes and merge main now
3. Commit changes first, then merge main

What would you like to do? (1/2/3)
```

Handle based on user choice.

**If clean working tree:**

```bash
git merge main --no-edit

# If schema.prisma was in your feature, update database for this worktree too
if git diff HEAD~1..HEAD --name-only | grep -q "prisma/schema.prisma"; then
  echo "⚠️  Schema changed - running database migration..."
  pnpm prisma db push
fi
```

**If merge conflicts:**

Show conflict guide:

```
⚠️  MERGE CONFLICT in <worktree-name>

Conflicting files:
<list files>

This is EXPECTED when multiple features update the same files.

Resolution steps:
1. Files will show conflict markers: <<<<<<< HEAD
2. Edit files to COMBINE both changes (don't delete either)
3. Remove conflict markers
4. git add <files>
5. git commit -m "merge: combine main updates with <feature>"

Conflicts detected. Skipping this worktree for now.
You can resolve manually and re-run worktree update.

Continue updating other worktrees? (yes/no)
```

**Step 19: Worktree Update Summary**

Show results:

```
📊 WORKTREE UPDATE COMPLETE

✅ main: Merged and updated
✅ volunteer: Updated successfully
⚠️  prayer: Skipped (uncommitted changes)

All active worktrees synchronized with your merged feature!

Note: prayer worktree needs manual update when ready.
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

**21.1: Read the Merged PR**

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

**21.2: Identify Affected Documentation**

Always update:

1. `docs/STATUS.md` - Health dashboard
2. `docs/ROADMAP.md` - Priority list

Conditionally update: 3. `docs/features/{feature}/vision.md` - If scope changed or feature completed 4. Remove stale content - TODOs, planning docs, outdated references

**21.3: Read Current Documentation State**

```bash
# Read all potentially affected docs
cat docs/STATUS.md | grep -A 20 "In Progress"
cat docs/ROADMAP.md | grep -A 10 "Active Work"
cat docs/features/<feature>/vision.md | head -50
```

Analyze:

- Is feature still marked "In Progress" in STATUS.md?
- Is feature still in "Active Work" in ROADMAP.md?
- Does feature vision match what was actually built?
- Are there TODOs for features just completed?

---

**Step 22: Generate Documentation Updates**

Generate precise diffs for each affected file.

**22.1: STATUS.md Updates**

Rule: Move feature from "In Progress" → "Complete" with summary.

Template:

```markdown
### <Feature Name> ✅ COMPLETE (<Month> <Year>)

**<One-line description>**

- <Key accomplishment 1>
- <Key accomplishment 2>
- <Key accomplishment 3>

**See `/docs/features/<feature>/vision.md` for full details**
```

**22.2: ROADMAP.md Updates**

Rule: Mark task/phase as ✅ COMPLETE, update "Active Work" section.

If phase completed, update "Current Phase" and move to "Completed Phases" section.

**22.3: Feature Vision Updates (If Scope Changed)**

Only update if:

- Feature direction changed during development
- Planned features were cut or modified
- New features were added that weren't planned

Updates:

1. Status header - Change from "IN PROGRESS" → "COMPLETE"
2. Current Status section - Mark completed items with ✅
3. Planned Features - Move completed checkboxes to done
4. Next Steps - Remove if fully complete, update if partial

**22.4: Stale Content Cleanup**

Search for stale references:

```bash
# Find TODOs related to feature
grep -r "TODO.*<feature-keyword>" docs/ --include="*.md"

# Find "planned" or "in progress" references
grep -r "planned.*<feature-keyword>\|in progress.*<feature-keyword>" docs/ --include="*.md" -i

# Find outdated status markers
grep -r "🔄.*<feature-keyword>" docs/ --include="*.md"
```

---

**Step 23: Show Documentation Diff & Get Approval**

Present comprehensive diff to user:

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

CHANGE: Mark task as complete

[Show exact diff]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 3. docs/features/<feature>/vision.md (if applicable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Update status and mark completed features

[Show exact diff]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Documentation updates are REQUIRED for every PR.
    Skipping causes documentation drift and confuses future AI sessions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTIONS:

1. Apply all updates (RECOMMENDED)
2. Let me edit the proposed changes
3. Skip documentation update (NOT RECOMMENDED)

What would you like to do? (1/2/3)
```

**Handle User Response:**

**Option 1: Apply All Updates (RECOMMENDED)**

```bash
# Apply all changes
<apply each diff to respective file>

# Stage all doc changes
git add docs/

# Commit
git commit -m "docs: update STATUS/ROADMAP/vision after <feature> merge (PR #<number>)"

# Push
git push origin main

# Verify
git log -1 --oneline
```

**Option 2: Edit Proposed Changes**

Ask which file to edit, show current diff, regenerate based on feedback, confirm before applying.

**Option 3: Skip Documentation Update**

Show strong warning:

```
⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️

Skipping documentation updates is STRONGLY DISCOURAGED.

CONSEQUENCES:
- STATUS.md won't reflect current state
- ROADMAP.md will show incorrect priorities
- Future AI sessions will waste hours on wrong information
- This is the ROOT CAUSE of documentation drift

Are you ABSOLUTELY SURE you want to skip? (yes/no)
```

If still yes, add comment to PR and warn user.

---

**Step 24: Documentation Validation**

After committing docs, validate they match reality:

**24.1: Check for Stale References**

```bash
# Search for TODOs related to completed feature
grep -r "TODO.*<feature-keyword>" docs/ --include="*.md"

# Search for "planned" references
grep -ri "planned.*<feature-keyword>" docs/ --include="*.md"

# Search for status markers that should be updated
grep -r "🔄.*<feature-keyword>" docs/ --include="*.md"
```

**24.2: Validate Last Updated Dates**

```bash
# Check STATUS.md and ROADMAP.md are current
grep "Last Updated" docs/STATUS.md
grep "Last Updated" docs/ROADMAP.md
```

**24.3: Show Validation Results**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENTATION VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Stale Content Check:
   - No stale TODOs found
   - No "planned" references remaining
   - No outdated status markers

✅ Last Updated Dates:
   - STATUS.md: <today's date>
   - ROADMAP.md: <today's date>

✅ Feature Status Consistency:
   - Feature marked complete in STATUS.md ✅
   - Feature marked complete in ROADMAP.md ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL VALIDATION CHECKS PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation is up-to-date and consistent with codebase reality.
Future AI sessions will have accurate context! 🎉
```

---

**Step 25: Verify Final State**

```bash
git status  # Should be clean
git log -3 --oneline  # Show recent commits
```

Show confirmation:

```
✅ DOCUMENTATION UPDATE COMPLETE

Files updated:
- docs/STATUS.md
- docs/ROADMAP.md
- docs/features/<feature>/vision.md

Commit: docs: update STATUS/ROADMAP/vision after <feature> merge (PR #<number>)

Ready to proceed to Stage 9 (Handoff Generation)
```

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

**All Worktrees Updated**: ✅
- main: Latest with merged feature
- volunteer: Synced with main
- prayer: Synced with main

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
5. All worktrees auto-sync with latest main

**Never**:
- ❌ Update /docs in feature branches
- ❌ Skip worktree updates after merge
- ❌ Run Prisma without explicit DATABASE_URL
- ❌ Commit without running build first

**Always**:
- ✅ Verify DATABASE_URL before Prisma ops
- ✅ Check current worktree (`pwd`)
- ✅ Build before commit
- ✅ Combine docs during merge conflicts
- ✅ Sync all worktrees after main merge

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
