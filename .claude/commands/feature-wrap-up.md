---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
model: claude-sonnet-4-5-20250929
---

# Feature Wrap-Up (Worktree-Aware)

Complete feature workflow: build → commit → conflict forecast → PR → merge → sync worktrees → handoff.

**Key Features:**

- ✅ Detects merge conflicts BEFORE creating PR
- ✅ Syncs all worktrees after merge
- ✅ Handles documentation conflicts intelligently
- ✅ NO doc updates in feature branch (prevents conflicts)
- ✅ Generates copyable handoff text

---

## Stage 1: Quality Verification

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

## Stage 2: Commit Feature Code

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

## Stage 3: Conflict Forecast & Analysis

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

## Stage 4: Pull Request

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

## Stage 5: Testing & Merge

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

## Stage 6: Post-Merge - Update All Worktrees

**CRITICAL**: After merging to main, ALL worktrees need the latest changes.

**Step 16: Update Current Worktree**

```bash
# Current worktree was on feature branch, now sync to main
git fetch origin main
git reset --hard origin/main
git status
```

Current worktree now has merged feature.

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

## Stage 7: Documentation Update (Main Worktree Only)

**Step 20: Switch to Main Worktree**

```bash
cd /path/to/main-worktree
git pull origin main  # Get docs commit if any
```

**Step 21: Update Project Documentation**

Ask user:

```
Feature merged! Update STATUS.md and ROADMAP.md now? (yes/no)

This will mark your feature complete in project documentation.
```

If YES:

1. Read `docs/STATUS.md` and `docs/ROADMAP.md`
2. Analyze what was just merged (from PR description)
3. Draft documentation updates
4. Show user proposed changes
5. Ask: "Apply these updates? (yes/no)"
6. If yes:
   ```bash
   git add docs/STATUS.md docs/ROADMAP.md
   git commit -m "docs: update STATUS and ROADMAP after <feature> merge"
   git push origin main
   ```

**Step 22: Verify Final State**

```bash
git status
git log -3 --oneline
```

Show clean state confirmation.

---

## Stage 8: Handoff Generation

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
