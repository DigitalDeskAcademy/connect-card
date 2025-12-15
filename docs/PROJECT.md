# Church Connect Hub - Project Overview

**Product:** Multi-tenant church visitor engagement platform
**Status:** MVP Complete, Production Prep In Progress
**Target Launch:** January 2026 (after technical fixes)
**Market:** Churches with 100-5000 members
**Last Updated:** 2025-12-12

---

## 🎯 What We're Building

**One sentence:** We help churches turn paper connect cards into engaged members through AI-powered data extraction and automated follow-up.

### The Problem

Churches lose 70% of first-time visitors because:

- Manual data entry takes 5-10 hours/week
- Connect cards get lost or delayed
- Follow-up is inconsistent
- No visibility into visitor → member journey

### Our Solution

1. **Scan** - Phone camera captures connect cards
2. **Extract** - Claude Vision AI reads handwriting (60-85% accuracy)
3. **Review** - Staff corrects any AI mistakes
4. **Engage** - Automated SMS/email follow-up
5. **Track** - Visitor → Returning → Member pipeline

### Why Now

- Churches post-COVID need digital engagement tools
- AI finally good enough for handwriting (Claude Vision)
- Churches willing to pay $200-500/month for efficiency
- Competition still using manual processes

---

## 📊 Current State

### ✅ What's Working

**Connect Cards (COMPLETE)**

- Multi-file upload with drag-and-drop
- Claude Vision extraction with 60-85% accuracy
- Review queue for manual corrections
- Batch processing with analytics

**Prayer Management (COMPLETE)**

- Request tracking with privacy controls
- Bulk assignment to prayer teams
- Auto-categorization (8 categories)
- Sensitive content detection
- **My Prayer Sheet** - Devotional prayer session UI with:
  - Critical prayer auto-detection (cancer, death, emergency)
  - Category-grouped prayers (Health, Family, Salvation, etc.)
  - Print-friendly layout for offline use
  - Session completion tracking

**Volunteer Pipeline (COMPLETE)**

- Interest extraction from connect cards
- Assignment to ministry leaders
- Skills and background check tracking
- Directory with TanStack Table UI
- Export tracking for ChMS sync (PR #52)
- Two-pool model: specific ministry vs general volunteer
- **Phase 2 MVP Automation** (PR #61):
  - Auto-send welcome email with ministry documents on activation
  - Token-based BG check confirmation page (`/volunteer/confirm/[token]`)
  - Staff review queue with Approve/Flag actions
  - Arcjet rate limiting for public endpoints
  - Email service with audit logging (EmailLog table)

**ChMS Export (COMPLETE)** - PR #48, #58

- CSV export with Planning Center, Breeze, Generic formats
- Email deduplication (keeps most recent per email)
- Field selection (include/exclude columns)
- Sync-focused workflow (only exports unsynced records)
- Export history with re-download
- Unified DataTable component system

**Team Management (COMPLETE)**

- Multi-campus permissions
- Role-based access control
- Email invitations

### 🚧 In Progress

**GHL Integration (Demo Priority)** → `tech-debt` worktree

- GoHighLevel MCP connected ✅
- Service layer for SMS/Email automation
- Contact sync on card review
- Volunteer onboarding SMS
- Vision doc: `/docs/features/ghl-integration/vision.md`

**Production Readiness**

- Fixing critical performance issues (see PLAYBOOK.md)
- Setting up production environment
- Load testing for Sunday rush

### ❌ Not Built Yet

**Member Management** (Next Priority)

- Member directory and profiles
- Visitor → Member tracking
- Duplicate detection

**GHL Bulk Messaging** (Phase 3)

- Filter volunteers by ministry/location/status
- Compose with calendar links & attachments
- Send via GHL (SMS/Email)

---

## 🗓️ Roadmap

### Phase 1: Production Fixes ✅ COMPLETE

**All critical blockers fixed:**

- [x] Add pagination (crashes at 200 users) → ✅ Fixed
- [x] Fix subscription enforcement → ✅ Fixed
- [x] Remove PII from logs → ✅ Fixed
- [x] Add database indexes → ✅ Fixed

See PLAYBOOK.md for Phase 2 performance improvements.

### Phase 2: Pilot Church (December 2025)

**Goal:** First church using in production with SMS automation

- [x] Dashboard UI/UX - Quick action cards for staff workflows → `main` ✅
- [x] Theme system with multiple variants (PR #54, #55) → `main` ✅
- [ ] **GHL Integration Phase 1** → `tech-debt` worktree (DEMO PRIORITY)
  - Vision doc: `/docs/features/ghl-integration/vision.md`
  - GHL MCP connected ✅
  - Service layer for contacts + messaging
  - Contact sync on Save & Next
  - Welcome SMS on volunteer onboarding
- [ ] **Onboarding & Card Mapping** → `main` worktree
  - Implementation plan: `/docs/features/onboarding/implementation-plan.md`
  - Hybrid onboarding: Setup checklist + AI-powered card mapping
  - Universal field detection (works without template)
  - Optional template creation for custom fields
  - Accuracy tracking via staff corrections
- [ ] Onboard pilot church (6 locations)
- [ ] Process 100+ real cards
- [ ] Gather feedback
- [ ] Fix discovered issues

### Phase 3: Member Management + Data Sync (January 2026)

**Goal:** Complete visitor → member pipeline + export to ChMS

- [ ] Member directory
- [ ] Profile pages
- [ ] Journey tracking
- [ ] Duplicate detection
- [x] **Church Software Sync (CSV Export)** → `integrations` worktree ✅ PR #48, #58
  - Planning Center format export
  - Breeze format export
  - Generic CSV export
  - Export tracking (mark as exported)
  - Field selection (include/exclude columns)
  - Unified DataTable component system

### Phase 4: Communication (February 2026)

**Goal:** Automated follow-up + bulk outreach

- [ ] GoHighLevel OAuth integration
- [ ] Campaign templates
- [ ] SMS/email automation
- [ ] Response tracking
- [ ] **Bulk Message Volunteers** → `volunteer` worktree
  - Filter volunteers by ministry/location/status
  - Compose with calendar links & document attachments
  - Send via GHL (SMS/Email)
  - Delivery tracking
  - See `/docs/features/volunteer-management/bulk-messaging-spec.md`
- [ ] **Church Software Sync (API)** → `connect-card` worktree
  - Planning Center OAuth integration
  - Breeze OAuth integration
  - Automatic sync on card processing
  - Field mapping UI

### Phase 5: Scale (March 2026)

**Goal:** 10 churches, $10K MRR

- [ ] Performance optimizations
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] Mobile app

---

## 💰 Business Model

### Pricing (Planned)

- **Starter:** $199/month - 1 location, 500 cards/month
- **Growth:** $399/month - 3 locations, 2000 cards/month
- **Scale:** $799/month - Unlimited locations, 10000 cards/month

### Unit Economics

- **CAC:** ~$500 (estimated)
- **LTV:** $4,800 (24-month average)
- **Gross Margin:** 85% (after hosting costs)
- **Payback Period:** 3 months

### Go-to-Market

1. **Pilot:** Current church (6 locations)
2. **Referrals:** Church network effect
3. **Content:** YouTube demos, blog posts
4. **Conferences:** Church leadership events
5. **Partners:** GoHighLevel agencies

---

## 🎯 Success Metrics

### Technical Metrics

- [ ] Page load < 1 second
- [ ] 99.9% uptime
- [ ] Support 500+ concurrent users
- [ ] Process card in < 30 seconds

### Business Metrics

- [ ] 10 churches by June 2026
- [ ] $10K MRR by June 2026
- [ ] 90% customer retention
- [ ] 50% visitor → member conversion

### User Metrics

- [ ] 90% data extraction accuracy
- [ ] < 2 minutes to review card
- [ ] 95% follow-up rate
- [ ] 50% response rate to outreach

---

## 🏃 Quick Links

### For Developers

- [Setup instructions](PLAYBOOK.md#development-setup)
- [Code patterns](PLAYBOOK.md#how-we-build)
- [Technical debt](PLAYBOOK.md#technical-debt-register)

### For Product

- [Feature specs](features/) - Detailed feature documentation
- [Architecture decisions](technical/architecture-decisions.md)
- [Integration guides](technical/integrations.md)

### Resources

- **Production URL:** (not deployed yet)
- **Staging URL:** (not deployed yet)
- **GitHub:** [repo]
- **Monitoring:** (to be configured)

---

## 📝 Recent Updates

### Week of Dec 10, 2025

- ✅ **Enterprise Contacts Module** (PR #65)
  - Full contacts data layer with multi-tenant isolation
  - Unified DataTable component system for all tables
  - Server actions for contact management
  - ChurchMember integration for connect card contacts
- ✅ **Dashboard UI Polish** (PR #64)
  - Badge standardization (primary color project-wide)
  - NavTabs improvements with edge-to-edge borders
  - Review queue back button repositioned
  - Step badges changed to rounded-md style
- ✅ **Theme System Improvements**
  - Primary theme now uses Starry Night Main (rounded corners)
  - Primary Square available for sharp corner preference
  - Theme switcher updated with new naming

### Week of Dec 8, 2025

- ✅ **Volunteer Phase 2 MVP Automation** (PR #61)
  - Auto-send welcome email with ministry documents on volunteer activation
  - Token-based public confirmation page for BG check self-reporting
  - Staff "BG Check Review" tab with Approve/Flag workflow
  - Email service abstraction with environment-aware delivery
  - Vitest testing setup with 37 unit/integration tests
  - Rate limiting via Arcjet for public endpoints
- ✅ E2E Phase 3 workflow tests + shared auth pattern (PR #60)
  - Comprehensive connect card workflow tests
  - Shared authentication setup for test suite
  - Batch processing and review queue coverage
- ✅ UI/UX improvements (merged to main)
  - Dev component library page (`/dev/components`)
  - Button hierarchy documentation
  - Removed sidebar auto-close on connect-cards
  - Cleaned up top-level page back buttons
  - Starry Night Main theme registered

### Week of Dec 7, 2025

- ✅ Onboarding & Card Mapping plan complete (PR #59)
  - Implementation plan: 5 phases, all data models defined
  - Hybrid approach: AI fallback + optional templates
  - Setup checklist with tiered steps
  - Accuracy tracking via staff corrections
- ✅ Starry Night theme added (PR #59)
- ✅ CLAUDE.md coding guidelines created (PR #59)
- ✅ FINISH-LINE.md MVP checklist created (PR #59)
- ✅ DataTable consolidation for export (PR #58)

### Week of Dec 6, 2025

- ✅ My Prayer Sheet - devotional prayer session UI (PR #57)
  - Critical prayer detection (cancer, death, emergency keywords)
  - Category grouping with visual sections
  - Print stylesheet for offline prayer
  - Session completion tracking

### Week of Dec 4, 2025

- ✅ Prayer management 100% complete (PR #49, #51, #56)
- ✅ Theme switching system with persistence (PR #54, #55)
- ✅ Volunteer export tracking + Check All fix (PR #52, #53)
- ✅ Fuzzy duplicate detection for connect cards (PR #50)

### Week of Dec 1, 2025

- ✅ ChMS Export (Phase 1) complete - Planning Center, Breeze, Generic CSV
- ✅ Volunteer email automation - Leader notification + document auto-send
- ✅ Type safety improvements for Prisma Json fields
- ✅ Production blockers (Phase 1) all fixed

### Week of Nov 25, 2025

- ✅ Completed comprehensive security & performance audit
- ✅ Identified 5 critical production blockers
- ✅ Consolidated documentation (10 docs → 2)
- ✅ Dashboard quick actions + collapsible sections

---

## 🤝 Team

- **Development:** In-house team
- **Design:** Using shadcn/ui components
- **Infrastructure:** Vercel + Neon + Tigris
- **AI/ML:** Anthropic Claude Vision API

---

## 📞 Getting Help

### For Technical Issues

Check PLAYBOOK.md first, then:

1. Check existing GitHub issues
2. Ask in team Slack
3. Create new issue with reproduction steps

### For Product Questions

1. Check this document
2. Review feature specs in `/features`
3. Ask product owner

---

**Remember:** This is a living document. When features ship or priorities change, update here via feature-wrap-up command.
