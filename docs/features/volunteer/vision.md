# Volunteer Onboarding Pipeline - Product Vision

**Status:** 🟡 **IN PROGRESS** - Onboarding features in development
**Worktree:** `/church-connect-hub/volunteer`
**Branch:** `feature/volunteer-management`
**Last Updated:** 2025-11-27
**Focus:** Onboarding Automation (Not Volunteer Management)

---

## 🚨 Assigned Fixes

**These issues are assigned to this worktree.**

### 1. Performance: N+1 Query in Volunteer Stats

**Impact:** Multiple queries per volunteer in stats calculations
**Risk:** Slow dashboard as volunteer count grows

**The Fix:** Optimize queries to batch fetch related data.

**Status:** ✅ N/A - Simplified scope (we're an onboarding bridge, not a volunteer management platform)

**Resolution:** The existing queries in `lib/data/volunteers.ts` are already well-optimized with `Promise.all` and proper Prisma includes. Since we're keeping the feature simple (onboarding pipeline → sync to Planning Center), the complex volunteer analytics that would require N+1 optimization won't be built.

---

### 2. Onboarding Status Tracking

**Impact:** Can't track volunteer journey from inquiry to ready
**Status:** 🔄 In progress

**Required:**

- [ ] Pipeline stage tracking (Inquiry → Welcome → Documents → Ready)
- [ ] Visual pipeline dashboard
- [ ] Status update actions

---

### 3. Onboarding Pipeline Dashboard

**Impact:** No visibility into where volunteers are stuck
**Status:** [ ] Planned

**Required:**

- [ ] Pipeline view UI
- [ ] Filter by stage
- [ ] Stuck volunteer alerts

---

## 📊 Fix Progress

| Priority | Issue               | Status | PR  |
| -------- | ------------------- | ------ | --- |
| 1        | N+1 Query           | ✅ N/A | -   |
| 2        | Onboarding tracking | 🔄     | -   |
| 3        | Pipeline dashboard  | [ ]    | -   |

---

## 🎯 Strategic Positioning: We Feed Planning Center, Not Replace It

**What Planning Center (Church Center) Already Does:**

- Volunteer directory and profiles
- Skills/certification tracking
- Background check management
- Shift scheduling and availability
- Check-in systems
- Volunteer hours tracking

**The Gap We're Filling:**

- Automated volunteer inquiry intake from connect cards
- Automated onboarding workflows (welcome, documents, leader intros)
- Routing volunteer inquiries to the right ministry leader
- SMS-based onboarding automation
- Tracking onboarding progress from inquiry → Planning Center ready

**Our Role:** Bridge the gap between "I want to volunteer" (connect card) and "Ready for shift scheduling" (Planning Center)

---

## 🎯 The Problem We Solve

### Current Manual Process (Painful)

1. Visitor fills out paper connect card: ☑ "I want to volunteer in Kids Ministry"
2. Church staff manually enters data into spreadsheet
3. Staff member manually emails Kids Ministry leader: "Hey, new volunteer inquiry"
4. Leader manually sends 5+ emails:
   - Welcome message
   - Background check application link
   - Safe sanctuary policy PDF
   - Waiver forms
   - Training video link
   - Calendar invite for orientation
   - Personal introduction
5. Volunteer gets overwhelmed with manual emails spread over days
6. No tracking of who's in what stage of onboarding
7. No automated reminders for incomplete steps
8. Leader manually checks if background check cleared
9. Once ready, manually add to Planning Center for scheduling

**Result:** 30-40% of volunteer inquiries never complete onboarding due to manual friction and lack of follow-up.

---

## ✅ Our Solution: Automated Volunteer Onboarding Pipeline

**Connect Card Inquiry → Automated Onboarding → Planning Center Ready**

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
   - Staff assigns to Kids Ministry Leader (Jane)
   - Enables SMS automation toggle

4. **System automatically triggers onboarding workflow**

   - ✅ Welcome SMS: "Hi Sarah! Thanks for volunteering with Kids Ministry. You've been connected with Jane (Kids Ministry Leader). Check your email for next steps."
   - ✅ Welcome email with ministry overview document
   - ✅ Background check form link (for Kids Ministry)
   - ✅ Safe sanctuary policy PDF
   - ✅ Leader introduction: Jane's photo, bio, phone, email
   - ✅ Calendar link for orientation dates
   - ✅ Notification to Jane: "Sarah assigned to you - she's received welcome packet"

5. **Volunteer leader monitors progress**

   - Dashboard shows Sarah's onboarding status
   - See which documents sent, background check status
   - Orientation date scheduled
   - Manual follow-up only when needed (stuck in background check, etc.)

6. **Staff tracks onboarding pipeline**

   - Visual pipeline: Inquiry → Welcome Sent → Documents Shared → Leader Connected → Orientation Set → Ready
   - Automated reminders for incomplete steps
   - Background check expiration tracking

7. **Once ready, export to Planning Center**
   - Status: "Ready for Planning Center"
   - Volunteer added to Planning Center for shift scheduling
   - Our job is done - Planning Center takes over

**Result:** 80%+ volunteer inquiry completion rate through automated onboarding + clear handoff to Planning Center.

---

## 🎨 What We're Building (Onboarding Pipeline)

### ✅ Phase 1: Connect Card Assignment & Automation Trigger

**Features:**

1. **Connect Card Assignment** - Route volunteer inquiries to appropriate leaders
2. **Team Categories** - Assign staff to volunteer categories (Hospitality, Kids, Worship, etc.)
3. **SMS Automation Toggle** - Enable automated onboarding workflows
4. **Leader Notification** - Alert leader when volunteer assigned

**Database Schema:**

- `ConnectCard.volunteerCategory` - Which ministry (Hospitality, Kids, Worship, etc.)
- `ConnectCard.assignedLeaderId` - Route to specific volunteer leader
- `ConnectCard.smsAutomationEnabled` - Trigger automated onboarding
- `ConnectCard.volunteerOnboardingStatus` - Track progress (Inquiry → Ready)
- `ConnectCard.volunteerDocumentsSent` - Track which documents sent
- `ConnectCard.volunteerOrientationDate` - When orientation scheduled
- `User.volunteerCategories` - Staff volunteer leadership assignments

**User Flow:**

1. Visitor submits connect card with volunteer interest
2. Staff reviews in Review Queue
3. Staff assigns to volunteer leader (filtered by category)
4. Staff toggles SMS automation (triggers onboarding workflow)
5. Leader receives notification with volunteer's info
6. System sends automated welcome message, documents, leader intro
7. Staff tracks progress in onboarding pipeline

---

### 🚀 Phase 2: Automated Onboarding Workflows (Next)

#### 🆕 Dynamic Volunteer Needs System

**Concept:** Churches have changing volunteer needs. Instead of generic "what do you want to do?", we show them where help is actually needed.

**Church Settings (Staff Configurable):**

```typescript
// Example church volunteer needs configuration
{
  currentNeeds: [
    { category: "KIDS_MINISTRY", urgency: "high", description: "Sunday morning helpers" },
    { category: "PARKING", urgency: "medium", description: "Parking team members" },
    { category: "HOSPITALITY", urgency: "low", description: "Greeters for second service" }
  ],
  generalMessage: "If none of these interest you, we'll keep you in our general pool and reach out when new opportunities arise.",
  lastUpdated: "2025-11-26"
}
```

**Welcome Message Flow:**

1. **Volunteer signs up** (via connect card or digital form)
2. **System checks current church needs**
3. **Welcome SMS/Email sent:**

   ```
   Hi Sarah! Thank you for reaching out to volunteer at New Life Church!

   We currently have needs in these areas:
   • Kids Ministry (high need) - Sunday morning helpers
   • Parking Team - Parking team members
   • Hospitality - Greeters for second service

   Reply with the number of your interest (1, 2, or 3).

   If none of these fit, reply "GENERAL" and we'll keep you in our
   volunteer pool and reach out when new opportunities arise.
   ```

4. **Response triggers next workflow:**
   - **Reply "1" (Kids Ministry)** → Background check form + Safe sanctuary policy + Leader intro
   - **Reply "2" (Parking)** → Training video + Calendar invite for orientation
   - **Reply "3" (Hospitality)** → Greeter guide + Calendar invite
   - **Reply "GENERAL"** → Confirmation + "We'll be in touch when needs change"

**Staff Settings UI (Church Admin):**

- [ ] Add/remove current needs
- [ ] Set urgency level (high/medium/low)
- [ ] Custom descriptions per need
- [ ] General fallback message
- [ ] Preview welcome message
- [ ] History log of need changes

**Database Schema:**

```prisma
model VolunteerNeed {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  category       VolunteerCategoryType
  urgency        VolunteerNeedUrgency  @default(MEDIUM)
  description    String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, category])
}

enum VolunteerNeedUrgency {
  HIGH
  MEDIUM
  LOW
}
```

---

**Planned Features:**

1. **Instant Welcome Message**

   - SMS: "Hi Sarah! Thanks for volunteering. You've been connected with Jane..."
   - Email: Ministry overview, next steps
   - **NEW:** Dynamic needs-based welcome (see above)

2. **Smart Document Routing**

   - Kids Ministry → Background check form + Safe sanctuary policy
   - Worship Team → Audition form + Availability survey
   - Hospitality → Training video + Uniform sizing

3. **Leader Introduction**

   - Leader's photo, bio, contact info
   - Personal message from leader
   - "Jane will reach out within 24 hours"

4. **Calendar Automation**

   - Orientation calendar link based on ministry
   - Kids Ministry: Required training sessions
   - Worship Team: Audition slots

5. **Background Check Integration**

   - Recommended partner: Protect My Ministry (most popular with churches)
   - Affiliate model first, API integration later
   - Track completion status + expiration
   - Notify leader when cleared
   - Automated reminders before expiry (30 days, 7 days)

6. **Progress Tracking Pipeline**

   - Inquiry → Welcome Sent → Documents Shared → Leader Connected → Orientation Set → Ready
   - Visual pipeline dashboard
   - Automated reminders for incomplete steps

7. **Planning Center Export**
   - Mark as "Ready for Planning Center"
   - Export volunteer data to Planning Center API
   - Status: ADDED_TO_PCO (final state)

---

## 🚀 What We're NOT Building

### ❌ Volunteer Management System

**We are NOT replacing:**

- Planning Center Services
- Church Community Builder
- Breeze ChMS volunteer management

**Why not?**

- These tools are purpose-built for volunteer management
- Churches already use and love them
- Our focus is **onboarding automation**, not ongoing management

**What we don't do:**

- ❌ Permanent volunteer directory (Planning Center's job)
- ❌ Skills/certification tracking long-term (Planning Center's job)
- ❌ Shift scheduling (Planning Center's job)
- ❌ Availability management (Planning Center's job)
- ❌ Check-in/check-out tracking (Planning Center's job)
- ❌ Volunteer hours tracking (Planning Center's job)

**Integration Strategy:**

- Churches use our system for **volunteer inquiry intake and automated onboarding**
- Then export to Planning Center for **ongoing management and scheduling**
- Best of both worlds: automated onboarding + specialized volunteer management

---

## ⚙️ Settings & Configuration

Churches need a centralized settings area to configure volunteer management features.

### Settings Areas

**1. Volunteer Categories Management**
`/church/[slug]/admin/settings/volunteers/categories`

- View/add/edit custom categories beyond defaults
- Set category-specific requirements (e.g., "Background check required")
- Reorder categories (priority/display order)

**2. Background Check Document Management**
`/church/[slug]/admin/settings/volunteers/background-checks`

- Upload background check instruction documents (PDF, DOCX)
- Configure which categories require background checks
- Set background check expiration periods (default: 2 years)
- Email template editor for sending background check info

**3. Leader Notification Templates**
`/church/[slug]/admin/settings/volunteers/notifications`

- Email template for "New volunteer assigned to you"
- SMS template (optional) for leader notifications
- Customize message based on volunteer category

**4. Volunteer Category Leaders**
`/church/[slug]/admin/settings/volunteers/category-leaders`

- Assign team members to lead specific categories
- Multi-category assignments
- Primary vs backup leaders
- Auto-assignment rules (round-robin, capacity-based)

**5. Default Workflow Settings**
`/church/[slug]/admin/settings/volunteers/defaults`

- Default category (currently hardcoded to GENERAL)
- Auto-assign to leader (yes/no)
- Auto-send notifications (yes/no)

### Settings Database Schema

```prisma
// Custom volunteer categories
VolunteerCategoryCustom {
  id, organizationId, categoryKey, displayName,
  description, requiresBackgroundCheck,
  isActive, displayOrder, createdAt, updatedAt
}

// Background check documents
BackgroundCheckDocument {
  id, organizationId, fileName, fileUrl,
  documentType (INSTRUCTIONS | FORM | CONSENT),
  isActive, version, uploadedAt, uploadedBy
}

// Notification templates
NotificationTemplate {
  id, organizationId, templateType,
  subject, bodyHtml, bodyText,
  applicableCategories[], isActive
}

// Category leader assignments
CategoryLeaderAssignment {
  id, organizationId, userId, categoryKey,
  isPrimary, notificationPreference,
  createdAt
}
```

---

## 📊 Success Metrics

### Current State (Manual)

- 30-40% volunteer inquiry completion rate
- 2-3 weeks average onboarding time
- 5-10 hours/week staff time on volunteer admin
- Volunteers receive 5+ separate emails over days

### Target State (Automated)

- 80%+ volunteer inquiry completion rate
- 3-5 days average onboarding time
- 1-2 hours/week staff time on volunteer admin
- Volunteers receive 1 coordinated welcome packet instantly

### Key Metrics to Track

1. **Inquiry → Ready conversion rate** (goal: 80%)
2. **Average onboarding time** (goal: <5 days)
3. **Staff time saved** (goal: 70% reduction)
4. **Background check completion** (goal: 100% for Kids Ministry)
5. **Volunteer satisfaction** (goal: 90%+ "clear next steps")

---

## 🚦 Implementation Status

**✅ Complete (Phase 1):**

- Connect card volunteer interest extraction (AI Vision)
- Volunteer category assignment (Hospitality, Kids, Worship, etc.)
- Assign to volunteer leader (filtered by category)
- SMS automation toggle in review queue
- Team volunteer category assignments

**🔄 In Progress:**

- Onboarding status tracking (Inquiry → Ready)
- Onboarding pipeline dashboard
- Document tracking (which forms sent)

**📋 Planned (Phase 2):**

- Automated SMS/email workflows (welcome, documents, leader intro)
- Background check integration (Checkr/Sterling)
- Calendar invite automation (orientation)
- Progress tracking with automated reminders
- Planning Center API export
- Settings & configuration UI

**📋 Planned (Phase 4): Bulk Messaging**

**Spec:** `/docs/features/volunteer-management/bulk-messaging-spec.md`

- Filter volunteers by ministry/location/status/background check
- Compose messages with merge tags ({first_name}, etc.)
- Attach calendar links and documents
- Send via GHL (SMS and/or Email)
- Delivery tracking (sent, delivered, opened)
- Message history and templates

**❌ Not Planned:**

- Permanent volunteer directory (Planning Center's job)
- Skills/certification long-term tracking (Planning Center's job)
- Shift scheduling system (Planning Center's job)
- Availability management (Planning Center's job)
- Check-in/check-out tracking (Planning Center's job)

---

**Last Updated:** 2025-11-27
**Document Purpose:** Clarify product vision - we're building onboarding automation, not volunteer management
**Strategic Position:** Feed Planning Center, don't compete with it

---

## 📚 Related Documentation

- [Bulk Messaging Spec](./bulk-messaging-spec.md) - Detailed spec for volunteer outreach feature
- [Church Software Sync](/docs/features/integrations/church-software-sync-spec.md) - Export volunteers to Planning Center
