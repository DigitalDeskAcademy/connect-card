# Worktree Project Dashboard

**Purpose:** Central status board for all worktrees. Check here first to know what to work on.
**Last Updated:** 2025-12-17
**Next Customer Meeting:** January 2026

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
> - 🆕 Keyword detection (campaign triggers like "impacted", "coffee oasis")
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
| **tech-debt**    | 🟡 Yellow | `feature/tech-debt`            | 🔨 Active | Keyword detection                |
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

**What to Build:**

| Task                                       | Status |
| ------------------------------------------ | ------ |
| Deduplication enhancement (fuzzy matching) | [ ]    |
| Shared email detection (couples)           | [ ]    |
| "Merge with existing" vs "Create new" UI   | [ ]    |
| Upload UX improvements for non-tech staff  | [ ]    |
| Better progress feedback during processing | [ ]    |

**Wishlist:**

- [ ] Async scan processing - Upload to S3 as cards are captured, process in background (no wait at end)
- [ ] Bulk re-process failed cards
- [ ] Card template customization
- [ ] Multi-language support

---

### 🟡 tech-debt - Keyword Detection

**Branch:** `feature/tech-debt`
**Focus:** AI keyword extraction from connect cards

**What to Build:**

| Task                                            | Status |
| ----------------------------------------------- | ------ |
| Update AI prompt to extract standalone keywords | [ ]    |
| Add `detectedKeywords: String[]` to schema      | [ ]    |
| Display keyword chips in review UI              | [ ]    |
| Filter connect cards by keyword                 | [ ]    |
| Include keywords in export                      | [ ]    |

**Context:** Churches announce trigger words at services (e.g., "write 'impacted' on your card"). These need to be extracted and surfaced.

**Wishlist:**

- [ ] Keyword analytics/counts
- [ ] Auto-tag contacts based on keywords

---

### 🔵 e2e - Testing & Production Hardening

**Branch:** `feature/e2e`
**Focus:** Comprehensive Playwright test coverage

**What to Build:**

| Task                                       | Status |
| ------------------------------------------ | ------ |
| Auth flow tests (login, OTP, session)      | [ ]    |
| Connect card upload → review → export flow | [ ]    |
| Volunteer pipeline flow                    | [ ]    |
| Prayer request flow                        | [ ]    |
| Multi-tenant isolation tests               | [ ]    |
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
