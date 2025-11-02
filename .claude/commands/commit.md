---
description: Complete commit workflow with build verification and clean commits
model: claude-sonnet-4-5-20250929
---

# Commit Workflow

Execute the complete commit workflow as documented in CLAUDE.md.

## Pre-Commit Checks

**CRITICAL:** Only create commits when explicitly requested by the user. Never run this command autonomously.

## Your Tasks:

### 1. Review Changes

Run these commands in parallel to understand the full scope of changes:

- `git status` - See all untracked files and modifications
- `git diff` - See both staged and unstaged changes
- `git log --oneline -5` - See recent commit messages to match style

### 2. Analyze and Draft Commit Message

Based on the changes:

- Summarize the nature of changes (new feature, enhancement, bug fix, refactoring, docs, etc.)
- Ensure accurate reflection of changes and their purpose:
  - "add" means wholly new feature
  - "update" means enhancement to existing feature
  - "fix" means bug fix
  - "refactor" means code improvement without behavior change
  - "docs" means documentation updates
- DO NOT commit files with secrets (.env, credentials.json, etc.) - Warn user if present
- Draft a concise (1-2 sentences) commit message focusing on "why" rather than "what"

**Commit Message Format:**

```
<type>: <short summary>

<optional detailed explanation if needed>
```

Examples:

- `feat: add connect card review queue with zoomable images`
- `fix: resolve phone validation for 9-digit numbers`
- `refactor: consolidate PageContainer variants for consistency`
- `docs: update STATUS.md with Phase 3 progress`

### 3. Execute Commit Workflow

**Step 1: Build Verification**

```bash
pnpm build
```

If build fails, STOP and report errors to user. Do NOT proceed with commit.

**Step 2: Stage All Changes**

```bash
git add .
```

**Golden Rule:** Always stage everything. Local builds use all files (committed + uncommitted), but Vercel only gets committed files. Missing files = Vercel failures.

**Step 3: Verify Staging**

```bash
git status
```

Confirm no needed files are unstaged.

**Step 4: Commit with Clean Message**

```bash
git commit -m "$(cat <<'EOF'
<your commit message here>
EOF
)"
```

**CRITICAL:**

- DO NOT include "Generated with Claude Code" signatures
- DO NOT add "Co-Authored-By: Claude" attribution
- Keep commits clean and professional (CLAUDE.md lines 457-463)

Format/lint run automatically via pre-commit hook.

**Step 5: Verify Commit Success**

```bash
git status
```

Should show "nothing to commit, working tree clean"

### 4. Handle Pre-Commit Hook Changes

If the commit fails due to pre-commit hook changes (e.g., prettier formatting):

**Verify it's safe to amend:**

- Check authorship: `git log -1 --format='%an %ae'`
- Check not pushed: `git status` shows "Your branch is ahead"
- If both true: Amend the commit
- Otherwise: Create NEW commit (never amend other developers' commits)

**If safe to amend:**

```bash
git add .
git commit --amend --no-edit
```

### 5. Ask About Push

After successful commit, ask user:

> "Commit created successfully. Would you like me to push to remote? (yes/no)"

**ONLY push if user explicitly says yes:**

```bash
git push origin <branch-name>
```

## Important Rules:

- ❌ NEVER run this without explicit user request
- ❌ NEVER push without user permission
- ❌ NEVER skip the build step
- ❌ NEVER include AI attribution in commits
- ✅ ALWAYS use `git add .` to stage everything
- ✅ ALWAYS use HEREDOC for commit messages
- ✅ ALWAYS check for secrets before committing
- ✅ ALWAYS verify build passes before committing

## Error Handling:

**Build Failures:**

- Report TypeScript errors with file:line references
- Suggest fixes based on error messages
- Do NOT proceed with commit

**Merge Conflicts:**

- Warn user about conflicts
- Show conflicted files
- Ask user to resolve manually

**Secrets Detected:**

- List files containing secrets
- Warn user NOT to commit
- Suggest adding to .gitignore
