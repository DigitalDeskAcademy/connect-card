# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-25
**Next Customer Meeting:** January 2026
**Latest PR:** #89 - Events UI with toolbar, filtering, and card views (Dec 24)

---

## 📣 POST-DEMO PRIORITIES

> **Pilot church demo completed Dec 15, 2025.**
>
> **Key Validated:**
>
> - ✅ Time savings: 10-15 hrs/week per location
> - ✅ Deduplication is THE biggest selling point
> - ✅ Planning Center API integration path confirmed
>
> **New Requests:**
>
> - 🆕 Planning Center API sync (real-time duplicate checking)
> - ✅ Keyword detection (campaign triggers like "impacted", "coffee oasis") - **PR #80 merged**
> - 🆕 Volunteer event tracking (capacity view, quick outreach)
>
> **Deprioritized:**
>
> - ⬇️ Prayer enhancements (Planning Center handles it)
>
> **📄 Full briefing:** `/docs/features/demo-feedback-dec-2025.md`

---

## 🚨 SECURITY: PRE-LAUNCH CHECKLIST

> **Before launching with real users:**
>
> - [ ] **Remove OTP logging** - `lib/auth.ts` line ~105-142
> - [ ] **Verify Resend domain** - Required for emails to any address
> - [ ] **Update `RESEND_FROM_EMAIL`** - Change from `onboarding@resend.dev`

---

## 🚦 Worktree Status

> **Note:** Only `main`, `connect-card`, and `volunteer` worktrees are active on the travel laptop.
> Other worktrees (`integrations`, `tech-debt`, `e2e`, `prayer`) exist on the desktop setup.

| Worktree         | Color     | Branch                         | Status     | Focus                            |
| ---------------- | --------- | ------------------------------ | ---------- | -------------------------------- |
| **main**         | 🔴 Red    | `main`                         | 📋 PM      | Project management (no building) |
| **connect-card** | 🟣 Purple | `feature/connect-card`         | 🔨 Active  | Async processing, deduplication  |
| **volunteer**    | 🟢 Green  | `feature/volunteer-management` | 🔨 Active  | Events Phase 2 (Assignment)      |
| **integrations** | ⬜ Grey   | `feature/integrations`         | 💻 Desktop | Planning Center / ChMS API sync  |
| **tech-debt**    | 🟡 Yellow | `feature/tech-debt`            | 💻 Desktop | Keyword detection (complete)     |
| **e2e**          | 🔵 Cyan   | `feature/e2e`                  | 💻 Desktop | Playwright tests (complete)      |
| **prayer**       | 🔵 Blue   | `feature/prayer-enhancements`  | ⏸️ Paused  | Deprioritized                    |

---

## 📋 Worktree Details

---

### 📋 main - Project Management

**Branch:** `main`
**Role:** Coordination only - NO feature building

**Responsibilities:**

- Drive production readiness
- Coordinate cross-worktree work
- Review and merge PRs
- Keep documentation updated
- Landing page updates

**Current Tasks:**

- [ ] Coordinate January meeting deliverables
- [ ] Track progress across all worktrees
- [ ] Production deployment when ready

---

### ⬜ integrations - ChMS API Sync

**Branch:** `feature/integrations`
**Focus:** Planning Center and other ChMS integrations

**What to Build:**

| Task                                           | Status |
| ---------------------------------------------- | ------ |
| Planning Center OAuth flow                     | [ ]    |
| PC connection settings UI                      | [ ]    |
| People API client (`lib/planning-center/`)     | [ ]    |
| Query PC for duplicates before creating        | [ ]    |
| Push approved contacts to PC                   | [ ]    |
| Add person to intake list (triggers workflows) | [ ]    |
| Store `remote_id` mapping                      | [ ]    |
| Handle OAuth token refresh                     | [ ]    |

**Wishlist:**

- [ ] Breeze API integration
- [ ] CCB API integration
- [ ] Generic webhook push

---

### 🟣 connect-card - MVP Fine-Tuning

**Branch:** `feature/connect-card`
**Focus:** Async processing and deduplication enhancements

**Open PR:**

- 🔄 PR #90 - Async card processing with background queue (awaiting review)
  - Cards process in background while staff continues scanning
  - Real-time progress stats display
  - Queue drawer showing all card statuses
  - Session recovery for interrupted scans

**Recently Completed:**

- ✅ PR #84 - Two-sided card extraction + dev test page (Dec 22)
- ✅ PR #83 - Phone wizard UX enhancements (Dec 22)
  - Progress header showing card count during scanning
  - Any team member can scan (removed admin restriction)
  - Card type syncs from QR modal to phone
  - Simplified QR modal with direct CTA to review queue

**What to Build:**

| Task                                       | Status     |
| ------------------------------------------ | ---------- |
| Async scan processing (background queue)   | [x] PR #90 |
| Two-sided card extraction                  | [x]        |
| Deduplication enhancement (fuzzy matching) | [ ]        |
| Shared email detection (couples)           | [ ]        |
| "Merge with existing" vs "Create new" UI   | [ ]        |
| Upload UX improvements for non-tech staff  | [x]        |
| Better progress feedback during processing | [x]        |

**Wishlist:**

- [ ] Bulk re-process failed cards
- [ ] Card template customization
- [ ] Multi-language support

---

### 🟡 tech-debt - Keyword Detection

**Branch:** `feature/tech-debt`
**Focus:** AI keyword extraction from connect cards

**Recently Completed:**

- ✅ PR #80 - Campaign keyword detection and tracking (Dec 20)
  - AI prompt extracts standalone keywords
  - `detectedKeywords: String[]` added to schema
  - Keywords visible in review UI and exports
  - Filter connect cards by keyword
  - Keywords synced to ChurchMember profiles

**What to Build:**

| Task                                            | Status |
| ----------------------------------------------- | ------ |
| Update AI prompt to extract standalone keywords | [x]    |
| Add `detectedKeywords: String[]` to schema      | [x]    |
| Display keyword chips in review UI              | [x]    |
| Filter connect cards by keyword                 | [x]    |
| Include keywords in export                      | [x]    |

**Wishlist:**

- [ ] Keyword analytics/counts
- [ ] Auto-tag contacts based on keywords
- [ ] Keyword-triggered automation (GHL workflows)

---

### 🔵 e2e - Testing & Production Hardening

**Branch:** `feature/e2e`
**Focus:** Comprehensive Playwright test coverage

**Recently Completed:**

- ✅ PR #82 - Comprehensive E2E test suite with 108 tests (Dec 20)
  - Full test infrastructure with auth setup
  - 19 test files covering all major features
  - Smoke tests for all admin routes
  - Export, contacts, settings page coverage

**What to Build:**

| Task                                       | Status |
| ------------------------------------------ | ------ |
| Auth flow tests (login, OTP, session)      | [x]    |
| Connect card upload → review → export flow | [x]    |
| Volunteer pipeline flow                    | [x]    |
| Prayer request flow                        | [x]    |
| Multi-tenant isolation tests               | [x]    |
| CI/CD integration                          | [ ]    |

**Tech Debt (handle with test updates):**

| Task                           | Notes                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Rename `admin/` → `dashboard/` | Misleading name - any staff can access, not just admins. Update all paths, links, and tests. |

**Test Credentials:**

- `test@playwright.dev` (church owner)
- `admin@newlife.test` (church admin)
- `staff@newlife.test` (staff)

---

### 🟢 volunteer - Event Tracking

**Branch:** `feature/volunteer-management`
**Focus:** Low-friction event coordination with SMS automation
**Spec:** `/docs/features/volunteer/volunteer-events-feature-spec.md`
**Implementation Plan:** `/docs/features/volunteer/events-implementation-plan.md`

**Recently Completed:**

- ✅ PR #89 - Events UI with toolbar, filtering, and card views (Dec 24)
  - Events list page with card-based layout
  - Reusable Toolbar component (search, view toggle, filters)
  - Event creation dialog with multi-session support
  - Event detail page with assignment modal
  - Date period filtering (Upcoming/Past/This Week/This Month)

**Implementation Phases:**

| Phase | Name                    | Description                                                | Status         |
| ----- | ----------------------- | ---------------------------------------------------------- | -------------- |
| 0     | Schema Preparation      | Add VolunteerEvent, EventSession, EventAssignment models   | ✅ Complete    |
| 1     | Core Event CRUD         | Create/edit/delete events, events list page                | ✅ Complete    |
| 2     | Assignment System       | Direct assign + invite pool, volunteer selection modal     | 🔨 In Progress |
| 3     | GHL SMS Automation      | Invite via SMS, parse YES/NO responses, auto-confirm       | [ ] Pending    |
| 4     | Attendance Confirmation | Magic link for leader to confirm attendance                | [ ] Pending    |
| 5     | Reliability Score       | Calculate & display volunteer reliability (attended/total) | [ ] Pending    |
| 6     | Polish & Edge Cases     | Cancel flow, archive old events, filters, empty states     | [ ] Pending    |

**Phase 2 Tasks (Current):**

| Task                            | Status |
| ------------------------------- | ------ |
| EventAssignment model           | [x]    |
| Invite pool query (all filters) | [x]    |
| Invite modal UI                 | [x]    |
| Direct assign action            | [x]    |
| Assignment status display       | [ ]    |
| slotsFilled calculation         | [ ]    |
| Send invite SMS action          | [ ]    |

**Key Design Decisions:**

- Staff dips in, takes action, leaves - system handles everything between
- SMS automation via existing GHL integration
- Optimistic attendance (auto-confirm, staff marks no-shows)
- NOT building: full scheduling, shifts, recurring availability (Planning Center's job)

**Previously Completed:**

- ✅ Volunteer onboarding MVP: Auto-send welcome email, BG check confirmation, review workflow
- ✅ Volunteer CRUD, pipeline, export tracking
- ✅ GHL integration for SMS/email automation

---

### 🔵 prayer - Deprioritized

**Branch:** `feature/prayer-enhancements`
**Status:** ⏸️ Paused - Pilot church uses Planning Center for prayer

**Completed (kept for reference):**

- ✅ All server actions (create, update, assign, delete, privacy)
- ✅ Inbox bulk assignment workflow
- ✅ My Prayers redesign with categories
- ✅ Critical prayer auto-detection
- ✅ N+1 query optimization

**Wishlist (future):**

- [ ] Connect card → auto-create prayer integration

---

## 🔧 Quick Commands

```bash
# Check all worktree status (laptop)
for wt in main connect-card volunteer; do
  echo "=== $wt ===" && cd /home/labadmin/church-connect-hub/$wt && git status -s
done

# Check all worktree status (desktop)
for wt in main connect-card prayer volunteer tech-debt e2e integrations; do
  echo "=== $wt ===" && cd /home/digitaldesk/Desktop/church-connect-hub/$wt && git status -s
done

# Start any worktree
cd /path/to/church-connect-hub/WORKTREE && pnpm dev

# Sync worktree with main
cd /path/to/church-connect-hub/WORKTREE && git fetch origin && git merge origin/main
```

---

## 📞 Quick Reference

| Need                 | Location                                                    |
| -------------------- | ----------------------------------------------------------- |
| **Demo Briefing**    | `/docs/features/demo-feedback-dec-2025.md`                  |
| Technical patterns   | `/docs/PLAYBOOK.md`                                         |
| Project roadmap      | `/docs/PROJECT.md`                                          |
| Testing strategy     | `/docs/technical/testing-strategy.md`                       |
| Connect card spec    | `/docs/features/connect-cards/vision.md`                    |
| Volunteer spec       | `/docs/features/volunteer/vision.md`                        |
| **Volunteer Events** | `/docs/features/volunteer/volunteer-events-feature-spec.md` |
| **Events Impl Plan** | `/docs/features/volunteer/events-implementation-plan.md`    |
| Integrations spec    | `/docs/features/integrations/vision.md`                     |

---

**Remember:** This is the post-demo version. Focus on Planning Center integration and deduplication - these are THE selling points.
