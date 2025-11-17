---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
model: claude-sonnet-4-5-20250929
---

# Feature Wrap-Up (Worktree-Aware)

Complete feature workflow: build → commit → conflict forecast → PR → merge → update main only → handoff.

**Key Features:**

- ✅ Detects merge conflicts BEFORE creating PR
- ✅ Updates ONLY main worktree after merge (safe)
- ✅ Skips other feature worktrees (prevents data loss)
- ✅ NO doc updates in feature branch (prevents conflicts)
- ✅ Generates copyable handoff text

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

## Stage 8: Documentation Update (Main Worktree Only)

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
