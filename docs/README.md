# Documentation Index

**Multi-Worktree Architecture** - Coordinated development across feature branches with central project management.

---

## Quick Start

**For Any Worktree Session:**

1. **CHECK FIRST:** `/CLAUDE.md` - AI assistant context
2. **CHECK SECOND:** `WORKTREE-STATUS.md` - What should I work on?
3. Reference `PLAYBOOK.md` for technical patterns

**For New Developers:**

1. Read `/CLAUDE.md` - Project overview and tech stack
2. Read `WORKTREE-STATUS.md` - Project dashboard and worktree assignments
3. Read `PLAYBOOK.md` - THE technical guide (patterns, blockers, debt)
4. Read `PROJECT.md` - Business context and roadmap

---

## Documentation Structure

```
/CLAUDE.md                       # AI ASSISTANT: Read first (project context)

docs/
├── README.md                    # THIS FILE - Navigation index
├── WORKTREE-STATUS.md           # PROJECT DASHBOARD: What to work on
├── PLAYBOOK.md                  # THE LAW: Technical patterns & standards
├── PROJECT.md                   # Business overview (vision, status, roadmap)
│
├── features/                    # Feature specs (one README per feature)
│   ├── connect-cards/README.md  # AI-powered connect card scanning
│   ├── volunteer/README.md      # Volunteer onboarding + events
│   ├── prayer/README.md         # Prayer request tracking
│   ├── integrations/README.md   # ChMS export & Planning Center API
│   ├── ghl-integration/README.md# GoHighLevel SMS/automation
│   ├── tech-debt/README.md      # Production blockers & fixes
│   ├── member/README.md         # Member unification (complete)
│   ├── platform-admin/README.md # Platform admin modernization
│   ├── church-onboarding/README.md # Church setup & migration
│   └── e2e/README.md            # Playwright testing
│
├── architecture/                # System architecture docs
│   ├── data-table-system.md     # Unified DataTable component spec
│   └── member-unification.md    # ChurchMember model architecture
│
├── technical/                   # Implementation guides
│   ├── testing-strategy.md      # Vitest/Playwright testing approach
│   ├── production-readiness-plan.md
│   └── quality-control-guide.md
│
├── reference/                   # External API docs & config reference
│   ├── planning-center-api.md   # Planning Center API documentation
│   ├── environment-configuration.md
│   └── s3-bucket-structure.md
│
└── archive/                     # Completed plans & one-time reviews
    ├── 2025-12-strategic-review.md
    ├── 2025-12-member-unification-plan.md
    ├── 2025-12-volunteer-events-*.md
    └── ... (historical specs)
```

---

## Core Documents

### PLAYBOOK.md - Technical Single Source of Truth

**Purpose:** THE authoritative guide for building Church Connect Hub. If there's a conflict, this document wins.

**Contains:**

- Critical production blockers
- Technical debt register
- Code patterns and standards
- Performance issues and fixes
- Architecture decisions

### PROJECT.md - Business & Product Overview

**Purpose:** Business/product documentation (what we're building, why, and when)

**Contains:**

- Product vision and problem statement
- Current status (working/broken features)
- Roadmap and priorities
- Success metrics

### WORKTREE-STATUS.md - Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.

**Contains:**

- Active worktree assignments
- Current sprint priorities
- Recent PRs and completions
- Pre-launch checklist

---

## Feature Documentation

All feature planning lives in `/docs/features/{feature}/README.md`:

| Feature               | Status           | Description                            |
| --------------------- | ---------------- | -------------------------------------- |
| **connect-cards**     | Production Ready | AI-powered connect card scanning       |
| **volunteer**         | Active           | Volunteer onboarding + event tracking  |
| **integrations**      | Planning         | Planning Center API sync               |
| **ghl-integration**   | Phase 1 Complete | GoHighLevel SMS/automation             |
| **prayer**            | Complete/Paused  | Prayer request tracking                |
| **tech-debt**         | Ongoing          | Production blockers & fixes            |
| **member**            | Complete         | ChurchMember model unification         |
| **platform-admin**    | Future           | Platform admin modernization           |
| **church-onboarding** | In Progress      | Church setup & agency→church migration |
| **e2e**               | Complete         | Playwright test suite                  |

---

## Archive (Completed Work)

The `archive/` directory contains completed implementation plans and one-time reviews. These are kept for historical reference but are no longer actively maintained.

**Convention:** Files are prefixed with date: `YYYY-MM-description.md`

---

## Reference (External Docs)

The `reference/` directory contains external API documentation, configuration references, and other static reference material.

---

## Documentation Rules

### For Main Branch:

- ✅ Edit PLAYBOOK.md and PROJECT.md ONLY in main
- ✅ Update after feature merges via `/feature-wrap-up`
- ❌ NEVER edit these files in feature worktrees

### For Feature Worktrees:

- ✅ ONLY edit `/docs/features/{your-feature}/`
- ❌ NEVER edit PLAYBOOK.md or PROJECT.md
- ✅ Merge main frequently to stay in sync

### Documentation Lifecycle:

| Document Type            | Location            | When to Archive           |
| ------------------------ | ------------------- | ------------------------- |
| **Core docs**            | `/docs/`            | Never (living documents)  |
| **Feature README**       | `/docs/features/*/` | Never (update in place)   |
| **Implementation plans** | `/docs/archive/`    | When PR merged            |
| **One-time reviews**     | `/docs/archive/`    | After decisions finalized |

---

## Documentation Principles

1. **One README per feature** - Consolidate specs into single living document
2. **Archive completed work** - Move implementation plans after completion
3. **Reference external docs** - Keep API docs separate from feature work
4. **Clear ownership** - Main owns core docs, features own their README

---

**Last Updated:** 2026-01-01
