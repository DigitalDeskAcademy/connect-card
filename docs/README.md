# Documentation Index

**Multi-Worktree Architecture** - Coordinated development across feature branches with central project management.

---

## 🚀 Quick Start

**For Any Worktree Session:**

1. **CHECK FIRST:** `WORKTREE-STATUS.md` - What should I work on?
2. Read your feature's vision doc in `features/{feature}/vision.md`
3. Reference `PLAYBOOK.md` for technical patterns

**For New Developers:**

1. Read `WORKTREE-STATUS.md` - Project dashboard and worktree assignments
2. Read `PLAYBOOK.md` - THE technical guide (patterns, blockers, debt)
3. Read `PROJECT.md` - Business context and roadmap
4. Read `essentials/coding-patterns.md` - How to write code

**For AI Sessions:**

1. **Start with `WORKTREE-STATUS.md`** - Know which worktree you're in and what to do
2. Check `PLAYBOOK.md` - Technical single source of truth
3. Reference `features/{feature}/vision.md` - Detailed feature planning

---

## 📁 Documentation Structure

```
docs/
├── 🔴 PLAYBOOK.md               # ← THE GUIDE: Technical single source of truth
├── PROJECT.md                   # ← Business overview (vision, status, roadmap)
│
├── features/                    # ← Feature specs (detailed planning)
│   ├── connect-cards/vision.md
│   ├── member-management/vision.md
│   ├── prayer-management/vision.md
│   └── volunteer-management/vision.md
│
├── essentials/                  # ← Core guides (how to build)
│   ├── architecture.md          # System design & decisions
│   ├── coding-patterns.md       # Code standards & patterns
│   ├── development.md           # Local setup & workflows
│   ├── deployment.md            # Production deployment
│   ├── data-table-pattern.md    # TanStack Table guide
│   ├── shadcn.md                # shadcn/ui component list
│   └── shadcn-usage-patterns.md # Component usage patterns
│
└── technical/                   # ← Implementation details
    ├── architecture-decisions.md # ADR log
    ├── adr-code-examples.md      # Code examples for ADRs
    └── integrations.md           # Third-party integrations
```

---

## 📊 Core Documents

### 🔴 PLAYBOOK.md - Technical Single Source of Truth

**Purpose:** THE authoritative guide for building Church Connect Hub. If there's a conflict, this document wins.

**Contains:**

- Critical production blockers (MUST FIX)
- Technical debt register
- Code patterns and standards
- Performance issues and fixes
- Architecture decisions

**When to update:**

- After every feature wrap-up (automatic)
- When discovering critical issues
- When establishing new patterns
- When making architectural decisions

### PROJECT.md - Business & Product Overview

**Purpose:** Combined business/product documentation (what we're building, why, and when)

**Contains:**

- Product vision and problem statement
- Current status (working/broken features)
- Roadmap and priorities
- Success metrics
- Team information

**When to update:**

- Feature completed
- Priorities changed
- Business decisions made
- Metrics updated

---

## 🎯 Feature Documentation

All feature planning lives in `/docs/features/{feature}/vision.md`:

- **Connect Cards** - AI-powered connect card scanning (PRODUCTION-READY)
- **Member Management** - Member directory and N2N workflow (PLANNED)
- **Prayer Management** - Prayer request tracking (COMPLETE)
- **Volunteer Management** - Volunteer onboarding automation (COMPLETE)

**Each vision doc contains:**

- Problem statement
- Solution overview
- Current status
- Planned features
- Success metrics
- Implementation details

---

## 🛠️ Essential Guides

### architecture.md

System design, business vision, multi-tenant architecture, database schema

### coding-patterns.md

**MUST READ** - How to write code that follows project standards:

- Server actions pattern
- Multi-tenant data isolation
- PageContainer usage
- Shadcn component-first approach
- Navigation configuration

### development.md

Local setup, tech stack, validation patterns, security patterns

### deployment.md

Production deployment, environment configuration, monitoring

---

## 📚 Technical Documentation

### architecture-decisions.md

ADR log with all architectural decisions and rationale

### adr-code-examples.md

Code examples referenced by ADRs

### integrations.md

GoHighLevel, Stripe, Tigris S3, Better Auth integration details

---

## ⚠️ Documentation Rules (STRICT)

### For Main Branch:

- ✅ Edit PLAYBOOK.md and PROJECT.md ONLY in main
- ✅ Update after feature merges via feature-wrap-up
- ❌ NEVER edit these files in feature worktrees

### For Feature Worktrees:

- ✅ ONLY edit `/docs/features/{your-feature}/`
- ❌ NEVER edit PLAYBOOK.md or PROJECT.md
- ❌ NEVER create `.worktree/` directories
- ✅ Merge main frequently to stay in sync

### Documentation Ownership:

| Document         | Location                 | Who Edits        | When                 |
| ---------------- | ------------------------ | ---------------- | -------------------- |
| **PLAYBOOK.md**  | `/docs/`                 | Main branch only | After features merge |
| **PROJECT.md**   | `/docs/`                 | Main branch only | Business changes     |
| **Feature Docs** | `/docs/features/{name}/` | Feature worktree | During development   |

---

## ✅ Documentation Principles

1. **Two Documents Rule** - Technical (PLAYBOOK) + Business (PROJECT)
2. **Single Source of Truth** - Each piece of info exists in ONE place
3. **Feature-First** - Detailed planning in feature vision docs
4. **No .worktree Directories** - Use git-native `/docs/` structure
5. **Clear Ownership** - Main owns architecture, features own their docs

---

## 🚫 What NOT to Do

- ❌ Create new TODO files (use PROJECT.md roadmap section)
- ❌ Edit PLAYBOOK/PROJECT in feature worktrees
- ❌ Create `.worktree/` directories
- ❌ Duplicate information (reference, don't copy)
- ❌ Leave contradictions (delete outdated docs)

---

**Last Updated:** 2025-11-25
**Total Files:** 2 main docs + feature docs (simplified from 10+ files)
