# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-08
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree         | Port | Branch                         | Status          | Current Focus                   |
| ---------------- | ---- | ------------------------------ | --------------- | ------------------------------- |
| **main**         | 3000 | `main`                         | 🟢 Active       | UI/UX improvements, E2E tests   |
| **connect-card** | 3001 | `feature/connect-card`         | 🟢 Ready for PR | Phase 4 + E2E tests complete    |
| **prayer**       | 3002 | `feature/prayer-enhancements`  | 🟢 Phase 1 Done | Phase 2 planned (workflow gaps) |
| **volunteer**    | 3003 | `feature/volunteer-management` | 🟢 Phase 1 Done | PR #47, #52, #53 merged         |
| **tech-debt**    | 3004 | `feature/tech-debt`            | 🟢 Phase 1 Done | Phase 2: Performance            |
| **integrations** | 3005 | `feature/integrations`         | 🟢 Phase 1 Done | PR #48, #58 merged              |

---

## 🚨 PRIORITY ORDER

**Work on these in order. Don't skip ahead.**

```
1. connect-card  → Create PR for Phase 4 (CSV Export complete!)
2. volunteer     → Phase 2: MVP Automation (next priority)
3. tech-debt     → Phase 2: Performance (non-blocking)
4. main          → Project management (ongoing)
```

**Recently Completed (PRs Merged):**

- ✅ connect-card #60 - E2E Phase 3 workflow tests + shared auth pattern (Dec 9)
- ✅ main - UI/UX improvements: component library, navigation cleanup (Dec 8)
- ✅ main #59 - Docs & theme updates, onboarding plan, Starry Night theme (Dec 7)
- ✅ integrations #58 - DataTable consolidation for export (Dec 6)
- ✅ prayer #57 - My Prayer Sheet devotional UI (Dec 6)
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

**Status:** ✅ Phase 1 COMPLETE | 📋 Phase 2 Planned
**Branch:** `feature/prayer-enhancements`
**Vision Doc:** `/docs/features/prayer/vision.md`

#### Phase 1 - Completed Work

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

**PR #57 - My Prayer Sheet:**

| #   | Task                      | Status |
| --- | ------------------------- | ------ |
| 1   | Critical prayer detection | [x]    |
| 2   | Category grouping         | [x]    |
| 3   | Print stylesheet          | [x]    |
| 4   | Session completion        | [x]    |

#### Phase 2 - Prayer Team Workflow (NEXT)

**Problem:** Prayers flow into system but don't reach prayer team automatically.

| #   | Task                                   | Status |
| --- | -------------------------------------- | ------ |
| 1   | Auto-create PrayerRequest from cards   | [ ]    |
| 2   | Dashboard widget for assigned prayers  | [ ]    |
| 3   | Batch creation (auto or manual)        | [ ]    |
| 4   | Full-screen prayer mode (nice to have) | [ ]    |

See `/docs/features/prayer/vision.md` for full Phase 2 spec.

#### Definition of Done (Phase 1)

- [x] All 6 server actions implemented
- [x] UI components for create/edit/detail dialogs
- [x] N+1 query optimization (PR #51)
- [x] Privacy redaction (PR #56)
- [x] My Prayer Sheet (PR #57)
- [x] All PRs merged to main

---

### 🟢 volunteer (Port 3003)

**Status:** Phase 1 Complete - Core automation merged
**Branch:** `feature/volunteer-management`
**Vision Doc:** `/docs/features/volunteer/vision.md`

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

#### What You Should Be Working On (Phase 2 - MVP Automation)

**Design decisions documented:** See `/docs/features/volunteer/vision.md` (Phase 2 section)

**Phase 2.1: Schema & Foundation**

| #   | Task                                                  | Status |
| --- | ----------------------------------------------------- | ------ |
| 1.1 | Add `PENDING_REVIEW` to BackgroundCheckStatus enum    | [ ]    |
| 1.2 | Simplify payment: remove `SUBSIDIZED`, keep 2 options | [ ]    |

**Phase 2.2: Core Automation**

| #   | Task                                            | Status |
| --- | ----------------------------------------------- | ------ |
| 2.1 | Wire `processVolunteer` → send welcome email    | [ ]    |
| 2.2 | Update welcome email with payment info          | [ ]    |
| 2.3 | Set `documentsSentAt` timestamp when email sent | [ ]    |

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

**Status:** Phase 4 Complete - Ready for PR
**Branch:** `feature/connect-card`
**Vision Doc:** `/docs/features/connect-cards/vision.md`

#### Phase 3.5 Complete (PR #50)

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

#### Phase 4 Complete - CSV Export

- Route: `/church/[slug]/admin/export`
- Spec: `/docs/features/integrations/church-software-sync-spec.md`

| #   | Task                               | Status |
| --- | ---------------------------------- | ------ |
| 1   | Export page UI with tabs           | [x]    |
| 2   | Planning Center CSV format export  | [x]    |
| 3   | Breeze CSV format export           | [x]    |
| 4   | Generic CSV format export          | [x]    |
| 5   | Export tracking (mark as exported) | [x]    |
| 6   | Export history log with S3 storage | [x]    |
| 7   | Route added to navigation          | [x]    |

#### Demo Polish (Current Session)

| #   | Task                           | Status |
| --- | ------------------------------ | ------ |
| 1   | Per-location dashboard tabs    | [x]    |
| 2   | Demo seed data (52 weeks)      | [x]    |
| 3   | Volunteer leaders for dropdown | [x]    |
| 4   | DRY refactor (KPICard extract) | [x]    |

#### What You Should Be Working On

**Future - API Integrations (Phase 5+):**

- Planning Center OAuth API sync
- Breeze OAuth API sync
- See spec for details

#### Definition of Done (Phase 4)

- [x] CSV export working for all 3 formats
- [x] Export tracking in database
- [x] Route added to navigation
- [ ] PR created to main

#### Blockers

None - ready for PR.

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

- ✅ Onboarding implementation plan created (Dec 7)
- ✅ Starry Night theme added (Dec 7)
- ✅ CLAUDE.md guidelines with CSS rules (Dec 7)
- ✅ FINISH-LINE.md MVP checklist created (Dec 7)
- ✅ Dashboard quick actions grid (8 buttons)
- ✅ Location-aware default tab
- ✅ Worktree port configuration
- ✅ Feature specs for bulk messaging & ChMS sync
- ✅ Roadmap updates with worktree assignments

#### Next Priority: Onboarding Feature

**Implementation Plan:** `/docs/features/onboarding/implementation-plan.md`

| Phase | Focus                 | Status  |
| ----- | --------------------- | ------- |
| 1     | Database & Foundation | Pending |
| 2     | Setup Page UI         | Pending |
| 3     | Card Mapping UI       | Pending |
| 4     | Tracking & Alerts     | Pending |
| 5     | Polish & Platform     | Pending |

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/main
pnpm dev  # Runs on port 3000

# Check this doc for project coordination
# Review PRs from feature worktrees
# Update docs as features complete
```

#### Current Tasks

- [ ] Implement onboarding feature (Phase 1: Database)
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
- ✅ Prayer management complete (PR #49, #51, #56, #57)
- ✅ ChMS CSV export working (PR #48, #58)
- ✅ Theme switching system (PR #54, #55)
- ✅ Onboarding plan ready for implementation

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

| Need                | Location                                                   |
| ------------------- | ---------------------------------------------------------- |
| Technical patterns  | `/docs/PLAYBOOK.md`                                        |
| Project roadmap     | `/docs/PROJECT.md`                                         |
| Connect card spec   | `/docs/features/connect-cards/vision.md`                   |
| Prayer spec         | `/docs/features/prayer/vision.md`                          |
| Volunteer spec      | `/docs/features/volunteer/vision.md`                       |
| Tech debt spec      | `/docs/features/tech-debt/vision.md`                       |
| **Onboarding plan** | `/docs/features/onboarding/implementation-plan.md`         |
| Bulk messaging spec | `/docs/features/volunteer/bulk-messaging-spec.md`          |
| ChMS sync spec      | `/docs/features/integrations/church-software-sync-spec.md` |
| Integrations spec   | `/docs/features/integrations/vision.md`                    |
| S3 structure        | `/docs/features/tech-debt/s3-bucket-structure.md`          |
| Environment config  | `/docs/features/tech-debt/environment-configuration.md`    |

---

**Remember:** Check this document at the start of each session. If your worktree status is unclear, update this doc first.
