---
description: Create industry-standard integration plan for merging worktree features to main
argument-hint: [optional: specific worktree names to include]
model: claude-sonnet-4-5-20250929
---

# Worktree Integration Planning

Create a comprehensive, industry-standard integration plan document that analyzes completed worktree features and provides expert guidance for merging to main.

**Purpose:** This command automatically discovers all feature worktrees, lets you choose which to include, then generates a strategic merge plan that the main worktree AI can follow to create PRs and merge documentation safely.

**How it works:**

1. **Auto-discovers** all feature worktrees in the repository
2. **Shows you** what's available with status summaries
3. **Asks you** whether to analyze all or select specific ones
4. **Generates** comprehensive integration plan document

**Output:** `/docs/integration-plans/YYYY-MM-DD-integration-plan.md` in main worktree

**Most common usage:** Simply run `/plan-integration` with no arguments - the command will discover worktrees and ask what you want to analyze.

---

## Your Tasks:

### Phase 0: Check Main Worktree Status (CRITICAL)

**Step 0.1: Check Main's Git Status**

```bash
git status --short
```

Capture if main has:

- Modified files
- Deleted files
- Untracked files

**Step 0.2: Store Main Status for Plan Generation**

If main is dirty (has any changes):

- Set `mainIsDirty = true`
- Store list of changed files
- Store list of untracked files
- Count total changes

If main is clean:

- Set `mainIsDirty = false`
- No action needed

**Why this matters:** Main MUST be a clean baseline for feature merges. Dirty main = unpredictable conflicts and merge chaos. This is the critical "Step 0" that MUST happen before any worktree integration.

---

### Phase 1: Discover Worktrees

**Step 1: List All Worktrees**

```bash
git worktree list
```

Parse the output to identify:

- Worktree paths
- Branch names
- Current commits

**Step 2: Filter to Feature Worktrees**

Exclude:

- `.bare` (bare repository)
- `main` (main worktree)

Include only feature worktrees (typically start with `feature/`).

**Step 3: Get Worktree Status**

For each feature worktree:

```bash
cd <worktree-path>
git status
git log --oneline -3  # Last 3 commits
git diff main...HEAD --stat  # Changes from main
```

Capture:

- Branch name
- Last 3 commits (SHA + message)
- Modified files count
- Insertions/deletions
- Uncommitted changes (if any)

**Step 4: Display Discovered Worktrees**

Present summary to user:

```markdown
📋 Discovered X feature worktrees:

1. **prayer** (feature/prayer-management)

   - Last commit: 9d8d140 - fix: prevent feature-wrap-up from destroying other worktrees
   - Changes: 23 files changed, 456 insertions(+), 123 deletions(-)
   - Status: ✅ Clean working directory

2. **volunteer** (feature/volunteer-management)

   - Last commit: a01d4ae - feat: add volunteer onboarding pipeline to connect card review
   - Changes: 18 files changed, 382 insertions(+), 67 deletions(-)
   - Status: ✅ Clean working directory

3. **member** (feature/member-directory)
   - Last commit: 3f2a1b4 - feat: add member search and filters
   - Changes: 15 files changed, 298 insertions(+), 45 deletions(-)
   - Status: ⚠️ Uncommitted changes detected
```

---

### Phase 2: User Selection

**Step 5: Determine Selection Method**

**If $ARGUMENTS provided:**

- If `$ARGUMENTS = "all"` → Use all worktrees
- Otherwise → Use specific worktrees named in $ARGUMENTS
  - Example: `/plan-integration prayer volunteer`
  - Validate names against discovered worktrees
  - Skip to Step 7 if valid

**If NO $ARGUMENTS provided:**

Proceed to Step 6.

**Step 6: Ask User for Selection Preference**

Ask: **"Analyze all worktrees or make a custom selection? (all/custom)"**

**If user chooses "all":**

- Use all discovered worktrees
- Skip to Step 7

**If user chooses "custom":**

- Present numbered list of worktrees:

```markdown
Select worktrees to include (enter numbers separated by commas, e.g., "1,3"):

1. prayer (feature/prayer-management) - 23 files changed
2. volunteer (feature/volunteer-management) - 18 files changed
3. member (feature/member-directory) - 15 files changed
```

- Wait for user response (e.g., "1,2" or "1,3")
- Parse selection and validate
- If invalid selection, ask again

**Step 7: Warn About Uncommitted Changes**

If any selected worktrees have uncommitted changes:

List them and ask:

```markdown
⚠️ Warning: The following worktrees have uncommitted changes:

- member (feature/member-directory)

These changes won't be included in the analysis. Continue anyway? (yes/no)
```

If user says "no":

- Abort command
- Suggest running `/feature-wrap-up` on those worktrees first

If user says "yes":

- Proceed with analysis
- Note uncommitted changes in the integration plan

---

### Phase 3: Deep Analysis

For each selected worktree:

**Step 7: Read Feature Documentation**

Check for feature-specific docs:

```bash
# In worktree directory
find . -path "./.worktree/*/docs/*.md" -o -path "./docs/features/*/vision.md"
```

Read:

- Feature vision docs
- Worktree-specific planning docs
- README files

Extract:

- Feature purpose
- Completion status
- Success criteria
- Known issues/blockers

**Step 8: Analyze Last 3 PR Commits**

For each worktree:

```bash
git log main...HEAD --oneline --no-merges -3
git show <commit-sha> --stat
```

For each commit, capture:

- Commit SHA
- Commit message
- Files changed
- Type of change (feat/fix/docs/refactor/test)
- Related feature areas

**Step 9: Analyze Code Changes**

```bash
git diff main...HEAD --name-only
```

Categorize changes:

**Database Schema:**

- [ ] Prisma schema changes
- [ ] New models
- [ ] Modified models
- [ ] Migrations needed

**Server Actions:**

- [ ] New server actions
- [ ] Modified actions
- [ ] Security patterns verified

**UI Components:**

- [ ] New pages
- [ ] New components
- [ ] Modified layouts

**Documentation:**

- [ ] New docs created
- [ ] Docs updated
- [ ] ADRs written

**Configuration:**

- [ ] Environment variables
- [ ] Package dependencies
- [ ] Build config

**Step 10: Check for Conflicts**

```bash
# Simulate merge to detect conflicts
git merge-tree $(git merge-base main HEAD) main HEAD
```

Identify potential conflicts:

- File conflicts
- Schema conflicts
- Dependency conflicts
- Documentation conflicts

**Step 11: Analyze Dependencies Between Worktrees**

Check if worktrees depend on each other:

- Do they modify the same files?
- Do they modify related database models?
- Do they share components?
- Is there a logical order for merging?

Create dependency graph:

```markdown
volunteer → (depends on) → prayer
(both modify: ChurchMember model, team management UI)

member → (independent)
(no shared dependencies)
```

---

### Phase 4: Risk Assessment

**Step 12: Evaluate Integration Risks**

For each worktree, assess:

**CRITICAL RISKS:**

- [ ] Schema migration conflicts
- [ ] Breaking changes to shared components
- [ ] Multi-tenant data isolation issues
- [ ] Authentication/authorization changes

**HIGH RISKS:**

- [ ] File conflicts with main branch
- [ ] Dependency version conflicts
- [ ] API contract changes
- [ ] Database seed conflicts

**MEDIUM RISKS:**

- [ ] Documentation merge conflicts
- [ ] Test coverage gaps
- [ ] Performance implications
- [ ] Bundle size increases

**LOW RISKS:**

- [ ] Minor UI adjustments needed
- [ ] Documentation formatting
- [ ] Code style inconsistencies

**Step 13: Verify Pattern Compliance**

For each worktree:

```bash
# Check multi-tenant isolation
grep -r "prisma\." --include="*.ts" | grep -v "organizationId"

# Check server action security
grep -r "export async function" --include="*.ts" actions/ | grep -v "arcjet"

# Check PageContainer usage
find app -name "page.tsx" | xargs grep -L "PageContainer"
```

Flag any pattern violations that need fixing before merge.

---

### Phase 5: Generate Integration Plan Document

**Step 14: Create Integration Plan**

Generate comprehensive plan document at:
`/docs/integration-plans/YYYY-MM-DD-integration-plan.md`

**CRITICAL: Check Main Status Flag**

Before generating the document, check the `mainIsDirty` flag from Phase 0:

- **If mainIsDirty = true:**

  - Include "Critical Pre-Work Required" section with Step 0 details
  - List all modified, deleted, and untracked files from Phase 0
  - Provide git commands to commit and push main
  - Warn about uncommitted changes in worktrees
  - Make this section EXTREMELY prominent (use emoji, bold text)

- **If mainIsDirty = false:**
  - Skip "Critical Pre-Work Required" section entirely
  - Proceed directly to "Executive Summary"
  - Main is clean and ready for integration

**Document Structure:**

````markdown
# Worktree Integration Plan - [Date]

**Generated:** [Timestamp]
**Worktrees Analyzed:** X
**Worktrees Selected:** X
**Risk Level:** [CRITICAL/HIGH/MEDIUM/LOW]
**Recommended Order:** [See merge sequence below]

---

[IF mainIsDirty = true, ADD THIS SECTION FIRST:]

### Critical Pre-Work Required

**🚨 STEP 0 (DO THIS FIRST): CLEAN MAIN WORKTREE**

**Main worktree currently has uncommitted changes and MUST be cleaned before any integration:**

- **X modified files** [list all modified files from Phase 0]
- **X deleted files** [list all deleted files from Phase 0]
- **X untracked files** [list all untracked files from Phase 0]

**Why this matters:** Main must be a clean baseline for feature merges. Dirty main = unpredictable conflicts and merge chaos.

**Action Required:**

```bash
cd [main-worktree-path]

# Step 1: Format code (BEFORE staging to avoid re-staging)
pnpm format

# Step 2: Build to verify (catches TypeScript/import errors)
pnpm build

# Step 3: Stage everything (now formatted and verified)
git add .

# Step 4: Commit with clean message (no Claude attribution)
git commit -m "feat: [suggest appropriate commit message based on changes]

[detailed commit message explaining what changed]"

# Step 5: Push to remote
git push origin main
```

**Why this order matters:**

- Format FIRST → Avoid re-staging after pre-commit hook formats
- Build BEFORE staging → Catch errors early
- Stage EVERYTHING → Vercel needs all files committed
````

**ONLY AFTER Step 0 is complete, proceed with worktrees:**

[If any selected worktrees have uncommitted changes, also warn:]

**⚠️ WORKTREES WITH UNCOMMITTED CHANGES - MUST BE COMMITTED AFTER MAIN IS CLEAN**

- **[worktree-name]:** [description of uncommitted changes]
- **Recommended:** Run `/feature-wrap-up` in BOTH worktrees before proceeding

---

[END IF - Continue with normal Executive Summary]

## Executive Summary

### Worktrees Included

1. **[worktree-name]** ([branch-name])

   - Purpose: [Feature purpose from docs]
   - Status: [Complete/In Progress/Blocked]
   - Changes: X files, +X/-X lines
   - Risk: [CRITICAL/HIGH/MEDIUM/LOW]

2. **[worktree-name]** ([branch-name])
   - ...

### Key Findings

- **Total Changes:** X files across Y worktrees
- **Schema Changes:** X models added/modified
- **Conflicts Detected:** X potential conflicts
- **Dependencies:** X worktrees have dependencies
- **Pattern Violations:** X issues found

### Recommended Integration Strategy

[High-level strategy: sequential merge, parallel merge, or staged rollout]

**Estimated Integration Effort:** [Simple/Moderate/Complex]

---

## Detailed Worktree Analysis

### 1. [Worktree Name] - [Branch Name]

**Feature Purpose:**
[Extracted from feature docs]

**Completion Status:**

- [x] Feature implementation complete
- [x] Tests passing
- [x] Documentation updated
- [ ] Any incomplete items

**Last 3 Commits:**

1. `[SHA]` - [commit message]

   - Type: [feat/fix/docs/refactor]
   - Files: X changed
   - Impact: [description]

2. `[SHA]` - [commit message]

   - Type: [feat/fix/docs/refactor]
   - Files: X changed
   - Impact: [description]

3. `[SHA]` - [commit message]
   - Type: [feat/fix/docs/refactor]
   - Files: X changed
   - Impact: [description]

**Code Changes:**

**Database Schema:**

- [x] Added: PrayerRequest model
- [x] Modified: ChurchMember (added prayerRequests relation)
- [ ] Migrations: Need to create migration files

**Server Actions:**

- [x] New: actions/prayer/create.ts (rate limited ✓)
- [x] New: actions/prayer/update.ts (rate limited ✓)
- [x] Modified: actions/church/members.ts (added prayer integration)

**UI Components:**

- [x] New: app/church/[slug]/admin/prayer/page.tsx
- [x] New: components/dashboard/prayer/prayer-table.tsx
- [x] Modified: components/sidebar/agency-nav-sidebar.tsx

**Documentation:**

- [x] Created: docs/features/prayer-management/vision.md
- [x] Updated: docs/STATUS.md
- [x] Updated: docs/ROADMAP.md

**Configuration:**

- [ ] No environment variable changes
- [x] Added: @tanstack/react-table dependency
- [ ] No build config changes

**Pattern Compliance:**

- ✅ Multi-tenant isolation verified
- ✅ Server action security patterns followed
- ✅ PageContainer usage correct
- ✅ Navigation config updated
- ⚠️ Missing: 2 pages need PageContainer (see issues below)

**Conflicts Detected:**

- ⚠️ Potential conflict: prisma/schema.prisma (ChurchMember model)
  - Worktree: prayer adds prayerRequests relation
  - Main branch: May have other relations added
  - Resolution: Manual merge required

**Risk Assessment:**

- Overall Risk: **MEDIUM**
- Schema Migration: MEDIUM (new model + relation)
- File Conflicts: LOW (mostly new files)
- Pattern Violations: LOW (2 minor issues)
- Dependencies: NONE (independent feature)

**Issues to Fix Before Merge:**

1. **MEDIUM:** Add PageContainer to 2 pages

   - File: app/church/[slug]/admin/prayer/settings/page.tsx
   - Fix: Wrap in `<PageContainer as="main">`

2. **LOW:** Update import to use @/ alias
   - File: components/prayer/prayer-form.tsx:5
   - Fix: Change '../../../lib/utils' to '@/lib/utils'

---

### 2. [Next Worktree Analysis]

...

---

## Conflict Resolution Strategy

### Schema Conflicts

**Conflict 1: ChurchMember Model**

**Affected Worktrees:** prayer, volunteer

**Nature of Conflict:**

- Prayer adds: `prayerRequests` relation
- Volunteer adds: `volunteerProfile` relation
- Both modify same model

**Resolution Strategy:**

1. Merge prayer first (has relation to PrayerRequest model)
2. Then merge volunteer (will see existing prayer changes)
3. Manual review of ChurchMember model after both merges
4. Ensure both relations work together

**Merge Order:** prayer → volunteer

---

### File Conflicts

**Conflict 2: Navigation Config**

**Affected Worktrees:** prayer, volunteer, member

**Nature of Conflict:**

- All three add navigation items to same navMain array

**Resolution Strategy:**

1. Review all navigation additions
2. Determine logical order in menu
3. Merge in order: prayer → volunteer → member
4. Each merge adds to existing navigation array
5. Final review for menu organization

**Merge Order:** prayer → volunteer → member

---

### Documentation Conflicts

**Conflict 3: STATUS.md Recent Completions**

**Affected Worktrees:** All

**Nature of Conflict:**

- All worktrees update "Recent Completions" section

**Resolution Strategy:**

1. Merge worktrees sequentially
2. Each merge adds its completion to the list
3. Maintain chronological order
4. Final review for consistency

**No special order required**

---

## Dependency Graph

```
prayer (independent)
  ↓
volunteer (depends on prayer - both modify ChurchMember)
  ↓
member (independent, but easier after volunteer merged)
```

**Critical Path:** prayer → volunteer → member

**Parallel Possible:** No (schema dependencies exist)

---

## Recommended Merge Sequence

### Sequence 1 (Recommended): Sequential Merge

**Order:** prayer → volunteer → member

**Rationale:**

- Prayer is independent and smallest
- Volunteer depends on prayer (ChurchMember model)
- Member is largest and benefits from seeing all changes

**Steps:**

1. **Merge Prayer Worktree**

   - Create PR from feature/prayer-management → main
   - Resolve schema conflicts (if any)
   - Run full test suite
   - Merge to main
   - Delete worktree

2. **Merge Volunteer Worktree**

   - Sync volunteer worktree with updated main
   - Resolve any conflicts from prayer merge
   - Create PR from feature/volunteer-management → main
   - Run full test suite
   - Merge to main
   - Delete worktree

3. **Merge Member Worktree**
   - Sync member worktree with updated main
   - Resolve any conflicts
   - Create PR from feature/member-directory → main
   - Run full test suite
   - Merge to main
   - Delete worktree

**Estimated Timeline:** 3 separate merge sessions

**Risk:** LOW (controlled, one at a time)

---

### Sequence 2 (Alternative): Batch Merge

**Order:** Create PRs for all, merge together

**Rationale:**

- Faster if no conflicts
- Less context switching

**Steps:**

1. Create PRs for all worktrees
2. Review all PRs together
3. Identify conflicts
4. Resolve conflicts in PRs
5. Merge all PRs on same day

**Estimated Timeline:** 1 intensive merge session

**Risk:** MEDIUM (more complex conflict resolution)

**Recommendation:** Only use if you're confident no schema conflicts exist.

---

## Pre-Merge Checklist

For each worktree, verify before creating PR:

### Code Quality

- [ ] Build passes: `pnpm build`
- [ ] Linter clean: `pnpm lint`
- [ ] TypeScript errors: `pnpm tsc --noEmit`
- [ ] Tests passing: `pnpm test:e2e`

### Pattern Compliance

- [ ] Multi-tenant isolation verified
- [ ] Server actions have rate limiting
- [ ] PageContainer usage correct
- [ ] Navigation config updated
- [ ] Shadcn components used

### Documentation

- [ ] Feature vision doc complete
- [ ] STATUS.md updated
- [ ] ROADMAP.md updated
- [ ] ADRs written (if architectural changes)
- [ ] Code comments added

### Database

- [ ] Schema changes documented
- [ ] Migrations created (if needed)
- [ ] Seed data updated
- [ ] No cross-tenant data leakage

### Security

- [ ] Rate limiting on all actions
- [ ] Authentication checks present
- [ ] Input validation with Zod
- [ ] Generic error messages
- [ ] No sensitive data in logs

---

## Post-Merge Verification

After each merge:

**Step 1: Sync Remaining Worktrees**

```bash
# For each remaining worktree
cd <worktree-path>
git fetch origin
git merge origin/main
# Resolve conflicts if any
```

**Step 2: Run Full Test Suite**

```bash
pnpm build
pnpm test:e2e
```

**Step 3: Verify Multi-Tenant Isolation**

```bash
/check-multi-tenant
```

**Step 4: Verify Pattern Compliance**

```bash
/check-patterns recent
```

**Step 5: Update Integration Plan**

Mark completed worktree:

- ✅ [worktree-name] - Merged on [date]

---

## Worktree Cleanup

After successful merge:

**Step 1: Delete Merged Worktree**

```bash
git worktree remove <worktree-path>
```

**Step 2: Delete Feature Branch**

```bash
git branch -d feature/<branch-name>
git push origin --delete feature/<branch-name>
```

**Step 3: Archive Worktree Docs**

```bash
# Move worktree-specific docs to archive
mv .worktree/<name>/docs .archive/worktrees/<name>-YYYY-MM-DD/
```

**Step 4: Update Worktree List**

Remove from any tracking documents.

---

## Rollback Plan

If integration fails:

**Step 1: Identify Issue**

- Build failure
- Test failure
- Runtime error
- Data corruption

**Step 2: Revert Merge**

```bash
git revert -m 1 <merge-commit-sha>
```

**Step 3: Fix in Worktree**

```bash
cd <worktree-path>
# Fix the issue
# Test thoroughly
# Create new PR
```

**Step 4: Document Issue**

Add to integration plan:

```markdown
## Integration Issues Encountered

### [Date] - [Worktree] Merge Failed

**Issue:** [description]
**Cause:** [root cause]
**Resolution:** [how fixed]
**Prevention:** [how to avoid in future]
```

---

## Communication Plan

### Before Integration

**Notify Team:**

- Announce integration plan
- Share this document
- Set expectations for timing
- Request availability for reviews

### During Integration

**Status Updates:**

- Update after each worktree merge
- Report any issues immediately
- Share conflict resolutions

### After Integration

**Summary:**

- Document what was merged
- Share lessons learned
- Update team on new features
- Plan feature announcements

---

## Success Criteria

Integration considered successful when:

- ✅ All selected worktrees merged to main
- ✅ Build passing on main branch
- ✅ All tests passing
- ✅ No multi-tenant data leakage
- ✅ No pattern violations introduced
- ✅ Documentation fully updated
- ✅ Worktrees cleaned up
- ✅ No production issues reported

---

## Next Steps

**Immediate:**

1. Review this integration plan
2. Fix any pre-merge issues identified
3. Get team approval for merge sequence

**Short-term:**

1. Begin merging in recommended sequence
2. Monitor for issues
3. Update plan as needed

**Long-term:**

1. Archive completed worktrees
2. Document lessons learned
3. Improve worktree workflow

---

**Plan Created:** [Timestamp]
**Created By:** Claude Code (/plan-integration command)
**Valid Until:** [30 days from creation]

For questions or issues, refer to:

- /docs/essentials/coding-patterns.md
- /docs/essentials/architecture.md
- CLAUDE.md

````

**Step 15: Save Integration Plan**

Write the generated plan to:
`/docs/integration-plans/YYYY-MM-DD-integration-plan.md`

**Step 16: Create Integration Plans Directory**

If `/docs/integration-plans/` doesn't exist, create it:

```bash
mkdir -p /docs/integration-plans
````

---

### Phase 6: Present Plan to User

**Step 17: Show Summary**

Present concise summary to user:

```markdown
# Integration Plan Created ✅

**Location:** `/docs/integration-plans/2025-11-19-integration-plan.md`

**Worktrees Analyzed:** 3

- prayer (feature/prayer-management)
- volunteer (feature/volunteer-management)
- member (feature/member-directory)

**Recommended Merge Sequence:**

1. prayer (independent, smallest)
2. volunteer (depends on prayer)
3. member (largest, benefits from seeing all changes)

**Risk Level:** MEDIUM

- 2 schema conflicts detected
- 3 file conflicts (manageable)
- 5 minor pattern violations to fix

**Pre-Merge Issues Found:** 5

- 2 MEDIUM priority (PageContainer missing)
- 3 LOW priority (import aliases)

**Next Steps:**

1. Review plan: /docs/integration-plans/2025-11-19-integration-plan.md
2. Fix pre-merge issues
3. Run: `/feature-wrap-up` on each worktree
4. Create PRs in recommended sequence

**Estimated Integration Effort:** Moderate (3 separate merge sessions recommended)
```

**Step 18: Ask for Next Action**

Ask user: **"Integration plan created. Would you like me to help fix the pre-merge issues? (yes/no)"**

If yes:

1. Start with highest priority issues
2. Offer to fix each one
3. Explain the fix
4. Apply the fix

If no:
End command, plan is ready for review.

---

## What This Command Does:

**Discovers:**

- All feature worktrees in repository
- Last 3 commits from each
- Code changes and file modifications
- Potential conflicts

**Analyzes:**

- Feature documentation and status
- Code changes by category
- Pattern compliance
- Risk assessment
- Dependencies between features

**Creates:**

- Industry-standard integration plan document
- Conflict resolution strategies
- Recommended merge sequence
- Pre-merge checklist
- Post-merge verification steps
- Rollback plan

**Provides:**

- Expert guidance for merge process
- Risk mitigation strategies
- Clear action items
- Success criteria

---

## What This Command Does NOT Do:

- ❌ Create PRs
- ❌ Merge code
- ❌ Modify worktrees
- ❌ Run builds/tests
- ❌ Fix issues automatically (asks first)
- ❌ Delete worktrees
- ❌ Commit changes

**This is a planning tool only.** Execution requires separate commands.

---

## Integration with Other Commands:

**Run before:**

- `/feature-wrap-up` (on each worktree)
- Creating PRs
- Merging to main

**Run after:**

- Feature development complete
- Documentation updated
- Tests passing

**Works well with:**

- `/check-patterns` - Verify compliance
- `/check-multi-tenant` - Verify data isolation
- `/update-docs` - Update documentation
- `/review-code` - Code quality review

---

## When to Use:

✅ **Before merging worktrees to main**
✅ **When multiple features are complete**
✅ **Planning sprint integration**
✅ **Before production release**
✅ **When unsure about merge order**
✅ **When conflicts are expected**

**Recommended Frequency:** Before each major integration milestone.

---

## Expert Guidance Provided:

This command follows industry best practices for multi-repository/worktree integration:

**Git Worktree Patterns:**

- Proper conflict detection
- Dependency analysis
- Sequential vs parallel merge strategies

**Risk Management:**

- Categorized risk levels (CRITICAL/HIGH/MEDIUM/LOW)
- Mitigation strategies
- Rollback plans

**Schema Management:**

- Database migration sequencing
- Conflict resolution for schema changes
- Data integrity verification

**Code Quality:**

- Pattern compliance verification
- Security audit
- Multi-tenant isolation check

**Documentation:**

- Comprehensive merge plan
- Clear communication strategy
- Success criteria

**Team Coordination:**

- Merge sequence recommendations
- Pre/post-merge checklists
- Status update templates

---

## Important Notes:

**Plan Validity:**

- Plans are valid for 30 days from creation
- Re-run if worktrees change significantly
- Update plan as issues are resolved

**Manual Review Required:**

- AI generates plan, but human reviews before execution
- Verify all recommendations before merging
- Adjust sequence if business needs require

**Continuous Updates:**

- Update plan after each merge
- Document issues encountered
- Track lessons learned

**Team Collaboration:**

- Share plan with entire team
- Get approval before starting integration
- Communicate status throughout process

---

## Example Usage:

```bash
# Most common: Discover worktrees, then ask user for selection
/plan-integration

# Advanced: Auto-include all worktrees (skip selection prompt)
/plan-integration all

# Advanced: Specify exact worktrees to analyze
/plan-integration prayer volunteer
```

---

## Output Example:

### Example 1: Interactive Selection (Most Common)

User runs: `/plan-integration`

```
📋 Discovered 3 feature worktrees:

1. **prayer** (feature/prayer-management)
   - Last commit: 9d8d140 - fix: prevent feature-wrap-up from destroying other worktrees
   - Changes: 23 files changed, 456 insertions(+), 123 deletions(-)
   - Status: ✅ Clean working directory

2. **volunteer** (feature/volunteer-management)
   - Last commit: a01d4ae - feat: add volunteer onboarding pipeline to connect card review
   - Changes: 18 files changed, 382 insertions(+), 67 deletions(-)
   - Status: ✅ Clean working directory

3. **member** (feature/member-directory)
   - Last commit: 3f2a1b4 - feat: add member search and filters
   - Changes: 15 files changed, 298 insertions(+), 45 deletions(-)
   - Status: ⚠️ Uncommitted changes detected

Analyze all worktrees or make a custom selection? (all/custom)
```

User responds: `all`

```
Analyzing prayer worktree...
Analyzing volunteer worktree...
Analyzing member worktree...

⚠️ Warning: The following worktrees have uncommitted changes:

- member (feature/member-directory)

These changes won't be included in the analysis. Continue anyway? (yes/no)
```

User responds: `yes`

```
✅ Integration plan created: /docs/integration-plans/2025-11-19-integration-plan.md

**Worktrees Analyzed:** 3
**Risk Level:** MEDIUM
**Recommended Sequence:** prayer → volunteer → member
**Conflicts Detected:** 2 schema, 3 file
**Pre-merge Issues:** 5 (2 MEDIUM, 3 LOW)

Would you like me to help fix the pre-merge issues? (yes/no)
```

---

### Example 2: Custom Selection

User runs: `/plan-integration`

After seeing the worktree list, user responds: `custom`

```
Select worktrees to include (enter numbers separated by commas, e.g., "1,3"):

1. prayer (feature/prayer-management) - 23 files changed
2. volunteer (feature/volunteer-management) - 18 files changed
3. member (feature/member-directory) - 15 files changed
```

User responds: `1,2`

```
Analyzing prayer worktree...
Analyzing volunteer worktree...

✅ Integration plan created: /docs/integration-plans/2025-11-19-integration-plan.md

**Worktrees Analyzed:** 2 (prayer, volunteer)
**Risk Level:** MEDIUM
**Recommended Sequence:** prayer → volunteer
**Pre-merge Issues:** 3 (1 MEDIUM, 2 LOW)

Would you like me to help fix the pre-merge issues? (yes/no)
```

---

### Example 3: Using Arguments (Advanced)

User runs: `/plan-integration all`

```
📋 Discovered 3 feature worktrees:

1. **prayer** (feature/prayer-management) - 23 files changed
2. **volunteer** (feature/volunteer-management) - 18 files changed
3. **member** (feature/member-directory) - 15 files changed

Using all worktrees (specified in arguments)...

Analyzing prayer worktree...
Analyzing volunteer worktree...
Analyzing member worktree...

✅ Integration plan created: /docs/integration-plans/2025-11-19-integration-plan.md
```

---

**Remember:** This plan is a roadmap, not a script. Adapt based on your specific needs and constraints.
