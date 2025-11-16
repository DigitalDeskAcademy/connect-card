# Documentation Index

**Single Source of Truth (SSOT)** - Each piece of information exists in exactly one place.

---

## 🚀 Quick Start

**For New Developers:**

1. Read `STATUS.md` - Current project state
2. Read `essentials/architecture.md` - System design
3. Read `essentials/coding-patterns.md` - How to write code
4. Read `essentials/development.md` - Local setup

**For AI Sessions:**

1. Start with `STATUS.md` - What's working/broken
2. Check `ROADMAP.md` - Current priorities
3. Reference `features/{feature}/vision.md` - Detailed feature planning

---

## 📁 Documentation Structure

```
docs/
├── STATUS.md                    # ← Health dashboard (what works, what's broken)
├── ROADMAP.md                   # ← Priority list (what needs to be done)
│
├── features/                    # ← Feature SSOT (detailed planning)
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
    ├── integrations.md           # Third-party integrations
    └── accessibility-modernization-plan.md # In-progress work
```

---

## 📊 Core Dashboards

### STATUS.md - Health Dashboard

**Purpose:** Current state of the project (working/broken/in-progress)

**When to read:**

- Starting a new session
- Checking feature status
- Understanding what's production-ready

**When to update:**

- Feature completed
- Bug discovered
- Production deployment

### ROADMAP.md - Priority List

**Purpose:** What needs to be done next

**When to read:**

- Planning next feature
- Understanding product direction
- Checking upcoming phases

**When to update:**

- Completing a phase
- Changing feature priorities
- Adding new features

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

## 🗄️ Archived Documentation

Historical docs moved to `/.archive/docs/`:

- Completed plans (documentation-strategy.md, prayer-management-plan.md)
- One-time setup guides (worktree-setup.md)
- Session notes (volunteer-sessions/)
- Superseded docs (project-overview.md)

**Why archive instead of delete?** Preserve git history and context for future reference.

---

## ✅ Documentation Principles

1. **Single Source of Truth** - Each piece of info exists in ONE place
2. **Feature-First** - Detailed planning in feature vision docs
3. **Lightweight Dashboards** - STATUS/ROADMAP link to details, don't duplicate
4. **No Duplication** - Reference, don't copy
5. **Always Current** - Docs reflect reality, not aspirations

---

## 🚫 What NOT to Do

- ❌ Create new TODO files (use ROADMAP.md)
- ❌ Duplicate information (link to existing docs)
- ❌ Leave contradictions (archive old info)
- ❌ Forget to update STATUS.md (should reflect reality)
- ❌ Put detailed planning in ROADMAP (use feature visions)

---

**Last Updated:** 2025-11-16
**Total Files:** 17 (down from 25, 32% reduction)
