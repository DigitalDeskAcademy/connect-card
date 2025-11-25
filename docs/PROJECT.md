# Church Connect Hub - Project Overview

**Product:** Multi-tenant church visitor engagement platform
**Status:** MVP Complete, Production Prep In Progress
**Target Launch:** January 2026 (after technical fixes)
**Market:** Churches with 100-5000 members
**Last Updated:** 2025-11-25

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

**Volunteer Pipeline (COMPLETE)**

- Interest extraction from connect cards
- Assignment to ministry leaders
- Skills and background check tracking
- Directory with TanStack Table UI

**Team Management (COMPLETE)**

- Multi-campus permissions
- Role-based access control
- Email invitations

### 🚧 In Progress

**Production Readiness**

- Fixing critical performance issues (see ENGINEERING-PLAYBOOK.md)
- Setting up production environment
- Load testing for Sunday rush

### ❌ Not Built Yet

**Member Management** (Next Priority)

- Member directory and profiles
- Visitor → Member tracking
- Duplicate detection

**Automated Communication** (Q1 2026)

- GoHighLevel integration
- SMS/email campaigns
- Follow-up automation

---

## 🗓️ Roadmap

### Phase 1: Production Fixes (NOW - 1 week)

**BLOCKED - Critical technical issues**

- [ ] Add pagination (crashes at 200 users)
- [ ] Fix subscription enforcement
- [ ] Remove PII from logs
- [ ] Add database indexes
      See ENGINEERING-PLAYBOOK.md for details.

### Phase 2: Pilot Church (December 2025)

**Goal:** First church using in production

- [ ] Onboard pilot church (6 locations)
- [ ] Process 100+ real cards
- [ ] Gather feedback
- [ ] Fix discovered issues

### Phase 3: Member Management (January 2026)

**Goal:** Complete visitor → member pipeline

- [ ] Member directory
- [ ] Profile pages
- [ ] Journey tracking
- [ ] Duplicate detection

### Phase 4: Communication (February 2026)

**Goal:** Automated follow-up

- [ ] GoHighLevel OAuth integration
- [ ] Campaign templates
- [ ] SMS/email automation
- [ ] Response tracking

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

- [Setup instructions](ENGINEERING-PLAYBOOK.md#development-setup)
- [Code patterns](ENGINEERING-PLAYBOOK.md#how-we-build)
- [Technical debt](ENGINEERING-PLAYBOOK.md#technical-debt-register)

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

### Week of Nov 25, 2025

- ✅ Completed comprehensive security & performance audit
- ✅ Identified 5 critical production blockers
- ✅ Consolidated documentation (10 docs → 2)
- 🚧 Starting emergency fixes for production

### Week of Nov 18, 2025

- ✅ Prayer batch management with bulk assignment
- ✅ Volunteer onboarding pipeline complete
- ✅ Documentation restructure

---

## 🤝 Team

- **Development:** In-house team
- **Design:** Using shadcn/ui components
- **Infrastructure:** Vercel + Neon + Tigris
- **AI/ML:** Anthropic Claude Vision API

---

## 📞 Getting Help

### For Technical Issues

Check ENGINEERING-PLAYBOOK.md first, then:

1. Check existing GitHub issues
2. Ask in team Slack
3. Create new issue with reproduction steps

### For Product Questions

1. Check this document
2. Review feature specs in `/features`
3. Ask product owner

---

**Remember:** This is a living document. When features ship or priorities change, update here via feature-wrap-up command.
