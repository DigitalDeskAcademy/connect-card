# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-06
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree         | Port | Branch                         | Status          | Current Focus                    |
| ---------------- | ---- | ------------------------------ | --------------- | -------------------------------- |
| **main**         | 3000 | `main`                         | 🟢 Active       | Project management, Theme system |
| **connect-card** | 3001 | `feature/connect-card`         | 🟢 Ready        | Phase 3.5 complete (PR #50)      |
| **prayer**       | 3002 | `feature/prayer-enhancements`  | 🟢 **COMPLETE** | PR #49, #51, #56 merged          |
| **volunteer**    | 3003 | `feature/volunteer-management` | 🟢 Phase 1 Done | PR #47, #52, #53 merged          |
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

- ✅ prayer #56 - Redact submittedBy for private prayers (Dec 5)
- ✅ main #55 - Persist theme choice across navigation (Dec 5)
- ✅ main #54 - Theme switching system with multiple variants (Dec 5)
- ✅ volunteer #53 - Check All toggle and volunteer category matching (Dec 4)
- ✅ volunteer #52 - Export tracking and getExportableVolunteers (Dec 4)
- ✅ prayer #51 - Optimize getPrayerRequestStats N+1 query (Dec 4)
- ✅ connect-card #50 - Fuzzy duplicate detection + S3 org-scoped paths (Dec 4)
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

**Status:** ✅ COMPLETE - All PRs merged (Dec 4-5)
**Branch:** `feature/prayer-enhancements`
**Vision Doc:** `/docs/features/prayer/vision.md`

#### Completed Work

**PR #49 - Server Actions & UI:**

| #   | Task                         | Status |
| --- | ---------------------------- | ------ |
| 1   | `createPrayerRequest` action | [x]    |
| 2   | `updatePrayerRequest` action | [x]    |
| 3   | `assignPrayerRequest` action | [x]    |
| 4   | `markAnswered` action        | [x]    |
| 5   | `deletePrayerRequest` action | [x]    |
| 6   | `togglePrivacy` action       | [x]    |
| 7   | Create prayer dialog         | [x]    |
| 8   | Edit prayer dialog           | [x]    |
| 9   | Detail view dialog           | [x]    |

**PR #51 - Performance:**

| #   | Task                   | Status |
| --- | ---------------------- | ------ |
| 1   | N+1 Query optimization | [x]    |

**PR #56 - Privacy:**

| #   | Task                                      | Status |
| --- | ----------------------------------------- | ------ |
| 1   | Redact submittedBy for unauthorized staff | [x]    |

#### Future Enhancements (Wishlist)

- [ ] Dedicated assignment dialog
- [ ] Connect card → auto-create prayer integration

#### Definition of Done

- [x] All 6 server actions implemented
- [x] UI components for create/edit/detail dialogs
- [x] N+1 query optimization (PR #51)
- [x] Privacy redaction (PR #56)
- [x] All PRs merged to main

---

### 🟢 volunteer (Port 3003)

**Status:** Phase 2.2 In Progress - Email automation wired
**Branch:** `feature/volunteer-management`
**Vision Doc:** `/docs/features/volunteer/vision.md`
**Testing Strategy:** `/docs/technical/testing-strategy.md`

#### Completed Work

**PR #47 - Email Automation:**

| #   | Task                             | Status |
| --- | -------------------------------- | ------ |
| 1   | Leader auto-notification         | [x]    |
| 2   | Document auto-send to volunteers | [x]    |

**PR #52 - Export Tracking:**

| #   | Task                                 | Status |
| --- | ------------------------------------ | ------ |
| 1   | `getExportableVolunteers()` function | [x]    |
| 2   | Export tracking fields               | [x]    |

**PR #53 - UI Fixes:**

| #   | Task                            | Status |
| --- | ------------------------------- | ------ |
| 1   | Check All toggle                | [x]    |
| 2   | Volunteer category matching fix | [x]    |

**Session Dec 6 - Phase 2.1 & 2.2 (In Progress):**

| #   | Task                                                      | Status |
| --- | --------------------------------------------------------- | ------ |
| 1   | Add `PENDING_REVIEW` to BackgroundCheckStatus enum        | [x]    |
| 2   | Remove `SUBSIDIZED` from BGCheckPayment enum              | [x]    |
| 3   | Create email service abstraction (`lib/email/service.ts`) | [x]    |
| 4   | Add `EmailLog` model for audit trail                      | [x]    |
| 5   | Wire `processVolunteer` → send welcome email              | [x]    |
| 6   | Set `documentsSentAt` timestamp when email sent           | [x]    |
| 7   | Update all UI components with PENDING_REVIEW option       | [x]    |
| 8   | Create testing strategy documentation                     | [x]    |
| 9   | Set up Vitest for unit/integration tests                  | [ ]    |
| 10  | Write tests for email service                             | [ ]    |

#### What You Should Be Working On (Phase 2 - MVP Automation)

**Design decisions documented:** See `/docs/features/volunteer/vision.md` (Phase 2 section)

**Phase 2.1: Schema & Foundation** ✅ COMPLETE

| #   | Task                                                  | Status |
| --- | ----------------------------------------------------- | ------ |
| 1.1 | Add `PENDING_REVIEW` to BackgroundCheckStatus enum    | [x]    |
| 1.2 | Simplify payment: remove `SUBSIDIZED`, keep 2 options | [x]    |

**Phase 2.2: Core Automation** ✅ COMPLETE

| #   | Task                                            | Status |
| --- | ----------------------------------------------- | ------ |
| 2.1 | Wire `processVolunteer` → send welcome email    | [x]    |
| 2.2 | Create industry-standard email service          | [x]    |
| 2.3 | Set `documentsSentAt` timestamp when email sent | [x]    |

**Phase 2.T: Testing Infrastructure** 🔄 IN PROGRESS

| #   | Task                                         | Status |
| --- | -------------------------------------------- | ------ |
| T.1 | Document testing strategy                    | [x]    |
| T.2 | Install Vitest + dependencies                | [ ]    |
| T.3 | Configure vitest.config.ts                   | [ ]    |
| T.4 | Write unit tests for email service           | [ ]    |
| T.5 | Write integration tests for processVolunteer | [ ]    |
| T.6 | Refactor E2E to critical paths only          | [ ]    |

**Phase 2.3: Volunteer Self-Report**

| #   | Task                                            | Status |
| --- | ----------------------------------------------- | ------ |
| 3.1 | Generate unique token-based confirmation link   | [ ]    |
| 3.2 | Build public endpoint → `PENDING_REVIEW` status | [ ]    |
| 3.3 | Add follow-up email template with confirm link  | [ ]    |

**Phase 2.4: Staff Review Queue**

| #   | Task                                                   | Status |
| --- | ------------------------------------------------------ | ------ |
| 4.1 | Build review queue UI (`PENDING_REVIEW` volunteers)    | [ ]    |
| 4.2 | One-click verification ("Confirm Cleared" / "Not Yet") | [ ]    |
| 4.3 | Bulk verification support                              | [ ]    |

**Phase 2.5: Dashboard Stats**

| #   | Task                                                   | Status |
| --- | ------------------------------------------------------ | ------ |
| 5.1 | Build stats banner (Awaiting BG, Pending Review, etc.) | [ ]    |
| 5.2 | Add stats data query                                   | [ ]    |
| 5.3 | Wire clickable filters                                 | [ ]    |

**Phase 2.6: Leader Notifications**

| #   | Task                                                    | Status |
| --- | ------------------------------------------------------- | ------ |
| 6.1 | Add leader notification prefs (per-category, email/SMS) | [ ]    |
| 6.2 | Trigger notifications when enabled                      | [ ]    |

**Phase 2.7: Export Enhancement**

| #   | Task                                                     | Status |
| --- | -------------------------------------------------------- | ------ |
| 7.1 | Update CSV export with BG status, date, expiry, provider | [ ]    |

**After Phase 2 Complete - Bulk Messaging (Phase 3):**

- See `/docs/features/volunteer/bulk-messaging-spec.md`
- Route: `/church/[slug]/admin/volunteer/message`

#### Definition of Done (Phase 2 - MVP Automation)

- [ ] Welcome email sends automatically when volunteer processed
- [ ] Volunteer can self-report BG check completion
- [ ] Staff can verify BG completions (one-click)
- [ ] Stats banner shows pipeline counts
- [ ] Export includes BG status data
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
| Phase 2 | Pilot Church            | 🟡 60%  | Dec 2025 |
| Phase 3 | Member Mgmt + ChMS Sync | 🟡 25%  | Jan 2026 |
| Phase 4 | Communication           | ⬜ 0%   | Feb 2026 |
| Phase 5 | Scale                   | ⬜ 0%   | Mar 2026 |

**Production Blockers: NONE** - All Phase 1 items complete!

- ✅ Subscription bypass fixed
- ✅ PII removed from logs
- ✅ Pagination added to all queries
- ✅ Database indexes added
- ✅ Prayer management complete
- ✅ ChMS CSV export working (PR #48)
- ✅ Theme switching system (PR #54, #55)

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

| Need                 | Location                                                     |
| -------------------- | ------------------------------------------------------------ |
| Technical patterns   | `/docs/PLAYBOOK.md`                                          |
| Project roadmap      | `/docs/PROJECT.md`                                           |
| **Testing strategy** | `/docs/technical/testing-strategy.md`                        |
| Connect card spec    | `/docs/features/connect-cards/vision.md`                     |
| Prayer spec          | `/docs/features/prayer-management/vision.md`                 |
| Volunteer spec       | `/docs/features/volunteer-management/vision.md`              |
| Tech debt spec       | `/docs/features/tech-debt/vision.md`                         |
| Bulk messaging spec  | `/docs/features/volunteer-management/bulk-messaging-spec.md` |
| ChMS sync spec       | `/docs/features/integrations/church-software-sync-spec.md`   |
| S3 structure         | `/docs/features/tech-debt/s3-bucket-structure.md`            |
| Environment config   | `/docs/features/tech-debt/environment-configuration.md`      |

---

**Remember:** Check this document at the start of each session. If your worktree status is unclear, update this doc first.
