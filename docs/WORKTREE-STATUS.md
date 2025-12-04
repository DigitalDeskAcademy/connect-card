# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-04
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree         | Port | Branch                         | Status          | Current Focus                    |
| ---------------- | ---- | ------------------------------ | --------------- | -------------------------------- |
| **main**         | 3000 | `main`                         | 🟢 Active       | Project management, Dashboard UI |
| **connect-card** | 3001 | `feature/connect-card`         | 🟡 Active Work  | Card format onboarding           |
| **prayer**       | 3002 | `feature/prayer-enhancements`  | 🟢 Merged       | PR #49 merged to main            |
| **volunteer**    | 3003 | `feature/volunteer-management` | 🟢 75% Complete | Ready for export flag            |
| **tech-debt**    | 3004 | `feature/tech-debt`            | 🟢 Phase 1 Done | Phase 2: Performance             |
| **integrations** | 3005 | `feature/integrations`         | 🟢 Phase 1 Done | CSV Export complete              |

---

## 🚨 PRIORITY ORDER

**Work on these in order. Don't skip ahead.**

```
1. volunteer     → Ready for export flag (75% complete)
2. connect-card  → Card format onboarding (active work)
3. integrations  → Phase 2: API integration (Phase 1 done)
4. tech-debt     → Phase 2: Performance (Phase 1 done)
5. main          → Project management (ongoing)
6. prayer        → ✅ MERGED (PR #49)
```

---

## 📋 Worktree Details

---

### 🟢 tech-debt (Port 3004)

**Status:** Phase 1 Complete - Ready for Phase 2
**Branch:** `feature/tech-debt`
**Vision Doc:** `/docs/features/tech-debt/vision.md`

#### Phase 1 - Production Blockers (COMPLETE)

| #   | Task                          | File                                                 | Status |
| --- | ----------------------------- | ---------------------------------------------------- | ------ |
| 1   | Fix subscription bypass       | `app/data/dashboard/require-dashboard-access.ts:114` | [x]    |
| 2   | Remove PII from logs          | Server action files                                  | [x]    |
| 3   | Add database indexes          | `prisma/schema.prisma`                               | [x]    |
| 4   | Add pagination to all queries | `/lib/data/*.ts`                                     | [x]    |

#### What You Should Be Working On

**Phase 2 - Performance (when time permits):**

| #   | Task             | Description                | Status |
| --- | ---------------- | -------------------------- | ------ |
| 5   | Add caching      | Redis/Upstash for hot data | [ ]    |
| 6   | Data abstraction | Repository pattern (defer) | [ ]    |

#### Definition of Done (Phase 1)

- [x] All 4 Phase 1 items complete
- [ ] PR created to main
- [ ] PLAYBOOK.md updated with completion status

#### Blockers

None - Phase 1 complete, no longer blocking production.

---

### 🟢 prayer (Port 3002)

**Status:** ✅ MERGED - PR #49 merged to main (Dec 4, 2025)
**Branch:** `feature/prayer-enhancements`
**Vision Doc:** `/docs/features/prayer/vision.md`

#### What Was Completed

| #   | Task                         | Status |
| --- | ---------------------------- | ------ |
| 1   | `createPrayerRequest` action | ✅     |
| 2   | `updatePrayerRequest` action | ✅     |
| 3   | `assignPrayerRequest` action | ✅     |
| 4   | `markAnswered` action        | ✅     |
| 5   | `deletePrayerRequest` action | ✅     |
| 6   | `togglePrivacy` action       | ✅     |
| 7   | Create prayer dialog         | ✅     |
| 8   | Edit prayer dialog           | ✅     |
| 9   | Detail view dialog           | ✅     |
| 10  | PR #49 merged to main        | ✅     |

**Each action includes:**

- Zod validation schema
- Arcjet rate limiting
- Multi-tenant `organizationId` scoping
- Privacy checks for private prayers

#### Future Enhancements (Phase 2)

- [ ] N+1 query optimization (10 COUNT queries)
- [ ] Dedicated assignment dialog

#### Blockers

None - this feature is complete and merged!

---

### 🟢 volunteer (Port 3003)

**Status:** 75% Complete - Ready for export flag
**Branch:** `feature/volunteer-management`
**Vision Doc:** `/docs/features/volunteer/vision.md`

#### What's Complete

| #   | Task                             | Status |
| --- | -------------------------------- | ------ |
| 1   | Leader auto-notification (email) | ✅     |
| 2   | Document auto-send (email)       | ✅     |
| 3   | Background check tracking        | ✅     |

#### What You Should Be Working On

| #   | Task                  | Status         |
| --- | --------------------- | -------------- |
| 4   | Ready for export flag | 🔄 In Progress |
| 5   | ChMS handoff workflow | [ ]            |

**Future (Bulk Messaging):**

- See `/docs/features/volunteer/vision.md`

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/volunteer
pnpm dev  # Runs on port 3003

# Current focus: Ready for export flag
# Check vision doc for detailed requirements
```

#### Definition of Done

- [x] Leader auto-notification working
- [x] Document auto-send working
- [ ] Ready for export flag + ChMS handoff
- [ ] PR created to main

#### Blockers

None - can work independently.

---

### 🟡 connect-card (Port 3001)

**Status:** Active Work - Card format onboarding
**Branch:** `feature/connect-card`
**Vision Doc:** `/docs/features/connect-cards/vision.md`

#### What You Should Be Working On

| #   | Task                                      | Status |
| --- | ----------------------------------------- | ------ |
| 1   | Card format onboarding (AI field mapping) | [ ]    |
| 2   | Send background check checkbox in Review  | [ ]    |

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/connect-card
pnpm dev  # Runs on port 3001

# Current focus: Card format variance handling
# See /docs/features/connect-cards/card-format-variance.md
```

#### Definition of Done

- [ ] Card format onboarding complete
- [ ] Background check checkbox working
- [ ] PR created to main

#### Blockers

None - can work independently.

#### Note

This worktree has 58 uncommitted files. Run `git status` to review.

---

### 🟢 integrations (Port 3005)

**Status:** Phase 1 Complete - CSV Export Done
**Branch:** `feature/integrations`
**Vision Doc:** `/docs/features/integrations/vision.md`

#### What's Complete (Phase 1)

| #   | Task                               | Status |
| --- | ---------------------------------- | ------ |
| 1   | Export page UI with filters        | ✅     |
| 2   | Planning Center CSV format         | ✅     |
| 3   | Breeze CSV format                  | ✅     |
| 4   | Generic CSV format                 | ✅     |
| 5   | Export tracking (mark as exported) | ✅     |
| 6   | Email deduplication                | ✅     |
| 7   | Export history with re-download    | ✅     |

#### What's Next (Phase 2 - Future)

| #   | Task                  | Status |
| --- | --------------------- | ------ |
| 8   | Planning Center OAuth | [ ]    |
| 9   | Breeze OAuth          | [ ]    |
| 10  | Scheduled exports     | [ ]    |

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/integrations
pnpm dev  # Runs on port 3005
```

#### Definition of Done (Phase 1)

- [x] CSV export working for all 3 formats
- [x] Export tracking in database
- [x] Export history with re-download
- [ ] PR created to main

#### Blockers

None - Phase 1 complete, ready for PR.

---

### 🟢 main (Port 3000)

**Status:** Active - Project management & shared infrastructure
**Branch:** `main`
**Vision Doc:** N/A (this is the trunk)

#### What You Should Be Working On

**Ongoing Responsibilities:**

- Project management and coordination
- Documentation updates
- Dashboard UI/UX improvements
- Cross-cutting infrastructure changes
- Merging PRs from feature worktrees

**Recently Completed:**

- ✅ Dashboard quick actions grid (8 buttons)
- ✅ Location-aware default tab
- ✅ Worktree port configuration
- ✅ Feature specs for bulk messaging & ChMS sync
- ✅ Roadmap updates with worktree assignments

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/main
pnpm dev  # Runs on port 3000

# Check this doc for project coordination
# Review PRs from feature worktrees
# Update docs as features complete
```

#### Current Tasks

- [ ] Review and merge feature PRs as they come in
- [ ] Keep this status document updated
- [ ] Coordinate cross-worktree dependencies

---

## 🔄 Dependency Map

```
┌─────────┐           ┌─────────────┐          ┌─────────────┐
│ prayer  │           │  volunteer  │          │connect-card │
│(server  │           │ (onboarding)│          │ (ChMS sync) │
│actions) │           │             │          │             │
└─────────┘           └─────────────┘          └─────────────┘
    │                        │                        │
    │                        │                        │
    └────────────────────────┼────────────────────────┘
                             │ all merge to
                             ▼
                    ┌─────────────────┐
                    │      main       │
                    │ (coordination)  │
                    └─────────────────┘
                             │
                             │ optional improvements
                             ▼
                    ┌─────────────────┐
                    │   tech-debt     │
                    │  (Phase 2)      │
                    └─────────────────┘
```

**Key Dependencies:**

- `tech-debt` Phase 1 → ✅ COMPLETE (no longer blocking)
- Feature worktrees (`prayer`, `volunteer`, `connect-card`) can work in parallel
- All features merge to `main` when complete

---

## 📊 Overall Project Progress

| Phase   | Description             | Status  | Target   |
| ------- | ----------------------- | ------- | -------- |
| Phase 1 | Production Fixes        | 🟢 100% | Complete |
| Phase 2 | Pilot Church            | 🟡 50%  | Dec 2025 |
| Phase 3 | Member Mgmt + ChMS Sync | ⬜ 0%   | Jan 2026 |
| Phase 4 | Communication           | ⬜ 0%   | Feb 2026 |
| Phase 5 | Scale                   | ⬜ 0%   | Mar 2026 |

**Production Blockers: NONE** - All Phase 1 items complete!

- ✅ Subscription bypass fixed
- ✅ PII removed from logs
- ✅ Pagination added to all queries
- ✅ Database indexes added

---

## 🔧 Quick Commands

### Check All Worktree Status

```bash
for worktree in main connect-card prayer volunteer tech-debt; do
  echo "=== $worktree ==="
  cd /home/digitaldesk/Desktop/church-connect-hub/$worktree
  git status --short
  echo ""
done
```

### Start Any Worktree

```bash
# Replace WORKTREE with: main, connect-card, prayer, volunteer, tech-debt
cd /home/digitaldesk/Desktop/church-connect-hub/WORKTREE
pnpm dev
```

### Sync Worktree with Main

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/WORKTREE
git fetch origin
git merge origin/main
```

---

## 📝 How to Update This Document

**When to update:**

- After completing significant work in any worktree
- After merging a PR to main
- After discovering blockers or dependencies
- At start of each work session (review status)

**What to update:**

1. Status emoji (🔴 🟡 🟢)
2. Current Focus description
3. Task checkboxes
4. Progress percentages
5. "Last Updated" date at top

---

## 📞 Quick Reference

| Need                | Location                                                     |
| ------------------- | ------------------------------------------------------------ |
| Technical patterns  | `/docs/PLAYBOOK.md`                                          |
| Project roadmap     | `/docs/PROJECT.md`                                           |
| Connect card spec   | `/docs/features/connect-cards/vision.md`                     |
| Prayer spec         | `/docs/features/prayer-management/vision.md`                 |
| Volunteer spec      | `/docs/features/volunteer-management/vision.md`              |
| Tech debt spec      | `/docs/features/tech-debt/vision.md`                         |
| Bulk messaging spec | `/docs/features/volunteer-management/bulk-messaging-spec.md` |
| ChMS sync spec      | `/docs/features/integrations/church-software-sync-spec.md`   |

---

**Remember:** Check this document at the start of each session. If your worktree status is unclear, update this doc first.
