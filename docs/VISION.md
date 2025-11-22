# Church Connect Card Platform - Product Vision

**Status:** Living Document - In Development
**Last Updated:** 2025-11-19
**Owner:** Product Team

---

## Executive Summary

> **[TO BE COMPLETED]**
>
> A church engagement platform that captures visitor and member data from connect cards, automates volunteer onboarding workflows, and provides communication tools to keep members engaged - all while integrating seamlessly with existing church management software.

**Market Position:**

- NOT a replacement for PCO/Breeze/CCB (scheduling platforms)
- IS the front door + communication layer for member engagement
- COMPLEMENTS existing church software with automation

---

## 1. Core Problems We Solve

### Primary Pain Point

**Manual connect card processing is killing church productivity and visitor engagement.**

Churches face a compound problem every Sunday:

1. **5+ hours of manual data entry each week** - Staff manually transcribe handwritten connect cards (3-5 minutes per card), leading to errors, backlogs, and burnout
2. **Poor visitor follow-up** - Only 30% of first-time visitors receive timely follow-up because cards get lost, misplaced, or stuck in the data entry backlog
3. **Scattered volunteer interest** - When someone checks "interested in volunteering" on a connect card, there's no structured workflow to route them to the right ministry leader
4. **Prayer requests fall through the cracks** - Prayer requests written on cards sit in a pile instead of being routed to prayer teams within 24-48 hours
5. **No integration with existing church software** - Data exists in spreadsheets and paper cards, not in Planning Center, Breeze, or CCB where churches actually manage their members

**The root cause:** Churches are trying to bridge the analog world (paper connect cards) and digital world (church management software) manually, and it's not working.

### Why Existing Solutions Fall Short

**Planning Center Online (PCO):**

- **Strengths:** Best-in-class volunteer scheduling, service planning, team rosters
- **Gaps:** No connect card scanning, no AI data extraction, assumes data is already digital
- **Pain Point:** Still requires manual data entry before you can use PCO's powerful features

**Breeze / Church Community Builder (CCB):**

- **Strengths:** Full church management (members, giving, groups, events)
- **Gaps:** No AI-powered connect card processing, outdated UI, complex to learn
- **Pain Point:** Doesn't solve the Sunday morning bottleneck of getting data into the system

**Why they can't solve this:**

- **They're destination platforms, not intake platforms** - PCO and Breeze assume you already have clean, digital member data. They don't help you capture it from paper.
- **No AI Vision processing** - None of these platforms can read handwritten connect cards and extract structured data
- **No automated visitor follow-up** - They're databases, not engagement automation tools
- **Complex onboarding** - Churches need 40+ hours of setup and training before seeing value

**The gap we fill:** We're the **front door** that feeds into PCO/Breeze. We solve the intake/onboarding problem they don't address.

### The Impact

**What changes for a church admin on Monday morning?**

**BEFORE (Current State):**

**9:00 AM** - Church admin arrives with stack of 50+ connect cards from Sunday services
**9:15 AM** - Opens Excel spreadsheet and starts manually typing names, emails, phone numbers
**9:20 AM** - Card #3 has illegible handwriting - skips it, will try to decode later
**10:00 AM** - 12 cards entered, 38 to go. Already feeling fatigued from repetitive data entry
**11:00 AM** - Prayer request mentions "struggling with addiction" - not sure who to route it to
**12:00 PM** - 25 cards done, takes lunch break
**2:00 PM** - Back to data entry. Card says "interested in volunteering - kids ministry"
**2:05 PM** - Manually emails Kids Ministry leader about new volunteer inquiry
**4:00 PM** - Finally finished all cards. 5 hours of work for Sunday data entry
**4:30 PM** - Realizes 3 cards were misplaced - data entry incomplete

**Total time: 5 hours**
**Cards with errors: 15-20%**
**Visitor follow-up sent: 30%** (too exhausted to email everyone)
**Volunteer inquiries routed: Manual emails, often delayed 2-3 days**

---

**AFTER (With Our Platform):**

**9:00 AM** - Church admin arrives, opens laptop
**9:05 AM** - Uses phone camera to photograph all 50 connect cards (batch upload)
**9:10 AM** - Claude Vision AI extracts data from all cards while admin grabs coffee
**9:20 AM** - Reviews AI extractions - 95% accurate, fixes 2-3 flagged entries
**9:30 AM** - Clicks "Approve Batch" - all data synced to member database
**9:35 AM** - Platform automatically:

- Identifies 12 first-time visitors → queues welcome email workflow
- Routes 3 volunteer inquiries to ministry leaders with detailed profiles
- Sends 8 prayer requests to prayer team coordinator with privacy flags
- Flags 2 returning visitors for personal follow-up
  **10:00 AM** - Exports clean data to Planning Center with one click
  **10:15 AM** - Done with connect card processing for the week

**Total time: 30 minutes**
**Cards with errors: <5%** (AI Vision + manual review)
**Visitor follow-up sent: 95%** (automated workflows)
**Volunteer inquiries routed: Instant, with context**

---

### Measurable Improvements

**Time Savings:**

- Connect card data entry: **5 hours → 30 minutes per week** (90% reduction)
- Volunteer inquiry routing: **Manual emails → Automated** (100% time savings)
- Prayer request distribution: **Manual → Automated** (100% time savings)

**Quality Improvements:**

- Data accuracy: **80-85% → 95%+** (AI Vision with human review)
- First-time visitor follow-up: **30% → 95%** (3x improvement)
- Volunteer inquiry response time: **2-3 days → 24 hours** (90% faster)

**Engagement Improvements:**

- Volunteer conversion rate: **10% → 50%** (faster response = higher conversion)
- Prayer request follow-up: **60% → 95%** (no more lost requests)
- Member data quality: **Messy spreadsheets → Clean CRM data** (exportable to PCO/Breeze)

---

## 2. Target Users & Personas

### Primary User: Church Administrator

**Role:** Executive Pastor, Administrative Pastor, or Church Operations Manager

**Church Profile:**

- Church size: 200-2000 members (sweet spot: 500-1000)
- Multi-campus: Often 2-6 locations
- Tech savvy: Intermediate (comfortable with email, spreadsheets, basic software)
- Existing tools: Planning Center, Breeze, or Church Community Builder for scheduling/giving

**Daily Tasks:**

- Process 20-50 connect cards every Monday after Sunday services
- Manually enter visitor information into spreadsheets or church management software
- Route volunteer inquiries to ministry leaders via email
- Distribute prayer requests to prayer team coordinators
- Follow up with first-time visitors within 48 hours (when time permits)
- Prepare weekly reports for senior leadership
- Manage team member permissions and campus access

**Pain Points:**

- **Time drain**: Spends 5-10 hours per week on manual data entry
- **Inconsistent follow-up**: Only 30% of first-time visitors get timely contact
- **Lost cards**: Paper cards misplaced or illegible, leading to lost connections
- **No automation**: Everything is manual - emails, data entry, routing
- **Disconnected systems**: Data lives in spreadsheets, not integrated with PCO/Breeze
- **Volunteer inquiries slip through cracks**: Takes 2-3 days to route to ministry leaders

**What They Need:**

- **Speed**: Process 50 connect cards in 30 minutes, not 5 hours
- **Accuracy**: AI Vision with 95%+ accuracy (better than tired manual entry)
- **Automation**: Visitor follow-up workflows that run without manual intervention
- **Integration**: Clean export to Planning Center, Breeze, or CCB
- **Visibility**: Dashboard showing who needs follow-up this week

**Success Metrics:**

- **Time saved**: 5 hours → 30 minutes per week (90% reduction)
- **Follow-up rate**: 30% → 95% of visitors contacted within 24 hours
- **Data accuracy**: 80% → 95%+ (AI Vision beats manual entry)
- **Volunteer response time**: 2-3 days → 24 hours (instant routing)

**Quote:**

> "I'm drowning in connect cards every Monday. By the time I finish entering data on Thursday, I've missed the window to follow up with Sunday's visitors. This platform gives me my time back and ensures no one falls through the cracks."

---

### Secondary User: Ministry Leader

**Role:** Kids Ministry Director, Worship Leader, Small Groups Pastor, Volunteer Coordinator

**Church Profile:**

- Oversees 10-50 volunteers in their ministry area
- Manages Sunday service teams (greeters, ushers, kids workers, worship team)
- Part-time or volunteer role (not full-time staff)
- Limited time for administrative tasks

**Daily Tasks:**

- Recruit new volunteers for their ministry area
- Schedule volunteers for upcoming Sunday services
- Respond to volunteer inquiries from connect cards
- Track background checks for kids ministry workers
- Communicate with team via email or group text
- Fill last-minute shift gaps when volunteers cancel

**Pain Points:**

- **Slow volunteer onboarding**: Takes 2-3 weeks from inquiry to first shift
- **Missing context**: Receives email saying "Jane Doe interested in kids ministry" with no phone number, background check status, or availability
- **Manual scheduling**: Uses spreadsheets or Planning Center, but volunteer data isn't up-to-date
- **Background check tracking**: Hard to know who's current vs. expired
- **Communication gaps**: Can't easily message all greeters or all kids workers at once

**What They Need:**

- **Fast volunteer routing**: Get notified within 24 hours when someone expresses interest
- **Complete profiles**: Volunteer inquiry includes phone, email, availability, skills
- **Background check tracking**: See who's cleared, who needs renewal
- **Easy communication**: Text or email all volunteers in their ministry category
- **Skills matching**: Know who's qualified for sensitive roles (kids ministry)

**Success Metrics:**

- **Volunteer response time**: 2-3 days → 24 hours (instant routing)
- **Onboarding speed**: 2-3 weeks → 1 week (faster intake)
- **Background check compliance**: 70% → 95% (automated expiration tracking)
- **Team communication**: Manual emails → Bulk messaging to ministry categories

**Quote:**

> "When someone checks 'interested in kids ministry' on a connect card, I want to know immediately - not 3 days later. And I need their phone number and availability, not just a name. This platform gives me everything I need to follow up fast."

---

### Tertiary User: Prayer Team Coordinator

**Role:** Prayer Ministry Leader, Pastoral Care Coordinator, Prayer Chain Manager

**Church Profile:**

- Oversees 5-20 prayer team members
- Distributes prayer requests weekly
- Follows up on sensitive requests (health, family, addiction)
- Part-time or volunteer role

**Daily Tasks:**

- Collect prayer requests from connect cards, emails, texts
- Categorize requests by topic (health, family, work, spiritual)
- Respect privacy flags (public vs. private requests)
- Distribute requests to prayer team via email or app
- Track answered prayers and follow up with requesters
- Send encouragement notes to those who requested prayer

**Pain Points:**

- **Scattered requests**: Prayer requests on paper cards, texts, emails - no central system
- **Privacy concerns**: Not sure which requests are safe to share publicly vs. keep private
- **No follow-up tracking**: Hard to remember who requested prayer 2 weeks ago
- **Manual distribution**: Copy/paste requests into email every week
- **Sensitive topics**: Needs to flag requests mentioning addiction, suicide, abuse for pastoral care

**What They Need:**

- **Centralized requests**: All prayer requests in one place (from connect cards, online forms, etc.)
- **Privacy controls**: Auto-detect sensitive topics and flag as private
- **Categorization**: Group by topic (health, family, work, spiritual)
- **Easy distribution**: One-click send to prayer team via email or SMS
- **Follow-up reminders**: Track which requests need pastoral follow-up

**Success Metrics:**

- **Request capture**: 60% → 95% of prayer requests from connect cards entered
- **Privacy compliance**: 70% → 95% (auto-detection of sensitive content)
- **Distribution time**: 30 minutes → 5 minutes per week (automated workflows)
- **Follow-up rate**: 50% → 80% (reminder system for answered prayers)

**Quote:**

> "Prayer requests used to sit in a pile on my desk for 3 days before I could type them up. Some were too sensitive to share publicly, but I had no system for flagging them. Now the AI auto-detects sensitive topics and routes them to pastoral care instead of the public prayer chain."

---

## 3. Member-Centric Architecture

### The Central Entity: ChurchMember

**Data Model:**

```
ChurchMember (central record)
├─ Roles: [Visitor, Regular, Member, Volunteer, Staff]
├─ Connect Cards: Many-to-many (track all cards over time)
├─ Prayer Requests: Many-to-many (all prayers submitted)
├─ Volunteer Categories: Many-to-many (Kids, Worship, etc.)
├─ Events Attended: Many-to-many (track engagement)
└─ Communications Sent: One-to-many (SMS/email history)
```

**Member Lifecycle:**

1. First-time Visitor (from connect card)
2. Returning Visitor
3. Regular Attender
4. Church Member
5. Active Volunteer
6. Ministry Leader / Staff

**Key Questions to Answer:**

**Q1: How do we handle duplicate detection? (same person, multiple connect cards)**

**Answer:** **Fuzzy matching with manual review** (Phase 3-4). Start with warnings, not automatic merges.

**Detection Strategy:**

1. **Match on:** Email (exact) OR Phone (exact) OR Name + Birthday (fuzzy)
2. **Similarity scoring:** If name is 85%+ match + same church → Flag as potential duplicate
3. **UI Warning:** "This person may already exist. Review before creating."
4. **Manual merge:** Church admin reviews and clicks "Merge Records" with conflict resolution

**Examples:**

- "John Smith" (new card) vs. "Jon Smith" (existing) → 90% match → Flag for review
- "john@gmail.com" (new card) vs. "john@gmail.com" (existing) → 100% match → Auto-warn
- Different email + different phone + similar name → Create new record (likely different person)

**Why manual review:**

- John Smith Sr. vs. John Smith Jr. (same church, different people)
- Married couples with same last name
- Common names in church (3 different "Maria Garcia" members)

**Phase 3-4:** Fuzzy matching with warnings
**Phase 5+:** Optional auto-merge with confidence threshold (95%+ match)

---

**Q2: How long do we retain historical data? (prayers, cards, communications)**

**Answer:** **Indefinite retention by default, with optional church-level retention policies** (comply with data privacy laws).

**Retention Strategy:**

- **Connect Cards:** Indefinite (part of member history)
- **Prayer Requests:** Indefinite (but can be archived after 1 year)
- **Communications (SMS/Email):** 2 years (compliance with SMS regulations)
- **Member Records:** Indefinite (unless member requests deletion)

**Church Controls:**

- **Auto-archive:** Prayer requests older than 1 year moved to "Archived Requests" (read-only)
- **Bulk delete:** Church can purge communications older than X years
- **GDPR compliance:** "Right to be forgotten" - member can request full data deletion

**Storage Approach:**

- **Active data:** Recent prayers/cards (last 12 months) in primary database
- **Historical data:** Older data stays in database but flagged as archived
- **Soft deletes:** When member requests deletion, mark as deleted (don't hard-delete) for audit trail

**Why indefinite by default:**

- Churches want to see member journey from first visit → member
- Prayer request history shows spiritual growth over time
- Historical data useful for reporting ("How many visitors became members in 2024?")

---

**Q3: Do we track lifecycle progression automatically or manually?**

**Answer:** **Hybrid approach** - automatic suggestions with manual confirmation (Phase 3-4).

**Automatic Tracking:**

- First connect card → Status: VISITOR (automatic)
- Second connect card (different Sunday) → Suggest: RETURNING (manual confirm)
- 4+ connect cards over 8 weeks → Suggest: REGULAR (manual confirm)
- Manual upgrade to MEMBER → Staff clicks "Mark as Member" button

**Lifecycle States:**

1. **VISITOR** (automatic) - First connect card submitted
2. **RETURNING** (suggested) - 2nd card within 60 days
3. **REGULAR** (suggested) - 4+ cards over 8 weeks
4. **MEMBER** (manual) - Completed membership class or staff decision
5. **VOLUNTEER** (manual) - Actively serving in ministry
6. **STAFF** (manual) - Paid or key leadership role

**Why hybrid:**

- Automatic progression catches 80% of cases correctly
- Manual confirmation prevents false positives (visitor filled out 2 cards in same day)
- Staff knows context AI doesn't (person completed membership class but hasn't submitted 4 cards)

**Phase 3-4:** Automatic suggestions with manual approval
**Phase 5+:** Optional fully automatic progression (church setting)

---

**Q4: What triggers status changes? (Visitor → Member)**

**Answer:** **Combination of automated triggers and manual overrides.** Staff always has final say.

**Automated Triggers (Suggestions):**

**VISITOR → RETURNING:**

- Trigger: 2nd connect card submitted (different Sunday)
- Timeframe: Within 60 days of first card
- Action: System suggests "Mark as Returning Visitor?" with one-click approval

**RETURNING → REGULAR:**

- Trigger: 4+ connect cards over 8-12 weeks
- OR: Attended 3+ consecutive Sundays (if attendance tracking enabled)
- Action: System suggests "Mark as Regular Attender?"

**REGULAR → MEMBER:**

- Trigger: Manual only (staff decision)
- Reasons: Completed membership class, baptism, or staff decision
- Action: Staff clicks "Mark as Member" + optional note (e.g., "Completed membership class 11/15/2025")

**MEMBER → VOLUNTEER:**

- Trigger: Volunteer inquiry from connect card OR staff assignment
- Action: Staff creates volunteer profile → Status auto-updates to VOLUNTEER

**Manual Overrides:**

- Staff can manually change any status at any time
- Example: Visitor submitted 1 card but pastor knows they're committed → Manually mark as REGULAR
- Example: Regular attender moved away → Manually mark as INACTIVE

**Status Rollback:**

- System won't auto-downgrade (MEMBER → REGULAR) without manual action
- Inactivity flagging: If no cards/attendance for 6 months → Suggest "Mark as Inactive?"

**Implementation:**

- **Status field:** ChurchMember.memberType enum (VISITOR, RETURNING, MEMBER, VOLUNTEER, STAFF)
- **Status history:** MemberStatusChange table tracks all transitions with timestamp + reason
- **Automation:** Cron job checks for trigger conditions daily → Creates suggestions in admin dashboard

---

## 4. Automation Engine (Core Differentiator)

**[SECTION 3 - TO BE COMPLETED]**

### Philosophy

Churches don't have time to manually follow up with every volunteer lead, prayer request, or visitor. Automation should handle 80% of routine tasks, freeing staff to focus on personal relationships.

### Automation Examples

**Example 1: Volunteer Onboarding (Kids Camp)**

```
TRIGGER: Connect card submitted with "Interested in volunteering - Kids Camp"
  ├─ IF member exists in database
  │   ├─ ACTION: Add volunteer role + Kids Ministry category
  │   └─ ACTION: Notify Kids Ministry leader
  └─ IF member does NOT exist
      ├─ ACTION 1: Create new member record
      ├─ ACTION 2: Assign volunteer role
      ├─ ACTION 3: Send SMS with background check link
      ├─ ACTION 4: Notify Kids Ministry leader
      └─ ACTION 5: Schedule follow-up reminder (3 days)
```

**Example 2: Bulk Volunteer Communication**

```
TRIGGER: Staff filters volunteers by "Kids Ministry" + clicks "Send Message"
  ├─ ACTION 1: Show message composer
  ├─ ACTION 2: Allow template selection or custom message
  ├─ ACTION 3: Attach calendar link (.ics file)
  ├─ ACTION 4: Send bulk SMS to 25 volunteers
  └─ ACTION 5: Track responses (YES/NO RSVP)
```

**Example 3: Background Check Expiration**

```
TRIGGER: Background check expiring in 30 days
  ├─ ACTION 1: Send reminder SMS to volunteer
  ├─ ACTION 2: Notify ministry leader
  └─ ACTION 3: Mark volunteer as "Needs Renewal" in system
```

**Key Questions to Answer:**

**Q1: Do staff create automations (Zapier-style UI) or use pre-built workflows?**

**Answer:** Start with **pre-built workflow templates** in Phase 4-5, then add Zapier-style builder in Phase 6+ if churches demand it.

**Reasoning:**

- Church admins are not technical - they need "Click to activate" workflows, not drag-and-drop builders
- Pre-built templates cover 80% of use cases: Visitor follow-up, volunteer onboarding, prayer routing
- Reduces onboarding complexity (activate 3 templates vs. build 10 custom workflows)
- Faster time-to-value (churches see automation working in 5 minutes, not 5 hours)
- Can always add custom builder later if power users demand it

**Phase 4-5:** Pre-built templates only (Visitor Welcome, Volunteer Onboarding, Prayer Routing)
**Phase 6+:** Optional custom builder for advanced users

---

**Q2: How complex is conditional logic? (If X AND Y, then Z)**

**Answer:** **Simple conditional logic** (1-2 conditions max) for Phase 4-5. Advanced logic (3+ conditions, nested rules) in Phase 6+ if needed.

**Examples of Simple Logic (Phase 4-5):**

- IF first-time visitor → Send welcome email
- IF volunteer inquiry + background check expired → Send renewal reminder
- IF prayer request contains sensitive keywords → Route to pastoral care
- IF returning visitor (2nd visit) → Send small group invitation

**Examples of Advanced Logic (Phase 6+ - Optional):**

- IF first-time visitor AND age 18-30 AND single → Send young adults group invite
- IF volunteer + Kids Ministry + background check cleared AND NOT scheduled in 60 days → Send re-engagement text
- IF prayer request + health category + urgent flag → Notify pastor immediately + send to prayer team

**Decision:** Start simple. 80% of automation needs are single-condition triggers. Add complexity only if churches ask for it.

---

**Q3: Can workflows be multi-step? (Day 1: Welcome, Day 3: Background check, Day 7: Team assignment)**

**Answer:** **Yes, multi-step sequences are CRITICAL** for Phase 4-5. This is the core differentiator vs. manual email.

**Multi-Step Workflow Examples:**

**Visitor Follow-Up Sequence (7-day journey):**

- Day 0 (Sunday): Visitor fills out connect card
- Day 1 (Monday): Automated welcome email from pastor
- Day 3 (Wednesday): SMS with link to next Sunday's service times
- Day 7 (Next Sunday): Check if they attended 2nd service
  - IF yes → Send small group invitation
  - IF no → Send video testimonial + re-invite

**Volunteer Onboarding Sequence (14-day journey):**

- Day 0: Volunteer inquiry submitted via connect card
- Day 1: Ministry leader receives notification with profile
- Day 3: IF no response → Reminder to ministry leader
- Day 7: Background check link sent to volunteer
- Day 10: IF background check submitted → Send onboarding checklist
- Day 14: Team assignment + first shift invitation

**Prayer Follow-Up Sequence (30-day journey):**

- Day 0: Prayer request submitted
- Day 1: Confirmation email to requester + assigned to prayer team
- Day 7: Check-in email: "How are you doing?"
- Day 14: IF no reply → Pastor notification for personal follow-up
- Day 30: "Answered prayer" survey

**Implementation:** Use scheduled jobs (cron) + status tracking. Each sequence has states: PENDING → IN_PROGRESS → COMPLETED.

---

**Q4: Do we need A/B testing for automated messages?**

**Answer:** **No, not for Phase 4-6**. A/B testing is a power feature for large churches with data analysts. Church admins just want messages that work.

**Why skip A/B testing:**

- Church admins aren't marketers - they don't think in terms of "open rates" and "conversion optimization"
- Pre-built templates can have research-backed messaging from church growth experts
- Churches care about "Did we follow up?" not "Did we optimize click-through rate by 2%?"
- Adds UI complexity that 95% of churches won't use

**What churches DO need:**

- **Template library:** 10-15 proven message templates (welcome emails, prayer confirmations, volunteer invites)
- **Personalization:** Insert member name, campus location, ministry leader name
- **Simple editing:** Customize templates with church branding and pastor's name
- **Success metrics:** Track if messages were sent, not which version performed better

**Future (Phase 7+ if churches ask):** Add A/B testing for mega-churches with dedicated communications staff.

**Recommendation:** Focus on "messages that work" (proven templates), not "optimizing messages" (A/B testing).

---

## 5. Feature Roadmap

### ✅ Phase 1: Connect Card MVP (COMPLETE)

- [x] AI Vision extraction (Claude API)
- [x] Multi-file upload (drag-and-drop + mobile camera)
- [x] Manual review queue
- [x] Batch management
- [x] Prayer request extraction

### ✅ Phase 2: Volunteer Intake (COMPLETE)

- [x] Volunteer directory (TanStack Table)
- [x] Multi-select ministry categories
- [x] Home campus assignment (locationId)
- [x] Background check status tracking
- [x] Basic volunteer profile creation

### 🔄 Phase 3: Member Management (IN PROGRESS)

**Goal:** Track member lifecycle from first visit to active volunteer

**Features:**

- [ ] Member directory (searchable, filterable)
- [ ] Duplicate detection (merge similar records)
- [ ] Member profile pages (full history view)
- [ ] Lifecycle status tracking (Visitor → Member → Volunteer)
- [ ] CSV import (bulk member upload)
- [ ] CSV export (to PCO/Breeze/CCB)

**Success Criteria:**

- [ ] Churches can import 500+ existing members via CSV
- [ ] Duplicate detection catches 95%+ of duplicates
- [ ] Staff can see member journey timeline (all connect cards, prayers, events)

---

### 📋 Phase 4: Automation & Communication (PLANNED)

**Goal:** Automate routine follow-up and enable bulk communications

**Features:**

- [ ] Automation builder (trigger → action workflows)
- [ ] Pre-built workflow templates (volunteer onboarding, prayer follow-up, etc.)
- [ ] Bulk SMS messaging (filtered groups)
- [ ] Bulk email messaging
- [ ] Calendar link generation (.ics files)
- [ ] RSVP tracking (two-way SMS responses)
- [ ] Communication history (track all messages sent)
- [ ] Message templates library

**Technical Requirements:**

- [ ] SMS provider integration (Twilio or GoHighLevel?)
- [ ] Email provider integration (Resend or SendGrid?)
- [ ] Calendar generation (iCal format)
- [ ] Webhook support for two-way messaging
- [ ] Rate limiting (avoid spam filters)

**Success Criteria:**

- [ ] Staff can send bulk SMS to 100 volunteers in < 2 minutes
- [ ] 80%+ message delivery rate
- [ ] RSVP responses tracked automatically
- [ ] Pre-built automations reduce manual follow-up by 70%

---

### 📊 Phase 5: Analytics & Insights (PLANNED)

**Goal:** Give churches visibility into engagement trends and volunteer health

**Features:**

- [ ] Engagement dashboard
  - First-time visitors this month
  - Returning visitor rate
  - Volunteer conversion rate (visitor → volunteer)
  - Prayer request volume trends
- [ ] Volunteer health metrics
  - Volunteers by category
  - Background check expiration alerts
  - Volunteer turnover rate
  - Average volunteer tenure
- [ ] Member journey insights
  - Average time: First visit → Member
  - Most effective volunteer categories
  - Engagement heat map (by campus, by month)
- [ ] Automated reports (weekly email to leadership)

**Success Criteria:**

- [ ] Churches can answer "How healthy is our volunteer team?" in 30 seconds
- [ ] Predictive alerts: "You'll need 5 more Kids Ministry volunteers by June"
- [ ] Leadership reports sent automatically every Monday

---

### 🔗 Phase 6: Integrations (FUTURE)

**Goal:** Two-way sync with existing church software

**PCO Integration:**

- [ ] Export volunteers to PCO Services (CSV or API)
- [ ] Sync member status changes (two-way)
- [ ] Import event attendance from PCO

**Breeze Integration:**

- [ ] Export member data (CSV or API)
- [ ] Sync volunteer assignments

**CCB Integration:**

- [ ] Export member data (CSV or API)

**GoHighLevel Integration:**

- [ ] Use GHL for SMS/email delivery
- [ ] Track communication history in GHL
- [ ] Sync contacts bidirectionally

**Decision Point:** Start with CSV export (easy), add API integrations based on church demand.

---

## 6. What We Build vs. What We DON'T Build

### ✅ What We WILL Build (In Scope)

**Data Capture & Management:**

- ✅ Connect card scanning (AI Vision)
- ✅ Member database (central record with roles)
- ✅ Volunteer intake & categorization
- ✅ Prayer request management
- ✅ Background check tracking
- ✅ Member lifecycle tracking

**Automation & Communication:**

- ✅ Automation engine (trigger → action workflows)
- ✅ Bulk SMS messaging (filtered groups)
- ✅ Bulk email messaging
- ✅ Calendar link generation
- ✅ RSVP tracking (two-way responses)
- ✅ Pre-built workflow templates

**Analytics & Insights:**

- ✅ Engagement dashboard
- ✅ Volunteer health metrics
- ✅ Member journey insights
- ✅ Automated leadership reports

**Integrations:**

- ✅ CSV export to PCO/Breeze/CCB
- ✅ API integrations (if churches demand it)

---

### ❌ What We WON'T Build (Out of Scope)

**Volunteer Scheduling (Use PCO Services):**

- ❌ Shift creation and management
- ❌ Recurring schedule templates
- ❌ Team rosters by service time
- ❌ Check-in/check-out systems
- ❌ Volunteer hour tracking
- ❌ Service planning tools

**Financial Systems (Use Existing Software):**

- ❌ Giving/donations management
- ❌ Accounting and bookkeeping
- ❌ Payroll for staff
- ❌ Budget tracking

**Website & Marketing (Use Existing Tools):**

- ❌ Church website builder
- ❌ Blog/content management
- ❌ Event registration pages (external)
- ❌ Social media management

**Other Church Management:**

- ❌ Small group management (use PCO Groups)
- ❌ Facility/room booking
- ❌ Sermon notes and archives
- ❌ Music/worship planning

---

## 7. Differentiation & Positioning

### vs. Planning Center Online (PCO)

**PCO Strengths:** Volunteer scheduling, service planning, check-in systems
**PCO Gaps:** Connect card processing, automated follow-up, bulk communications
**Our Position:** Front door + communication layer that feeds into PCO

**Use Case:** Church uses our platform to capture volunteer interest from connect cards, then exports to PCO Services for ongoing scheduling.

---

### vs. Breeze / Church Community Builder (CCB)

**Breeze/CCB Strengths:** Full church management (members, giving, groups, events)
**Breeze/CCB Gaps:** AI connect card scanning, automation workflows, modern UI
**Our Position:** Specialized engagement layer focused on visitor → volunteer pipeline

**Use Case:** Church uses Breeze for main member database, uses our platform for connect card automation and volunteer communications.

---

### vs. Generic CRM (Salesforce, HubSpot)

**Generic CRM Strengths:** Powerful automation, customization, reporting
**Generic CRM Gaps:** Not built for church workflows, expensive, complex setup
**Our Position:** Church-specific workflows out of the box (connect cards, prayers, volunteers)

**Use Case:** Church doesn't want to spend $5k/month on Salesforce + 40 hours configuring it for church use.

---

### vs. Simple Automation Tools (Zapier, Make)

**Zapier Strengths:** Connects 1000+ apps, flexible workflows
**Zapier Gaps:** Requires technical setup, no church-specific templates, costs add up
**Our Position:** Pre-built church workflows (no Zapier expertise needed)

**Use Case:** Church admin doesn't know how to build Zapier workflows. Our pre-built "Volunteer Onboarding" automation works out of the box.

---

## 8. Success Metrics

### Church-Level Metrics (User Impact)

**Time Savings:**

- Connect card data entry: **5 hours → 30 minutes per week** (90% reduction)
- Volunteer follow-up: **2-3 weeks → 24 hours** (90% faster)
- Prayer request distribution: **Manual → Automated** (100% time savings)

**Engagement Improvements:**

- Volunteer conversion rate: **10% → 50%** (5x improvement)
- First-time visitor follow-up: **30% → 95%** (3x improvement)
- Background check compliance: **60% → 95%** (automated reminders)

**Adoption Metrics:**

- Weekly active users (church staff)
- Connect cards processed per week
- Automations triggered per week
- Messages sent via platform

---

### Business Metrics (Platform Health)

**Growth:**

- Churches onboarded per month
- Monthly recurring revenue (MRR)
- Customer retention rate (% of churches still using after 6 months)

**Engagement:**

- Average connect cards processed per church per week
- Percentage of churches using automation features
- Percentage of churches using bulk messaging

**Product-Market Fit:**

- Net Promoter Score (NPS)
- Feature request volume by category
- Customer support ticket volume

---

## 9. Open Questions & Decisions Needed

### Architecture & Data Model

- [ ] How do we handle duplicate members? (automatic merge or manual review?)
- [ ] How long do we retain historical data? (prayers, connect cards, communications)
- [ ] Do we track member lifecycle progression automatically or manually?
- [ ] What triggers status changes? (Visitor → Member → Volunteer)

### Automation Engine

- [ ] Do staff create custom automations (Zapier-style UI) or only use pre-built workflows?
- [ ] How complex is conditional logic? (If X AND Y, then Z)
- [ ] Can workflows be multi-step sequences? (Day 1, Day 3, Day 7 actions)
- [ ] Do we need A/B testing for automated messages?

### Communication System

- [ ] SMS provider: Twilio, GoHighLevel, or both?
- [ ] Email provider: Resend, SendGrid, or built-in?
- [ ] Two-way SMS: Do we track responses and update member records?
- [ ] Calendar formats: iCal files, Google Calendar links, or both?

### Integration Strategy

- [ ] Start with CSV export only, or build API integrations immediately?
- [ ] Which integration is highest priority? (PCO, Breeze, CCB, GHL)
- [ ] One-way export or two-way sync?
- [ ] How do we handle conflicts? (member updated in both systems)

### Pricing & Business Model

- [ ] Per-church subscription or per-user pricing?
- [ ] Pricing tiers based on features or church size?
- [ ] Free tier for small churches (< 100 members)?
- [ ] SMS/email costs: included in subscription or usage-based?

---

## 10. Next Steps

**Immediate (This Week):**

1. ✅ Complete volunteer categories feature
2. ✅ Create this vision document
3. [ ] Complete vision document Section 1 (Core Problems)
4. [ ] Create PR and merge volunteer categories
5. [ ] Plan Phase 3: Member Management features

**Short-Term (Next 2 Weeks):**

- [ ] Complete all vision document sections
- [ ] Build member directory (Phase 3)
- [ ] Design automation builder UI mockups
- [ ] Research SMS provider options (Twilio vs. GHL)

**Medium-Term (Next Month):**

- [ ] Launch Phase 3: Member Management
- [ ] Design automation workflows (pre-built templates)
- [ ] Test bulk messaging with pilot church
- [ ] Gather feedback on export formats (PCO/Breeze compatibility)

**Long-Term (Next Quarter):**

- [ ] Launch Phase 4: Automation & Communication
- [ ] Build analytics dashboard
- [ ] API integrations (if needed)
- [ ] Scale to 10+ churches

---

## Revision History

| Date       | Section | Changes                                  | Author       |
| ---------- | ------- | ---------------------------------------- | ------------ |
| 2025-11-19 | All     | Initial vision document template created | Product Team |

---

**This is a living document.** As we learn from churches, iterate on features, and gather feedback, this vision will evolve. Keep it updated to reflect our current understanding and direction.
