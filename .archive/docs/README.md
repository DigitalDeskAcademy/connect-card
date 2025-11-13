# Archived Documentation

**Archive Date:** 2025-11-12
**Reason:** Documentation cleanup to maintain industry-standard organization

---

## Why Files Are Archived

Archived documentation is **historical content that is no longer actively used** but preserved for reference. This follows industry best practices:

- **Active docs** stay in `/docs` - current technical reference
- **Completed work** moves to `.archive` - historical reference
- **Meta-guides** move to `.archive` - setup/process documentation

---

## Archived Files

### `/guides/CLAUDE_MD_CREATION_GUIDE.md`
- **Original Location:** `/docs/CLAUDE_MD_CREATION_GUIDE.md`
- **Why Archived:** Meta-guide for creating CLAUDE.md files. Not actively used in daily development. Industry standard: Reference external documentation rather than maintain internal meta-guides.
- **Date Archived:** 2025-11-12

### `/guides/playwright-mcp.md`
- **Original Location:** `/docs/playwright-mcp.md`
- **Why Archived:** Third-party tool setup guide (Playwright MCP installation). E2E testing infrastructure was completed on 2025-11-08. The official Playwright/MCP documentation is the better source of truth.
- **Date Archived:** 2025-11-12

### `/copywriting/copywriting-public-facing.md`
- **Original Location:** `/docs/copywriting-public-facing.md`
- **Why Archived:** Early access landing page copy. Public site accessibility work was completed on 2025-11-07. Copy is live in production, no longer needs to be in active docs.
- **Date Archived:** 2025-11-12

### `/technical/deprecated-adrs.md`
- **Original Location:** Created from `/docs/technical/architecture-decisions.md`
- **Why Archived:** ADRs from original SideCar Platform (IV clinic system) that are not relevant to Church Connect Card platform. Preserved for historical context.
- **Date Archived:** 2025-11-12
- **Deprecated ADRs:** ADR-002, ADR-003, ADR-004, ADR-005

### `/technical/adr-007-role-framework-consolidation.md`
- **Original Location:** `/docs/technical/architecture-decisions.md` (ADR-007)
- **Why Archived:** Superseded ADR from SideCar Platform era describing 3-tier role system (platform → agency → clinic). ChurchSyncAI simplified to 2-tier (platform → church) with location filtering via `user.defaultLocationId`. Historical reference only.
- **Date Archived:** 2025-11-12
- **Status:** Superseded (2025-10-26)

---

## Active Documentation Structure

Current `/docs` structure follows industry-standard organization:

```
/docs/
├── STATUS.md                    # Current project state
├── ROADMAP.md                   # Task priorities
├── DOCUMENTATION_GUIDE.md       # Doc maintenance rules
├── PROJECT_OVERVIEW.md          # High-level architecture
├── volunteer-feature-roadmap.md # Active feature development
├── worktree-setup.md           # Git worktree guide
│
├── essentials/                 # Core technical reference
│   ├── architecture.md
│   ├── coding-patterns.md
│   ├── data-table-pattern.md   # (NEW) Extracted pattern
│   ├── deployment.md
│   ├── development.md
│   ├── shadcn.md
│   └── shadcn-usage-patterns.md # (NEW) Extracted patterns
│
└── technical/                  # Implementation details
    ├── accessibility-modernization-plan.md
    ├── architecture-decisions.md
    └── integrations.md
```

---

## Industry Best Practices Applied

1. **Single Source of Truth**: Avoid duplicate documentation across multiple files
2. **Archive Completed Work**: Preserve history without cluttering active docs
3. **External References**: Link to official documentation for third-party tools
4. **Clear Structure**: Developers can find current information quickly
5. **Version Control**: Git tracks all changes; archives provide historical context

---

**Note:** All archived files remain accessible via git history. Use `git log --follow <file>` to trace file movement.
