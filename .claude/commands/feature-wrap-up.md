---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
---

# Feature Wrap-Up (Worktree-Aware)

Complete feature workflow: build → commit → PR → merge → **RESET to main** → handoff.

**Key Features:**

- **RESETS branch to main after merge** (not merge - prevents drift)
- Updates documentation in main worktree
- Optional sync of other worktrees (safety-first)
- NO doc updates in feature branch (prevents conflicts)
- Generates copyable handoff text

---

## Stage 1: Pre-Flight Checks

### 1.0: Origin Sync Check (CRITICAL)

**ALWAYS run first** - ensures we have latest changes from origin/main before build:

```bash
git fetch origin main
BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
echo "Commits behind origin/main: $BEHIND"
```

**If behind (BEHIND > 0), merge before proceeding:**

```bash
git merge origin/main --no-edit
pnpm prisma generate
```

**STOP if merge has conflicts** - resolve them first.

---

### 1.1: Schema Sync Check

Check if Prisma schema differs from main:

```bash
diff -q prisma/schema.prisma ../main/prisma/schema.prisma 2>/dev/null || echo "Schema differs or main not accessible"
```

If schemas differ, show differences and offer to sync:

```bash
# Show differences
diff prisma/schema.prisma ../main/prisma/schema.prisma | head -30

# If user wants to sync:
cp ../main/prisma/schema.prisma prisma/schema.prisma
pnpm prisma generate
```

### 1.2: Documentation Scope Check (Auto-Defer)

Check for core doc changes and automatically defer them to Stage 8:

```bash
# Check for forbidden changes (staged or unstaged)
FORBIDDEN_DOCS=$(git diff main --name-only | grep -E "docs/(PROJECT|PLAYBOOK)\.md" || true)
```

**If forbidden docs found, AUTO-DEFER (no user interaction):**

```bash
# 1. Create pending-docs directory
mkdir -p .claude/pending-docs

# 2. For each forbidden file, create a patch and revert
for doc in $FORBIDDEN_DOCS; do
  FILENAME=$(basename "$doc")

  # Create patch of the changes
  git diff main -- "$doc" > ".claude/pending-docs/${FILENAME}.patch"

  # Revert to main version
  git checkout main -- "$doc"
done

# 3. Stage the reverts
git add docs/PROJECT.md docs/PLAYBOOK.md 2>/dev/null || true

# 4. Report what was deferred
echo "Deferred doc updates to Stage 8:"
ls -1 .claude/pending-docs/*.patch 2>/dev/null | xargs -I {} basename {} .patch
```

**Rules:**

- Core docs (PROJECT.md, PLAYBOOK.md) auto-defer to Stage 8
- Feature docs (`/docs/features/{your-feature}/`) are allowed
- Patches stored in `.claude/pending-docs/` for Stage 8

**No stopping, no questions - just handles it.**

---

## Stage 2: Quality Verification

### 2.0: Prisma Client Sync (REQUIRED)

**ALWAYS run before build** - ensures Prisma types match schema after any main sync:

```bash
pnpm prisma generate
```

### 2.1: Build Check

```bash
pnpm build
```

If build fails, STOP and report errors with file:line references.

### 2.2: Lint Check

```bash
pnpm lint
```

If lint fails, offer to run `pnpm lint --fix`.

### 2.3: Quick Sanity Check

Scan for issues:

```bash
# Check for console.log in production code
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ components/ lib/ actions/ | grep -v ".spec." | head -10

# Check for .only() in tests
grep -r "\.only(" tests/ --include="*.spec.ts" | head -5
```

Report findings, ask if acceptable to proceed.

---

## Stage 3: Commit Changes

### 3.1: Status Review

```bash
git status
git diff --stat
```

### 3.2: Create Commit

Analyze changes and draft commit message:

```
<type>: <short summary>

<optional details>
```

Types: feat, fix, refactor, docs, test, chore

```bash
git add .
git commit -m "$(cat <<'EOF'
<message>
EOF
)"
```

### 3.3: Verify Clean State

```bash
git log -1 --oneline
git status
```

---

## Stage 4: Review Changes

### 4.1: Show Changed Files

```bash
git diff main...HEAD --name-only
```

### 4.2: Confirm Ready

List files that will be in the PR. GitHub will detect any merge conflicts with main during PR creation.

Ask: "Ready to push and create PR? (yes/no)"

---

## Stage 5: Pull Request

### 5.1: Push Branch

```bash
git push origin <branch-name> -u
```

### 5.2: Create PR

```bash
gh pr create --title "<type>: <feature>" --body "$(cat <<'EOF'
## Summary
<1-3 bullets>

## Changes
<key files>

## Testing
<how to test>

## Checklist
- [x] Build passes
- [x] ESLint clean
EOF
)"
```

Store PR number.

---

## Stage 6: Merge

### 6.1: Manual Testing?

Ask: "Need manual testing before merge? (yes/no)"

### 6.2: Merge PR

```bash
gh pr merge <pr-number> --squash
```

### 6.3: Verify Merge

```bash
gh pr view <pr-number> --json state,mergedAt
```

---

## Stage 7: Reset Current Worktree to Main (CRITICAL)

> **WHY RESET, NOT MERGE?**
>
> After your PR merges, your work IS in main. The feature branch's commit history
> is now irrelevant. Resetting to main gives you a clean slate and prevents the
> "25 commits ahead, 17 commits behind" drift problem.

### 7.1: Verify PR is Merged

```bash
# Confirm the PR merged successfully
gh pr view <pr-number> --json state | grep -q '"MERGED"' && echo "PR merged successfully"
```

### 7.2: Fetch Latest Main

```bash
git fetch origin main
```

### 7.3: Check for Any Uncommitted Work

```bash
UNCOMMITTED=$(git status --short | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "WARNING: You have $UNCOMMITTED uncommitted files!"
  echo "These will be LOST if you reset. Commit or stash them first."
  git status --short
  exit 1
fi
```

### 7.4: Reset to Main

```bash
# This is safe because:
# 1. PR is merged - your work is IN main
# 2. No uncommitted files - nothing to lose
# 3. Gives clean slate for next feature

git reset --hard origin/main
```

### 7.5: Update Remote Branch (CRITICAL)

**After reset, the remote feature branch is stale.** Force push to sync it:

```bash
# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Update remote to match local (prevents "49 commits ahead" on next PR)
git push --force-with-lease origin $CURRENT_BRANCH

echo "✅ Remote branch updated to match main"
```

**Why this matters:**

- Your PR merged → commits went to main
- You reset local to main → local is current
- Remote feature branch still points to old commit → causes confusion
- Force push updates remote to match → clean slate for next feature

### 7.6: Verify Clean State

```bash
CURRENT_BRANCH=$(git branch --show-current)
echo "=== Post-Reset Verification ==="
echo "HEAD: $(git log -1 --oneline)"
echo "Ahead of main: $(git rev-list origin/main..HEAD --count)"
echo "Behind main: $(git rev-list HEAD..origin/main --count)"
echo "Ahead of remote branch: $(git rev-list origin/$CURRENT_BRANCH..HEAD --count)"
```

**Expected output:** All counts should be 0.

### 7.7: Regenerate Prisma Client

```bash
pnpm prisma generate
```

---

## Stage 8: Documentation Update (in Main Worktree)

**REQUIRED** - Run in MAIN worktree so doc changes are centralized.

### 8.0: Switch to Main Worktree and Verify Branch (CRITICAL)

**Common issue:** The main worktree may be on a different branch (e.g., `feature/production-deploy`).
This causes push failures and wasted work. Always verify branch FIRST.

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/main

# Step 1: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Main worktree is on branch: $CURRENT_BRANCH"

# Step 2: If not on main, handle it
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Main worktree is on '$CURRENT_BRANCH', not 'main'"

  # Check for uncommitted changes
  UNCOMMITTED=$(git status --short | wc -l)
  if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "Stashing $UNCOMMITTED uncommitted files..."
    git stash push -m "feature-wrap-up: auto-stash before switching to main"
  fi

  # Switch to main branch
  echo "Switching to main branch..."
  git checkout main
fi

# Step 3: Now safe to pull
git fetch origin main
git pull origin main
```

**If checkout fails due to conflicts:** The main worktree has diverged. Resolve manually:

1. Check `git status` for the issue
2. Either commit, stash, or reset the changes
3. Then `git checkout main`

### 8.1: Apply Deferred Doc Updates

Check for and apply any patches deferred from Stage 1.2:

```bash
# Check for pending patches in the feature worktree
FEATURE_WORKTREE="/home/digitaldesk/Desktop/church-connect-hub/<worktree-name>"
PENDING_DIR="$FEATURE_WORKTREE/.claude/pending-docs"

if [ -d "$PENDING_DIR" ] && ls "$PENDING_DIR"/*.patch 1>/dev/null 2>&1; then
  echo "Applying deferred doc updates..."

  for patch in "$PENDING_DIR"/*.patch; do
    FILENAME=$(basename "$patch" .patch)
    echo "  → Applying $FILENAME changes"

    if git apply "$patch" 2>/dev/null; then
      rm "$patch"
      echo "  ✅ Applied successfully"
    else
      echo "  ⚠️  Patch conflict - apply manually"
      cat "$patch"
    fi
  done
fi
```

### 8.2: Update WORKTREE-STATUS.md

Update the section for the worktree that just completed:

```markdown
### worktree-name (Port XXXX)

**Status:** ✅ Phase X Complete - PR #YY merged
...
```

### 8.3: Commit and Push Documentation

```bash
git add docs/
git commit -m "docs: update after <feature> merge (PR #<number>)"
git push origin main
```

### 8.4: Return to Feature Worktree

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/<worktree-name>
```

---

## Stage 9: Sync Other Worktrees (Optional)

**Run AFTER documentation is pushed** so all worktrees get doc changes.

### 9.1: Check Worktree Status

```bash
for worktree in connect-card prayer volunteer tech-debt; do
  echo "==== $worktree ===="
  cd /home/digitaldesk/Desktop/church-connect-hub/$worktree 2>/dev/null && \
  git fetch origin main 2>/dev/null && \
  UNCOMMITTED=$(git status --short | wc -l) && \
  BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 'N/A') && \
  UNIQUE=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 'N/A') && \
  echo "Uncommitted: $UNCOMMITTED | Behind: $BEHIND | Unique commits: $UNIQUE"
done
```

Show status table:

```
WORKTREE STATUS
===============

Worktree     | Uncommitted | Behind | Unique | Recommendation
-------------|-------------|--------|--------|---------------
connect-card | 0 files     | 3      | 0      | RESET (no unique work)
prayer       | 5 files     | 2      | 3      | Skip (active work)
volunteer    | 0 files     | 1      | 0      | RESET (no unique work)
```

### 9.2: Sync Logic

**For each worktree:**

| Uncommitted | Unique Commits | Action                                            |
| ----------- | -------------- | ------------------------------------------------- |
| 0           | 0              | `reset --hard` + `push --force-with-lease` (safe) |
| 0           | > 0            | `git merge origin/main` (preserve work)           |
| > 0         | any            | Skip - has active work                            |

```bash
# For worktrees with no uncommitted and no unique commits:
git reset --hard origin/main
git push --force-with-lease origin $(git branch --show-current)  # Update remote!
pnpm prisma generate

# For worktrees with unique commits but no uncommitted:
git merge origin/main --no-edit
pnpm prisma generate
```

**Key insight:** After reset, always force push to sync the remote branch. This prevents the "49 commits ahead" problem.

---

## Stage 10: Handoff

### 10.1: Generate Completion Report

```
FEATURE WRAP-UP COMPLETE
========================

**Feature**: <name>
**PR**: #<number> - Merged
**Date**: <date>

## What Was Built
<summary>

## Key Files
- <file 1>
- <file 2>

## Worktree Status
- Current worktree: Reset to main ✅
- Other worktrees: <status>

## Branch Health
- Ahead of main: 0 commits ✅
- Behind main: 0 commits ✅
- Remote branch synced: ✅
- Clean slate for next feature

---

## NEXT STEPS

1. Run `/clear` to start fresh session
2. Run `/session-start <next-feature>` to begin new work
3. Or check `docs/WORKTREE-STATUS.md` for priorities

```

---

## Error Handling

| Error                    | Recovery                                   |
| ------------------------ | ------------------------------------------ |
| Build fails              | Stop, report errors, fix before continuing |
| PR merge conflicts       | Resolve in GitHub UI, then continue        |
| Reset would lose work    | Commit or stash first, then reset          |
| Worktree has active work | Skip sync, provide manual instructions     |

---

## Key Principle: Reset + Force Push After Merge

```
BEFORE (wrong):
  PR merges → git merge origin/main → creates merge commits → DRIFT

STILL WRONG:
  PR merges → git reset --hard origin/main → local clean BUT remote stale → "49 COMMITS AHEAD"

CORRECT:
  PR merges → git reset --hard origin/main → git push --force-with-lease → BOTH CLEAN
```

**Your work is IN main after PR merges. Reset local. Force push remote. Start fresh.**
