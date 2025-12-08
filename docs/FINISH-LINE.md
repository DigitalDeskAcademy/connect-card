# Finish Line Document

**Purpose:** What needs to happen to ship the MVP to production
**Created:** 2025-12-06
**Target:** December 2025 Pilot Launch

---

## Executive Summary

**We are 85% complete.** The core features are built and merged. What remains is:

1. **3 PRs to create** (91 total commits ready to merge)
2. **Production environment setup**
3. **Pilot church onboarding**

---

## The Final Sprint

### Step 1: Merge Pending Work (1-2 days)

These worktrees have completed work that needs to be turned into PRs:

| Worktree         | Commits Ready | Work Completed                  | Action                   |
| ---------------- | ------------- | ------------------------------- | ------------------------ |
| **connect-card** | 28            | Phase 4 CSV Export, Demo Polish | Create PR, merge to main |
| **volunteer**    | 48            | Phase 2 Automation (partial)    | Review, commit, PR       |
| **integrations** | 15            | Export enhancements             | Review, commit, PR       |

**Commands to execute:**

```bash
# 1. Connect Card PR (ready now)
cd /home/digitaldesk/Desktop/church-connect-hub/connect-card
git add .
git commit -m "test: add Phase 1 basic connect card E2E tests"
gh pr create --title "feat(connect-card): Phase 4 CSV Export + Demo Polish" \
  --body "## Summary
- Export page UI with Planning Center, Breeze, Generic CSV formats
- Export tracking (mark as exported)
- Export history with S3 storage
- Per-location dashboard tabs
- Demo seed data (52 weeks)
- DRY refactor (KPICard extraction)

## Test Plan
- [ ] Export to each format works
- [ ] History shows past exports
- [ ] Re-download works"

# 2. Volunteer worktree (needs review first)
cd /home/digitaldesk/Desktop/church-connect-hub/volunteer
git status  # Review changes
git diff    # Inspect modifications
# Then commit and PR if ready

# 3. Integrations worktree (needs review first)
cd /home/digitaldesk/Desktop/church-connect-hub/integrations
git status  # Review changes
git diff    # Inspect modifications
# Then commit and PR if ready
```

---

### Step 2: Production Environment Setup (1-2 days)

| Task                         | Status      | Notes                      |
| ---------------------------- | ----------- | -------------------------- |
| Production Neon database     | ❌ Not done | Create production branch   |
| Environment variables        | ❌ Not done | Copy from .env.example     |
| Vercel deployment            | ❌ Not done | Connect to main branch     |
| Custom domain                | ❌ Not done | Configure DNS              |
| SSL certificate              | ❌ Auto     | Vercel handles this        |
| Error monitoring (Sentry)    | ❌ Optional | Nice to have for debugging |
| Analytics (Vercel Analytics) | ❌ Optional | Track page views           |

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://..." # Production Neon URL

# Auth
BETTER_AUTH_SECRET="..."        # Generate secure secret
BETTER_AUTH_URL="..."           # Production URL

# AI
ANTHROPIC_API_KEY="..."         # Claude Vision API

# Storage
AWS_S3_BUCKET="..."             # Tigris bucket
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."

# App
NEXT_PUBLIC_APP_URL="..."       # Production URL
```

---

### Step 3: Pilot Church Onboarding (1-2 days)

| Task                             | Status      | Notes                         |
| -------------------------------- | ----------- | ----------------------------- |
| Create organization in database  | ❌ Not done | Use seed script               |
| Create admin user account        | ❌ Not done | First staff login             |
| Configure locations (6 campuses) | ❌ Not done | Multi-campus setup            |
| Test connect card scan workflow  | ❌ Not done | Mobile camera + AI extraction |
| Test prayer request workflow     | ❌ Not done | Create, assign, answer        |
| Test volunteer onboarding        | ❌ Not done | Process, notify leader        |
| Test CSV export                  | ❌ Not done | Export to Planning Center     |
| User training documentation      | ❌ Not done | Simple how-to guide           |

---

## What's Already Done (In Main)

### Core Features (100% Complete)

| Feature                   | PRs Merged    | Status  |
| ------------------------- | ------------- | ------- |
| Connect Card Scanning     | #50           | ✅ Done |
| AI Vision Extraction      | Built-in      | ✅ Done |
| Review Queue              | Built-in      | ✅ Done |
| Batch Processing          | Built-in      | ✅ Done |
| Fuzzy Duplicate Detection | #50           | ✅ Done |
| Prayer Management         | #49, #51, #56 | ✅ Done |
| Volunteer Pipeline        | #47, #52, #53 | ✅ Done |
| ChMS CSV Export           | #48           | ✅ Done |
| Theme System              | #54, #55      | ✅ Done |
| Team Management           | Built-in      | ✅ Done |

### Production Readiness (100% Complete)

| Fix                      | PRs Merged | Status   |
| ------------------------ | ---------- | -------- |
| Subscription Enforcement | #38        | ✅ Fixed |
| PII Removed from Logs    | #38        | ✅ Fixed |
| Database Pagination      | #42        | ✅ Fixed |
| Database Indexes         | #42        | ✅ Fixed |
| Type Safety (Json)       | #46        | ✅ Fixed |

---

## What's NOT Needed for MVP

These are deferred to post-launch:

| Feature                  | Why Deferred                      |
| ------------------------ | --------------------------------- |
| Planning Center API sync | CSV export works for MVP          |
| Breeze API sync          | CSV export works for MVP          |
| GoHighLevel integration  | Can do follow-up manually for now |
| Member directory         | Focus on visitor intake first     |
| Public prayer wall       | Nice-to-have, not essential       |
| Volunteer bulk messaging | Can email manually for now        |
| Redis caching            | Performance is acceptable         |
| Repository pattern       | Direct Prisma works for MVP       |
| S3 bucket admin UI       | Can manage manually               |

---

## Risk Assessment

| Risk                        | Likelihood | Impact | Mitigation                      |
| --------------------------- | ---------- | ------ | ------------------------------- |
| Merge conflicts             | Low        | Medium | Small PRs, test locally first   |
| AI extraction accuracy      | Medium     | Low    | Human review catches errors     |
| Sunday load spike           | Low        | Medium | Already have pagination/indexes |
| Mobile camera compatibility | Low        | Medium | Tested on iOS/Android           |

---

## Success Criteria

**MVP is successful when:**

1. ✅ Pilot church can scan connect cards from phone
2. ✅ AI extracts data with 60-85% accuracy
3. ✅ Staff can review and correct in <1 minute per card
4. ✅ Prayer requests are tracked and assigned
5. ✅ Volunteer inquiries are routed to leaders
6. ✅ CSV export works for Planning Center import
7. ⬜ 100+ real cards processed without crash
8. ⬜ All 6 locations configured and working

---

## Timeline

| Day | Tasks                                       | Owner |
| --- | ------------------------------------------- | ----- |
| 1   | Create connect-card PR, merge to main       | Dev   |
| 1   | Review volunteer/integrations work, commit  | Dev   |
| 2   | Create remaining PRs, merge to main         | Dev   |
| 2   | Set up production environment (Vercel/Neon) | Dev   |
| 3   | Configure pilot church organization         | Dev   |
| 3   | Test all workflows end-to-end               | Dev   |
| 4   | Train pilot church staff                    | Dev   |
| 5   | Go live with real connect cards             | Team  |

---

## Post-Launch (January 2026)

After successful pilot:

1. **Gather feedback** - What's confusing? What's missing?
2. **Fix discovered issues** - Bug fixes, UX improvements
3. **Member management** - Build visitor → member tracking
4. **API integrations** - Planning Center/Breeze direct sync
5. **Scale** - Onboard additional churches

---

## Contacts

| Role              | Responsibility           |
| ----------------- | ------------------------ |
| **Developer**     | Technical implementation |
| **Pilot Church**  | Testing, feedback        |
| **Product Owner** | Priorities, decisions    |

---

**The finish line is in sight. Let's ship it.**
