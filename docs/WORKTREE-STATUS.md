# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-24
**Next Customer Meeting:** January 2026
**Latest PR:** #88 - Interactive Onboarding Checklist (Dec 24)

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

| Worktree         | Color     | Branch                         | Status    | Focus                            |
| ---------------- | --------- | ------------------------------ | --------- | -------------------------------- |
| **main**         | 🔴 Red    | `feature/production-deploy`    | 📋 PM     | Project management (no building) |
| **integrations** | ⬜ Grey   | `feature/integrations`         | 🔨 Active | Planning Center / ChMS API sync  |
| **connect-card** | 🟣 Purple | `feature/connect-card`         | 🔨 Active | Fine-tuning MVP                  |
| **tech-debt**    | 🟡 Yellow | `feature/tech-debt`            | ✅ Done   | Member unification Phases 1-4    |
| **e2e**          | 🔵 Cyan   | `feature/e2e`                  | 🔨 Active | Playwright tests                 |
| **volunteer**    | 🟢 Green  | `feature/volunteer-management` | 🔨 Active | Event tracking                   |
| **prayer**       | 🔵 Blue   | `feature/prayer-enhancements`  | ⏸️ Paused | Deprioritized                    |

---

## 📋 Worktree Details

---

### 📋 main - Project Management

**Branch:** `feature/production-deploy`
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
**Focus:** Polish the core connect card experience

**Recently Completed:**

- ✅ PR #84 - Two-sided extraction fix + dev test page (Dec 22)
  - Fixed `useConnectCardUpload` hook to send both front and back images to Claude Vision
  - Added extraction test page at `/dev/extraction-test` (simple two-column layout)
  - DRY refactor: shared extraction utilities in `lib/utils/extraction.ts`
- ✅ PR #83 - Phone wizard UX enhancements (Dec 21)
  - Progress header showing card count during scanning
  - Any team member can scan (removed admin restriction)
  - Card type syncs from QR modal to phone
  - Simplified QR modal with direct CTA to review queue

**What to Build:**

| Task                                       | Status |
| ------------------------------------------ | ------ |
| **Async scan processing** (HIGH PRIORITY)  | [ ]    |
| Deduplication enhancement (fuzzy matching) | [ ]    |
| Shared email detection (couples)           | [ ]    |
| "Merge with existing" vs "Create new" UI   | [ ]    |
| Upload UX improvements for non-tech staff  | [x]    |
| Better progress feedback during processing | [x]    |

**Next Up - Async Scan Processing:**

When staff scan 25-50 cards, they currently wait for the entire batch to upload/process. Goal: Upload to S3 and start Claude extraction as each card is captured, so earlier cards are processed while later ones are being scanned. Staff sees cards appearing in review queue in real-time.

**Wishlist:**

- [ ] Bulk re-process failed cards
- [ ] Card template customization
- [ ] Multi-language support

---

### 🟡 tech-debt - Member Unification ✅ Phases 1-4 Complete

**Branch:** `feature/tech-debt`
**Status:** ✅ PR #87 Merged (Dec 23, 2025)

**Architecture Doc:** `/docs/member-unification-architecture.md`
**Implementation Plan:** `/docs/member-unification-implementation-plan.md`

**Why:**

- Eliminates JOINs on every volunteer query
- Simplifies messaging, event invites, and exports
- Matches Planning Center's architecture
- Single profile view instead of assembling from multiple sources

**Phases:**

| Phase | Focus                           | Status |
| ----- | ------------------------------- | ------ |
| 1     | Schema additions (non-breaking) | [x]    |
| 2     | Data migration script           | [x]    |
| 3     | Update data layer               | [x]    |
| 4     | Server action dual-write        | [x]    |
| 5     | Remove legacy writes            | [ ]    |
| 6     | Drop Volunteer model            | [ ]    |

**Completed in PR #87:**

- ✅ Added unified volunteer fields to ChurchMember schema
- ✅ Created `lib/volunteer-dual-write.ts` helper module
- ✅ All server actions now write to both Volunteer AND ChurchMember
- ✅ Data migration script ready: `scripts/migrate-volunteer-to-churchmember.ts`
- ✅ Updated data layer types to use ChurchMember

**Next Steps (when ready to sunset legacy):**

1. Run migration script in production
2. Phase 5: Remove legacy Volunteer writes
3. Phase 6: Drop Volunteer model from schema

**Previously Completed:**

- ✅ PR #80 - Keyword detection (Dec 20)

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

**Test Credentials:**

- `test@playwright.dev` (church owner)
- `admin@newlife.test` (church admin)
- `staff@newlife.test` (staff)

---

### 🟢 volunteer - Event Tracking

**Branch:** `feature/volunteer-management`
**Focus:** Simple event capacity management

**What to Build:**

| Task                                       | Status |
| ------------------------------------------ | ------ |
| Event data model (name, date, capacity)    | [ ]    |
| Simple capacity view (X needed / Y filled) | [ ]    |
| Quick outreach button (GHL SMS)            | [ ]    |
| Event list page                            | [ ]    |

**Wishlist:**

- [ ] Volunteer self-signup
- [ ] Recurring events
- [ ] Shift management
- [ ] Bulk messaging to event volunteers

**Previously Completed (for reference):**

- ✅ Phase 2 MVP: Auto-send welcome email, BG check confirmation, review workflow

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
# Check all worktree status
for wt in main connect-card prayer volunteer tech-debt e2e integrations; do
  echo "=== $wt ===" && cd /home/digitaldesk/Desktop/church-connect-hub/$wt && git status -s
done

# Start any worktree
cd /home/digitaldesk/Desktop/church-connect-hub/WORKTREE && pnpm dev

# Sync worktree with main
cd /home/digitaldesk/Desktop/church-connect-hub/WORKTREE && git fetch origin && git merge origin/main
```

---

## 📞 Quick Reference

| Need               | Location                                   |
| ------------------ | ------------------------------------------ |
| **Demo Briefing**  | `/docs/features/demo-feedback-dec-2025.md` |
| Technical patterns | `/docs/PLAYBOOK.md`                        |
| Project roadmap    | `/docs/PROJECT.md`                         |
| Testing strategy   | `/docs/technical/testing-strategy.md`      |
| Connect card spec  | `/docs/features/connect-cards/vision.md`   |
| Volunteer spec     | `/docs/features/volunteer/vision.md`       |
| Integrations spec  | `/docs/features/integrations/vision.md`    |

---

**Remember:** This is the post-demo version. Focus on Planning Center integration and deduplication - these are THE selling points.
