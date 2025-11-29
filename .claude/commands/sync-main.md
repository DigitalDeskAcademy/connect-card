---
description: Sync latest main into current worktree safely
---

# Sync Main

Safely pull latest main into current worktree without losing work.

---

## Step 1: Capture Current State

```bash
# Get current branch and check for uncommitted work
CURRENT_BRANCH=$(git branch --show-current)
UNCOMMITTED=$(git status --short | wc -l)
echo "Branch: $CURRENT_BRANCH"
echo "Uncommitted files: $UNCOMMITTED"
```

---

## Step 2: Stash Uncommitted Work (if any)

If uncommitted files > 0:

```bash
git stash push -m "sync-main: auto-stash before merge"
```

---

## Step 3: Fetch and Merge Main

```bash
# Fetch latest from origin
git fetch origin main

# Merge main into current branch
git merge origin/main --no-edit
```

**If merge conflicts:**

1. Show conflicting files: `git diff --name-only --diff-filter=U`
2. Ask user: "Resolve conflicts manually or abort?"
3. If abort: `git merge --abort` then restore stash

---

## Step 4: Restore Stashed Work

If work was stashed in Step 2:

```bash
git stash pop
```

**If stash conflicts:** Show files and let user resolve manually.

---

## Step 5: Verify & Report

```bash
git log --oneline -3
git status
```

Report:

```
SYNC COMPLETE
=============
Branch: feature/prayer-enhancements
Merged: X commits from main
Status: Clean (or: X uncommitted files restored)
```

---

## Error Recovery

**Merge failed:** `git merge --abort` → restore stash → report failure
**Stash conflict:** Leave stash in place, show `git stash list`, manual resolution needed
