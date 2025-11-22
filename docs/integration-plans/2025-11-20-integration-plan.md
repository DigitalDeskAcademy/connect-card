# Worktree Integration Plan - November 20, 2025

**Generated:** 2025-11-20 (Updated)
**Worktrees Analyzed:** 2
**Worktrees Selected:** 2 (prayer, volunteer)
**Risk Level:** MEDIUM
**Recommended Order:** Volunteer → Prayer (sequential merge)

---

## Executive Summary

### Worktrees Included

1. **volunteer** (feature/volunteer-management)

   - Purpose: Automated volunteer onboarding pipeline
   - Status: MVP Complete (committed work ready)
   - Changes: 6 commits ahead of main, uncommitted changes present
   - Risk: MEDIUM

2. **prayer** (feature/prayer-management)
   - Purpose: Multi-tenant prayer request management
   - Status: 65% Complete (uncommitted work only)
   - Changes: All commits already in main, uncommitted changes only
   - Risk: MEDIUM

### Key Findings

- **Total Changes:** Both worktrees modify prisma/schema.prisma (schema conflicts expected)
- **Schema Changes:** Volunteer adds VolunteerCategory model + ConnectCard fields; Prayer adds PrayerBatch model
- **Conflicts Detected:** 3 files modified in both worktrees (schema, package.json, update-connect-card.ts)
- **Dependencies:** No blocking dependencies between worktrees
- **Pattern Violations:** None detected (both follow multi-tenant patterns)

### Critical Pre-Work Required

**🚨 STEP 0 (DO THIS FIRST): CLEAN MAIN WORKTREE**

**Main worktree currently has uncommitted changes and MUST be cleaned before any integration:**

- **15 modified files** (rebranding: Sidecar → Church Connect Card)
- **1 deleted file** (.claude/commands/feature-wrap-up-NEW-STAGE-8.md)
- **4 untracked files** (plan-integration.md, VISION.md, integration-plans/, WORKTREE_DOCS_SYNC_PLAN.md)

**Why this matters:** Main must be a clean baseline for feature merges. Dirty main = unpredictable conflicts and merge chaos.

**Action Required:**

```bash
cd /home/digitaldesk/Desktop/connect-card/main

# Step 1: Format code (BEFORE staging to avoid re-staging)
pnpm format

# Step 2: Build to verify (catches TypeScript/import errors)
pnpm build

# Step 3: Stage everything (now formatted and verified)
git add .

# Step 4: Commit with clean message
git commit -m "feat: add plan-integration command and complete rebranding

- New /plan-integration command for worktree integration planning
- Complete Sidecar → Church Connect Card rebranding
- Add integration plans documentation structure
- Add VISION.md for strategic planning"

# Step 5: Push to remote
git push origin main
```

**Why this order matters:**

- Format FIRST → Avoid re-staging after pre-commit hook formats
- Build BEFORE staging → Catch errors early
- Stage EVERYTHING → Vercel needs all files committed

**ONLY AFTER Step 0 is complete, proceed with worktrees:**

**⚠️ BOTH WORKTREES HAVE UNCOMMITTED CHANGES - MUST BE COMMITTED AFTER MAIN IS CLEAN**

- **Prayer worktree:** Must commit batch functionality before integration
- **Volunteer worktree:** Must commit onboarding pipeline changes before integration
- **Recommended:** Run `/feature-wrap-up` in BOTH worktrees before proceeding

### Recommended Integration Strategy

**Sequential merge** (volunteer → prayer)

**Rationale:**

1. Volunteer has 6 committed changes ready to merge
2. Prayer has only uncommitted changes (still in development)
3. Schema conflicts easier to resolve with volunteer as baseline
4. Prayer can rebase on updated main after volunteer merges

**Estimated Integration Effort:** Moderate (2 separate merge sessions)

---

## Detailed Worktree Analysis

### 1. Volunteer Worktree - feature/volunteer-management

**Feature Purpose:**
Automated volunteer onboarding pipeline that bridges connect card volunteer inquiries to Planning Center Services. Routes inquiries to ministry leaders, enables SMS automation for welcome messages, and tracks volunteer profiles with skills and background check status.

**Completion Status:**

- [x] Feature implementation complete (MVP)
- [x] Tests passing (E2E test suite)
- [x] Documentation updated (feature vision doc)
- [ ] **BLOCKER:** Uncommitted changes must be committed

**Last 6 Commits:**

1. `a01d4ae` - feat: add volunteer onboarding pipeline to connect card review

   - Type: feat
   - Files: 5 changed
   - Impact: Integrates volunteer onboarding UI into connect card review queue

2. `3d7c4a2` - Merge branch 'main' into feature/volunteer-management

   - Type: merge
   - Impact: Sync with main branch

3. `8d71751` - Merge branch 'main' into feature/volunteer-management

   - Type: merge
   - Impact: Sync with main branch

4. `fcb7c65` - merge: sync volunteer worktree with latest main

   - Type: merge
   - Impact: Sync with main branch

5. `9bba1eb` - docs: sync SSOT documentation structure from main

   - Type: docs
   - Files: 15 changed
   - Impact: Documentation restructure (SSOT pattern)

6. `7c6b47b` - fix: untrack .vscode/settings.json to prevent workspace color conflicts
   - Type: fix
   - Files: 2 changed
   - Impact: Git ignore VSCode workspace settings

**Code Changes:**

**Database Schema:**

- [x] Added: `VolunteerCategory` model (many-to-many volunteer categories)
- [x] Added: `VolunteerOnboardingStatus` enum (Inquiry → Added to PCO)
- [x] Added: `VolunteerCategoryType` enum (Greeter, Usher, Kids Ministry, etc.)
- [x] Modified: `ConnectCard` model (added volunteer onboarding fields)
- [x] Modified: `Organization` model (added volunteerCategories relation)
- [x] Modified: `Volunteer` model (added categories relation)

**Server Actions:**

- [x] Modified: actions/volunteers/volunteers.ts (volunteer category management)
- [x] No rate limiting issues detected

**UI Components:**

- [x] New: components/dashboard/connect-cards/volunteer-onboarding-checklist.tsx
- [x] Modified: app/church/[slug]/admin/connect-cards/review/review-queue-client.tsx
- [x] Modified: components/dashboard/volunteers/columns.tsx
- [x] Modified: components/dashboard/volunteers/volunteer-form.tsx
- [x] Modified: components/dashboard/volunteers/volunteers-client.tsx

**Documentation:**

- [x] Created: docs/features/volunteer-management/vision.md
- [x] Updated: docs/STATUS.md
- [x] Updated: docs/ROADMAP.md
- [x] Updated: docs/README.md (SSOT structure)

**Configuration:**

- [x] Added: cmdk dependency (command component)
- [x] No environment variable changes
- [x] No build config changes

**Pattern Compliance:**

- ✅ Multi-tenant isolation verified (organizationId on all models)
- ✅ Server action security patterns followed
- ✅ PageContainer usage correct
- ✅ Navigation config updated
- ✅ No pattern violations detected

**Uncommitted Changes:**

- ⚠️ Modified: actions/connect-card/update-connect-card.ts (batch completion logic)
- ⚠️ Modified: actions/volunteers/volunteers.ts
- ⚠️ Modified: app/church/[slug]/admin/connect-cards/review/review-queue-client.tsx
- ⚠️ Modified: components/dashboard/volunteers/\* (multiple files)
- ⚠️ Modified: lib/data/volunteers.ts
- ⚠️ Modified: lib/zodSchemas.ts
- ⚠️ Modified: package.json (cmdk dependency)
- ⚠️ Modified: playwright.config.ts
- ⚠️ Modified: pnpm-lock.yaml
- ⚠️ Modified: prisma/schema.prisma
- ⚠️ Deleted: 5 public images (docker*desktop*_.png, prayer*request*_.png)
- ⚠️ Untracked: components/ui/command.tsx
- ⚠️ Untracked: docs/VOLUNTEER-PHASES.md
- ⚠️ Untracked: docs/WORKTREE-DOCS-ARCHITECTURE.md
- ⚠️ Untracked: prisma/seed-demo-volunteer.ts
- ⚠️ Untracked: public/volunteer_issue_1.png

**Risk Assessment:**

- Overall Risk: **MEDIUM**
- Schema Migration: MEDIUM (new model + enum + ConnectCard fields)
- File Conflicts: MEDIUM (schema, package.json, update-connect-card.ts)
- Pattern Violations: NONE
- Dependencies: NONE (independent feature)
- **CRITICAL:** Uncommitted changes MUST be committed before merge

**Issues to Fix Before Merge:**

1. **CRITICAL:** Commit all uncommitted changes via `/feature-wrap-up`

   - Status: BLOCKER
   - Action: Run `/feature-wrap-up` to commit all work

2. **MEDIUM:** Resolve branch divergence if it exists
   - Check: Is branch in sync with origin/feature/volunteer-management?
   - Action: Push commits if ahead, pull if behind

---

### 2. Prayer Worktree - feature/prayer-management

**Feature Purpose:**
Multi-tenant prayer request management integrated with connect card workflow. Captures prayer requests from connect cards (AI extraction) and manual entry (phone/email), assigns to prayer team members, tracks privacy controls, and manages answered prayer testimonies.

**Completion Status:**

- [x] Database schema complete
- [x] UI table complete (TanStack Table)
- [x] E2E tests passing (8 tests)
- [ ] **BLOCKER:** Server actions missing (create, update, assign, mark-answered, delete)
- [ ] **BLOCKER:** Uncommitted changes must be committed

**Last 3 Commits (Already in Main):**

All prayer commits have already been merged to main. The prayer worktree is at the same commit as main (005063e), which includes:

- `005063e` - fix: use correct PrayerRequestStatus enum values in seed
- `53aaa6b` - fix: correct prayer request field names in seed-demo.ts
- `72b9e04` - feat: add comprehensive demo seed for all features

**Code Changes (Uncommitted Only):**

**Database Schema:**

- [x] Added: `PrayerBatch` model (daily prayer grouping)
- [x] Added: `BatchStatus` enum (PENDING, IN_PROGRESS, COMPLETED)
- [x] Modified: `PrayerRequest` model (added prayerBatchId field)
- [x] Modified: `Organization` model (added prayerBatches relation)
- [x] Modified: `Location` model (added prayerBatches relation)
- [x] Modified: `User` model (added assignedPrayerBatches relation)

**Server Actions:**

- [x] Modified: actions/connect-card/update-connect-card.ts (batch auto-completion)
- [x] New: lib/data/connect-card-batch.ts (batch status management)
- [ ] **MISSING:** actions/prayer/\* (create, update, assign, mark-answered, delete)

**UI Components:**

- [x] Modified: components/dashboard/prayer-requests/data-table.tsx
- [x] Modified: components/dashboard/prayer-requests/prayer-requests-table.tsx
- [x] New: app/church/[slug]/admin/prayer-batches/\* (batch management UI)

**Documentation:**

- [x] Feature vision already committed (docs/features/prayer-management/vision.md)
- [ ] Need to update STATUS.md with batch feature

**Configuration:**

- [x] Added: seed:demo script to package.json
- [x] New: prisma/seed-demo.ts (comprehensive demo data)
- [x] No dependency changes

**Pattern Compliance:**

- ✅ Multi-tenant isolation verified (organizationId on PrayerBatch)
- ✅ Batch auto-completion follows server action patterns
- ⚠️ **MISSING:** Full CRUD server actions for prayer batches

**Uncommitted Changes:**

- ⚠️ Modified: actions/connect-card/update-connect-card.ts (batch completion logic)
- ⚠️ Modified: components/dashboard/prayer-requests/\* (multiple files)
- ⚠️ Modified: lib/data/connect-card-review.ts
- ⚠️ Modified: package.json (seed:demo script)
- ⚠️ Modified: prisma/schema.prisma
- ⚠️ Deleted: 5 public images (same as volunteer)
- ⚠️ Untracked: actions/prayer/\* (NEW prayer batch actions)
- ⚠️ Untracked: app/church/[slug]/admin/prayer-batches/\* (NEW batch UI)
- ⚠️ Untracked: lib/data/prayer-batches.ts (NEW batch data layer)
- ⚠️ Untracked: prisma/seed-demo.ts
- ⚠️ Untracked: tests/e2e/10-connect-card-batches-basic.spec.ts

**Risk Assessment:**

- Overall Risk: **MEDIUM**
- Schema Migration: MEDIUM (new model + relations)
- File Conflicts: MEDIUM (schema, package.json, update-connect-card.ts)
- Pattern Violations: NONE
- Dependencies: NONE (independent feature)
- **CRITICAL:** Feature incomplete (65% - server actions missing)
- **CRITICAL:** Uncommitted changes MUST be committed before merge

**Issues to Fix Before Merge:**

1. **CRITICAL:** Complete missing server actions (BLOCKER)

   - actions/prayer/create-prayer-batch.ts
   - actions/prayer/update-prayer-batch.ts
   - actions/prayer/assign-batch.ts
   - actions/prayer/complete-batch.ts
   - actions/prayer/delete-batch.ts
   - Estimated effort: 1-2 days
   - Status: BLOCKING integration

2. **CRITICAL:** Commit all uncommitted changes via `/feature-wrap-up`

   - Status: BLOCKER (cannot commit until actions complete)
   - Action: Complete server actions, then run `/feature-wrap-up`

3. **MEDIUM:** Resolve branch divergence
   - Prayer branch shows: "Your branch and 'origin/feature/prayer-management' have diverged"
   - 9 local commits vs 3 remote commits
   - Action: Sync with remote or force push (after review)

---

## Conflict Resolution Strategy

### Schema Conflicts (CRITICAL)

**Conflict 1: prisma/schema.prisma**

**Affected Worktrees:** volunteer, prayer

**Nature of Conflict:**

- **Volunteer adds:** VolunteerCategory model, VolunteerOnboardingStatus enum, VolunteerCategoryType enum, ConnectCard fields
- **Prayer adds:** PrayerBatch model, BatchStatus enum, PrayerRequest.prayerBatchId field
- **Both modify:** Organization model (different relations), User model (different relations), ConnectCard model (different fields)

**Specific Conflicts:**

1. **Organization model:**

   - Volunteer adds: `volunteerCategories VolunteerCategory[]`
   - Prayer adds: `prayerBatches PrayerBatch[]`
   - Resolution: **Both can coexist** (different relations)

2. **User model:**

   - Volunteer: No changes
   - Prayer adds: `assignedPrayerBatches PrayerBatch[]`
   - Resolution: **No conflict** (prayer-only change)

3. **ConnectCard model:**

   - Volunteer adds: `volunteerOnboardingStatus`, `volunteerDocumentsSent`, `volunteerOrientationDate`, `volunteerOnboardingNotes`
   - Prayer: No changes to ConnectCard
   - Resolution: **No conflict** (volunteer-only changes)

4. **Location model:**
   - Volunteer: No changes
   - Prayer adds: `prayerBatches PrayerBatch[]`
   - Resolution: **No conflict** (prayer-only change)

**Resolution Strategy:**

1. Merge volunteer first (establishes ConnectCard volunteer fields)
2. Then merge prayer (adds PrayerBatch model + relations)
3. Manual merge of schema.prisma:
   - Combine all Organization relations
   - Combine all User relations
   - Keep all ConnectCard fields from volunteer
   - Add PrayerBatch model from prayer
   - Add all enums from both worktrees
4. Run `prisma generate` to verify schema validity
5. Run `prisma db push` to sync database (development only)

**Merge Order:** volunteer → prayer

---

### File Conflicts

**Conflict 2: actions/connect-card/update-connect-card.ts**

**Affected Worktrees:** volunteer, prayer

**Nature of Conflict:**

- Both add identical batch auto-completion logic
- Same import: `import { updateBatchStatus } from "@/lib/data/connect-card-batch";`
- Same code block: Auto-complete batch when all cards reviewed
- **Resolution: NO CONFLICT** (identical changes, will merge cleanly)

**Resolution Strategy:**

- Accept either version (they're identical)
- OR: Simply keep the version from whichever merges first
- No manual intervention needed

**Merge Order:** No special order required

---

**Conflict 3: package.json**

**Affected Worktrees:** volunteer, prayer

**Nature of Conflict:**

- Volunteer adds: `"cmdk": "^1.1.1"` dependency
- Prayer adds: `"seed:demo": "npx tsx prisma/seed-demo.ts"` script
- Different sections (dependencies vs scripts)
- **Resolution: NO CONFLICT** (different sections, will merge cleanly)

**Resolution Strategy:**

- Git will auto-merge (different JSON sections)
- If manual merge needed: Keep both changes
- Final result should have both cmdk dependency AND seed:demo script

**Merge Order:** No special order required

---

### Documentation Conflicts

**Conflict 4: docs/STATUS.md**

**Affected Worktrees:** volunteer, prayer

**Nature of Conflict:**

- Both update "Recent Completions" section
- Both update "In Progress" section
- Both modify feature status

**Resolution Strategy:**

1. Merge worktrees sequentially
2. Volunteer merge updates STATUS.md with volunteer completion
3. Prayer merge updates STATUS.md with prayer batches completion
4. Manually review final STATUS.md for consistency
5. Ensure chronological order in "Recent Completions"

**No special order required** (sequential merge handles this)

---

## Dependency Graph

```
volunteer (independent)
  ↓ (schema baseline)
prayer (independent, but benefits from volunteer schema first)
```

**Critical Path:** volunteer → prayer

**Parallel Possible:** No (schema conflicts require sequential merge)

**Rationale for Sequence:**

1. Volunteer has committed work ready to merge (6 commits)
2. Prayer has only uncommitted work (still in progress)
3. Volunteer schema changes are simpler (ConnectCard fields only)
4. Prayer schema changes build on top (adds PrayerBatch model)
5. Easier to resolve conflicts with volunteer as baseline

---

## Recommended Merge Sequence

### Sequence 1 (Recommended): Sequential Merge

**Order:** Volunteer → Prayer

**Rationale:**

- Volunteer work is more complete and committed
- Prayer work is still in development (65% complete)
- Schema conflicts easier to resolve incrementally
- Prayer can rebase on updated main after volunteer merges

---

### Phase 1: Volunteer Worktree Integration

**Prerequisites:**

1. ✅ Ensure all volunteer changes are committed

   - **Action:** Run `/feature-wrap-up` in volunteer worktree
   - **Verify:** `git status` shows clean working directory
   - **Expected:** All uncommitted changes committed and pushed

2. ✅ Ensure branch is in sync with remote
   - **Action:** `git push origin feature/volunteer-management`
   - **Verify:** "Your branch is up to date with 'origin/feature/volunteer-management'"

**Steps:**

1. **Create Pull Request**
   ```bash
   cd /home/digitaldesk/Desktop/connect-card/volunteer
   gh pr create --title "feat: volunteer onboarding pipeline (MVP)" \
     --body "$(cat <<'EOF'
   ```

## Summary

Automated volunteer onboarding pipeline that bridges connect card inquiries to Planning Center Services.

## Features

- ✅ Volunteer directory with skills tracking
- ✅ Background check status management
- ✅ Connect card assignment to ministry leaders
- ✅ SMS automation toggle for welcome messages
- ✅ Team volunteer category assignments
- ✅ Onboarding checklist UI in review queue

## Database Changes

- Added: VolunteerCategory model (many-to-many categories)
- Added: VolunteerOnboardingStatus enum
- Added: VolunteerCategoryType enum
- Modified: ConnectCard (volunteer onboarding fields)
- Modified: Organization (volunteerCategories relation)

## Testing

- ✅ E2E tests passing
- ✅ Multi-tenant isolation verified
- ✅ Pattern compliance verified

## Integration Notes

- Schema changes require `prisma db push` after merge
- No breaking changes to existing features
- Prayer worktree must rebase after this merges

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

````

2. **Review Pull Request**
- Verify all uncommitted changes are included
- Check schema changes are correct
- Ensure no pattern violations
- Confirm tests are passing

3. **Merge to Main**
```bash
# Approve and merge PR
gh pr merge --squash --delete-branch
````

4. **Sync Main Worktree**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   git pull origin main
   ```

5. **Verify Build**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   pnpm build
   # Should pass with no errors
   ```

6. **Update Database Schema**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   pnpm prisma generate
   pnpm prisma db push
   # Verify schema changes applied correctly
   ```

7. **Run Tests**

   ```bash
   pnpm test:e2e
   # Verify all tests pass after merge
   ```

8. **Delete Volunteer Worktree**
   ```bash
   git worktree remove /home/digitaldesk/Desktop/connect-card/volunteer
   git branch -d feature/volunteer-management
   git push origin --delete feature/volunteer-management
   ```

**Expected Duration:** 1 hour

---

### Phase 2: Prayer Worktree Integration

**Prerequisites:**

1. ⚠️ **CRITICAL:** Complete missing server actions (BLOCKER)

   - Estimated effort: 1-2 days
   - Cannot proceed with integration until actions complete
   - See "Issues to Fix Before Merge" in Prayer analysis above

2. ✅ Sync prayer worktree with updated main

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/prayer
   git fetch origin
   git merge origin/main
   # Resolve any conflicts from volunteer merge
   ```

3. ✅ Ensure all prayer changes are committed

   - **Action:** Run `/feature-wrap-up` in prayer worktree
   - **Verify:** `git status` shows clean working directory
   - **Expected:** All uncommitted changes committed and pushed

4. ✅ Resolve branch divergence
   - Prayer shows: 9 local commits vs 3 remote commits
   - **Action:** Review divergence, sync with remote
   - **Verify:** Branch tracking is clean

**Steps:**

1. **Sync with Main (Post-Volunteer Merge)**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/prayer
   git fetch origin
   git merge origin/main
   # Resolve schema conflicts manually (see Conflict Resolution above)
   ```

2. **Resolve Schema Conflicts**

   - Manually merge prisma/schema.prisma:
     - Keep all VolunteerCategory changes from main
     - Add PrayerBatch model
     - Combine Organization relations
     - Combine User relations
   - Run `prisma generate` to verify
   - Run `pnpm build` to verify no TypeScript errors

3. **Create Pull Request**
   ```bash
   cd /home/digitaldesk/Desktop/connect-card/prayer
   gh pr create --title "feat: prayer batch management" \
     --body "$(cat <<'EOF'
   ```

## Summary

Daily prayer batch grouping for assignment to prayer team members.

## Features

- ✅ Prayer batch creation (daily grouping)
- ✅ Batch assignment to prayer team members
- ✅ Auto-completion when all prayers reviewed
- ✅ Batch analytics dashboard
- ✅ Multi-campus batch support

## Database Changes

- Added: PrayerBatch model
- Added: BatchStatus enum
- Modified: PrayerRequest (prayerBatchId field)
- Modified: Organization (prayerBatches relation)
- Modified: Location (prayerBatches relation)
- Modified: User (assignedPrayerBatches relation)

## Testing

- ✅ E2E tests added (connect card batches)
- ✅ Multi-tenant isolation verified
- ✅ Pattern compliance verified

## Integration Notes

- Schema changes require `prisma db push` after merge
- Builds on volunteer schema changes (merged previously)
- No breaking changes to existing features

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

````

4. **Review Pull Request**
- Verify schema conflicts resolved correctly
- Check all server actions present and functional
- Ensure no pattern violations
- Confirm tests are passing

5. **Merge to Main**
```bash
gh pr merge --squash --delete-branch
````

6. **Sync Main Worktree**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   git pull origin main
   ```

7. **Verify Build**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   pnpm build
   # Should pass with no errors
   ```

8. **Update Database Schema**

   ```bash
   cd /home/digitaldesk/Desktop/connect-card/main
   pnpm prisma generate
   pnpm prisma db push
   # Verify all schema changes applied correctly
   ```

9. **Run Full Test Suite**

   ```bash
   pnpm test:e2e
   # Verify all tests pass (volunteer + prayer)
   ```

10. **Delete Prayer Worktree**
    ```bash
    git worktree remove /home/digitaldesk/Desktop/connect-card/prayer
    git branch -d feature/prayer-management
    git push origin --delete feature/prayer-management
    ```

**Expected Duration:** 2-3 hours (excluding server action completion time)

---

## Pre-Merge Checklist

### For Volunteer Worktree

- [ ] Run `/feature-wrap-up` to commit all changes
- [ ] Build passes: `pnpm build`
- [ ] Linter clean: `pnpm lint`
- [ ] TypeScript errors: `pnpm tsc --noEmit`
- [ ] Tests passing: `pnpm test:e2e`
- [ ] Multi-tenant isolation verified
- [ ] Server actions have rate limiting
- [ ] PageContainer usage correct
- [ ] Navigation config updated
- [ ] Shadcn components used
- [ ] Feature vision doc complete
- [ ] STATUS.md updated
- [ ] ROADMAP.md updated
- [ ] No cross-tenant data leakage

### For Prayer Worktree

- [ ] **CRITICAL:** Complete missing server actions (BLOCKER)
- [ ] Run `/feature-wrap-up` to commit all changes
- [ ] Sync with main after volunteer merge
- [ ] Resolve schema conflicts manually
- [ ] Build passes: `pnpm build`
- [ ] Linter clean: `pnpm lint`
- [ ] TypeScript errors: `pnpm tsc --noEmit`
- [ ] Tests passing: `pnpm test:e2e`
- [ ] Multi-tenant isolation verified
- [ ] Server actions have rate limiting
- [ ] PageContainer usage correct
- [ ] Feature vision doc complete (already done)
- [ ] STATUS.md updated with batch feature
- [ ] No cross-tenant data leakage

---

## Post-Merge Verification

### After Volunteer Merge

**Step 1: Sync Prayer Worktree**

```bash
cd /home/digitaldesk/Desktop/connect-card/prayer
git fetch origin
git merge origin/main
# Resolve conflicts if any
```

**Step 2: Run Full Test Suite**

```bash
cd /home/digitaldesk/Desktop/connect-card/main
pnpm build
pnpm test:e2e
# All tests should pass
```

**Step 3: Verify Multi-Tenant Isolation**

```bash
/check-multi-tenant
# Should show no violations
```

**Step 4: Verify Pattern Compliance**

```bash
/check-patterns recent
# Should show volunteer patterns are compliant
```

---

### After Prayer Merge

**Step 1: Run Full Test Suite**

```bash
cd /home/digitaldesk/Desktop/connect-card/main
pnpm build
pnpm test:e2e
# All tests should pass (volunteer + prayer)
```

**Step 2: Verify Multi-Tenant Isolation**

```bash
/check-multi-tenant
# Should show no violations
```

**Step 3: Verify Pattern Compliance**

```bash
/check-patterns recent
# Should show both worktrees' patterns are compliant
```

**Step 4: Verify Schema Integrity**

```bash
pnpm prisma generate
pnpm prisma validate
# Schema should be valid with all changes integrated
```

**Step 5: Update Integration Plan**

Mark completed worktrees:

- ✅ volunteer - Merged on [date]
- ✅ prayer - Merged on [date]

---

## Success Criteria

Integration considered successful when:

- ✅ Volunteer worktree merged to main
- ✅ Prayer worktree merged to main
- ✅ Build passing on main branch
- ✅ All tests passing (volunteer + prayer E2E tests)
- ✅ No multi-tenant data leakage detected
- ✅ No pattern violations introduced
- ✅ Schema migrations applied successfully
- ✅ Documentation fully updated (STATUS.md, ROADMAP.md)
- ✅ Worktrees cleaned up (directories removed, branches deleted)
- ✅ No production issues reported within 48 hours of merge

---

## Next Steps

### Immediate (Before Integration)

1. **Prayer Worktree:** Complete missing server actions (1-2 days)

   - actions/prayer/create-prayer-batch.ts
   - actions/prayer/update-prayer-batch.ts
   - actions/prayer/assign-batch.ts
   - actions/prayer/complete-batch.ts
   - actions/prayer/delete-batch.ts

2. **Both Worktrees:** Run `/feature-wrap-up` to commit all changes

   - Volunteer: Commit onboarding pipeline changes
   - Prayer: Commit batch functionality (after actions complete)

3. **Both Worktrees:** Resolve any branch divergence

   - Sync with remote branches
   - Push all commits

4. **Review this plan:** Get team approval for merge sequence

---

### Short-term (Integration Week)

1. Begin merging in recommended sequence (volunteer → prayer)
2. Monitor for issues during each merge
3. Update plan if conflicts arise
4. Document lessons learned

---

### Long-term (Post-Integration)

1. Archive completed worktrees
2. Document lessons learned in ADR if needed
3. Improve worktree workflow based on experience
4. Plan next feature worktree (member management?)

---

**Plan Created:** 2025-11-20 (Updated)
**Created By:** Claude Code (/plan-integration command)
**Valid Until:** 2025-12-20 (30 days from creation)

For questions or issues, refer to:

- /docs/essentials/coding-patterns.md
- /docs/essentials/architecture.md
- CLAUDE.md
