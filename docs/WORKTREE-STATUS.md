# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-14
**Update Frequency:** After each significant work session

---

## 🚦 Project Health at a Glance

| Worktree           | Port | Branch                         | Status              | Current Focus                       |
| ------------------ | ---- | ------------------------------ | ------------------- | ----------------------------------- |
| **main**           | 3000 | `feature/general`              | 🟢 Active           | Project management, docs            |
| **connect-card**   | 3001 | `feature/connect-card`         | 🟡 **UX Priority**  | Upload UX Overhaul (high priority)  |
| **prayer**         | 3002 | `feature/prayer-enhancements`  | 🟢 **COMPLETE**     | PR #49, #51, #56, #57 merged        |
| **volunteer**      | 3003 | `feature/volunteer-management` | 🟢 **Phase 2 Done** | PR #61 MVP Automation merged        |
| **tech-debt**      | 3004 | `feature/ghl-integration`      | 🟢 **Phase 1 Done** | GHL Integration (Phase 1 Complete)  |
| **platform-admin** | 3005 | `feature/platform-admin`       | 🔴 **Planning**     | Modernize platform admin (7 phases) |

---

## 🚨 PRIORITY ORDER

**Work on these in order. Don't skip ahead.**

```
1. connect-card    → 🔥 Upload UX Overhaul (HIGH PRIORITY)
2. tech-debt       → GHL Phase 2: Ministry Management (Phase 1 DONE ✅)
3. platform-admin  → Modernize platform admin (post-demo)
4. main            → Project management (ongoing)
```

> **Note:** GHL Phase 1 COMPLETE! Demo goal achieved: volunteer checkbox → SMS + email sent.
>
> **Next Priority:** Connect card upload UX overhaul for non-technical church staff.

**Recently Completed (PRs Merged):**

- ✅ tech-debt #72 - GHL Integration Phase 1: Service Layer + SMS (Dec 14)
- ✅ main #71 - Dashboard UX improvements + Review Batches action (Dec 14)
- ✅ main #70 - Documentation audit + responsive UI fixes (Dec 13)
- ✅ tech-debt #68 - GitHub-style responsive overflow tabs for NavTabs (Dec 12)
- ✅ connect-card #66 - Review Mode + Volunteer Assignment UX polish (Dec 12)
- ✅ integrations #65 - Enterprise Contacts module + DataTable migrations (Dec 11)
- ✅ main #64 - Dashboard UI polish and badge standardization (Dec 10)
- ✅ tech-debt #62 - S3 storage architecture improvements for multi-tenant safety (Dec 9)
- ✅ volunteer #61 - Phase 2 MVP: Volunteer Onboarding Automation (Dec 9)
- ✅ e2e #60 - Phase 3 workflow tests + shared auth pattern (Dec 9)
- ✅ main #59 - Starry Night theme, header improvements, onboarding plan (Dec 8)
- ✅ integrations #58 - Field selection and unified DataTable system (Dec 7)
- ✅ prayer #57 - My Prayer Sheet for team members (Dec 7)
- ✅ prayer #56 - Redact submittedBy for private prayers (Dec 5)
- ✅ main #55 - Persist theme choice across navigation (Dec 5)
- ✅ main #54 - Theme switching system with multiple variants (Dec 5)
- ✅ volunteer #53 - Check All toggle and volunteer category matching (Dec 4)

---

## 📋 Worktree Details

---

### 🟢 tech-debt (Port 3004) - GHL Integration Phase 1 COMPLETE

**Status:** ✅ Phase 1 Complete - Ready for PR
**Branch:** `feature/ghl-integration`
**Vision Doc:** `/docs/features/ghl-integration/vision.md`

#### GHL Integration Overview

GoHighLevel integration for SMS/email automation. Each church has their own GHL sub-account.

**Demo Goal:** Check "Send onboarding materials" → Volunteer gets welcome SMS + email ✅

#### Phase 1 - Foundation (COMPLETE)

| #   | Task              | Description                      | Status |
| --- | ----------------- | -------------------------------- | ------ |
| 1   | MCP Server Setup  | Connect GHL MCP to Claude Code   | [x]    |
| 2   | Service Layer     | Create `lib/ghl/` abstraction    | [x]    |
| 3   | Credentials Model | Using env vars (Phase 4 for DB)  | [x]    |
| 4   | Contact Sync      | Sync contact on Save & Next      | [x]    |
| 5   | Welcome SMS       | Send SMS when onboarding checked | [x]    |
| 6   | Demo Test         | End-to-end demo flow             | [x]    |

#### Future Phases

**Phase 2 - Volunteer Automation:**

- BG check SMS sequence
- Calendar link SMS
- Status update notifications

**Phase 3 - Bulk Messaging:**

- Filter + compose UI
- Message templates
- Delivery tracking

**Phase 4 - Settings:**

- GHL connection UI for churches
- OAuth flow (optional)

#### Start Here

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/tech-debt
pnpm dev  # Runs on port 3004

# Phase 1 complete - GHL service layer + SMS integration working
# Next: Phase 2 - Ministry management + custom templates
```

#### Recent Work

- ✅ GHL Phase 1 - Service layer, contact sync, welcome SMS (Dec 14)
- ✅ PR #68 - GitHub-style responsive overflow tabs for NavTabs
- ✅ Team page spacing fixes

#### Definition of Done (Phase 1) ✅ COMPLETE

- [x] GHL MCP connected and working
- [x] Service layer created (`lib/ghl/`)
- [x] Contact syncs to GHL on save
- [x] Welcome SMS sends when checkbox checked
- [x] Demo flow works end-to-end
- [x] PR #72 merged to main

#### Blockers

None - Phase 1 complete and merged!

---

### 🔴 platform-admin (Port 3005) - NEW

**Status:** 🔴 Planning - Worktree to be created
**Branch:** `feature/platform-admin`
**Vision Doc:** `/docs/features/platform-admin/vision.md`

#### Overview

Platform admin (`/app/platform/admin/`) has fallen behind church admin. 88% of pages are placeholders/stubs. Needs modernization to match church admin quality.

#### Current State

| Page          | Status         | Notes                    |
| ------------- | -------------- | ------------------------ |
| Dashboard     | 🔴 Placeholder | "Coming soon" text       |
| Contacts      | 🟡 Stub        | NavTabs only, no data    |
| Team          | 🔴 Placeholder | Empty                    |
| Conversations | 🟢 Demo        | Mock data                |
| Courses       | 🟢 Working     | Real DB                  |
| Payments      | 🟡 Demo        | Mock data                |
| API           | 🟢 Working     | Real DB                  |
| Others        | 🔴 Empty       | 8 more placeholder pages |

#### 7-Phase Plan

| Phase | Focus                     | Status |
| ----- | ------------------------- | ------ |
| 1     | Foundation & Security     | [ ]    |
| 2     | Dashboard & Organizations | [ ]    |
| 3     | Contacts & Team           | [ ]    |
| 4     | Conversations & Messaging | [ ]    |
| 5     | Analytics & Reporting     | [ ]    |
| 6     | Settings & Configuration  | [ ]    |
| 7     | Polish & Parity           | [ ]    |

#### Critical Issues

1. **No multi-tenant filtering** - Security risk
2. **Different auth pattern** - Uses `requireAdmin()` not `requireDashboardAccess()`
3. **No data layer** - Missing `/lib/data/platform/*.ts`
4. **Stale UI** - Missing NavTabs overflow, quick actions, badges

#### Start Here

```bash
# Create worktree (not yet created)
cd /home/digitaldesk/Desktop/church-connect-hub/main
git worktree add ../platform-admin -b feature/platform-admin

cd ../platform-admin
cp .env.local.example .env.local
# Update PORT=3005, DATABASE_URL to new Neon branch
pnpm install
pnpm dev
```

#### Definition of Done (Phase 1 - Foundation)

- [ ] Platform auth helper created
- [ ] PlatformRole added to schema
- [ ] Data access layer created
- [ ] All routes protected
- [ ] PR created to main

#### Blockers

- Worktree not yet created
- Depends on demo completion (tech-debt GHL work)

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

**Status:** ✅ **Phase 2 MVP COMPLETE** - PR #61 merged (Dec 9)
**Branch:** `feature/volunteer-management`
**Vision Doc:** `/docs/features/volunteer/vision.md`
**Testing Strategy:** `/docs/technical/testing-strategy.md`

#### Completed Work (PR #61 - Phase 2 MVP)

| #   | Task                                                     | Status |
| --- | -------------------------------------------------------- | ------ |
| 1   | Auto-send welcome email with ministry docs on activation | [x]    |
| 2   | Token-based BG check confirmation page                   | [x]    |
| 3   | Staff "BG Check Review" tab with Approve/Flag workflow   | [x]    |
| 4   | Email service abstraction with audit logging             | [x]    |
| 5   | Vitest testing setup with 37 unit/integration tests      | [x]    |
| 6   | Arcjet rate limiting for public endpoints                | [x]    |
| 7   | PENDING_REVIEW status in BackgroundCheckStatus enum      | [x]    |

**Earlier PRs:**

- ✅ PR #47 - Leader auto-notification + document auto-send
- ✅ PR #52 - Export tracking + `getExportableVolunteers()`
- ✅ PR #53 - Check All toggle + category matching fix

#### What's Next (Future Enhancements)

**Phase 3 - Bulk Messaging:**

- See `/docs/features/volunteer/bulk-messaging-spec.md`
- Route: `/church/[slug]/admin/volunteer/message`
- Filter volunteers by ministry/location/status
- Compose with calendar links & document attachments
- Send via GHL (SMS/Email)

#### Definition of Done (Phase 2 - MVP Automation)

- [x] Welcome email sends automatically when volunteer processed
- [x] Volunteer can self-report BG check completion
- [x] Staff can verify BG completions (one-click via Review tab)
- [x] Vitest test suite (37 tests)
- [x] PR #61 merged to main

#### Blockers

None - Phase 2 MVP complete.

---

### 🟡 connect-card (Port 3001)

**Status:** 🔥 Upload UX Overhaul (HIGH PRIORITY)
**Branch:** `feature/connect-card`
**Vision Doc:** `/docs/features/connect-cards/vision.md`

#### Recently Completed (PR #50, #66)

| #   | Task                                    | Status |
| --- | --------------------------------------- | ------ |
| 1   | Mobile Camera Wizard (live viewfinder)  | [x]    |
| 2   | Background queue processing             | [x]    |
| 3   | Two-sided card support (front/back)     | [x]    |
| 4   | Auto-crop to card bounds                | [x]    |
| 5   | Upload flow polished                    | [x]    |
| 6   | AI extraction reliable                  | [x]    |
| 7   | Review queue complete                   | [x]    |
| 8   | Batch save/complete flow                | [x]    |
| 9   | Fuzzy duplicate detection               | [x]    |
| 10  | S3 org-scoped paths                     | [x]    |
| 11  | Review Mode (see & type simultaneously) | [x]    |
| 12  | Volunteer Assignment UX polish          | [x]    |

#### What You Should Be Working On

**🔥 HIGH PRIORITY - Upload UX Overhaul:**

Non-technical church staff need better guidance through the upload process. Current pain points:

| #   | Issue                              | Solution Needed                              | Status |
| --- | ---------------------------------- | -------------------------------------------- | ------ |
| 1   | Unclear entry point                | Guide: "Are you scanning or uploading?"      | [ ]    |
| 2   | Scanner vs file upload confusion   | Clear pathway selection with visual cues     | [ ]    |
| 3   | "Where are my files?" after upload | Better feedback, link to batches             | [ ]    |
| 4   | Process feels technical            | Friendly language, step-by-step hand-holding | [ ]    |
| 5   | No progress indicator for batch    | Show "X of Y cards processed" status         | [ ]    |

**Goal:** A church volunteer with no tech experience should complete their first upload without asking for help.

---

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
| Phase 2 | Pilot Church            | 🟢 85%  | Dec 2025 |
| Phase 3 | Member Mgmt + ChMS Sync | 🟡 30%  | Jan 2026 |
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
- ✅ Volunteer Phase 2 MVP (PR #61)
- ✅ E2E test suite (PR #60)
- ✅ S3 multi-tenant safety (PR #62)

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

| Need                 | Location                                                |
| -------------------- | ------------------------------------------------------- |
| Technical patterns   | `/docs/PLAYBOOK.md`                                     |
| Project roadmap      | `/docs/PROJECT.md`                                      |
| **Testing strategy** | `/docs/technical/testing-strategy.md`                   |
| **GHL integration**  | `/docs/features/ghl-integration/vision.md`              |
| **Platform admin**   | `/docs/features/platform-admin/vision.md`               |
| Connect card spec    | `/docs/features/connect-cards/vision.md`                |
| Prayer spec          | `/docs/features/prayer/vision.md`                       |
| Volunteer spec       | `/docs/features/volunteer/vision.md`                    |
| Tech debt spec       | `/docs/features/tech-debt/vision.md`                    |
| Bulk messaging spec  | `/docs/features/volunteer/bulk-messaging-spec.md`       |
| Integrations spec    | `/docs/features/integrations/vision.md`                 |
| S3 structure         | `/docs/features/tech-debt/s3-bucket-structure.md`       |
| Environment config   | `/docs/features/tech-debt/environment-configuration.md` |

---

**Remember:** Check this document at the start of each session. If your worktree status is unclear, update this doc first.
