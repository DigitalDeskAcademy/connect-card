---
description: Comprehensive documentation audit - sync, verify consistency, remove outdated content
allowed-arguments: what changed
---

# Documentation Update & Audit

Audit all documentation across worktrees, detect stale content, and update the dev dashboard for project visibility.

**Purpose:** Keep docs in sync with reality. Prevents AI confusion and wasted hours.

---

## Stage 1: Gather Project State

### 1.1: Worktree Status

```bash
# List all worktrees and their branches
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree list
```

For each worktree, gather:

```bash
# For each worktree
cd /home/digitaldesk/Desktop/church-connect-hub/<worktree>
echo "=== $(basename $(pwd)) ==="
echo "Branch: $(git branch --show-current)"
echo "Uncommitted: $(git status --short | wc -l) files"
echo "Last commit: $(git log -1 --format='%s (%ar)')"
```

### 1.2: Recent Merged PRs

```bash
# Get recent merged PRs (last 2 weeks)
gh pr list --state merged --limit 10 --json number,title,mergedAt
```

### 1.3: Read Current Documentation

Read these files to understand current documented state:

- `docs/PROJECT.md` - Project overview, features, roadmap
- `docs/PLAYBOOK.md` - Technical decisions, patterns, debt
- `docs/WORKTREE-STATUS.md` - Worktree progress tracking
- `CLAUDE.md` - AI instructions
- `README.md` - Public-facing overview

---

## Stage 2: Analyze Feature Documentation

### 2.1: List All Feature Docs

```bash
find docs/features -name "*.md" -type f 2>/dev/null | sort
```

### 2.2: Check Each Feature Doc

For each feature doc, check:

1. **Last modified date** vs recent commits to that feature
2. **Status markers** (IN PROGRESS, COMPLETE, etc.) vs actual code state
3. **Checkboxes** - are completed items marked?
4. **Stale TODOs** - references to completed work

```bash
# Example: Check volunteer feature
ls -la docs/features/volunteer-management/
git log -3 --oneline -- "docs/features/volunteer-management/"

# Check for stale status markers
grep -r "IN PROGRESS\|🔄\|TODO" docs/features/volunteer-management/
```

### 2.3: Cross-Reference with Code

For each feature area, verify docs match reality:

| Feature       | Doc Location                           | Code Location                             | Check           |
| ------------- | -------------------------------------- | ----------------------------------------- | --------------- |
| Connect Cards | `/docs/features/connect-cards/`        | `/app/church/[slug]/admin/connect-cards/` | Status matches? |
| Prayer        | `/docs/features/prayer-management/`    | `/app/church/[slug]/admin/prayer/`        | Status matches? |
| Volunteer     | `/docs/features/volunteer-management/` | `/app/church/[slug]/admin/volunteer/`     | Status matches? |
| Integrations  | `/docs/features/integrations/`         | `/app/church/[slug]/admin/integrations/`  | Status matches? |

---

## Stage 3: Staleness Detection

### 3.1: Find Stale References

```bash
# TODOs for completed features
grep -r "TODO.*connect.card\|TODO.*prayer\|TODO.*volunteer" docs/ --include="*.md" -i

# "Planned" references that might be built
grep -r "planned\|will be\|future" docs/ --include="*.md" -i | head -20

# Old status markers
grep -r "🔄\|⚠️\|IN PROGRESS" docs/ --include="*.md"
```

### 3.2: Check Last Updated Dates

```bash
# Files with "Last Updated" headers
grep -r "Last Updated" docs/ --include="*.md" -l | while read f; do
  echo "$f: $(grep 'Last Updated' $f | head -1)"
done
```

Flag any docs not updated in 2+ weeks.

### 3.3: Orphaned Documentation

Check for docs referencing non-existent code:

```bash
# Feature docs without corresponding code
for feature_dir in docs/features/*/; do
  feature=$(basename $feature_dir)
  if [ ! -d "app/church/[slug]/admin/$feature" ]; then
    echo "⚠️ Orphaned doc? $feature_dir (no matching route)"
  fi
done
```

---

## Stage 4: Generate Audit Report

Create a comprehensive report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENTATION AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: <date>

## Worktree Status

| Worktree | Branch | Status | Last Commit |
|----------|--------|--------|-------------|
| main | main | Clean | <commit> |
| connect-card | feature/connect-card | 25 uncommitted | <commit> |
| ... | ... | ... | ... |

## Documentation Health

| Document | Last Updated | Status |
|----------|--------------|--------|
| PROJECT.md | 2025-11-30 | ✅ Current |
| PLAYBOOK.md | 2025-11-25 | ⚠️ 5 days old |
| WORKTREE-STATUS.md | 2025-11-27 | ⚠️ 3 days old |

## Feature Docs

| Feature | Doc Status | Code Status | Sync? |
|---------|------------|-------------|-------|
| Connect Cards | COMPLETE | Has active work | ⚠️ Check |
| Prayer | 65% BLOCKING | Needs server actions | ✅ Matches |
| Volunteer | IN PROGRESS | Has uncommitted | ✅ Matches |

## Stale Content Found

- [ ] docs/PROJECT.md:45 - "TODO: Add prayer batches" (completed)
- [ ] docs/features/volunteer/vision.md:102 - Status says "IN PROGRESS" but UI complete
- [ ] docs/PLAYBOOK.md:200 - References old auth pattern

## Recommended Actions

1. Update WORKTREE-STATUS.md with current state
2. Mark volunteer UI as COMPLETE in vision doc
3. Remove stale TODOs from PROJECT.md
4. Update dev dashboard with current progress

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 5: Update Dev Dashboard

### 5.1: Read Current Dev Page

```bash
cat app/church/[slug]/admin/dev/page.tsx
```

### 5.2: Update Worktree Progress Data

The dev page at `/app/church/[slug]/admin/dev/page.tsx` has hardcoded worktree status. Update based on audit findings:

```typescript
const worktrees: WorktreeCardProps[] = [
  {
    name: "Connect Cards",
    branch: "feature/connect-card",
    status: "ready", // Update based on actual state
    statusLabel: "Ready for PR",
    tasks: [
      { label: "CSV Export (Phase 3A)", completed: false }, // Update checkboxes
      // ...
    ],
  },
  // ... other worktrees
];
```

### 5.3: Update Demo Ready Checklist

Review `DemoReadyChecklist` component and update completion status based on what's actually built.

---

## Stage 6: Apply Updates

### 6.1: Show Proposed Changes

For each file that needs updating, show:

- Current content
- Proposed change
- Reason for change

### 6.2: Get User Approval

Ask: "Apply these documentation updates? (yes/no/edit)"

### 6.3: Commit Changes

```bash
git add docs/ app/church/[slug]/admin/dev/page.tsx
git commit -m "docs: sync documentation with current project state

- Update WORKTREE-STATUS.md with current progress
- Update feature vision docs status markers
- Remove stale TODOs and planning text
- Update dev dashboard worktree cards
- Update last updated dates

Audit performed: <date>"

git push origin main
```

---

## Stage 7: Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DOCUMENTATION AUDIT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files Updated:
- docs/WORKTREE-STATUS.md
- docs/features/volunteer/vision.md
- app/church/[slug]/admin/dev/page.tsx

Stale Content Removed: 5 items
Status Markers Updated: 3 items
Dev Dashboard Synced: Yes

Next audit recommended: 1 week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## When to Run This Command

**Run weekly or after:**

- Merging a feature PR
- Completing a major milestone
- Starting a new sprint/week
- Before demos or presentations
- When docs feel "off" or outdated

**This command helps:**

- Keep AI sessions accurate (no confusion from stale docs)
- Maintain dev dashboard visibility
- Track actual vs documented progress
- Clean up planning artifacts after completion
