# Volunteer Management - Product Vision

**Last Updated:** 2025-11-16
**Status:** MVP Complete - Volunteer Onboarding Automation

---

## 🎯 The Problem We Solve

### Current Manual Process (Painful)

1. Visitor fills out paper connect card: ☑ "I want to volunteer in Kids Ministry"
2. Church staff manually enters data into spreadsheet
3. Staff member emails Kids Ministry leader: "Hey, new volunteer inquiry"
4. Leader manually sends email with:
   - Background check application link
   - Waiver forms
   - Training schedule
   - Calendar invite for orientation
5. Volunteer gets overwhelmed with manual emails, some fall through cracks
6. No tracking of who's in what stage of onboarding

**Result:** 30-40% of volunteer inquiries never complete onboarding due to manual friction.

---

## ✅ Our Solution: Automated Volunteer Onboarding

### How It Works (Automated)

1. **Visitor fills out connect card** (paper or digital)

   - Checks: ☑ "I want to volunteer"
   - Selects: Kids Ministry, Hospitality, Worship Team, etc.

2. **AI Vision extracts volunteer info**

   - Name, email, phone
   - Volunteer interest: "Kids Ministry"
   - Prayer requests (if any)

3. **Church staff reviews in Review Queue**

   - Connect card appears with volunteer flag
   - Staff assigns to Kids Ministry Leader
   - Enables SMS automation toggle

4. **System automatically triggers onboarding workflow**

   - ✅ Sends welcome email to volunteer
   - ✅ Sends background check link (for Kids Ministry)
   - ✅ Sends waiver forms
   - ✅ Sends calendar invite for orientation
   - ✅ Notifies volunteer leader with contact info
   - ✅ Creates volunteer profile in system

5. **Volunteer leader follows up**
   - Already has volunteer's info in system
   - Can see onboarding stage (forms submitted, background check pending, etc.)
   - Manual follow-up only when needed

**Result:** 80%+ volunteer inquiry completion rate through automated onboarding.

---

## 🔄 Comparison to Prayer Request Feature

Our volunteer system mirrors the prayer request workflow:

| **Prayer Requests**                      | **Volunteer Requests**                             |
| ---------------------------------------- | -------------------------------------------------- |
| Connect card: "Prayer for healing"       | Connect card: "Want to volunteer in Kids Ministry" |
| AI extracts prayer request               | AI extracts volunteer interest + category          |
| Assigned to prayer team member           | Assigned to volunteer leader                       |
| Team member follows up manually          | Automated onboarding + leader follow-up            |
| Track prayer status (Pending → Answered) | Track volunteer status (Inquiry → Active)          |

**Key Difference:** Volunteer onboarding includes **automated workflows** (background checks, forms, calendar invites) while prayer requests are purely manual follow-up.

---

## 🎨 What We Built (MVP)

### ✅ Phase 1: Volunteer Tracking & Assignment

**Features Complete:**

1. **Volunteer Directory** - List all volunteers with search/filter
2. **Volunteer Profiles** - Name, contact info, emergency contacts, background check status
3. **Skills Tracking** - Track certifications (CPR, First Aid, etc.) with expiration dates
4. **Connect Card Assignment** - Route volunteer inquiries to appropriate leaders
5. **Team Categories** - Assign staff to volunteer categories (Hospitality, Kids, Worship, etc.)

**Database Models:**

- `Volunteer` - Profile with background check tracking
- `VolunteerSkill` - Certifications with expiration
- `User.volunteerCategories` - Staff assignments to ministry areas
- `ConnectCard.assignedLeaderId` - Route inquiries to leaders
- `ConnectCard.smsAutomationEnabled` - Enable automated onboarding

**User Flow (Current):**

1. Visitor submits connect card with volunteer interest
2. Staff reviews in Review Queue
3. Staff assigns to volunteer leader (filtered by category)
4. Staff toggles SMS automation (sends welcome message)
5. Leader receives notification, follows up manually
6. If volunteer joins, staff creates volunteer profile with skills/background check

---

## 🚀 What We're NOT Building

### ❌ Shift Scheduling System

**We are NOT replacing:**

- Planning Center Services
- Church Community Builder
- Breeze ChMS volunteer scheduling

**Why not?**

- These tools are purpose-built for complex shift scheduling
- Churches already use and love them
- Our focus is **onboarding automation**, not scheduling

**What we don't do:**

- ❌ Manage weekly shift calendars
- ❌ Track volunteer availability
- ❌ Send shift reminders
- ❌ Check-in/check-out tracking
- ❌ Conflict detection for double-booking

**Integration Strategy:**

- Churches use our system for **volunteer intake**
- Then export to Planning Center for **scheduling**
- Best of both worlds: automated onboarding + specialized scheduling

---

## 🔮 Phase 2: Automated Onboarding Workflows (Planned)

### Vision for Future Automation

When volunteer inquiry comes in:

1. **Instant Welcome Email**

   - Personalized based on ministry area
   - "Thanks for your interest in Kids Ministry!"
   - Next steps outlined

2. **Smart Form Routing**

   - Kids Ministry → Background check application + waiver
   - Worship Team → Audition form + availability survey
   - Hospitality → Training schedule + uniform sizing

3. **Calendar Automation**

   - Send orientation invite based on ministry
   - Kids Ministry: Required training sessions
   - Worship Team: Audition slots

4. **Background Check Integration**

   - Kids Ministry auto-sends background check link
   - Track completion status
   - Notify leader when cleared

5. **Progress Tracking**

   - Inquiry → Forms Sent → Forms Submitted → Background Check → Orientation → Active
   - Visual pipeline in dashboard
   - Automated reminders for incomplete steps

6. **Leader Notifications**
   - "New volunteer inquiry for Kids Ministry"
   - "Sarah completed background check - ready for orientation"
   - "5 volunteers pending orientation scheduling"

### Integration Opportunities

**GoHighLevel (Already integrated):**

- SMS campaigns: "Welcome to Kids Ministry!"
- Email sequences: Onboarding drip campaign
- Calendar booking: Orientation scheduling

**DocuSign / HelloSign (Future):**

- Digital waiver signatures
- Background check consent forms

**Checkr / Sterling (Future):**

- Automated background checks for Kids Ministry
- Track expiration (typically 2-3 years)

**Planning Center API (Future):**

- Export volunteers to Planning Center Services
- Sync basic profile info
- Let Planning Center handle scheduling

---

## 📊 Success Metrics

### Current State (Manual)

- 30-40% volunteer inquiry completion rate
- 2-3 weeks average onboarding time
- 5-10 hours/week staff time on volunteer admin

### Target State (Automated)

- 80%+ volunteer inquiry completion rate
- 3-5 days average onboarding time
- 1-2 hours/week staff time on volunteer admin

### Key Metrics to Track

1. **Inquiry → Active conversion rate** (goal: 80%)
2. **Average onboarding time** (goal: <5 days)
3. **Staff time saved** (goal: 70% reduction)
4. **Background check completion** (goal: 100% for Kids Ministry)
5. **Form submission rate** (goal: 90% within 48 hours)

---

## 🎯 Competitive Advantage

**Why churches choose us over manual process:**

1. **AI Vision Integration** - No manual data entry from paper cards
2. **Automated Workflows** - Background checks, forms, calendar invites sent automatically
3. **Connect Card Native** - Built into existing connect card workflow (not separate system)
4. **SMS Automation** - Text-based onboarding (churches love this)
5. **Background Check Tracking** - Kids Ministry compliance built-in

**Why we don't compete with Planning Center:**

- Different problem: **Onboarding vs Scheduling**
- Complementary: Our system feeds volunteers → Planning Center schedules them
- Better together: Automated intake + specialized scheduling

---

## 🏗️ Architecture Notes

### Database Models (Current)

**Active Models:**

- `Volunteer` - Profile, emergency contacts, background check status
- `VolunteerSkill` - Certifications with verification/expiration
- `User.volunteerCategories` - Staff volunteer leadership assignments
- `ConnectCard.assignedLeaderId` - Route inquiries
- `ConnectCard.smsAutomationEnabled` - Automation flag

**Future Models (Schema exists, not used):**

- `ServingOpportunity` - Ministry role definitions (for Planning Center export)
- `VolunteerAvailability` - If we ever add simple availability tracking
- `VolunteerShift` - If we ever add basic shift tracking (unlikely)

**Why the extra models exist:**

- Future-proofing in case churches request basic scheduling
- Export capabilities to Planning Center
- Currently unused (not building full scheduling)

---

## 📝 Related Features

### Similar Pattern: Prayer Requests

- Connect card extraction → Assignment → Follow-up tracking
- Staff assigns to prayer team member
- Track status (Pending → Prayed For → Answered)
- Manual follow-up (no automation)

### Key Difference: Automation

- Prayer = Manual follow-up only
- Volunteer = **Automated onboarding** + manual follow-up
- Volunteer onboarding requires forms, background checks, training
- Prayer requests are purely relational (no paperwork)

---

## 🎓 User Personas

### Church Staff (Connect Card Reviewer)

**Goal:** Quickly route volunteer inquiries to right leader
**Pain:** Manual email forwarding, volunteers fall through cracks
**Solution:** One-click assignment with automated onboarding kickoff

### Volunteer Leader (Kids Ministry Coordinator)

**Goal:** Get background-checked volunteers ready to serve
**Pain:** Chasing volunteers for forms, background checks expire
**Solution:** Automated form sending, expiration tracking, progress dashboard

### Volunteer (New Member)

**Goal:** Start serving without getting overwhelmed
**Pain:** 10 different emails, unclear next steps, forms get lost
**Solution:** Single welcome message with clear checklist, automated reminders

---

## 🚦 Implementation Status

**✅ Complete (MVP):**

- Volunteer directory and profiles
- Skills tracking with expiration
- Connect card assignment to leaders
- Team volunteer category assignments
- Background check status tracking

**🔄 In Progress:**

- Documentation cleanup (this file!)
- Remove outdated scheduling references

**📋 Planned (Phase 2):**

- Automated email workflows
- Background check integration (Checkr/Sterling)
- Form automation (waiver, consent)
- Calendar invite automation
- Progress pipeline dashboard

**❌ Not Planned:**

- Full shift scheduling system
- Availability management
- Check-in/check-out tracking
- Automated shift reminders

---

**Last Updated:** 2025-11-16
**Document Purpose:** Clarify product vision and prevent scope creep into scheduling
