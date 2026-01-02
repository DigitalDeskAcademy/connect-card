---
description: Comprehensive documentation audit - sync, verify consistency, remove outdated content
allowed-arguments: what changed
---

# Documentation Update & Audit

Audit all documentation across worktrees, detect stale content, verify structure compliance, and update the dev dashboard for project visibility.

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

## Stage 2: Structure Validation (NEW)

### 2.1: Check Root Directory Cleanliness

The `/docs/` root should only contain core documents, not implementation plans or one-time reviews.

```bash
# List root docs - should only be core docs
ls -1 docs/*.md

# Expected files (core docs only):
# - README.md
# - WORKTREE-STATUS.md
# - PLAYBOOK.md
# - PROJECT.md
```

**Flag issues:**

- Any `*-plan.md` files at root → Should be in `archive/` or `features/`
- Any `*-review.md` files at root → Should be in `archive/`
- Any `*-spec.md` files at root → Should be in `archive/` or `features/`

### 2.2: Feature Folder Compliance

Each feature folder should have exactly ONE `README.md` as the source of truth.

```bash
# Check feature folders
for dir in docs/features/*/; do
  echo "=== $dir ==="
  ls -1 "$dir"
done
```

**Expected structure per feature:**

- `README.md` - Main feature documentation (REQUIRED)
- `*.md` - Additional specs ONLY if actively being worked on

**Flag issues:**

- Missing `README.md` → Create or rename `vision.md`
- Old `vision.md` still exists alongside `README.md` → Delete vision.md
- Multiple spec files → Consider archiving completed specs

### 2.3: Archive Detection

Check for completed implementation plans that should be archived.

```bash
# Find implementation plans outside archive/
find docs/ -name "*-plan.md" -not -path "docs/archive/*"
find docs/ -name "*-spec.md" -not -path "docs/archive/*"
find docs/ -name "*-implementation*.md" -not -path "docs/archive/*"

# Check archive directory exists and has proper naming
ls docs/archive/ 2>/dev/null || echo "⚠️ No archive directory"
```

**Archive naming convention:** `YYYY-MM-description.md`

### 2.4: Reference Directory Check

External API docs and configuration references should be in `reference/`.

```bash
# Check reference directory
ls docs/reference/ 2>/dev/null || echo "⚠️ No reference directory"

# Find potential reference docs in wrong location
grep -r "API documentation\|External API\|Configuration reference" docs/features/ --include="*.md" -l
```

### 2.5: Generate Structure Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 STRUCTURE VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Root Directory:
  ✅ Only core docs present
  OR
  ⚠️ Found loose files that should be organized:
     - member-unification-plan.md → archive/2025-12-member-unification-plan.md
     - strategic-review.md → archive/2025-12-strategic-review.md

Feature Folders:
  ✅ All features have README.md
  OR
  ⚠️ Issues found:
     - features/volunteer/vision.md → Rename to README.md
     - features/connect-cards/ has 4 files → Archive completed specs

Archive Directory:
  ✅ Proper naming convention (YYYY-MM-description.md)
  OR
  ⚠️ Files without date prefix

Reference Directory:
  ✅ External docs properly separated
  OR
  ⚠️ API docs found in feature folders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 3: Analyze Feature Documentation

### 3.1: List All Feature Docs

```bash
find docs/features -name "*.md" -type f 2>/dev/null | sort
```

### 3.2: Check Each Feature Doc

For each feature doc, check:

1. **Last modified date** vs recent commits to that feature
2. **Status markers** (IN PROGRESS, COMPLETE, etc.) vs actual code state
3. **Checkboxes** - are completed items marked?
4. **Stale TODOs** - references to completed work

```bash
# Example: Check volunteer feature
ls -la docs/features/volunteer/
git log -3 --oneline -- "docs/features/volunteer/"

# Check for stale status markers
grep -r "IN PROGRESS\|🔄\|TODO" docs/features/volunteer/
```

### 3.3: Cross-Reference with Code

For each feature area, verify docs match reality:

| Feature       | Doc Location                    | Code Location                             | Check           |
| ------------- | ------------------------------- | ----------------------------------------- | --------------- |
| Connect Cards | `/docs/features/connect-cards/` | `/app/church/[slug]/admin/connect-cards/` | Status matches? |
| Prayer        | `/docs/features/prayer/`        | `/app/church/[slug]/admin/prayer/`        | Status matches? |
| Volunteer     | `/docs/features/volunteer/`     | `/app/church/[slug]/admin/volunteer/`     | Status matches? |
| Integrations  | `/docs/features/integrations/`  | `/app/church/[slug]/admin/export/`        | Status matches? |

---

## Stage 4: Staleness Detection

### 4.1: Find Stale References

```bash
# TODOs for completed features
grep -r "TODO.*connect.card\|TODO.*prayer\|TODO.*volunteer" docs/ --include="*.md" -i

# "Planned" references that might be built
grep -r "planned\|will be\|future" docs/ --include="*.md" -i | head -20

# Old status markers
grep -r "🔄\|⚠️\|IN PROGRESS" docs/ --include="*.md"
```

### 4.2: Check Last Updated Dates

```bash
# Files with "Last Updated" headers
grep -r "Last Updated" docs/ --include="*.md" -l | while read f; do
  echo "$f: $(grep 'Last Updated' $f | head -1)"
done
```

Flag any docs not updated in 2+ weeks.

### 4.3: Orphaned Documentation

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

## Stage 5: Generate Audit Report

Create a comprehensive report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENTATION AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: <date>

## Structure Validation
[Include Stage 2 report here]

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
| Prayer | PAUSED | Complete | ✅ Matches |
| Volunteer | IN PROGRESS | Has uncommitted | ✅ Matches |

## Stale Content Found

- [ ] docs/PROJECT.md:45 - "TODO: Add prayer batches" (completed)
- [ ] docs/features/volunteer/README.md:102 - Status says "IN PROGRESS" but UI complete
- [ ] docs/PLAYBOOK.md:200 - References old auth pattern

## Recommended Actions

### Structure Fixes
1. Move loose files to archive/
2. Rename vision.md to README.md in feature folders
3. Archive completed implementation plans

### Content Updates
1. Update WORKTREE-STATUS.md with current state
2. Mark volunteer UI as COMPLETE in README
3. Remove stale TODOs from PROJECT.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 6: Update Dev Dashboard

### 6.1: Read Current Dev Page

```bash
cat app/church/[slug]/admin/dev/page.tsx
```

### 6.2: Update Worktree Progress Data

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

### 6.3: Update Demo Ready Checklist

Review `DemoReadyChecklist` component and update completion status based on what's actually built.

---

## Stage 7: Apply Updates

### 7.1: Show Proposed Changes

For each file that needs updating, show:

- Current content
- Proposed change
- Reason for change

### 7.2: Get User Approval

Ask: "Apply these documentation updates? (yes/no/edit)"

### 7.3: Commit Changes

```bash
git add docs/ app/church/[slug]/admin/dev/page.tsx
git commit -m "docs: sync documentation with current project state

- Update WORKTREE-STATUS.md with current progress
- Update feature docs status markers
- Move completed specs to archive/
- Fix structure compliance issues
- Update dev dashboard worktree cards
- Update last updated dates

Audit performed: <date>"

git push origin main
```

---

## Stage 8: Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DOCUMENTATION AUDIT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files Updated:
- docs/WORKTREE-STATUS.md
- docs/features/volunteer/README.md
- app/church/[slug]/admin/dev/page.tsx

Structure Fixes: X items
Stale Content Removed: X items
Status Markers Updated: X items
Files Archived: X items
Dev Dashboard Synced: Yes

Next audit recommended: 1 week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Documentation Standards Reference

### Expected Structure

```
docs/
├── README.md                    # Navigation index
├── WORKTREE-STATUS.md           # Project dashboard
├── PLAYBOOK.md                  # Technical standards
├── PROJECT.md                   # Business overview
│
├── features/                    # One README per feature
│   └── {feature}/README.md      # Main feature doc
│
├── architecture/                # System architecture
├── technical/                   # Implementation guides
├── reference/                   # External API docs
└── archive/                     # Completed work (YYYY-MM-*.md)
```

### Naming Conventions

| Type           | Pattern                  | Location           |
| -------------- | ------------------------ | ------------------ |
| Feature docs   | `README.md`              | `features/{name}/` |
| Archived plans | `YYYY-MM-description.md` | `archive/`         |
| Reference docs | `{api-name}.md`          | `reference/`       |
| Architecture   | `{system}.md`            | `architecture/`    |

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
- Maintain proper doc structure (prevent creep)
- Track actual vs documented progress
- Clean up planning artifacts after completion
