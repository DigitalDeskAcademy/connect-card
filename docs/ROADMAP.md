# Church Connect Card - Product Roadmap

**Current Phase**: Phase 2 Complete (Connect Card MVP) → Moving to Phase 3 (Production Launch)
**Product Focus**: Church visitor engagement platform with AI-powered connect card scanning
**Target Market**: Churches (100-2000 members) seeking to improve visitor follow-up

---

## 🎯 PRODUCT VISION

### The Problem

Churches manually enter connect card data (visitor info, prayer requests), which is:

- **Slow**: 3-5 minutes per card
- **Error-prone**: Typos in emails/phones prevent follow-up
- **Inconsistent**: Cards get lost, data entry delayed weeks
- **Poor visitor experience**: Visitors feel forgotten when follow-up is slow

### The Solution

**Scan → Extract → Automate**

1. **Scan**: Church staff photograph connect cards with phone camera
2. **Extract**: Claude Vision AI extracts structured data from handwriting
3. **Automate**: SMS/email campaigns automatically follow up with visitors

### Success Metrics

- **90% time savings** on data entry (5 min/card → 30 sec/card)
- **95% follow-up rate** with first-time visitors (up from ~30%)
- **Response within 24 hours** to prayer requests
- **50% conversion** from first-time visitor → returning visitor

---

## ✅ PHASE 1: FOUNDATION (COMPLETE - Oct 25, 2025)

**Goal**: Fork SideCar Platform and rebrand to Church Connect Card

### Completed

- [x] Forked multi-tenant SaaS boilerplate
- [x] Renamed `/app/agency/` → `/app/church/`
- [x] Updated database schema (Contact → ChurchMember, added ConnectCard)
- [x] Created church-specific navigation (Dashboard, Connect Cards, Volunteer, Prayer)
- [x] Config-based headers (eliminated Named Slots complexity)
- [x] Standardized PageContainer pattern
- [x] Created church seed data with realistic test users

**Outcome**: Clean foundation aligned with church domain, ready for feature development

---

## ✅ PHASE 2: CONNECT CARD MVP (COMPLETE - Oct 26, 2025)

**Goal**: Build AI-powered connect card scanning and data extraction

### Completed

- [x] Claude Vision API integration (Anthropic)
- [x] Multi-file upload with drag-and-drop
- [x] Mobile camera capture for phone-based scanning
- [x] Base64 image processing (avoids S3 access issues)
- [x] Structured data extraction (name, email, phone, prayer request, interests)
- [x] Client-side validation (phone number digit count, email format)
- [x] Test interface for debugging extractions
- [x] Database storage (ConnectCard model with JSONB extractedData)

### Key Learnings

- AI achieves 60-85% accuracy on handwritten cards (industry standard for OCR)
- Phone validation catches common OCR errors (9-digit vs 10-digit numbers)
- Hybrid approach works best: AI extracts 80%, human reviews flagged 20% = 90% time savings
- Base64 encoding required (Anthropic API can't access private S3 buckets)

**Outcome**: Functional connect card scanning system, tested with handwritten samples

---

## 🚀 PHASE 3: PRODUCTION LAUNCH (CURRENT - Target: Nov 2025)

**Goal**: Launch to first pilot church with 6 locations

### Environment Setup

- [ ] **Production Database** - Configure Neon production Postgres
- [ ] **Environment Variables** - Set all production secrets (Anthropic, Stripe, S3, Auth)
- [ ] **Domain & SSL** - Custom domain with HTTPS
- [ ] **Monitoring** - Error tracking (Sentry), analytics (Vercel)
- [ ] **Backups** - Automated database backups

### Connect Card Enhancements

- [ ] **Review Queue UI** - Show flagged cards with validation warnings
- [ ] **Manual Edit Interface** - Allow correction of extracted data before saving
- [ ] **Bulk Processing Progress** - Better visual feedback for multi-card uploads
- [ ] **Search & Filter** - Find cards by name, date, status, first-time visitor

### Testing & Validation

- [ ] **Pilot Church Testing** - Process 100+ real connect cards
- [ ] **Mobile Testing** - Verify iOS/Android camera capture
- [ ] **Load Testing** - Handle 500+ cards uploaded in one Sunday
- [ ] **AI Accuracy Measurement** - Track extraction success rate on real data

### Onboarding & Documentation

- [ ] **Church Admin Guide** - How to scan and process connect cards
- [ ] **Video Tutorial** - 5-minute walkthrough of full workflow
- [ ] **Support System** - Help desk for pilot church questions

**Success Criteria**: Pilot church processes 100+ connect cards with 90% time savings

---

## 🎯 PHASE 4: MEMBER MANAGEMENT (Target: Dec 2025)

**Goal**: Build member directory and N2N (Newcomer to Next-Step) workflow

### Member Directory

- [ ] **Member List** - Searchable, filterable list of all church members
- [ ] **Member Profiles** - View individual history, notes, connect cards, attendance
- [ ] **Member Import** - Bulk upload existing member database (CSV)
- [ ] **Duplicate Detection** - Warn when connect card matches existing member

### N2N Workflow

- [ ] **Visitor Pipeline** - First-time → returning → regular attender → member
- [ ] **Status Tracking** - Mark members with tags (visitor, new member, volunteer, etc.)
- [ ] **Follow-up Dashboard** - See who needs outreach this week
- [ ] **Notes & History** - Track all interactions with each visitor/member

### Data Management

- [ ] **Merge Duplicates** - Combine multiple records for same person
- [ ] **Bulk Actions** - Tag multiple members, export lists
- [ ] **Custom Fields** - Church-specific data (small group, serving team, etc.)

**Success Criteria**: Church transitions 50% of first-time visitors to returning visitors

---

## 🎯 PHASE 5: AUTOMATED COMMUNICATION (Target: Jan 2026)

**Goal**: Automated SMS/email follow-up campaigns

### GHL Integration

- [ ] **OAuth Connection** - Connect church's GoHighLevel account
- [ ] **Contact Sync** - Push connect card data to GHL
- [ ] **SMS Campaigns** - Automated welcome messages to first-time visitors
- [ ] **Email Campaigns** - Follow-up series, event invitations

### Campaign Templates

- [ ] **First-Time Visitor Welcome** - Thank you + what to expect next Sunday
- [ ] **Prayer Request Follow-up** - Check-in on prayer needs after 1 week
- [ ] **Returning Visitor** - Invite to coffee with pastor
- [ ] **New Member Onboarding** - Next steps to get connected

### Analytics & Reporting

- [ ] **Campaign Performance** - Open rates, click rates, response rates
- [ ] **Follow-up Effectiveness** - Track visitor retention by campaign type
- [ ] **Response Tracking** - See who replied, needs manual outreach

**Success Criteria**: 95% of first-time visitors receive follow-up within 24 hours

---

## 🎯 PHASE 6: VOLUNTEER & PRAYER MANAGEMENT (Target: Feb 2026)

### Volunteer System

- [ ] **Volunteer Database** - Skills, availability, preferences
- [ ] **Serving Opportunities** - List of volunteer roles (greeters, ushers, kids ministry, etc.)
- [ ] **Scheduling** - Assign volunteers to weekly serving schedule
- [ ] **Check-in System** - Track volunteer attendance
- [ ] **Reminders** - SMS reminders before serving shifts

### Prayer Request System

- [ ] **Prayer Wall** - Public prayer request board (opt-in)
- [ ] **Prayer Teams** - Assign requests to specific prayer groups
- [ ] **Follow-up Workflow** - Check in after 1 week, 1 month
- [ ] **Answered Prayers** - Track and celebrate answered requests
- [ ] **Privacy Controls** - Public vs confidential prayer requests

**Success Criteria**: 80% of prayer requests receive follow-up within 1 week

---

## 🎯 PHASE 7: ANALYTICS & INSIGHTS (Target: Mar 2026)

### Visitor Analytics

- [ ] **First-Time Visitor Trends** - Weekly/monthly counts, seasonal patterns
- [ ] **Retention Metrics** - How many visitors return for 2nd, 3rd, 4th visit
- [ ] **N2N Pipeline Dashboard** - Visual funnel from visitor → member
- [ ] **Source Tracking** - How visitors heard about the church

### Engagement Metrics

- [ ] **Member Activity** - Attendance trends, serving frequency
- [ ] **Communication Effectiveness** - SMS/email open rates, response rates
- [ ] **Prayer Request Analytics** - Response times, follow-up completion
- [ ] **Volunteer Health** - Burnout indicators, serving frequency

### Predictive Insights

- [ ] **At-Risk Members** - Identify members with declining attendance
- [ ] **High-Potential Volunteers** - Find engaged members ready to serve
- [ ] **Growth Forecasting** - Predict membership growth based on trends

**Success Criteria**: Church leadership makes data-driven decisions on outreach strategy

---

## 🎯 PHASE 8: MULTI-LOCATION & SCALING (Target: Apr 2026)

### Multi-Location Support

- [ ] **Location Management** - Manage 6+ church campuses in one system
- [ ] **Location-Specific Data** - Filter by campus, track per-location metrics
- [ ] **Cross-Location Reporting** - Roll-up metrics across all campuses
- [ ] **Location Branding** - Custom branding per campus (if needed)

### White-Label Features

- [ ] **Custom Domain** - church.theirurl.com
- [ ] **Church Branding** - Logo, colors, custom styling
- [ ] **Custom Fields** - Church-specific data fields
- [ ] **API Access** - Integrate with other church management systems

### Scaling Infrastructure

- [ ] **Performance Optimization** - Handle 1000+ cards/week
- [ ] **Mobile App** - Native iOS/Android apps for on-the-go scanning
- [ ] **Offline Mode** - Scan cards without internet, sync later
- [ ] **Batch Processing** - Process 100+ cards simultaneously

**Success Criteria**: Support 10+ churches with 50,000+ members total

---

## 📊 SUCCESS METRICS

### Phase 3 (Production Launch)

- 1 pilot church using system
- 100+ connect cards processed
- 90% time savings on data entry
- 95% extraction accuracy (with review queue)

### Phase 4 (Member Management)

- 50% first-time visitor → returning visitor conversion
- 500+ members in directory
- 10+ follow-ups completed per week

### Phase 5 (Communication)

- 95% follow-up rate within 24 hours
- 40%+ SMS open rate
- 20%+ email open rate
- 80% visitor satisfaction with follow-up

### Phase 6 (Volunteer & Prayer)

- 50+ active volunteers tracked
- 80% prayer requests followed up within 1 week
- 90% volunteer attendance rate

### Long-Term (12 Months)

- 10+ churches using platform
- 50,000+ connect cards processed
- 100,000+ church members in system
- $10K+ MRR

---

## 🚫 OUT OF SCOPE (Not Planning)

These features are explicitly NOT planned for MVP:

- **Event Management** - Use external tools (Planning Center, Eventbrite)
- **Giving/Donations** - Use Stripe directly or church giving platforms
- **Livestream Integration** - Use YouTube, Vimeo, or church streaming services
- **Website Builder** - Focus on CRM/engagement, not website hosting
- **Accounting/Finances** - Use QuickBooks, FreshBooks, or church accounting software

---

## 📝 NOTES

- **AI Limitations**: 60-85% accuracy is industry standard for handwriting OCR. Hybrid approach (AI + human review) is the right model.
- **GHL Dependency**: Communication features require GoHighLevel. Alternative: direct Twilio/SendGrid integration if churches don't have GHL.
- **Mobile-First**: Many church staff use phones, not computers. Mobile camera scanning is critical feature.
- **Privacy**: Churches handle sensitive data (prayer requests, personal info). Security and compliance are non-negotiable.
- **LMS Position**: Training system is secondary feature for church staff onboarding, not core product.

---

## 🔄 NEXT STEPS

**Immediate** (This Week):

1. Set up production environment (Neon, Vercel, domain)
2. Configure all environment variables
3. Build review queue UI for flagged connect cards
4. Test end-to-end flow with pilot church

**Short-Term** (This Month):

1. Launch to pilot church (6 locations)
2. Process 100+ real connect cards
3. Measure accuracy, time savings, user satisfaction
4. Iterate based on feedback

**Medium-Term** (Next 3 Months):

1. Build member management MVP
2. Implement N2N workflow
3. Connect GHL for automated follow-up
4. Expand to 2-3 additional pilot churches
