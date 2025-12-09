---
description: Comprehensive worktree status analysis with honest assessment
argument-hint: [worktree-name]
---

# Worktree Status Analysis

**Worktree:** `$ARGUMENTS` (if empty, use current directory)

Provide comprehensive, brutally honest analysis of **THIS worktree only**. Do NOT compare to or suggest switching to other worktrees - they may have parallel work in progress with uncommitted changes.

---

## Stage 1: Gather Context

### 1.1 Determine Current Worktree

```bash
# Get current directory name (worktree identifier)
basename $(pwd)

# Get current branch
git branch --show-current

# Map branch to worktree info
# main → port 3000
# feature/connect-card → port 3001
# feature/prayer-enhancements → port 3002
# feature/volunteer-management → port 3003
# feature/tech-debt → port 3004
# feature/integrations → port 3005
```

### 1.2 Git State

```bash
# Current branch
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"

# Uncommitted files
echo "=== Uncommitted Files ==="
git status --short
UNCOMMITTED=$(git status --short | wc -l)
echo "Count: $UNCOMMITTED"

# Commits ahead/behind origin
echo "=== Origin Status ==="
git rev-list --left-right --count origin/$BRANCH...HEAD 2>/dev/null || echo "No remote tracking"

# Commits behind main
echo "=== Main Status ==="
git fetch origin main --quiet 2>/dev/null
git rev-list --left-right --count origin/main...HEAD 2>/dev/null

# Last 5 commits on this branch
echo "=== Recent Commits ==="
git log --oneline -5

# Last activity
echo "=== Last Activity ==="
git log -1 --format="%cr (%ci)"
```

### 1.3 Recent PRs from This Branch

```bash
# PRs from this branch (open or merged)
gh pr list --head $(git branch --show-current) --state all --limit 3 --json number,title,state,mergedAt 2>/dev/null || echo "GitHub CLI not available"
```

### 1.4 Documentation State

Read these files to understand documented status for THIS worktree:

1. **`docs/WORKTREE-STATUS.md`** - Find the section for this worktree only
2. **Feature vision doc** based on current branch:
   - `feature/connect-card` → `docs/features/connect-cards/vision.md`
   - `feature/prayer*` → `docs/features/prayer/vision.md`
   - `feature/volunteer*` → `docs/features/volunteer/vision.md`
   - `feature/tech-debt` → `docs/features/tech-debt/vision.md`
   - `feature/integrations` → `docs/features/integrations/vision.md`
   - `main` → N/A (trunk)

### 1.5 Dev Dashboard State

Read `app/church/[slug]/admin/dev/page.tsx`:

- Find the `worktrees` array
- Locate the card matching THIS branch only
- Extract:
  - `status` and `statusLabel`
  - `tasks` array (what's completed vs pending)
  - `wishlist` items

### 1.6 Code State (if significant uncommitted changes)

If uncommitted files > 5:

- Group files by directory/feature area
- Identify what's being worked on
- Check for obvious issues (console.log debugging left in, etc.)

---

## Stage 2: Analysis (This Worktree Only)

### Compare Reality vs Documentation

Ask these questions about THIS worktree only:

1. **Is documentation accurate for this worktree?**

   - Does WORKTREE-STATUS.md section reflect actual git state?
   - Are dev dashboard checkboxes current for this worktree?
   - Does the vision doc status match reality?

2. **What's actually been accomplished here?**

   - Check recent commits - what was built?
   - Check merged PRs from this branch - has work already shipped?
   - Look at uncommitted files - is there untracked WIP?

3. **Is this worktree's work active or stale?**
   - When was the last commit? (> 3 days = needs attention)
   - When was the last activity? (> 5 days = possibly stale)

### Assess Worktree Health

- **Merge risk:** How far behind main? (> 10 commits = sync soon)
- **Completion:** What % of THIS worktree's tasks are done vs claimed?
- **Blockers:** Is anything blocking progress on THIS worktree?

**IMPORTANT:** Do NOT check or comment on other worktrees. They may have parallel work with uncommitted changes.

---

## Stage 3: Output Report

Generate this exact format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 WORKTREE STATUS: [name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch: [branch name]
Port: [port number]
Path: [full path]

## Git State

| Metric | Value |
|--------|-------|
| Uncommitted files | X files |
| Ahead of origin | X commits (unpushed) |
| Behind main | X commits (need sync) |
| Last activity | X ago |

[If uncommitted > 0, list key files grouped by area]

## Progress Assessment

**Documentation claims:**
> [Quote from WORKTREE-STATUS.md section for this worktree]

**Reality:**
[What's actually true based on code/commits/PRs]

**Discrepancy:**
[Be brutally honest about gaps - or say "Docs are accurate"]

## Task Status

| Task | Doc Status | Actual |
|------|------------|--------|
| [task] | [claimed] | [reality] |

Summary: X/Y tasks actually complete

## Health Verdict: [🟢 Healthy | 🟡 Needs Attention | 🔴 Critical | ⚫ Stale]

[Honest assessment paragraph. Examples:]

🟢 "Active development, on track, docs accurate."
🟡 "15 commits behind main - sync soon or face merge conflicts."
🔴 "58 uncommitted files for 14+ hours. Commit or risk losing work."
⚫ "Last activity 5 days ago in this worktree. Resume or stash?"

## Recommended Action

[ONE of these - be specific:]

### 🚀 CREATE PR
Ready to merge to main.
\`\`\`bash
git push origin [branch]
gh pr create --title "[suggested title]" --body "## Summary\n- [bullet points]"
\`\`\`

### 💻 KEEP WORKING
Continue current work. Next tasks for this worktree:
1. [specific task]
2. [specific task]

### 🔄 SYNC MAIN FIRST
[X] commits behind main. Sync before continuing.
\`\`\`bash
/sync-main
\`\`\`

### 💾 COMMIT WIP
[X] uncommitted files need to be saved.
\`\`\`bash
git add .
git commit -m "wip: [suggested message based on files]"
\`\`\`

### 🧹 RESUME OR STASH
This worktree hasn't been touched in a while. Options:
1. Resume and finish the current phase
2. Stash and revisit later: `git stash push -m "[description]"`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Tone Guidelines

**DO:**

- Be direct and specific about THIS worktree
- Point out stale documentation ("Docs say X but reality is Y")
- Call out if this worktree seems stale
- Compare claimed progress to actual commits
- Give specific actionable commands for THIS worktree

**DON'T:**

- Compare to other worktrees or suggest switching
- Assume other worktrees are abandoned (they may have uncommitted WIP)
- Use priority order to suggest working elsewhere
- Be agreeable just to be nice
- Assume documentation is accurate

**Example feedback (this worktree only):**

- "This worktree has 58 uncommitted files from 14 hours ago. Either commit this work or it's going to cause merge hell."
- "Documentation says 'In Progress' but the last commit here was 3 days ago. Is this stale?"
- "You're 20 commits behind main. Sync before doing anything else."
- "The dev dashboard shows 0/6 tasks complete but PRs from this branch already shipped these features. Update the dashboard."

---

## Performance Notes

- Skip files not relevant to current worktree
- Target: Complete analysis in < 30 seconds
- Don't run TypeScript checks unless specifically asked (slow)
- Only read docs/dashboard sections for THIS worktree

---

## Quick Reference: Worktree Mapping

| Directory    | Branch                       | Port | Vision Doc                            |
| ------------ | ---------------------------- | ---- | ------------------------------------- |
| main         | main/general-maintenance     | 3000 | N/A                                   |
| connect-card | feature/connect-card         | 3001 | docs/features/connect-cards/vision.md |
| prayer       | feature/prayer-enhancements  | 3002 | docs/features/prayer/vision.md        |
| volunteer    | feature/volunteer-management | 3003 | docs/features/volunteer/vision.md     |
| tech-debt    | feature/tech-debt            | 3004 | docs/features/tech-debt/vision.md     |
| integrations | feature/integrations         | 3005 | docs/features/integrations/vision.md  |
