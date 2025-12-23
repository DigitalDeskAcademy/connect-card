---
description: Sync latest main into current worktree safely
---

# Sync Main (Smart)

Intelligently sync with main - uses RESET when safe, MERGE when needed.

---

## Step 1: Analyze Current State

```bash
# Fetch latest
git fetch origin main

# Get metrics
CURRENT_BRANCH=$(git branch --show-current)
BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
UNIQUE=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo "0")

# Detailed uncommitted work check
STAGED=$(git diff --cached --name-only | wc -l)
UNSTAGED=$(git diff --name-only | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard | grep -v -E "^(node_modules|\.next|\.env)" | wc -l)
UNCOMMITTED=$((STAGED + UNSTAGED + UNTRACKED))

echo "Branch: $CURRENT_BRANCH"
echo "Behind main: $BEHIND commits"
echo "Unique commits (not in main): $UNIQUE"
echo "Uncommitted files: $UNCOMMITTED"
```

### 1b: Uncommitted Work Warning

If uncommitted files are detected, show exactly what will be stashed:

```bash
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠️  UNCOMMITTED WORK DETECTED - WILL BE STASHED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  if [ "$STAGED" -gt 0 ]; then
    echo "📦 STAGED files ($STAGED):"
    git diff --cached --name-only | sed 's/^/   /'
    echo ""
  fi

  if [ "$UNSTAGED" -gt 0 ]; then
    echo "📝 MODIFIED files ($UNSTAGED):"
    git diff --name-only | sed 's/^/   /'
    echo ""
  fi

  if [ "$UNTRACKED" -gt 0 ]; then
    echo "🆕 UNTRACKED files ($UNTRACKED):"
    git ls-files --others --exclude-standard | grep -v -E "^(node_modules|\.next|\.env)" | head -10 | sed 's/^/   /'
    echo ""
  fi

  echo "These files will be STASHED before sync and RESTORED after."
  echo "If stash pop fails, your work is safe in: git stash list"
  echo ""
fi
```

**The stash protects your work**, but review the list above to ensure nothing unexpected is there.

---

## Step 2: Determine Strategy

| Uncommitted | Unique Commits | Strategy                       | Reason                           |
| ----------- | -------------- | ------------------------------ | -------------------------------- |
| 0           | 0              | **RESET + FORCE PUSH**         | No work to preserve, clean slate |
| 0           | > 0            | **MERGE + PUSH**               | Preserve unmerged work           |
| > 0         | 0              | **STASH + RESET + FORCE PUSH** | Save work, reset, restore        |
| > 0         | > 0            | **STASH + MERGE + PUSH + POP** | Safe merge preserving all work   |

### Decision Tree

```
Has uncommitted files?
├── YES → Stash first
│   └── Has unique commits?
│       ├── YES → MERGE → Push → Pop stash
│       └── NO → RESET → Force push → Pop stash
│
└── NO
    └── Has unique commits?
        ├── YES → MERGE → Push (preserve commits)
        └── NO → RESET → Force push (clean slate)
```

---

## Step 3: Execute Strategy

### If RESET Strategy (no unique commits):

```bash
# Safe to reset - no unique work to lose
echo "No unique commits. Resetting to main..."

# Stash if uncommitted files
if [ "$UNCOMMITTED" -gt 0 ]; then
  git stash push -m "sync-main: auto-stash before reset"
  STASHED=true
fi

# Reset to main
git reset --hard origin/main

# Restore stash if we stashed
if [ "$STASHED" = true ]; then
  git stash pop
fi

echo "✅ Reset to main complete"
```

### Step 3b: Update Remote Branch (RESET only)

**After a RESET, the remote feature branch is stale.** Force push to sync it:

```bash
# Update remote to match local (prevents "49 commits ahead" on next PR)
git push --force-with-lease origin $CURRENT_BRANCH

echo "✅ Remote branch updated"
```

**Why this matters:**

- Your PR merged → commits went to main
- You reset local to main → local is current
- Remote feature branch still points to old commit → causes confusion
- Force push updates remote to match → clean slate for next feature

### If MERGE Strategy (has unique commits):

```bash
# Has unique commits - must merge to preserve them
echo "Has $UNIQUE unique commits. Merging main..."

# Stash if uncommitted files
if [ "$UNCOMMITTED" -gt 0 ]; then
  git stash push -m "sync-main: auto-stash before merge"
  STASHED=true
fi

# Merge main
git merge origin/main --no-edit

# Check for conflicts
if [ $? -ne 0 ]; then
  echo "⚠️ MERGE CONFLICT"
  echo "Conflicting files:"
  git diff --name-only --diff-filter=U
  echo ""
  echo "Options:"
  echo "  1. Resolve conflicts manually, then: git add . && git commit"
  echo "  2. Abort merge: git merge --abort"

  # Don't pop stash if merge failed
  exit 1
fi

# Restore stash if we stashed
if [ "$STASHED" = true ]; then
  git stash pop
  if [ $? -ne 0 ]; then
    echo "⚠️ Stash conflict - resolve manually"
    echo "Your stashed changes are in: git stash list"
    exit 1
  fi
fi

echo "✅ Merge complete"
```

### Step 3c: Update Remote Branch (MERGE)

**After a merge, push to sync the remote branch:**

```bash
# Push merge commit to remote (regular push, not force)
git push origin $CURRENT_BRANCH

echo "✅ Remote branch updated with merge"
```

**Why regular push (not force)?** You have unique commits that aren't in main yet. A regular push adds the merge commit on top of your existing remote history.

---

## Step 4: Regenerate Prisma Client

**ALWAYS run after sync** - ensures TypeScript types match any schema changes:

```bash
pnpm prisma generate
```

---

## Step 5: Verify & Report

```bash
echo "=== Sync Complete ==="
echo "HEAD: $(git log -1 --oneline)"
echo "Ahead of main: $(git rev-list origin/main..HEAD --count)"
echo "Behind main: $(git rev-list HEAD..origin/main --count)"
echo "Ahead of remote branch: $(git rev-list origin/$CURRENT_BRANCH..HEAD --count)"
echo "Uncommitted: $(git status --short | wc -l)"
```

**All counts should be 0 after a successful RESET + FORCE PUSH.**

### Success Report

```
SYNC COMPLETE
=============
Branch: feature/volunteer-management
Strategy: RESET + FORCE PUSH (no unique commits)
Local: Synced with main ✅
Remote: Updated to match ✅
Status: 0 ahead, 0 behind (both local and remote)

Ready for new work!
```

Or:

```
SYNC COMPLETE
=============
Branch: feature/connect-card
Strategy: MERGE + PUSH (preserved 3 unique commits)
Local: Merged with main ✅
Remote: Pushed merge commit ✅
Status: 3 ahead (your work + merge), 0 behind main

Continue your work!
```

---

## Quick Reference

**When to use `/sync-main`:**

- Starting a new work session (sync first)
- Before creating a PR (ensure up-to-date)
- After someone else's PR merges to main

**When NOT to use:**

- Right after YOUR PR merges → Use `/feature-wrap-up` instead (it resets)
- In the middle of complex uncommitted changes → Commit first

---

## Why RESET vs MERGE?

### RESET (when no unique commits)

```
Your branch:  A---B---C (same as main)
Main:         A---B---C---D---E

After reset:  A---B---C---D---E (identical to main)
```

- Cleanest result
- No merge commits
- Fastest

### MERGE (when you have unique commits)

```
Your branch:  A---B---C---X---Y (X,Y are your work)
Main:         A---B---C---D---E

After merge:  A---B---C---D---E---M (merge commit)
                      \       /
                       X---Y
```

- Preserves your unmerged work
- Creates merge commit
- Necessary when you have WIP

---

## Error Recovery

| Issue                 | Solution                                                      |
| --------------------- | ------------------------------------------------------------- |
| Merge conflict        | Resolve manually or `git merge --abort`                       |
| Stash conflict        | `git stash show` to see changes, resolve manually             |
| Wrong strategy chosen | `git reflog` to find previous state, `git reset --hard <ref>` |
| Lost uncommitted work | Check `git stash list` - may be there                         |
