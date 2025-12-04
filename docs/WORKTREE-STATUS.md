# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-03
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree         | Port | Branch                         | Status          | Current Focus                    |
| ---------------- | ---- | ------------------------------ | --------------- | -------------------------------- |
| **main**         | 3000 | `main`                         | 🟢 Active       | Project management, Dashboard UI |
| **connect-card** | 3001 | `feature/connect-card`         | 🟢 Ready        | Phase 3.5 complete (PR #50)      |
| **prayer**       | 3002 | `feature/prayer-enhancements`  | 🟢 **COMPLETE** | PR #49 merged Dec 4              |
| **volunteer**    | 3003 | `feature/volunteer-management` | 🟢 Phase 1 Done | PR #47 merged Dec 1              |
| **tech-debt**    | 3004 | `feature/tech-debt`            | 🟢 Phase 1 Done | Phase 2: Performance             |
| **integrations** | 3005 | `feature/integrations`         | 🟢 Phase 1 Done | PR #48 merged Dec 1              |

---

## 🚨 PRIORITY ORDER

**Work on these in order. Don't skip ahead.**

```
1. connect-card  → Phase 4: CSV Export (next)
2. tech-debt     → Phase 2: Performance (non-blocking)
3. main          → Project management (ongoing)
```

**Recently Completed (PRs Merged):**

- ✅ connect-card #50 - Fuzzy duplicate detection + S3 org-scoped paths (Dec 3)
- ✅ prayer #49 - Complete prayer request management system (Dec 4)
- ✅ integrations #48 - ChMS export with email deduplication (Dec 1)
- ✅ volunteer #47 - Email automation for leader notification (Dec 1)

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

**Phase 2 - Infrastructure & Performance:**

| #   | Task                     | Description                          | Status |
| --- | ------------------------ | ------------------------------------ | ------ |
| 5   | S3 bucket structure init | Admin UI to create org folders       | [ ]    |
| 6   | Migrate legacy S3 paths  | Move `uploads/general/` to org paths | [ ]    |
| 7   | Add caching              | Redis/Upstash for hot data           | [ ]    |
| 8   | Data abstraction         | Repository pattern (defer)           | [ ]    |

**New Documentation:**

- `/docs/features/tech-debt/s3-bucket-structure.md` - S3 organization spec
- `/docs/features/tech-debt/environment-configuration.md` - Env vars for forked projects

#### Definition of Done (Phase 1)

- [x] All 4 Phase 1 items complete
- [ ] PR created to main
- [ ] PLAYBOOK.md updated with completion status

#### Blockers

None - Phase 1 complete, no longer blocking production.

---

### 🟢 prayer (Port 3002)

**Status:** COMPLETE - PR #49 merged Dec 4
**Branch:** `feature/prayer-enhancements`
**Vision Doc:** `/docs/features/prayer-management/vision.md`

#### Completed Work (PR #49)

**Phase 1 - Server Actions:**

| #   | Task                         | Status |
| --- | ---------------------------- | ------ |
| 1   | `createPrayerRequest` action | [x]    |
| 2   | `updatePrayerRequest` action | [x]    |
| 3   | `assignPrayerRequest` action | [x]    |
| 4   | `markAnswered` action        | [x]    |
| 5   | `deletePrayerRequest` action | [x]    |
| 6   | `togglePrivacy` action       | [x]    |

**UI Components:**

| #   | Task                 | Status |
| --- | -------------------- | ------ |
| 1   | Create prayer dialog | [x]    |
| 2   | Edit prayer dialog   | [x]    |
| 3   | Detail view dialog   | [x]    |

#### Future Enhancements (Wishlist)

- [ ] N+1 Query optimization (10 COUNT queries)
- [ ] Dedicated assignment dialog

#### Definition of Done

- [x] All 6 server actions implemented
- [x] UI components for create/edit/detail dialogs
- [x] PR #49 merged to main

---

### 🟡 volunteer (Port 3003)

**Status:** In Progress - Onboarding pipeline
**Branch:** `feature/volunteer-management`
**Vision Doc:** `/docs/features/volunteer-management/vision.md`

#### What You Should Be Working On

**Current Phase - Onboarding Pipeline:**

| #   | Task                                         | Status         |
| --- | -------------------------------------------- | -------------- |
| 1   | Onboarding status tracking (Inquiry → Ready) | 🔄 In Progress |
| 2   | Visual pipeline dashboard                    | [ ]            |
| 3   | Status update actions                        | [ ]            |
| 4   | N+1 query optimization                       | [ ]            |

**After Onboarding Complete - Bulk Messaging (Phase 4):**

- See `/docs/features/volunteer-management/bulk-messaging-spec.md`
- Route: `/church/[slug]/admin/volunteer/message`

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/volunteer
pnpm dev  # Runs on port 3003

# Current focus: Complete onboarding pipeline
# Check vision doc for detailed requirements
```

#### Definition of Done (Onboarding)

- [ ] Pipeline stages visible in UI
- [ ] Status transitions working
- [ ] N+1 queries fixed
- [ ] PR created to main

#### Blockers

None - can work independently.

---

### 🟢 connect-card (Port 3001)

**Status:** Phase 3.5 Complete - Ready for Phase 4
**Branch:** `feature/connect-card`
**Vision Doc:** `/docs/features/connect-cards/vision.md`

#### Recently Completed (PR #50)

| #   | Task                                   | Status |
| --- | -------------------------------------- | ------ |
| 1   | Mobile Camera Wizard (live viewfinder) | [x]    |
| 2   | Background queue processing            | [x]    |
| 3   | Two-sided card support (front/back)    | [x]    |
| 4   | Auto-crop to card bounds               | [x]    |
| 5   | Upload flow polished                   | [x]    |
| 6   | AI extraction reliable                 | [x]    |
| 7   | Review queue complete                  | [x]    |
| 8   | Batch save/complete flow               | [x]    |
| 9   | Fuzzy duplicate detection              | [x]    |
| 10  | S3 org-scoped paths                    | [x]    |

#### What You Should Be Working On

**Next Feature - CSV Export (Phase 4):**

- See `/docs/features/integrations/church-software-sync-spec.md`
- Route: `/church/[slug]/admin/integrations`

| #   | Task                               | Status |
| --- | ---------------------------------- | ------ |
| 1   | Create integrations page UI        | [ ]    |
| 2   | Planning Center CSV format export  | [ ]    |
| 3   | Breeze CSV format export           | [ ]    |
| 4   | Generic CSV format export          | [ ]    |
| 5   | Export tracking (mark as exported) | [ ]    |
| 6   | Export history log                 | [ ]    |

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/connect-card
pnpm dev  # Runs on port 3001

# First task: Create integrations page
# Create: /app/church/[slug]/admin/integrations/page.tsx
# Follow the UI wireframes in the spec doc
```

#### Definition of Done

- [ ] CSV export working for all 3 formats
- [ ] Export tracking in database
- [ ] Route added to navigation
- [ ] PR created to main

#### Blockers

None - can work independently.

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
| S3 structure        | `/docs/features/tech-debt/s3-bucket-structure.md`            |
| Environment config  | `/docs/features/tech-debt/environment-configuration.md`      |

---

**Remember:** Check this document at the start of each session. If your worktree status is unclear, update this doc first.
