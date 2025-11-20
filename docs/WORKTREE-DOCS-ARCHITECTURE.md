# Worktree Documentation Architecture

**Purpose:** Explain how documentation is organized across worktrees to prevent merge conflicts and maintain clarity.

---

## Documentation Hierarchy

### 1. Core Docs (Main Worktree ONLY)

**Location:** `/main/docs/`
**Branch:** `main`
**Updated:** Only through main worktree merges
**Scope:** Cross-cutting architecture, patterns, and standards

**Files:**

```
/main/docs/
├── CLAUDE.md                          # Project-wide AI instructions
├── STATUS.md                          # Overall project status
├── ROADMAP.md                         # Cross-feature roadmap
├── essentials/
│   ├── architecture.md                # Multi-tenant system design
│   ├── coding-patterns.md             # Shared coding standards
│   ├── data-table-pattern.md          # TanStack Table usage
│   ├── shadcn.md                      # shadcn/ui component reference
│   └── development.md                 # Local setup
└── technical/
    └── architecture-decisions.md      # ADR log (all features)
```

**Rules:**

- ✅ Update through main worktree only
- ✅ Merge changes from feature branches
- ❌ Never edit from feature worktrees (read-only)
- ❌ No feature-specific content (goes to worktree docs)

---

### 2. Worktree-Specific Docs (Feature Branches)

**Location:** `/{worktree}/docs/`
**Branch:** Feature branch (e.g., `feature/volunteer-management`)
**Updated:** Only within that worktree
**Scope:** Feature-specific planning and implementation

**Example (Volunteer Worktree):**

```
/volunteer/docs/
├── VOLUNTEER-PHASES.md                # Phase breakdown (this feature only)
├── STATUS.md                          # Volunteer feature status
├── ROADMAP.md                         # Volunteer feature priorities
└── features/
    └── volunteer-management/
        └── vision.md                  # Feature spec
```

**Example (Prayer Worktree):**

```
/prayer/docs/
├── PRAYER-PHASES.md                   # Phase breakdown (this feature only)
├── STATUS.md                          # Prayer feature status
├── ROADMAP.md                         # Prayer feature priorities
└── features/
    └── prayer-management/
        └── vision.md                  # Feature spec
```

**Rules:**

- ✅ Edit freely within your worktree
- ✅ Commit to feature branch
- ✅ Merge to main when feature ships
- ❌ Never edit other worktree's docs
- ❌ No cross-feature coordination (use main docs)

---

### 3. Temporary Worktree Docs (Gitignored)

**Location:** `/.worktree/{name}/docs/{session-notes,testing,wip}/`
**Tracked:** ❌ No (gitignored)
**Purpose:** Scratch notes, WIP planning, testing docs

**Example:**

```
/.worktree/volunteer/docs/
├── session-notes/                     # Chat session logs (gitignored)
├── testing/                           # Test planning (gitignored)
└── wip/                               # Work-in-progress (gitignored)
```

**Gitignore Rules:**

```gitignore
.worktree/*/docs/session-notes/
.worktree/*/docs/testing/
.worktree/*/docs/wip/
!.worktree/*/docs/.gitkeep
```

**Rules:**

- ✅ Use for temporary notes
- ✅ Scratch planning
- ❌ Never commit (gitignored)
- ❌ No permanent documentation here

---

## Workflow Examples

### Scenario 1: Adding a New Coding Pattern (Main Worktree)

**Correct:**

```bash
cd /main
# Edit core docs
vim docs/essentials/coding-patterns.md
git add docs/essentials/coding-patterns.md
git commit -m "docs: add DataScope pattern to coding-patterns"
git push origin main
```

**Incorrect:**

```bash
cd /volunteer
# ❌ DON'T edit core docs from feature worktree
vim docs/essentials/coding-patterns.md  # ❌ WRONG
```

---

### Scenario 2: Planning Volunteer Feature (Volunteer Worktree)

**Correct:**

```bash
cd /volunteer
# Edit worktree-specific docs
vim docs/VOLUNTEER-PHASES.md
git add docs/VOLUNTEER-PHASES.md
git commit -m "docs: add Phase 2 plan for unified members"
git push origin feature/volunteer-management
```

**Incorrect:**

```bash
cd /volunteer
# ❌ DON'T edit other worktree's docs
vim ../prayer/docs/PRAYER-PHASES.md  # ❌ WRONG
```

---

### Scenario 3: Coordinating Cross-Feature Changes (Main Worktree)

**When to Use Main Docs:**

- Architectural decisions affecting multiple features
- Shared component patterns
- Database schema conventions
- Security standards

**Example:**

```bash
cd /main
# Document unified member management architecture
vim docs/technical/architecture-decisions.md
# Add ADR-011: Unified Member Management

git add docs/technical/architecture-decisions.md
git commit -m "docs: add ADR-011 for unified member management"
```

**When to Use Worktree Docs:**

- Feature-specific implementation phases
- Volunteer onboarding workflow
- Prayer request categorization logic
- Feature-specific E2E test plans

---

## Documentation Decision Tree

```
Is this documentation cross-cutting (affects 2+ features)?
  ├─ YES → Use main worktree docs
  │         Location: /main/docs/essentials/ or /main/docs/technical/
  │         Example: Coding patterns, ADRs, architecture
  │
  └─ NO → Use feature worktree docs
            Location: /{worktree}/docs/
            Example: Volunteer phases, prayer roadmap, feature specs
```

---

## Merge Strategy

### Feature Branch → Main

**When:** Feature ships to production

**Steps:**

1. Feature worktree docs merge to main
2. Main worktree docs stay untouched (unless coordinated)
3. Other worktrees pull latest main for reference

**Example (Volunteer Feature Ships):**

```bash
# 1. Merge feature branch to main
cd /volunteer
git checkout main
git merge feature/volunteer-management

# 2. Volunteer docs now in main repo
ls /main/docs/  # Now includes VOLUNTEER-PHASES.md

# 3. Other worktrees can reference
cd /prayer
git pull origin main  # Get volunteer docs for reference
# Read (but don't edit) volunteer docs for cross-feature planning
```

---

## Benefits of This Architecture

### ✅ Prevents Merge Conflicts

- Worktree docs isolated (no overlap)
- Main docs updated sequentially (not in parallel)
- Feature branches don't touch each other's docs

### ✅ Clear Ownership

- Main worktree owns core docs
- Volunteer worktree owns volunteer docs
- Prayer worktree owns prayer docs

### ✅ Easy Cross-Feature Coordination

- Main docs provide shared standards
- Worktree docs show implementation details
- No ambiguity about where docs live

### ✅ Clean Git History

- Feature docs committed with feature code
- Main docs committed separately
- Clear separation of concerns

---

## Common Pitfalls

### ❌ Editing Core Docs from Feature Worktree

**Problem:** Merge conflicts when multiple features update same file

**Solution:** Only edit core docs from main worktree

---

### ❌ Duplicating Content Across Worktrees

**Problem:** Volunteer worktree copies coding-patterns.md and edits it

**Solution:** Link to main docs, don't duplicate

**Correct:**

```markdown
<!-- /volunteer/docs/VOLUNTEER-PHASES.md -->

See [Coding Patterns](../../main/docs/essentials/coding-patterns.md) for server action pattern.
```

**Incorrect:**

```markdown
<!-- /volunteer/docs/coding-patterns.md -->

❌ Copy of entire coding-patterns.md (gets out of sync)
```

---

### ❌ No Central Documentation for Cross-Feature Changes

**Problem:** Unified member management affects 4 features, where does it go?

**Solution:** Main worktree ADR, reference from feature worktrees

**Main Worktree:**

```markdown
<!-- /main/docs/technical/architecture-decisions.md -->

## ADR-011: Unified Member Management

Decision affects: Team, Volunteers, Members, Connect Cards
```

**Feature Worktrees:**

```markdown
<!-- /volunteer/docs/VOLUNTEER-PHASES.md -->

### Phase 2: Unified Member Management

See ADR-011 in main docs for architectural decisions.
```

---

## File Naming Conventions

### Main Worktree Docs

- `SCREAMING-CASE.md` for top-level (STATUS.md, ROADMAP.md)
- `kebab-case.md` for subdirectories (coding-patterns.md, architecture-decisions.md)

### Worktree Docs

- `{FEATURE}-PHASES.md` for phase planning (VOLUNTEER-PHASES.md, PRAYER-PHASES.md)
- `STATUS.md` for worktree status
- `ROADMAP.md` for worktree priorities

---

## Summary

**Golden Rules:**

1. **Core architecture → Main worktree docs**
2. **Feature planning → Worktree docs**
3. **Temporary notes → Gitignored worktree subdirs**
4. **Cross-feature coordination → Main worktree ADRs**
5. **Never edit other worktree's docs**

**This architecture ensures:**

- ✅ No merge conflicts
- ✅ Clear ownership
- ✅ Easy cross-feature coordination
- ✅ Clean git history
- ✅ Scalable for 10+ worktrees

---

**Last Updated:** 2025-11-19
**Author:** Claude Code
