# Documentation Guide

**Purpose**: Keep documentation lean, current, and useful for AI sessions and developers.

---

## 📁 DOCUMENTATION STRUCTURE

```
/docs/
├── STATUS.md              # Current state - what works, what's broken
├── ROADMAP.md            # Task priorities - what needs to be done
├── DOCUMENTATION_GUIDE.md # This file - how to maintain docs
├── GHL_PRODUCTION_SCOPES.md # GoHighLevel OAuth configuration
│
├── essentials/           # Core project understanding
│   ├── architecture.md   # System design & decisions
│   ├── coding-patterns.md # Code standards & patterns
│   ├── development.md    # Setup & development guide
│   ├── deployment.md     # Production deployment
│   └── refactoring-plan.md # Component deduplication strategy
│
├── technical/            # Implementation details (consolidated)
│   └── implementation-guide.md # Auth, Integrations, Security, Multi-tenant
│
└── packages/             # Third-party package decisions
    └── package-decisions.md # Why we chose each package

Note: Archived documentation is stored in /.archive/ to prevent AI confusion
```

---

## 📝 MAINTENANCE RULES

### 1. Single Source of Truth

- **STATUS.md** - ONLY place for current state
- **ROADMAP.md** - ONLY place for tasks/todos
- **No duplicate content** - Reference, don't copy

### 2. When to Update

- **Starting work**: Update STATUS.md "In Progress"
- **Completing work**: Update STATUS.md, move task in ROADMAP.md
- **Finding issues**: Add to STATUS.md "Broken" section
- **Making decisions**: Document in architecture.md

### 3. When to Archive

- **Completed plans**: Move to /.archive/ after implementation
- **Outdated guides**: Archive to /.archive/ when no longer relevant
- **Old decisions**: Keep in /.archive/ for history
- **Location**: Use /.archive/ (not /docs/archive) to prevent AI confusion

### 4. Documentation Standards

- **Be concise**: Get to the point quickly
- **Use examples**: Show, don't just tell
- **Stay factual**: Document what IS, not what SHOULD BE
- **No dates**: Use phases/status instead of dates

---

## 🤖 FOR AI SESSIONS

### Quick Context Files (Read First)

1. **CLAUDE.md** - Project overview and guidelines
2. **STATUS.md** - Current state of the project
3. **ROADMAP.md** - What needs to be done
4. **coding-patterns.md** - How to write code

### When Starting a Session

```
"Check STATUS.md for current state and ROADMAP.md for priorities"
```

### When Completing Work

```
"Update STATUS.md with changes and move completed items in ROADMAP.md"
```

---

## 🚫 WHAT NOT TO DO

1. **Don't create new TODO files** - Use ROADMAP.md
2. **Don't duplicate information** - Link to existing docs
3. **Don't leave contradictions** - Archive old info
4. **Don't forget to update** - STATUS.md should reflect reality

---

## ✅ ARCHIVING CHECKLIST

Before archiving a document:

- [ ] Is the information outdated or superseded?
- [ ] Is it duplicated elsewhere?
- [ ] Has the work been completed?
- [ ] Will anyone need this in the next month?

If YES to first three and NO to last → Archive it

---

## 📊 DOCUMENTATION HEALTH METRICS

**Good Documentation:**

- STATUS.md reflects actual codebase state
- ROADMAP.md has clear, actionable tasks
- No contradictions between documents
- Essential guides are up-to-date

**Bad Documentation:**

- Multiple TODO lists exist
- STATUS.md is weeks old
- Contradictory information
- Completed work not archived
