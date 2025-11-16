# Product Roadmap - Church Connect Card

**Current Phase:** Phase 3 (Production Launch Prep)
**Product Focus:** Church visitor engagement platform with AI-powered connect card scanning
**Target Market:** Churches (100-2000 members) seeking to improve visitor follow-up

---

## 🎯 Product Vision

**The Problem:** Churches manually enter connect card data (3-5 minutes per card), leading to errors, lost cards, and poor visitor follow-up (only 30% of first-time visitors receive follow-up).

**Our Solution:** Scan → Extract → Automate

1. Church staff photograph connect cards with phone camera
2. Claude Vision AI extracts structured data from handwriting (60-85% accuracy)
3. SMS/email campaigns automatically follow up with visitors

**Success Metrics:**

- 90% time savings on data entry (5 min/card → 30 sec/card)
- 95% follow-up rate with first-time visitors
- Response within 24 hours to prayer requests

---

## ✅ Completed Phases

### Phase 1: Foundation (Oct 2025) ✅ COMPLETE

Forked SideCar Platform → Rebranded to Church Connect Card → Multi-tenant architecture ready

### Phase 2: Connect Card MVP (Oct 2025) ✅ COMPLETE

AI-powered connect card scanning with Claude Vision API → Upload, extract, review workflow

See `/docs/features/connect-cards/vision.md` for full details.

---

## 🚀 Current Phase: Phase 3 (Production Launch - Nov 2025)

**Goal:** Launch to first pilot church (6 locations) with production-ready system

### Active Work

- **Connect Card Enhancements** ✅ COMPLETE - Review queue, batch management, analytics
  - See `/docs/features/connect-cards/vision.md`
- **Team Management** ✅ COMPLETE - Multi-campus permissions, role management
- **Environment Setup** 🔄 IN PROGRESS - Production database, domain, SSL, monitoring
- **Pilot Church Testing** 🔄 IN PROGRESS - Process 100+ real connect cards

### Success Criteria

- [x] Review queue UI complete
- [ ] Production environment configured
- [ ] 100+ real connect cards processed
- [ ] Mobile & load testing complete

---

## 📋 Next Up: Phase 4 (Member Management - Dec 2025)

**Goal:** Build member directory and N2N (Newcomer to Next-Step) workflow

### Planned Features

- **Member Directory** - Searchable list, profiles, CSV import
- **N2N Workflow** - Auto-track visitor → returning → member status
- **Follow-up Dashboard** - See who needs outreach this week
- **Duplicate Detection** - Merge duplicate member records

**See `/docs/features/member-management/vision.md` for full details.**

**Success Criteria:** 50% first-time visitor → returning visitor conversion

---

## 🔮 Future Phases

### Phase 5: Automated Communication (Feb 2026)

**GHL Integration** - SMS/email campaigns for visitor follow-up
**See `/docs/features/communication/vision.md` (coming soon)**

### Phase 6: Prayer & Volunteer Management (Mar 2026)

- **Prayer Requests** - See `/docs/features/prayer-management/vision.md`
- **Volunteer Onboarding** - See `/docs/features/volunteer-management/vision.md`

### Phase 7: Analytics & Insights (Apr 2026)

**Visitor trends, retention metrics, predictive insights**

### Phase 8: Multi-Location & Scaling (May 2026)

**Support 10+ churches with 50,000+ members total**

---

## 🚫 Out of Scope (Not Planning)

These features are explicitly **NOT** planned for MVP:

- ❌ Event Management (use Planning Center, Eventbrite)
- ❌ Giving/Donations (use Stripe, church giving platforms)
- ❌ Livestream Integration (use YouTube, Vimeo)
- ❌ Website Builder (focus on CRM/engagement only)
- ❌ Accounting/Finances (use QuickBooks, FreshBooks)

---

## 📊 Success Metrics by Phase

| Phase         | Key Metric                                | Target   |
| ------------- | ----------------------------------------- | -------- |
| **Phase 3**   | Pilot church using system                 | 1 church |
| **Phase 4**   | First-time → returning visitor conversion | 50%      |
| **Phase 5**   | Follow-up rate within 24 hours            | 95%      |
| **Phase 6**   | Prayer requests followed up within 1 week | 80%      |
| **12 Months** | Total churches using platform             | 10+      |
| **12 Months** | Connect cards processed                   | 50,000+  |
| **12 Months** | Monthly Recurring Revenue                 | $10K+    |

---

## 🔄 Current Priorities (This Week)

1. ✅ Documentation restructure (lightweight dashboards)
2. 🔄 Production environment setup (Neon, Vercel, domain)
3. 🔄 Deploy to production and test end-to-end workflow
4. 🔄 Prepare pilot church onboarding materials

---

**Last Updated:** 2025-11-16
**See `/docs/STATUS.md` for current working/broken features**
**See `/docs/features/{feature}/vision.md` for detailed feature planning**
