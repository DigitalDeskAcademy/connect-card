# Documentation Strategy - Multi-Worktree Best Practices

**Status:** DRAFT - Needs Implementation
**Created:** 2025-11-16
**Purpose:** Solve documentation drift and stale information across git worktrees

---

## 🚨 The Problem

### Current Issues

1. **Documentation Drift** - Docs updated in feature branches, never synced to main
2. **Stale Information** - Features change direction, docs don't get updated
3. **AI Confusion** - Stale docs cause Claude to waste hours on wrong approach
4. **Cross-Worktree Conflicts** - Same doc files modified in multiple worktrees
5. **No Enforcement** - Nothing prevents committing outdated docs

### Real Example (Volunteer Feature)

**What happened:**

- Initial plan: Full shift scheduling system (35-45 components)
- Direction changed: Simple onboarding automation (10 components)
- Docs never updated: Still showed scheduling system
- Result: 3+ hours wasted in new session reading wrong roadmap

**Root cause:** Documentation updated in `volunteer/` worktree, never merged to main properly.

---

## 📚 Industry Best Practices

### 1. Single Source of Truth (SSOT)

**Principle:** Each piece of information exists in exactly ONE place.

**Examples:**

- Linux Kernel: `/Documentation/` (strict SSOT, no duplication)
- Kubernetes: `/docs/` for user docs, `/design/` for ADRs
- React: `/docs/` synced to website, no local copies

**Why it matters:** Reduces contradictions, easier to maintain, clear authority.

### 2. Docs-as-Code

**Principle:** Documentation is versioned with code, reviewed in PRs.

**Examples:**

- GitHub: Docs reviewed like code, CI checks for broken links
- Stripe: API docs generated from code, can't drift
- Vercel: Docs in monorepo, deployed with code

**Why it matters:** Docs stay in sync with code changes.

### 3. Documentation Review Process

**Principle:** PRs that change behavior MUST update docs.

**Examples:**

- Rust: PR template has "Documentation" checklist
- Django: CI fails if docstrings missing
- GitLab: "Docs required" label blocks merge

**Why it matters:** Prevents stale docs from being committed.

### 4. Worktree/Branch Isolation

**Principle:** Temporary docs stay local, permanent docs in main.

**Examples:**

- Chromium: Feature flags + local design docs during development
- Android: `/dev-docs/` for WIP, `/docs/` for released features
- PostgreSQL: Commit docs only when feature merges

**Why it matters:** Prevents WIP docs from polluting main branch.

---

## 🏗️ Proposed Documentation Structure

### New Directory Layout

```
/docs/                                  # Global docs (ONLY updated in main worktree)
├── STATUS.md                           # Current project state (SSOT)
├── ROADMAP.md                          # Future plans (SSOT)
├── DOCUMENTATION_STRATEGY.md           # This file
├── essentials/                         # Core knowledge
│   ├── architecture.md                 # System design
│   ├── coding-patterns.md              # How to write code
│   ├── development.md                  # Local setup
│   └── deployment.md                   # Production deployment
├── features/                           # Feature-specific docs (SSOT per feature)
│   ├── connect-cards/
│   │   └── vision.md                   # Connect card product vision
│   ├── prayer-management/
│   │   └── vision.md                   # Prayer request product vision
│   ├── volunteer-management/
│   │   └── vision.md                   # Volunteer onboarding vision
│   └── member-management/
│       └── vision.md                   # Member management vision
├── technical/                          # Implementation details
│   ├── architecture-decisions.md       # ADR log (all ADRs in one file)
│   ├── adr-code-examples.md           # Code examples for ADRs
│   └── integrations.md                # Third-party integrations
└── .archive/                          # Deprecated docs (never delete, archive)
    └── 2025-11-volunteer-scheduling-roadmap.md  # Example

.worktree/{worktree-name}/docs/         # Worktree-specific (NOT committed to main)
├── session-notes/                      # Daily session logs
│   └── 2025-11-16-skills-management.md
├── testing/                            # Testing plans
│   └── manual-testing-guide.md
└── wip/                                # Work-in-progress planning
    └── phase-3-plan.md
```

### Documentation Ownership

| Document Type                                              | Worktree      | Main Branch        | Who Updates                  |
| ---------------------------------------------------------- | ------------- | ------------------ | ---------------------------- |
| **Global Docs** (`/docs/STATUS.md`, `/docs/ROADMAP.md`)    | ❌ Read-only  | ✅ Source of truth | Main only                    |
| **Feature Vision** (`/docs/features/{feature}/vision.md`)  | ❌ Read-only  | ✅ Source of truth | Main only (after PR merge)   |
| **ADRs** (`/docs/technical/architecture-decisions.md`)     | ❌ Read-only  | ✅ Source of truth | Main only (after PR merge)   |
| **Session Notes** (`.worktree/{name}/docs/session-notes/`) | ✅ Local only | ❌ Never merged    | Feature branches (temporary) |
| **Testing Guides** (`.worktree/{name}/docs/testing/`)      | ✅ Local only | ❌ Never merged    | Feature branches (temporary) |

**Rule:** If it's under `/docs/`, it's ONLY updated in the main worktree after PR merge.

---

## 🔒 Enforcement Strategy

### 1. feature-wrap-up Command Checks

Add to `.claude/commands/feature-wrap-up.md`:

```markdown
## Step 6: Documentation Review (NEW)

**CRITICAL: Check if /docs/ needs updating**

1. **Read the PR diff** - What code/behavior changed?
2. **Check affected documentation files:**

   - If feature scope changed → Update `/docs/features/{feature}/vision.md`
   - If architecture changed → Update `/docs/technical/architecture-decisions.md`
   - If status changed (complete, in-progress) → Update `/docs/STATUS.md`
   - If roadmap priorities changed → Update `/docs/ROADMAP.md`

3. **Ask user:**

   - "This PR changed {behavior}. Should we update {doc}?"
   - "Feature scope was {old}, now it's {new}. Update vision doc?"

4. **If docs need updating:**

   - ❌ DO NOT update docs in feature branch
   - ✅ CREATE a follow-up task: "After merge, update {doc} in main"
   - ✅ ADD to PR description: "Docs to update: {list}"

5. **Validation:**
   - Search for stale references to removed features
   - Check STATUS.md matches actual implementation
   - Verify roadmap reflects current priorities
```

### 2. Pre-Merge Documentation Checklist

**In PR description template:**

```markdown
## Documentation Updates (Required)

- [ ] No documentation changes needed
- [ ] Documentation changes needed (list below):

**Docs to update after merge:**

- [ ] `/docs/STATUS.md` - Reason: {why}
- [ ] `/docs/ROADMAP.md` - Reason: {why}
- [ ] `/docs/features/{feature}/vision.md` - Reason: {why}
- [ ] `/docs/technical/architecture-decisions.md` - Reason: {why}

**Stale docs to archive:**

- [ ] None
- [ ] Archive {file} - Reason: {why}
```

### 3. Git Pre-Commit Hook (Optional)

Warn if `/docs/` modified outside main:

```bash
# .husky/pre-commit (add this check)
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  DOCS_CHANGED=$(git diff --cached --name-only | grep "^docs/")
  if [[ -n "$DOCS_CHANGED" ]]; then
    echo "⚠️  WARNING: You're modifying /docs/ in a feature branch!"
    echo "Docs should only be updated in main worktree after PR merge."
    echo ""
    echo "Files:"
    echo "$DOCS_CHANGED"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi
```

### 4. Session Start Documentation Check

Add to `/claude/commands/session-start.md`:

```markdown
## Step 2.5: Documentation Sanity Check (NEW)

After reading docs, validate they match reality:

1. **Check STATUS.md date** - If >30 days old, warn user
2. **Check for contradictions:**

   - STATUS.md says "Complete" but code is WIP
   - ROADMAP.md says "Phase 1" but we're on "Phase 3"
   - Feature vision says "Building X" but code does Y

3. **If docs are stale:**

   - STOP and ask user: "Docs seem outdated. Should we update them first?"
   - List specific contradictions found
   - Suggest archiving old roadmaps

4. **Validation checks:**
   - Does STATUS.md match git log (recent commits)?
   - Does ROADMAP.md align with /docs/features/{} visions?
   - Are there duplicate roadmaps (old + new)?
```

---

## 🔄 Migration Plan

### Phase 1: Restructure (Immediate)

**Goal:** Separate global docs from worktree-specific docs

**Tasks:**

1. **Create new structure in main:**

   ```bash
   mkdir -p docs/features/{connect-cards,prayer-management,volunteer-management,member-management}
   mkdir -p .worktree/volunteer/docs/{session-notes,testing,wip}
   mkdir -p .worktree/prayer/docs/{session-notes,testing,wip}
   mkdir -p .worktree/main/docs/{session-notes,testing,wip}
   ```

2. **Move feature-specific docs:**

   ```bash
   # Volunteer
   mv docs/volunteer-vision.md docs/features/volunteer-management/vision.md
   mv docs/volunteer-feature-roadmap.md .archive/2025-11-volunteer-scheduling-roadmap.md
   mv docs/volunteer/ .worktree/volunteer/docs/session-notes/

   # Prayer
   mv docs/PRAYER_MANAGEMENT_PLAN.md docs/features/prayer-management/vision.md
   ```

3. **Update .gitignore:**

   ```gitignore
   # Worktree-specific docs (never commit)
   .worktree/*/docs/

   # But DO track the structure
   !.worktree/*/docs/.gitkeep
   ```

4. **Archive outdated docs:**
   ```bash
   mv docs/volunteer-feature-roadmap.md .archive/docs/2025-11-volunteer-scheduling-roadmap.md
   mv docs/FORK_SETUP_GUIDE.md .archive/docs/guides/
   ```

### Phase 2: Enforcement (Next)

**Goal:** Prevent future documentation drift

**Tasks:**

1. **Update feature-wrap-up command** with documentation review step
2. **Create PR template** with documentation checklist
3. **Add pre-commit hook** (optional) warning about /docs/ changes
4. **Update session-start command** with documentation validation

### Phase 3: Cleanup (Final)

**Goal:** Remove all stale/contradictory documentation

**Tasks:**

1. **Audit all /docs/ files:**

   - Check last modified date
   - Verify accuracy against code
   - Archive anything >6 months old and not referenced

2. **Consolidate roadmaps:**

   - One ROADMAP.md (top-level planning)
   - Feature-specific visions in `/docs/features/{feature}/`
   - Archive old roadmaps

3. **Create documentation index:**

   ```markdown
   # Documentation Index

   ## For New Developers

   - Start here: docs/STATUS.md
   - Then read: docs/essentials/architecture.md
   - Then read: docs/essentials/coding-patterns.md

   ## For AI Sessions

   - Start here: docs/STATUS.md
   - Feature planning: docs/features/{feature}/vision.md
   - Coding standards: docs/essentials/coding-patterns.md
   ```

---

## ✅ Success Criteria

**We've solved the problem when:**

1. ✅ AI sessions don't waste time on stale roadmaps
2. ✅ All feature docs match actual implementation
3. ✅ STATUS.md accurately reflects current state
4. ✅ No contradictory roadmaps exist
5. ✅ Documentation updated as part of every PR
6. ✅ Worktree-specific docs don't pollute main
7. ✅ Clear ownership: Global docs vs local notes

---

## 📖 Learning Resources

### Industry Examples

**Monorepo Documentation:**

- [Turborepo Docs Structure](https://turbo.build/repo/docs) - Feature-based organization
- [Nx Monorepo Guide](https://nx.dev/concepts/more-concepts/monorepo-tags) - Docs ownership
- [Rush Stack Docs](https://rushjs.io/pages/maintainer/setup_new_repo/) - Multi-package docs

**Documentation Standards:**

- [Write the Docs](https://www.writethedocs.org/guide/) - Industry best practices
- [Divio Documentation System](https://documentation.divio.com/) - 4 types: tutorials, how-tos, reference, explanation
- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) - Technical writing

**ADR (Architecture Decision Records):**

- [ADR GitHub Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [When to write an ADR](https://adr.github.io/)
- [ADR best practices](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/examples/decisions/2016-02-12-adr-template-for-alexandrian-pattern.md)

### Git Worktree Best Practices

**Documentation Management:**

- [Git Worktree Workflows](https://morgan.cugerone.com/blog/workarounds-to-git-worktree-using-bare-repository-and-cannot-fetch-remote-branches/) - Separate worktrees
- [Monorepo.tools](https://monorepo.tools/#versioning-and-publishing) - Versioning docs with code

---

## 🎯 Implementation Checklist

### Immediate (This Session)

- [ ] Create this plan document
- [ ] Review with user for approval
- [ ] Create `/docs/features/` structure
- [ ] Move volunteer-vision.md to correct location
- [ ] Archive volunteer-feature-roadmap.md (outdated)

### Next Session

- [ ] Update feature-wrap-up.md with documentation review
- [ ] Create PR template with documentation checklist
- [ ] Update session-start.md with documentation validation
- [ ] Add .gitignore rules for .worktree/\*/docs/

### Future

- [ ] Audit all /docs/ files for staleness
- [ ] Consolidate duplicate roadmaps
- [ ] Create documentation index
- [ ] Add pre-commit hook (optional)

---

## 🤔 Open Questions

1. **Worktree-specific docs location:**

   - Option A: `.worktree/{name}/docs/` (in .gitignore)
   - Option B: `docs/.worktree/{name}/` (in .gitignore)
   - **Recommendation:** Option A (keeps .worktree isolated)

2. **Documentation review frequency:**

   - Every PR? (strict, prevents drift)
   - Monthly audit? (lighter weight)
   - **Recommendation:** Every PR for /docs/, monthly for accuracy

3. **Who enforces documentation updates:**
   - AI (feature-wrap-up command)
   - Human (PR reviewer)
   - Both (AI flags, human confirms)
   - **Recommendation:** Both

---

**Last Updated:** 2025-11-16
**Status:** DRAFT - Awaiting user approval
**Next Step:** Review plan, approve structure, begin Phase 1 migration
