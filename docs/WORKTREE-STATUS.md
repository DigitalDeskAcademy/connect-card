# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-06
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree         | Port | Branch                         | Commits Ahead | Status                | Current Focus                                  |
| ---------------- | ---- | ------------------------------ | ------------- | --------------------- | ---------------------------------------------- |
| **main**         | 3000 | `main`                         | -             | 🟢 Active             | Project management                             |
| **connect-card** | 3001 | `feature/connect-card`         | 28            | 🟡 **NEEDS PR**       | Phase 4 ready, create PR!                      |
| **prayer**       | 3002 | `feature/prayer-enhancements`  | 1             | 🟢 Complete + new WIP | PR merged, new prayer session work uncommitted |
| **volunteer**    | 3003 | `feature/volunteer-management` | 48            | 🟡 **Phase 2 WIP**    | Significant uncommitted work                   |
| **tech-debt**    | 3004 | `feature/tech-debt`            | 0             | ✅ **MERGED**         | Phase 1 complete in main                       |
| **integrations** | 3005 | `feature/integrations`         | 15            | 🟡 **WIP**            | Export enhancements uncommitted                |

---

## 🚨 IMMEDIATE ACTION REQUIRED

**These tasks will get us to production-ready:**

```
1. connect-card  → CREATE PR NOW (28 commits ready, Phase 4 complete!)
2. volunteer     → Commit & PR Phase 2 work (6 modified files)
3. integrations  → Commit & PR export changes (multiple files)
4. prayer        → Decide: commit new work or discard
```

**Recently Completed (PRs Merged to Main):**

- ✅ PR #56 - prayer: Redact submittedBy for private prayers (Dec 5)
- ✅ PR #55 - main: Persist theme choice across navigation (Dec 5)
- ✅ PR #54 - main: Theme switching system with multiple variants (Dec 5)
- ✅ PR #53 - volunteer: Check All toggle and volunteer category matching (Dec 4)
- ✅ PR #52 - volunteer: Export tracking and getExportableVolunteers (Dec 4)
- ✅ PR #51 - prayer: Optimize getPrayerRequestStats N+1 query (Dec 4)
- ✅ PR #50 - connect-card: Fuzzy duplicate detection + S3 org-scoped paths (Dec 4)
- ✅ PR #49 - prayer: Complete prayer request management system (Dec 4)
- ✅ PR #48 - integrations: ChMS export with email deduplication (Dec 1)
- ✅ PR #47 - volunteer: Email automation for leader notification (Dec 1)

---

## 📋 Worktree Details

---

### ✅ tech-debt (Port 3004)

**Status:** ✅ **PHASE 1 COMPLETE & MERGED** - Branch is clean (0 commits ahead)
**Branch:** `feature/tech-debt`
**Vision Doc:** `/docs/features/tech-debt/vision.md`

#### Phase 1 - Production Blockers (MERGED TO MAIN)

| #   | Task                          | PR  | Status    |
| --- | ----------------------------- | --- | --------- |
| 1   | Fix subscription bypass       | #38 | ✅ Merged |
| 2   | Remove PII from logs          | #38 | ✅ Merged |
| 3   | Add database indexes          | #42 | ✅ Merged |
| 4   | Add pagination to all queries | #42 | ✅ Merged |
| 5   | Type safety for Json fields   | #46 | ✅ Merged |
| 6   | Theme switching system        | #54 | ✅ Merged |
| 7   | Theme persistence             | #55 | ✅ Merged |

**All Phase 1 production blockers are fixed and merged to main.**

#### Phase 2 - Infrastructure & Performance (Deferred)

These are nice-to-haves, not blocking production:

| #   | Task                     | Description                          | Status   |
| --- | ------------------------ | ------------------------------------ | -------- |
| 5   | S3 bucket structure init | Admin UI to create org folders       | Deferred |
| 6   | Migrate legacy S3 paths  | Move `uploads/general/` to org paths | Deferred |
| 7   | Add caching              | Redis/Upstash for hot data           | Deferred |
| 8   | Data abstraction         | Repository pattern (defer)           | Deferred |

**Documentation Created:**

- `/docs/features/tech-debt/s3-bucket-structure.md` - S3 organization spec
- `/docs/features/tech-debt/environment-configuration.md` - Env vars for forked projects

#### Blockers

None - This worktree is complete for MVP. Can be used for future infrastructure work.

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

### 🟡 connect-card (Port 3001)

**Status:** 🟡 **28 COMMITS READY - CREATE PR NOW**
**Branch:** `feature/connect-card`
**Vision Doc:** `/docs/features/connect-cards/vision.md`
**Uncommitted:** 1 staged test file

#### Completed Work (Ready for PR)

**Phase 3.5 - Mobile Camera Wizard (PR #50 merged):**

- Mobile Camera Wizard (live viewfinder)
- Background queue processing
- Two-sided card support (front/back)
- Auto-crop to card bounds
- Fuzzy duplicate detection
- S3 org-scoped paths

**Phase 4 - CSV Export (28 commits awaiting PR):**

| #   | Task                               | Status  |
| --- | ---------------------------------- | ------- |
| 1   | Export page UI with tabs           | ✅ Done |
| 2   | Planning Center CSV format export  | ✅ Done |
| 3   | Breeze CSV format export           | ✅ Done |
| 4   | Generic CSV format export          | ✅ Done |
| 5   | Export tracking (mark as exported) | ✅ Done |
| 6   | Export history log with S3 storage | ✅ Done |
| 7   | Route added to navigation          | ✅ Done |
| 8   | Per-location dashboard tabs        | ✅ Done |
| 9   | Demo seed data (52 weeks)          | ✅ Done |
| 10  | DRY refactor (KPICard extract)     | ✅ Done |

#### 🚨 ACTION REQUIRED

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/connect-card
git add .  # Stage the test file
git commit -m "test: add Phase 1 basic connect card E2E tests"
gh pr create --title "feat(connect-card): Phase 4 CSV Export + Demo Polish" --body "..."
```

#### Future - API Integrations (Phase 5+)

- Planning Center OAuth API sync
- Breeze OAuth API sync

#### Blockers

None - ready for PR TODAY.

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
| Phase 1 | Production Fixes        | ✅ 100% | Complete |
| Phase 2 | Pilot Church            | 🟡 85%  | Dec 2025 |
| Phase 3 | Member Mgmt + ChMS Sync | 🟡 40%  | Jan 2026 |
| Phase 4 | Communication           | ⬜ 0%   | Feb 2026 |
| Phase 5 | Scale                   | ⬜ 0%   | Mar 2026 |

**Production Blockers: NONE** - Ready for pilot church!

### ✅ Merged to Main (Production Ready)

- ✅ Subscription bypass fixed (PR #38)
- ✅ PII removed from logs (PR #38)
- ✅ Pagination added to all queries (PR #42)
- ✅ Database indexes added (PR #42)
- ✅ Type safety for Json fields (PR #46)
- ✅ Prayer management complete (PR #49, #51, #56)
- ✅ ChMS CSV export working (PR #48)
- ✅ Theme switching system (PR #54, #55)
- ✅ Volunteer email automation (PR #47, #52, #53)
- ✅ Connect card fuzzy duplicate detection (PR #50)

### 🟡 Awaiting PR (Done but Not Merged)

- 🟡 connect-card: 28 commits (Phase 4 CSV Export)
- 🟡 integrations: 15 commits (Export enhancements)
- 🟡 volunteer: 48 commits (Phase 2 automation work)

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
