---
description: Comprehensive worktree status analysis with honest assessment
argument-hint: [worktree-name]
---

# Worktree Status Analysis

**Worktree:** `$ARGUMENTS` (if empty, use current directory)

Provide comprehensive, brutally honest analysis of worktree status, progress, and recommended next actions.

---

## Stage 1: Gather Context (Use Subagents in Parallel)

**IMPORTANT:** Use the `Task` tool with `subagent_type="Explore"` to gather these in parallel for speed.

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

### 1.3 Recent PRs

```bash
# Recent merged PRs to main (context for what's shipped)
gh pr list --state merged --limit 5 --json number,title,mergedAt 2>/dev/null || echo "GitHub CLI not available"
```

### 1.4 Documentation State

Read these files to understand documented status:

1. **`docs/WORKTREE-STATUS.md`** - What does it claim about this worktree?
2. **`docs/PROJECT.md`** - Current phase, roadmap priorities
3. **`docs/PLAYBOOK.md`** - Any blockers or critical issues?
4. **Feature vision doc** based on current branch:
   - `feature/connect-card` → `docs/features/connect-cards/vision.md`
   - `feature/prayer*` → `docs/features/prayer/vision.md`
   - `feature/volunteer*` → `docs/features/volunteer/vision.md`
   - `feature/tech-debt` → `docs/features/tech-debt/vision.md`
   - `feature/integrations` → `docs/features/integrations/vision.md`
   - `main` → N/A (trunk)

### 1.5 Dev Dashboard State

Read `app/church/[slug]/admin/dev/page.tsx`:

- Find the `worktrees` array
- Locate the card matching this branch
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

## Stage 2: Analysis (Be Direct and Honest)

### Compare Reality vs Documentation

Ask these questions and answer honestly:

1. **Is documentation accurate?**

   - Does WORKTREE-STATUS.md reflect actual git state?
   - Are dev dashboard checkboxes current?
   - Does the vision doc status match reality?

2. **What's actually been accomplished?**

   - Check recent commits - what was built?
   - Check merged PRs - has work already shipped to main?
   - Look at uncommitted files - is there untracked WIP?

3. **Is this work active or abandoned?**
   - When was the last commit? (> 3 days = needs attention)
   - When was the last activity? (> 5 days = possibly abandoned)

### Assess Worktree Health

- **Merge risk:** How far behind main? (> 10 commits = sync soon)
- **Completion:** What % is actually done vs claimed?
- **Priority:** Is this the most important thing to work on?
- **Dependencies:** Does anything block or depend on this?

### Priority Check

From `docs/WORKTREE-STATUS.md`, the priority order is:

1. prayer → Server actions (BLOCKING)
2. volunteer → Ready for export flag
3. connect-card → Card format onboarding
4. integrations → Phase 2 API
5. tech-debt → Phase 2 Performance
6. main → Project management

If working on lower priority, call it out.

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
> [Quote from WORKTREE-STATUS.md and vision doc]

**Reality:**
[What's actually true based on code/commits/PRs]

**Discrepancy:**
[Be brutally honest about gaps - or say "Docs are accurate"]

## Task Status

| Task | Doc Status | Actual |
|------|------------|--------|
| [task] | [claimed] | [reality] |

Summary: X/Y tasks actually complete

## Health Verdict: [🟢 Healthy | 🟡 Needs Attention | 🔴 Critical | ⚫ Abandoned]

[Honest assessment paragraph. Examples:]

🟢 "Active development, on track, docs accurate."
🟡 "15 commits behind main - sync soon or face merge conflicts."
🔴 "58 uncommitted files for 14+ hours. Commit or risk losing work."
⚫ "Last activity 5 days ago. Is this abandoned?"

## Priority Check

Current priority order:
1. [priority 1] ← [status]
2. [priority 2] ← [status]
...

This worktree is priority #X.

[If not #1]: "⚠️ [Higher priority] needs attention first because [reason]."

## Recommended Action

[ONE of these - be specific:]

### 🚀 CREATE PR
Ready to merge to main.
\`\`\`bash
git push origin [branch]
gh pr create --title "[suggested title]" --body "## Summary\n- [bullet points]"
\`\`\`

### 💻 KEEP WORKING
Continue current work. Next tasks:
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

### 🔀 SWITCH GEARS
[Other worktree] is higher priority.
\`\`\`bash
cd /home/digitaldesk/Desktop/church-connect-hub/[worktree]
/worktree-status
\`\`\`

### 🧹 CLEAN UP
This work appears stale. Options:
1. Resume and finish
2. Stash and revisit later: `git stash push -m "[description]"`
3. Abandon: `git checkout . && git clean -fd`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Tone Guidelines

**DO:**

- Be direct and specific
- Point out stale documentation ("Docs say X but reality is Y")
- Call out abandoned work ("Last commit 5 days ago - is this dead?")
- Compare claimed progress to actual commits
- Give specific actionable commands
- Prioritize based on project roadmap

**DON'T:**

- Be agreeable just to be nice
- Assume documentation is accurate
- Give vague advice ("keep working on things")
- Skip hard questions ("should we abandon this?")
- Ignore priority order

**Example harsh feedback:**

- "This worktree has 58 uncommitted files from 14 hours ago. Either commit this work or it's going to cause merge hell."
- "Documentation says 'In Progress' but the last commit was 3 days ago. Is this abandoned?"
- "You're 20 commits behind main. Sync before doing anything else."
- "The dev dashboard shows 0/6 tasks complete but PRs #47 and #48 already shipped these features. Documentation is lying to you."
- "Prayer worktree is BLOCKING and hasn't been touched. Why are you here instead?"

---

## Performance Notes

- Use `Task` tool with `subagent_type="Explore"` to gather git state, docs, and dev dashboard in parallel
- Skip files not relevant to current worktree
- Target: Complete analysis in < 30 seconds
- Don't run TypeScript checks unless specifically asked (slow)

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
