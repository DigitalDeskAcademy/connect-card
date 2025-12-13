# Documentation Index

**Multi-Worktree Architecture** - Coordinated development across feature branches with central project management.

---

## 🚀 Quick Start

**For Any Worktree Session:**

1. **CHECK FIRST:** `/CLAUDE.md` - AI assistant context
2. **CHECK SECOND:** `WORKTREE-STATUS.md` - What should I work on?
3. Reference `PLAYBOOK.md` for technical patterns

**For New Developers:**

1. Read `/CLAUDE.md` - Project overview and tech stack
2. Read `WORKTREE-STATUS.md` - Project dashboard and worktree assignments
3. Read `PLAYBOOK.md` - THE technical guide (patterns, blockers, debt)
4. Read `PROJECT.md` - Business context and roadmap

**For AI Sessions:**

1. **Start with `/CLAUDE.md`** - Technical context and patterns
2. Check `WORKTREE-STATUS.md` - Know which worktree needs work
3. Reference `PLAYBOOK.md` - Technical single source of truth
4. Reference `features/{feature}/vision.md` - Detailed feature planning

---

## 📁 Documentation Structure

```
/CLAUDE.md                       # ← AI ASSISTANT: Read first (project context)

docs/
├── WORKTREE-STATUS.md           # ← PROJECT DASHBOARD: What to work on
├── 🔴 PLAYBOOK.md               # ← THE LAW: Technical patterns & standards
├── PROJECT.md                   # ← Business overview (vision, status, roadmap)
│
├── features/                    # ← Feature specs (detailed planning)
│   ├── connect-cards/vision.md
│   ├── prayer/vision.md
│   ├── volunteer/vision.md
│   ├── tech-debt/vision.md
│   ├── integrations/vision.md
│   ├── member/vision.md
│   └── onboarding/implementation-plan.md
│
├── architecture/                # ← System architecture
│   └── data-table-system.md     # Unified DataTable component spec
│
└── technical/                   # ← Implementation guides
    └── testing-strategy.md      # Vitest/Playwright testing approach
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

All essential patterns are now consolidated in:

- **`/CLAUDE.md`** - Project context, tech stack, critical rules
- **`PLAYBOOK.md`** - Code patterns, server actions, UI patterns, responsive design
- **`architecture/data-table-system.md`** - Unified DataTable component spec
- **`technical/testing-strategy.md`** - Vitest/Playwright testing approach

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

**Last Updated:** 2025-12-12
**Total Files:** CLAUDE.md + 3 core docs + feature docs
