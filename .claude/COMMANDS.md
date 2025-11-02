# Slash Commands Reference

Custom slash commands to accelerate development workflows for Church Connect Card platform.

## Quick Reference

| Command              | Purpose                                | When to Use               |
| -------------------- | -------------------------------------- | ------------------------- |
| `/session-start`     | Initialize feature session             | Starting new feature work |
| `/add-route`         | Scaffold new route                     | Creating new page         |
| `/add-server-action` | Generate secure server action          | Creating API endpoint     |
| `/review-code`       | Launch code review                     | Before committing         |
| `/update-docs`       | Comprehensive doc audit                | After code changes        |
| `/commit`            | Complete commit workflow               | Ready to commit           |
| `/feature-wrap-up`   | Full workflow: build → merge → handoff | Feature complete          |

---

## Development Workflow Commands

### `/session-start [feature description]`

**Initialize a new feature development session.**

**What it does:**

1. Checks current branch, creates feature branch if needed
2. Loads all project documentation (CLAUDE.md, coding-patterns.md, etc.)
3. Explores relevant code areas
4. Provides implementation plan

**Example:**

```bash
/session-start new member management dashboard
```

**Output:**

- Feature branch created
- Context loaded
- Relevant files identified
- Ready-to-proceed summary

**When to use:**

- Starting new feature
- Beginning work day
- Switching to different feature
- Onboarding to new area of codebase

---

### `/add-route [path] [title]`

**Scaffold a new route following all project patterns.**

**What it does:**

1. Determines correct PageContainer variant
2. Checks existing similar routes
3. Updates navigation config (`/lib/navigation.ts`)
4. Creates page file with proper auth and structure
5. Verifies pattern compliance

**Examples:**

```bash
/add-route app/church/[slug]/admin/events "Events"
/add-route app/platform/admin/analytics "Analytics"
```

**Output:**

- Navigation config updated
- Page file created with correct patterns
- Next steps guidance (tables, forms, etc.)

**When to use:**

- Creating any new page
- Adding admin features
- Building new sections

**Key patterns enforced:**

- PageContainer with correct variant
- No duplicate headers (SiteHeader handles)
- Proper authentication
- Multi-tenant data scoping

---

### `/add-server-action [name] [type]`

**Generate secure server action with all safety patterns.**

**Action types:** `create`, `update`, `delete`, `custom`

**What it does:**

1. Checks similar existing actions
2. Creates/updates Zod schema
3. Generates server action with:
   - Rate limiting (Arcjet)
   - Authentication checks
   - Input validation
   - Multi-tenant isolation
   - Generic error handling
4. Optionally generates form component

**Examples:**

```bash
/add-server-action createChurchMember create
/add-server-action updateConnectCardStatus update
/add-server-action deleteVolunteerAssignment delete
```

**Output:**

- Zod schema in `/lib/zodSchemas.ts`
- Server action in `/actions/[feature]/actions.ts`
- Optional form component
- Security checklist verification

**When to use:**

- Creating any server action
- Building forms
- API endpoints
- Data mutations

**Key patterns enforced:**

- Rate limiting (5 req/min standard)
- Authentication (requireUser/requireAdmin)
- ApiResponse return type
- organizationId for multi-tenant
- Generic error messages
- No console.error

---

### `/review-code`

**Launch code-reviewer agent for quality and security analysis.**

**What it does:**

1. Identifies changed files
2. Launches code-reviewer agent to analyze:
   - Code quality
   - Security issues
   - Pattern compliance
   - Performance
   - TypeScript correctness
3. Categorizes findings (Critical, Warnings, Suggestions)
4. Creates fix plan
5. Offers to implement fixes

**Output:**

- 🚨 Critical issues (must fix)
- ⚠️ Warnings (should fix)
- 💡 Suggestions (consider)
- File:line references for each issue
- Actionable recommendations

**When to use:**

- Before committing code
- After major refactoring
- Before creating PR
- When adding security-sensitive code
- When uncertain about patterns

**What gets checked:**

- Rate limiting on server actions
- Multi-tenant data isolation
- Input validation
- No secrets in code
- Pattern compliance (PageContainer, ApiResponse, etc.)
- Code quality and performance

---

### `/update-docs [what changed]`

**Comprehensive documentation audit and sync.**

**What it does:**

1. Analyzes code changes
2. Reads ALL documentation files
3. Detects contradictions across docs
4. Consolidates duplicate examples
5. Removes obsolete content
6. Documents new patterns
7. Verifies consistency
8. Generates comprehensive report

**Examples:**

```bash
/update-docs completed connect card review queue
/update-docs added new PageContainer variant
/update-docs refactored server action pattern
```

**Output:**

- Updated STATUS.md and ROADMAP.md
- New patterns documented in coding-patterns.md
- ADRs for architectural decisions
- Contradictions resolved
- Duplicates consolidated
- Obsolete content removed
- Consistency verified
- Changes staged (not committed)

**When to use:**

- After completing feature
- After introducing new patterns
- After major refactoring
- Weekly documentation maintenance
- Before creating PR

**What it checks:**

- Contradictions between docs
- Duplicate code examples
- Obsolete file paths (app/agency, @header, etc.)
- Deprecated patterns
- Consistency across all docs
- Real vs hypothetical examples

---

### `/commit`

**Complete commit workflow with build verification.**

**What it does:**

1. Reviews all changes (git status, git diff)
2. Analyzes and drafts commit message
3. Runs `pnpm build` to verify
4. Stages all changes (`git add .`)
5. Creates commit with clean message (no AI attribution)
6. Handles pre-commit hook changes
7. Asks about pushing to remote

**Output:**

- Clean commit created
- Build verified passing
- Pre-commit hooks handled
- Optional push to remote

**When to use:**

- Ready to commit code
- After `/review-code` passes
- After `/update-docs` completes
- When user explicitly says "commit"

**Commit message format:**

```
<type>: <short summary>

<optional detailed explanation>
```

**Types:** feat, fix, refactor, docs, test, chore

**Critical rules:**

- ❌ NO "Generated with Claude Code"
- ❌ NO "Co-Authored-By: Claude"
- ✅ Clean, professional commits only
- ✅ ALWAYS runs build first
- ✅ ALWAYS stages everything (git add .)

---

### `/feature-wrap-up`

**Complete end-to-end workflow: build → commit → PR → merge → handoff.**

**This is the BIG ONE - full feature completion ceremony.**

**What it does:**

**Phase 1: Quality Verification**

1. Run `pnpm build` (stops if fails)
2. Run `pnpm lint` (offers to fix)
3. Check for console.log, TODOs, .only()

**Phase 2: Commit & Documentation** 4. Check git status 5. Draft commit message 6. Create commit (clean, no AI attribution) 7. Update STATUS.md and ROADMAP.md 8. Commit documentation updates

**Phase 3: Pull Request** 9. Push branch to remote 10. Generate PR description 11. Create PR with `gh pr create`

**Phase 4: Testing & Merge** 12. Ask if manual testing needed 13. Show testing checklist if yes 14. Squash and merge PR 15. Delete remote branch

**Phase 5: Cleanup & Switch** 16. Switch to main branch 17. Pull latest changes 18. Delete local feature branch 19. Verify clean state

**Phase 6: Next Feature Planning** 20. Ask user what to work on next 21. Generate AI session handoff document 22. Save to `.claude/handoff-<date>.md` 23. Display completion summary

**Output:**

- ✅ Build passed
- ✅ Commits created
- ✅ PR created and merged
- ✅ Switched to main
- ✅ Documentation updated
- ✅ Handoff document created
- Ready for next feature

**When to use:**

- Feature completely done and tested
- Ready to merge to main
- Want automated end-to-end workflow
- Ending work day (handoff to tomorrow)

**User confirmations required:**

- Create PR? (yes/no)
- Manual testing needed? (yes/no)
- Testing complete? (yes/no)
- Ready to merge? (yes/no)
- What's next feature? (text input)

**Time estimate:** 2-5 minutes (excluding manual testing)

**Critical notes:**

- This is COMPLETE workflow - takes you from "code done" to "ready for next feature"
- Automatically calls `/update-docs` internally
- Creates handoff document for next AI session
- Leaves repository in clean state on main branch

---

## Command Workflows

### Daily Development Workflow

**Starting work:**

```bash
/session-start implement volunteer scheduling
```

**Building features:**

```bash
/add-route app/church/[slug]/admin/volunteers "Volunteers"
/add-server-action createVolunteerAssignment create
```

**Before committing:**

```bash
/review-code
```

**Committing:**

```bash
/commit
```

**Completing feature:**

```bash
/feature-wrap-up
```

---

### Quick Commit Workflow

For small changes or bug fixes:

```bash
# 1. Make changes
# 2. Review
/review-code

# 3. Update docs
/update-docs fixed phone validation bug

# 4. Commit
/commit
```

---

### Full Feature Workflow

For complete features:

```bash
# 1. Start session
/session-start member management dashboard

# 2. Build feature
/add-route app/church/[slug]/admin/members "Members"
/add-server-action createMember create
# ... implement feature ...

# 3. Wrap up (does everything)
/feature-wrap-up
```

This one command handles: build → lint → commit → docs → PR → merge → cleanup → handoff

---

## Pattern Enforcement

All commands enforce project patterns:

**Multi-Tenant Safety:**

- All queries filter by `organizationId`
- Rate limiting uses multi-tenant fingerprinting
- No cross-tenant data leakage

**Security:**

- Rate limiting on all server actions
- Authentication checks (requireUser/requireAdmin)
- Input validation with Zod
- Generic error messages

**UI Consistency:**

- PageContainer with correct variant
- No duplicate headers (SiteHeader handles)
- Navigation config in `/lib/navigation.ts`
- Shadcn components (not custom)

**Code Quality:**

- ApiResponse return type
- TypeScript strict mode
- No console.log/error
- Clean git history

---

## Tips & Best Practices

**Use `/session-start` every time:**

- Loads context fresh
- Creates proper branch
- Identifies relevant patterns

**Use `/review-code` before every commit:**

- Catches issues early
- Verifies pattern compliance
- Prevents security vulnerabilities

**Use `/feature-wrap-up` to finish:**

- Comprehensive workflow
- Nothing forgotten
- Clean handoff

**Use `/update-docs` frequently:**

- Keeps docs synchronized
- Catches contradictions
- Documents new patterns

**Commit message quality:**

- Be specific: "feat: add review queue with zoomable images"
- Not vague: "feat: add feature"
- Focus on why, not what

**Documentation discipline:**

- Document new patterns immediately
- Create ADRs for architectural decisions
- Keep examples real (not hypothetical)
- Verify consistency

---

## Command Chaining

Commands can be chained in workflows:

**Method 1: Manual chaining**

```bash
/session-start <feature>
# ... build feature ...
/review-code
/update-docs <feature>
/commit
```

**Method 2: Auto chaining (feature-wrap-up)**

```bash
# ... build feature ...
/feature-wrap-up
# Automatically runs: build → lint → review → update-docs → commit → PR → merge → handoff
```

---

## Error Handling

All commands include error handling:

**Build failures:**

- Reports TypeScript errors with file:line
- Stops workflow
- Offers to help fix

**Lint failures:**

- Reports ESLint issues
- Offers to run `pnpm lint --fix`
- Resumes after fix

**Commit failures:**

- Checks for pre-commit hook changes
- Amends if safe
- Creates new commit otherwise

**PR failures:**

- Checks gh CLI authentication
- Provides manual instructions
- Waits for user resolution

**Merge conflicts:**

- Detects conflicts
- Asks user to resolve
- Resumes after resolution

---

## Command Reference Files

All commands are stored in:

```
.claude/commands/
├── session-start.md
├── add-route.md
├── add-server-action.md
├── review-code.md
├── update-docs.md
├── commit.md
└── feature-wrap-up.md
```

View any command:

```bash
cat .claude/commands/<command-name>.md
```

---

## Getting Help

**See available commands:**
Type `/` in Claude Code to see all commands

**View command details:**

```bash
cat .claude/commands/<command>.md
```

**Command not working?**

1. Check command syntax
2. Verify required parameters
3. Check error message
4. Read command markdown file for details

**Need new command?**
Follow pattern from existing commands in `.claude/commands/`

---

## Version History

**v1.0** - Initial command library (Nov 2025)

- `/session-start` - Feature initialization
- `/add-route` - Route scaffolding
- `/add-server-action` - Secure server actions
- `/review-code` - Code quality analysis
- `/update-docs` - Documentation audit
- `/commit` - Commit workflow
- `/feature-wrap-up` - Complete workflow

**Future commands (planned):**

- `/add-table` - TanStack Table scaffolding
- `/db-push` - Safe database operations
- `/pr` - Quick PR creation
- `/check-patterns` - Pattern compliance checker
- `/security-audit` - Security analysis

---

**Remember:** These commands encode your project's patterns and best practices. Using them ensures consistent, high-quality code that follows all documented patterns.
