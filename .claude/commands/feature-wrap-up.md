---
description: Complete end-to-end feature workflow from quality checks to session recovery
model: claude-sonnet-4-5-20250929
---

# Feature Wrap-Up - Industry Standard Workflow

Complete feature workflow: sync → build → commit → PR → merge → docs → handoff.

**Key Features:**

- ✅ **INDUSTRY STANDARD:** Syncs with main BEFORE creating PR
- ✅ Detects merge conflicts before PR creation
- ✅ Updates main worktree after merge (always)
- ✅ Optional sync of other worktrees (safety-first)
- ✅ Required documentation updates (prevents drift)
- ✅ Generates comprehensive handoff text

---

## Stage 1: Sync with Main (INDUSTRY STANDARD)

**Purpose:** Ensure your feature branch integrates with latest main BEFORE creating PR. This catches integration issues early on your machine, not in CI/CD.

**Why This Matters:**

- Your code might break when combined with new changes in main
- Better to find conflicts now than during PR review
- Reviewers shouldn't see merge conflicts
- Tests should run against code that's already integrated

**Industry Precedent:**

- **Google Engineering:** "Sync your branch with latest main before sending code review"
- **GitHub Flow:** "Keep branch up to date with base branch before creating PR"
- **GitLab:** "Rebase feature branch on target branch before creating MR"
- **Trunk-Based Development:** "Integrate with trunk multiple times per day"

---

**Step 1: Fetch Latest Main**

```bash
git fetch origin main
```

**Step 2: Check If Behind Main**

```bash
git rev-list HEAD..origin/main --count
```

Store the count. If 0, skip to Stage 2.

**Step 3: Show What Changed in Main**

If behind main (count > 0):

```bash
# Show commits you're missing
git log HEAD..origin/main --oneline --no-merges

# Show files changed in main
git diff HEAD...origin/main --stat
```

Present to user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  YOUR BRANCH IS BEHIND MAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your branch is <count> commits behind origin/main.

New commits in main:
<show git log output>

Files changed in main:
<show git diff --stat output>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏭 INDUSTRY STANDARD: Sync with main BEFORE creating PR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This ensures:
✅ Your code works with latest changes
✅ No merge conflicts during PR review
✅ Tests run against integrated code
✅ Reviewer sees clean, mergeable PR

Options:
1. Merge main into your branch (preserves commit history)
2. Rebase your branch on main (cleaner linear history)
3. Skip sync (NOT RECOMMENDED - may cause PR conflicts)

What would you like to do? (1/2/3)
```

**Step 4: Handle User Choice**

**If Option 1 (Merge):**

```bash
git merge origin/main --no-edit
```

If conflicts occur:

```bash
# Show conflicted files
git status --short | grep "^UU\|^AA\|^DD"

# Abort merge
git merge --abort
```

Show user:

```
⚠️  MERGE CONFLICTS DETECTED

Conflicted files:
<list files>

You need to resolve these manually:

1. Run: git merge origin/main
2. Fix conflicts in each file
3. Stage resolved files: git add <file>
4. Complete merge: git commit
5. Re-run /feature-wrap-up

Abort for now? (yes/no)
```

**If Option 2 (Rebase):**

```bash
git rebase origin/main
```

If conflicts occur during rebase:

```bash
# Show conflict
git status

# Abort rebase
git rebase --abort
```

Show similar conflict resolution guide as merge.

**If Option 3 (Skip):**

**Show strong warning:**

```
⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️

Skipping sync with main violates industry best practices.

CONSEQUENCES:
- PR may have merge conflicts (reviewer has to resolve)
- Your tests pass, but combined code may fail
- CI/CD may fail unexpectedly
- Integration issues discovered late

This is why Google, GitHub, GitLab all require sync first.

Are you SURE you want to skip? (yes/no)
```

If still yes, add note for PR description later.

**Step 5: Verify Sync Success**

```bash
# Check if ahead of main only (no divergence)
git rev-list origin/main..HEAD --count  # Your commits
git rev-list HEAD..origin/main --count  # Should be 0 now

# Verify working tree is clean
git status
```

Show confirmation:

```
✅ SYNC COMPLETE

Your branch now includes all changes from main.

Status:
- Your commits ahead: <count>
- Main commits behind: 0 (synced)
- Working tree: clean

Ready to proceed with quality verification (Stage 2)
```

---

## Stage 2: Schema Sync Verification

**Purpose:** Prevent merge conflicts by ensuring your Prisma schema matches main's schema.

**Step 1: Check Schema Sync**

```bash
diff -q prisma/schema.prisma ../main/prisma/schema.prisma
```

If no difference, skip to Stage 3.

**Step 2: Show Schema Differences**

If schemas differ:

```bash
diff prisma/schema.prisma ../main/prisma/schema.prisma | head -30
```

Ask user:

```
⚠️  SCHEMA OUT OF SYNC

Your schema differs from main's schema.

This can happen if:
- Another feature merged schema changes
- You started this branch before recent schema updates

Sync schema from main now? (yes/no/show-full-diff)
```

**Step 3: Sync Schema (If Requested)**

```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Copy schema from main
cp ../main/prisma/schema.prisma prisma/schema.prisma

# Regenerate Prisma client
pnpm prisma generate
```

Show:

```
✅ SCHEMA SYNCED

Copied schema from main worktree
Regenerated Prisma client

Your backup: prisma/schema.prisma.backup
```

---

## Stage 3: Quality Verification

**Step 1: Run Build**

```bash
pnpm build
```

If build fails:

- Report TypeScript errors with file:line references
- STOP workflow
- Ask: "Build failed. Fix errors before continuing? (yes/no)"

**Step 2: Run ESLint**

```bash
pnpm lint
```

If lint fails:

- Report errors/warnings
- Ask: "Run `pnpm lint --fix`? (yes/no)"

**Step 3: Check for Critical Issues**

Scan for:

```bash
# Console statements (coding-patterns.md forbids these)
grep -r "console\\.log\|console\\.error" actions/ app/ lib/ components/ --include="*.ts" --include="*.tsx"

# Test-only code left in
grep -r "\\.only(" tests/ --include="*.ts"

# TODO/FIXME in critical paths
grep -r "TODO\|FIXME" actions/ app/api/ --include="*.ts"
```

If found, report and ask if acceptable to proceed.

**Step 4: Build Success Confirmation**

```
✅ QUALITY CHECKS PASSED

- Build: successful
- ESLint: clean
- No console.log statements
- No .only() in tests
- Ready to commit

Proceeding to Stage 4 (Commit)
```

---

## Stage 4: Commit Feature Code

**Step 1: Git Status**

```bash
git status
git diff --stat
```

Show user summary of changes.

**Step 2: Draft Commit Message**

Analyze changes and create commit following Conventional Commits:

```
<type>(<scope>): <short summary>

<optional detailed description>

<optional breaking changes>
```

**Types:** feat, fix, docs, refactor, test, chore, perf, style

**NO** AI attribution (CLAUDE.md policy - no "Generated with Claude Code")

**Step 3: Commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
<message>
EOF
)"
```

**Step 4: Verify Commit**

```bash
git log -1 --oneline
git status
```

Should show clean working tree.

```
✅ FEATURE CODE COMMITTED

Commit: <sha> <message>
Working tree: clean

Ready for conflict forecast (Stage 5)
```

---

## Stage 5: Conflict Forecast & Analysis

**Purpose:** Detect potential merge conflicts BEFORE creating PR by analyzing changes across all worktrees.

**Step 1: Get Files Changed in Current Branch**

```bash
git diff origin/main...HEAD --name-only > /tmp/current-changes.txt
```

**Step 2: Check Other Worktrees**

```bash
git worktree list
```

**Step 3: Analyze Each Worktree for Overlaps**

For each other worktree (excluding current and main):

```bash
cd /path/to/other-worktree

# Get files changed in that worktree
git diff main...HEAD --name-only > /tmp/other-changes.txt

# Find overlapping files
comm -12 <(sort /tmp/current-changes.txt) <(sort /tmp/other-changes.txt)
```

**Step 4: Generate Conflict Forecast**

Categorize overlapping files:

- **HIGH RISK:** Code files (actions/, components/, lib/)
- **EXPECTED:** Documentation (docs/STATUS.md, docs/ROADMAP.md)
- **CLEAN:** No overlaps

Present forecast:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MERGE CONFLICT FORECAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Potential conflicts with other feature branches:

HIGH RISK (Same code files modified):
- lib/data/helpers.ts (also modified in: volunteer)
  Strategy: COMBINE both changes during merge
  Risk: May require manual conflict resolution

EXPECTED (Documentation files):
- docs/ROADMAP.md (also modified in: volunteer, prayer)
  Strategy: Keep both task lists, merge sections
- docs/STATUS.md (also modified in: volunteer)
  Strategy: Combine completion notes from both features

CLEAN (No conflicts):
- lib/data/tech-debt.ts (feature-specific)
- actions/security/* (feature-specific)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These conflicts are EXPECTED in worktree workflow.

During PR merge (via GitHub UI):
1. Resolve via visual diff editor
2. COMBINE content from both branches (don't replace)
3. Keep all feature documentation and code changes

For code conflicts: Carefully merge logic from both features
For doc conflicts: Keep all updates, combine sections

Proceed with PR creation? (yes/no)
```

**If user says NO:**

- Ask what they'd like to adjust
- Offer to help resolve conflicts pre-merge
- Wait for confirmation

---

## Stage 6: Pull Request

**Step 1: Push Branch**

```bash
git push origin <branch-name> -u
```

**Step 2: Generate PR Description**

```bash
# Get commit history
git log origin/main..HEAD --oneline

# Get file changes
git diff origin/main...HEAD --stat
```

Draft PR using this template:

```markdown
## Summary

<1-3 bullets describing what was built>

## Changes

- <key file 1> - <what changed>
- <key file 2> - <what changed>
- <key file 3> - <what changed>

## Testing

<how this was tested>

## Merge Conflict Notes

<If conflicts detected in Stage 5>

⚠️ **Expected Conflicts**

This PR modifies files also changed in other feature branches:

- `<file>` (also in: <other-branch>)

**Resolution Strategy**: COMBINE changes from both branches

- Code files: Merge both sets of logic
- Docs: Keep all updates and task lists

## Checklist

- [x] Build passes
- [x] ESLint clean
- [x] Synced with main (industry standard)
- [x] Conflict forecast reviewed
- [x] Multi-tenant isolation verified
- [ ] Manual testing (if needed)
```

**Step 3: Create PR**

```bash
gh pr create --title "<type>: <feature>" --body "$(cat <<'EOF'
<PR description>
EOF
)"
```

Store PR number for later stages.

```
✅ PULL REQUEST CREATED

PR #<number>: <title>
URL: <github-url>

Ready for testing & merge (Stage 7)
```

---

## Stage 7: Testing & Merge

**Step 1: Manual Testing Check**

Ask: "Need manual testing before merge? (yes/no)"

If YES:

- Show testing checklist
- Wait for user confirmation

**Step 2: Merge PR**

Ask: "Ready to squash and merge? (yes/no)"

```bash
gh pr merge <pr-number> --squash --delete-branch
```

**Step 3: Verify Merge**

```bash
gh pr view <pr-number> --json state,mergedAt
```

Should show "MERGED" with timestamp.

```
✅ PR MERGED TO MAIN

PR #<number> merged successfully
Remote branch deleted
Timestamp: <merged-at>

Ready to update main worktree (Stage 8)
```

---

## Stage 8: Post-Merge Main Worktree Update

**Purpose:** Update the main worktree with your merged changes. Other feature worktrees are NOT touched.

**Step 1: Navigate to Main Worktree**

```bash
cd ../main
```

**Step 2: Pull Latest Main**

```bash
git fetch origin main
git pull origin main
git status
```

**Step 3: Check for Schema Changes**

```bash
git log -1 --name-only | grep "prisma/schema.prisma"
```

If schema was modified:

```
⚠️  SCHEMA CHANGES DETECTED

Your PR modified prisma/schema.prisma.

REQUIRED: Update database in main worktree

Run now:
  pnpm prisma generate
  pnpm prisma db push

This adds new columns/tables to main's database.
Without this, code will fail when using new schema.

Run database update now? (yes/no)
```

If yes:

```bash
pnpm prisma generate
pnpm prisma db push
```

**Step 4: Verify Main Worktree State**

```bash
git status
git log -3 --oneline
```

```
✅ MAIN WORKTREE UPDATED

Current commit: <sha> <your-merged-commit>
Working tree: clean
Database: <updated if schema changed>

Other worktrees intentionally NOT updated (separate features in progress)

Ready for optional worktree sync (Stage 9)
```

---

## Stage 9: Optional Worktree Sync

**Purpose:** Give user option to update other worktrees with latest main, with strong safety checks.

**Step 1: Detect Other Worktrees**

```bash
git worktree list | grep -v "$(pwd)" | grep -v "/main"
```

If no other worktrees, skip to Stage 10.

**Step 2: Analyze Each Worktree Status**

For each worktree:

```bash
cd /path/to/worktree

# Get branch name
git branch --show-current

# Count uncommitted files
git status --short | wc -l

# Check if behind main
git rev-list HEAD..main --count
```

**Step 3: Present Status Table**

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

⚠️  IMPORTANT: Only update CLEAN worktrees (no uncommitted work)

Updating active worktrees can:
- Cause merge conflicts
- Interrupt work in progress
- Require manual conflict resolution

SAFE PRACTICE:
- ✅ Update CLEAN/IDLE worktrees now
- ❌ Skip ACTIVE worktrees (sync manually later)

Options:
1. Update all CLEAN worktrees (skip active) - RECOMMENDED
2. Ask me for each worktree individually
3. Skip all (I'll sync manually later)

What would you like to do? (1/2/3)
```

**Step 4: Handle User Choice**

**If Option 1 (Update all clean):**

For each worktree where uncommitted count = 0:

```bash
cd /path/to/worktree
git status --short  # Verify clean

# If clean, merge main
git merge main --no-edit
```

If merge conflicts:

```bash
git merge --abort
# Mark as "requires manual sync"
```

**If Option 2 (Ask each):**

For each worktree, show detailed prompt with uncommitted files listed, ask yes/no/skip.

**If Option 3 (Skip all):**

Show manual sync instructions.

**Step 5: Summary Report**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 WORKTREE SYNC SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ main: Updated with your merged feature
✅ prayer: Updated successfully (merged main)
⏭️  volunteer: Skipped (5 uncommitted files - active work)

Manual sync needed:
- volunteer: cd /path && git merge main (when ready)

All critical worktrees synced or have instructions!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready for documentation update (Stage 10)
```

---

## Stage 10: Documentation Update (REQUIRED)

**Purpose:** Ensure documentation ALWAYS reflects reality. Every PR must update relevant docs.

**Philosophy:** Documentation drift causes AI confusion and wasted hours. Make doc updates **required, comprehensive, and validated**.

---

**Step 1: Verify in Main Worktree**

```bash
cd ../main
git branch --show-current  # Should be "main"
git status                 # Should be clean
```

**Step 2: Read Merged PR Details**

```bash
# Get PR info
gh pr view <pr-number> --json title,body,files

# See what was built
git log -1 --stat
```

Extract:

- Feature area (connect-cards, volunteer, prayer, security)
- What was built
- Scope changes

**Step 3: Read Current Documentation**

```bash
# Check STATUS.md
grep -A 20 "In Progress\|Working Features" docs/STATUS.md

# Check ROADMAP.md
grep -A 10 "Active Work\|Current Phase" docs/ROADMAP.md

# Check feature vision (if exists)
ls docs/features/*/vision.md
```

**Analyze:**

- Is feature marked "In Progress" in STATUS.md?
- Is feature in "Active Work" in ROADMAP.md?
- Are there completed TODOs to move?

**Step 4: Generate Documentation Updates**

**Always Update:**

1. `docs/STATUS.md` - Move from "In Progress" → "Complete"
2. `docs/ROADMAP.md` - Mark task as ✅ COMPLETE

**Conditionally Update:** 3. `docs/features/{feature}/vision.md` - If scope changed or feature completed 4. Remove stale content - TODOs, outdated references

**Step 5: Show Documentation Diff**

Present comprehensive diff:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 DOCUMENTATION UPDATE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This PR completed: <Feature Name>
PR #<number>: <title>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 1. docs/STATUS.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Move from "In Progress" → "Complete"

-## 🔄 In Progress
-
-### Tech Debt Fixes
-- 🔄 **Security Audit** - Addressing CRITICAL issues

+## ✅ Working Features
+
+### Security Fixes ✅ COMPLETE (Nov 2025)
+
+**Comprehensive security audit addressing 11 vulnerabilities**
+
+- Multi-tenant isolation enforcement (3 CRITICAL fixes)
+- PII logging removal (23 files cleaned)
+- Generic error messages (security best practice)
+
+**See `/docs/technical/security-fixes-2025-11-21.md` for full audit**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 2. docs/ROADMAP.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGE: Mark task as complete

-### Active Work
-
-- **Security Audit** 🔄 IN PROGRESS - Fixing CRITICAL vulnerabilities

+### Active Work
+
+- **Security Audit** ✅ COMPLETE - 11 vulnerabilities fixed (PR #<number>)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY:
- Files to update: 2
- Lines added: ~15
- Lines removed: ~5

⚠️  Documentation updates are REQUIRED for every PR.
    Skipping causes documentation drift and confuses future AI sessions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTIONS:

1. Apply all updates (RECOMMENDED)
   → Updates all docs, commits, pushes to main

2. Let me edit the proposed changes
   → Review and modify before applying

3. Skip documentation update (NOT RECOMMENDED)
   → Causes documentation drift, manual cleanup later

What would you like to do? (1/2/3)
```

**Step 6: Handle Response**

**If Option 1 (Apply all):**

```bash
# Apply changes using Edit tool
<apply diffs to each file>

# Stage docs
git add docs/STATUS.md docs/ROADMAP.md

# Verify
git diff --cached --stat

# Commit
git commit -m "docs: update STATUS/ROADMAP after <feature> merge (PR #<number>)

- Mark <feature> as complete in STATUS.md
- Update ROADMAP.md active work section
- Update last modified dates

Ensures documentation reflects state after PR #<number>."

# Push
git push origin main

# Verify
git log -1 --oneline
```

**If Option 2 (Edit):**

Show each file, ask for edits, apply custom changes.

**If Option 3 (Skip):**

Show strong warning:

```
⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️

Skipping documentation updates is STRONGLY DISCOURAGED.

CONSEQUENCES:
- STATUS.md won't reflect current state
- ROADMAP.md will show incorrect priorities
- Future AI sessions waste hours on wrong info
- Next developer confused about project state

This is the ROOT CAUSE of documentation drift.

Add reminder comment to PR? (yes/no)
```

**Step 7: Validation**

After committing docs, validate:

```bash
# Check for stale TODOs
grep -r "TODO.*<feature>" docs/ --include="*.md"

# Check for outdated status markers
grep -r "🔄.*<feature>" docs/ --include="*.md"

# Verify last updated dates
grep "Last Updated" docs/STATUS.md docs/ROADMAP.md
```

Show validation results:

```
✅ DOCUMENTATION VALIDATION

- No stale TODOs found
- No outdated status markers
- Last updated dates: 2025-11-24 (today)
- Feature marked complete consistently

Documentation is accurate and current! 🎉
```

---

## Stage 11: Handoff Generation

**Step 1: Ask About Next Feature**

"What feature should we work on next?"

Wait for user input.

**Step 2: Generate Handoff Document**

Create comprehensive handoff text (copyable, not saved to file):

````
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 FEATURE WRAP-UP COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: <feature-name>
PR: #<number> - MERGED to main
Date: <date>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AI SESSION HANDOFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy/paste this into your next Claude Code session:

---START HANDOFF---

# AI Session Handoff

**Date**: <current-date>
**Completed Feature**: <feature-name>
**Next Feature**: <user-provided>
**Current Worktree**: main (synced)
**Current Branch**: main

## Just Completed: <feature-name>

**Status**: ✅ Merged to main (PR #<number>)

**Summary**:
<what was built - from PR>

**Key Files Modified**:
- <file 1>
- <file 2>
- <file 3>

**Patterns Used**:
- Multi-tenant: organizationId scoping
- Server actions: Rate limiting + auth
- Industry workflow: Synced with main first
- <other patterns>

**Merge Conflicts**:
<if any, what and how resolved>

**Documentation Updated**:
✅ STATUS.md - Feature marked complete
✅ ROADMAP.md - Task marked done
✅ All docs reflect current reality

## Worktree Architecture

This project uses git worktrees for parallel development:

```
/church-connect-hub/.bare         (bare repo)
/church-connect-hub/main           (main branch)
/church-connect-hub/volunteer      (feature branch)
/church-connect-hub/prayer         (feature branch)
/church-connect-hub/tech-debt      (just merged)
```

**Database Isolation**:
- main: ep-xxx (port 3000)
- volunteer: ep-yyy (port 3001)
- prayer: ep-zzz (port 3002)

**Critical Commands**:
```bash
git worktree list                # See all worktrees
cd /path/to/worktree            # Switch context
git merge main                  # Update with main changes
```

**Documentation Workflow**:
- ✅ Docs updated in main AFTER merge
- ❌ Never update docs in feature branches
- Conflicts in docs are EXPECTED - combine, don't replace

## Current Project State

**Working Features**:
- Connect Card AI Vision ✅
- Review Queue ✅
- Team Management ✅
- Prayer Management ✅
- Volunteer Management ✅
- <just-completed> ✅

**In Progress** (Other Worktrees):
- <list features in other worktrees>

**Next Feature**:
- <next-feature>

## Next Feature: <next-feature>

**Objective**:
<what needs to be built>

**Recommended Approach**:
<implementation suggestions>

**Files to Review**:
- <similar existing code>

**Patterns to Follow**:
- Server actions: `/add-server-action` command
- Multi-tenant: `requireDashboardAccess()`
- Tables: TanStack Table pattern
- Forms: react-hook-form + Zod

## Quick Reference

**Documentation**:
- `CLAUDE.md` - Core AI instructions
- `docs/essentials/coding-patterns.md` - Patterns
- `docs/STATUS.md` - Current state
- `docs/ROADMAP.md` - Priorities

**Slash Commands**:
- `/session-start <feature>` - Initialize
- `/feature-wrap-up` - This command
- `/add-server-action <name>` - Generate action
- `/review-code` - Quality check

**Critical Rules**:
- ✅ Build before commit
- ✅ Sync with main first (industry standard)
- ✅ Update docs in main after merge
- ✅ Only update main worktree post-merge
- ❌ Never update docs in feature branches
- ❌ Never auto-sync active worktrees

## Starting Next Session

**First command**:
```
/session-start <next-feature>
```

**Good luck! Previous session completed successfully.** 🚀

---END HANDOFF---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Copy text between START/END markers for next Claude Code session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Great work on <feature-name>! 🎉
````

---

## Error Handling

**Build Failures:**

- Stop workflow
- Report errors with file:line
- Offer to help fix
- Resume from Stage 3

**Sync Conflicts (Stage 1):**

- Abort merge/rebase
- Show conflict guide
- User resolves manually
- Re-run /feature-wrap-up

**Merge Conflicts (Stage 5 forecast):**

- Warn in forecast
- Guide resolution during PR merge
- Emphasis: COMBINE content

**Worktree Update Failures (Stage 9):**

- Uncommitted changes: Skip or stash
- Merge conflicts: Abort, mark for manual sync
- Missing worktree: Continue gracefully

---

## When to Use This Command

✅ **Use when:**

- Feature complete and tested
- Ready to merge to main
- Want automated wrap-up workflow
- Need conflict detection
- Need documentation updates
- Need handoff for next session

❌ **Don't use if:**

- Feature incomplete
- Build broken
- Critical bugs present
- Not in worktree setup

---

## Key Industry Standards Applied

**Stage 1: Sync with Main First**

- ✅ Google: "Sync before code review"
- ✅ GitHub: "Keep branch up to date"
- ✅ GitLab: "Rebase on target branch"
- ✅ Trunk-Based: "Integrate frequently"

**Stage 10: Required Documentation**

- ✅ Every PR updates docs
- ✅ Comprehensive (STATUS, ROADMAP, visions)
- ✅ Validated (no stale content)
- ✅ Auditable (clean commit messages)

**Result:** Clean merges, current docs, comprehensive handoffs.
