---
description: Complete end-to-end feature workflow - worktree-aware with conflict detection
---

# Feature Wrap-Up (Worktree-Aware)

Complete feature workflow: build → commit → PR → merge → sync main → handoff.

**Key Features:**

- Updates main worktree after merge
- Optional sync of other worktrees (safety-first)
- NO doc updates in feature branch (prevents conflicts)
- Generates copyable handoff text

---

## Stage 1: Pre-Flight Checks

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
echo "📋 Deferred doc updates to Stage 8:"
ls -1 .claude/pending-docs/*.patch 2>/dev/null | xargs -I {} basename {} .patch
```

**Rules:**

- Core docs (PROJECT.md, PLAYBOOK.md) auto-defer to Stage 8
- Feature docs (`/docs/features/{your-feature}/`) are allowed
- Patches stored in `.claude/pending-docs/` for Stage 8

**No stopping, no questions - just handles it.**

---

## Stage 2: Quality Verification

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

**Note:** We do NOT use `--delete-branch` because worktrees keep feature branches for continued development. The branch stays on the remote and locally in the worktree.

### 6.3: Verify

```bash
gh pr view <pr-number> --json state,mergedAt
```

---

## Stage 7: Post-Merge Sync

### 7.1: Update Main Worktree

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/main
git fetch origin main
git pull origin main
```

### 7.2: Schema Migration (if needed)

If schema.prisma was modified:

```bash
pnpm prisma generate
pnpm prisma db push
```

### 7.3: Other Worktrees - Status Check

```bash
# Check each worktree status
for worktree in connect-card prayer volunteer tech-debt integrations; do
  echo "==== $worktree ===="
  cd /home/digitaldesk/Desktop/church-connect-hub/$worktree 2>/dev/null && \
  git status --short | head -5 && \
  echo "Behind main: $(git rev-list HEAD..main --count 2>/dev/null || echo 'N/A')"
done
```

Show status table:

```
WORKTREE STATUS
===============

Worktree     | Uncommitted | Behind Main | Recommendation
-------------|-------------|-------------|---------------
connect-card | 0 files     | 3 commits   | Safe to sync
prayer       | 5 files     | 2 commits   | Skip (active)
volunteer    | 0 files     | 1 commit    | Safe to sync
```

Options:

1. Sync all CLEAN worktrees (recommended)
2. Ask for each individually
3. Skip all (manual sync later)

For clean worktrees:

```bash
cd /path/to/worktree
git merge main --no-edit
```

---

## Stage 8: Documentation Update

**REQUIRED** - Run in main worktree after merge.

### 8.0: Apply Deferred Doc Updates (Auto)

Check for and apply any patches deferred from Stage 1.2:

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/main

# Check for pending patches from feature worktree
FEATURE_WORKTREE="/home/digitaldesk/Desktop/church-connect-hub/<feature-name>"
PENDING_DIR="$FEATURE_WORKTREE/.claude/pending-docs"

if [ -d "$PENDING_DIR" ] && ls "$PENDING_DIR"/*.patch 1>/dev/null 2>&1; then
  echo "📋 Applying deferred doc updates..."

  for patch in "$PENDING_DIR"/*.patch; do
    FILENAME=$(basename "$patch" .patch)
    echo "  → Applying $FILENAME changes"

    # Apply the patch
    git apply "$patch"

    # Remove the patch file
    rm "$patch"
  done

  echo "✅ Deferred updates applied"
else
  echo "No deferred doc updates to apply"
fi
```

### 8.1: Analyze What Was Built

```bash
gh pr view <pr-number> --json title,body,files
git log -1 --stat
```

### 8.2: Update PROJECT.md

Move feature from "In Progress" to "Complete":

```markdown
## Working Features

### <Feature Name> - COMPLETE (Nov 2025)

- <Key accomplishment 1>
- <Key accomplishment 2>
```

Update roadmap/priorities section.

### 8.3: Update Feature Vision (if needed)

Only if scope changed or feature completed:

```bash
# Update status in docs/features/<feature>/vision.md
# Mark completed items with checkboxes
```

### 8.4: Commit Documentation

```bash
git add docs/
git commit -m "docs: update PROJECT.md after <feature> merge (PR #<number>)"
git push origin main
```

---

## Stage 9: Handoff

### 9.1: Ask About Next Feature

"What feature should we work on next?"

### 9.2: Generate Handoff

````
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
- main: Updated
- Others: <status>

---

## HANDOFF FOR NEXT SESSION

Copy this to your next Claude Code session:

---START---

# Session Handoff

**Date**: <date>
**Completed**: <feature> (PR #<number>)
**Next**: <next-feature>

## Just Completed
<summary of what was built>

## Project State
- Connect Cards: Ready for PR
- Prayer: 65% - Blocking
- Volunteer: In Progress
- Tech Debt: Critical items
- Integrations: Planning

## Worktree Setup
```
.bare/                 (bare repo)
main/                  (main branch)
connect-card/          (feature/connect-card)
prayer/                (feature/prayer-enhancements)
volunteer/             (feature/volunteer-management)
tech-debt/             (feature/tech-debt)
integrations/          (feature/integrations)
```

## Key Commands
```bash
git -C ../.bare worktree list     # See all worktrees
cd /path/to/worktree              # Switch context
git merge main                    # Update from main
```

## Documentation
- PROJECT.md - Current state & roadmap
- PLAYBOOK.md - Technical decisions & patterns
- docs/features/*/vision.md - Feature specs

## Next Steps
1. cd to appropriate worktree
2. Run `/session-start <feature>` or continue work
3. Use `/feature-wrap-up` when done

---END---

````

---

## Error Handling

**Build Failures**: Stop, report errors, offer to fix
**Merge Conflicts**: GitHub shows conflicts during PR - resolve before merge
**Worktree Issues**: Skip active worktrees, provide manual instructions
**Documentation**: Strong warning if skipped

---

## When to Use

**Use when:**

- Feature complete and tested
- Ready to merge to main
- Need automated wrap-up workflow

**Don't use if:**

- Feature incomplete
- Build broken
- Not in worktree setup
