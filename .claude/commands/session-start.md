---
description: Initialize a new feature session with branch, docs, and code exploration
argument-hint: [feature description]
---

# Feature Session Initialization

You're starting work on: **$ARGUMENTS**

## Your Tasks:

### 1. Branch Setup

- Check current git branch with `git branch --show-current`
- If not already on a feature branch, create one:
  - Suggest a descriptive branch name based on the feature (format: `feature/descriptive-name`)
  - Create and checkout the branch: `git checkout -b <branch-name>`
  - Confirm the new branch

### 2. Load Project Context

Read all project documentation to understand the project:

1. **CLAUDE.md** - Read this first
2. **All files in /docs/** - Use Glob to find all documentation files and read them all

### 3. Explore Relevant Code

Based on the feature description, identify which areas of the codebase are relevant:

- Use Glob to find related files (e.g., `app/church/**/*.tsx` for UI, `prisma/schema.prisma` for data models)
- Read key files that will be modified or referenced
- Check for existing similar implementations to follow established patterns

**Common areas:**

- `/app/church/[slug]/admin/*` - Admin features
- `/components/*` - Shared UI components
- `/lib/*` - Utilities and shared logic
- `/actions/*` - Server actions
- `/prisma/schema.prisma` - Database models

### 4. Create Phase Plan & PR Goal

**Extract phases from documentation:**

- Check `/docs/WORKTREE-STATUS.md` for current worktree status and task lists
- Check the relevant vision doc in `/docs/features/*/vision.md`
- Identify what's already complete vs what remains

**Establish a clear PR goal:**

- Pick ONE achievable milestone that warrants a PR
- The goal should be:
  - Small enough to complete in one session (1-3 hours of work)
  - Large enough to be a meaningful unit of work
  - Self-contained (doesn't leave broken/half-done features)
- Examples of good PR goals:
  - "Implement all 5 prayer server actions"
  - "Add export tracking to database"
  - "Complete card format onboarding UI"
- Examples of BAD goals:
  - "Work on prayer feature" (too vague)
  - "Fix everything" (too big)
  - "Add one action" (too small, not self-contained)

### 5. Provide Summary

After loading context and exploring code, provide:

- **Branch:** [name]
- **Current State:** What's already done in this worktree
- **PR Goal:** The specific milestone we're working toward
- **Tasks to Complete:**
  - [ ] Task 1
  - [ ] Task 2
  - [ ] Task 3
- **Relevant files:** Key files that will be modified
- **Patterns to follow:** Similar implementations to reference

**Ask for confirmation before starting implementation.**

---

## Session Workflow

```
┌─────────────────┐
│  /session-start │
│  (set PR goal)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Work toward   │
│    PR goal      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Goal complete? │──No──▶ Keep working
└────────┬────────┘
         │Yes
         ▼
┌─────────────────┐
│  Create PR      │
│  /feature-wrap-up│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     /clear      │
│  Start new      │
│  session        │
└─────────────────┘
```

## Notes:

- Follow all patterns from coding-patterns.md
- Check shadcn/ui components BEFORE building custom UI
- Never run builds/formats/lints until explicitly asked to commit
- Challenge any approach that doesn't follow established patterns
