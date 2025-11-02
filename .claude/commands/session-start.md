---
description: Initialize a new feature session with branch, docs, and code exploration
argument-hint: [feature description]
model: claude-sonnet-4-5-20250929
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

### 4. Provide Summary

After loading context and exploring code, provide:

- **Branch created:** [name]
- **Feature scope:** Brief description of what we're building
- **Relevant files identified:** List key files that will be modified
- **Existing patterns to follow:** Note any similar features to reference
- **Ready to proceed:** Confirm understanding and ask for approval to start implementation

## Notes:

- Follow all patterns from coding-patterns.md
- Check shadcn/ui components BEFORE building custom UI
- Never run builds/formats/lints until explicitly asked to commit
- Challenge any approach that doesn't follow established patterns
