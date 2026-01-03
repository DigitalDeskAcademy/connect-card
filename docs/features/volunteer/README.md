# Volunteer Onboarding Pipeline - Product Vision

**Status:** 🟢 **Events Phase 2** - Events UI complete (PR #89), resources tracking added (PR #92)
**Worktree:** `volunteer`
**Last Updated:** 2026-01-03
**Focus:** Volunteer Events - Resources, SMS Automation & Testing

---

## 🔄 Worktree Coordination: Export Feature

**Export UI lives in `integrations` worktree.** This worktree provides the data layer.

### This Worktree Owns

| Item                              | Status               |
| --------------------------------- | -------------------- |
| Volunteer data model              | ✅ Complete          |
| `readyForExport` business logic   | ✅ Complete          |
| `getExportableVolunteers()` fn    | ✅ Complete (PR #52) |
| Leader auto-notification          | ✅ Complete (PR #47) |
| Document auto-send                | ✅ Complete (PR #47) |
| `documentsSentAt` tracking        | ✅ Complete (PR #61) |
| Email service with audit logging  | ✅ Complete (PR #61) |
| Token-based BG check confirmation | ✅ Complete (PR #61) |
| Staff BG check review queue       | ✅ Complete (PR #61) |
| Vitest test suite (37 tests)      | ✅ Complete (PR #61) |

### Integrations Worktree Owns

| Item                             | Status               |
| -------------------------------- | -------------------- |
| Export page UI (`/admin/export`) | ✅ Complete (PR #48) |
| Unified CSV export (PCO/Breeze)  | ✅ Complete (PR #48) |
| Field selection                  | ✅ Complete (PR #58) |

### Design Decision: Unified Export

**No separate volunteer export.** A volunteer is just a person with additional attributes. The existing export includes all ChurchMember data; volunteer-specific columns (category, BG check status) are included when the member has a volunteer profile. See `/docs/features/integrations/README.md` for details.

### Interface Contract

```typescript
// lib/data/volunteers.ts - This worktree provides this function
export async function getExportableVolunteers(
  organizationId: string,
  filters?: {
    locationId?: string;
    category?: VolunteerCategoryType;
    onlyNew?: boolean; // Not yet exported
  }
): Promise<ExportableVolunteer[]>;

export type ExportableVolunteer = {
  id: string;
  category: string;
  backgroundCheckStatus: string;
  readyForExport: boolean;
  readyForExportDate: Date | null;
  exportedAt: Date | null;
  // From churchMember relation
  name: string;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
};
```

---

## 🎯 Two-Pool Volunteer Model

Volunteers are handled differently based on whether they selected a specific ministry:

```
"I want to volunteer"
        │
        ├── SPECIFIC MINISTRY ──► Onboarding Pipeline
        │   (Kids, Worship, etc.)  • Auto-send docs
        │                          • Auto-notify leader
        │                          • BG check if required
        │                          • Export when complete
        │
        └── GENERAL ──► Automation Sequence (if enabled)
                        • Day 1: Welcome + top 3 needs
                        • Day 3: Follow-up reminder
                        • Day 7: Timeout → export to ChMS

                        Response 1-3 → Move to specific pipeline
                        Response 4 or timeout → Export to ChMS general
```

### Pool 1: Specific Ministry (Full Onboarding)

| Step | Trigger                        | Action                              |
| ---- | ------------------------------ | ----------------------------------- |
| 1    | Volunteer assigned to ministry | Auto-send ministry-specific docs    |
| 2    | Volunteer assigned to ministry | Auto-notify ministry leader         |
| 3    | BG check required              | Track status until CLEARED          |
| 4    | Docs sent + BG complete        | `readyForExport = true`             |
| 5    | Export                         | Include in volunteer export to ChMS |

### Pool 2: General (Automation Sequence)

| Day   | Action                     | If Response   | If No Response         |
| ----- | -------------------------- | ------------- | ---------------------- |
| **1** | Send welcome + top 3 needs | Process reply | Wait                   |
| **3** | Send friendly follow-up    | Process reply | Wait                   |
| **7** | Timeout                    | —             | Export to ChMS general |

**Response Options:**

- **1, 2, or 3**: Move to specific ministry pipeline (full onboarding)
- **4**: "Add me to list for later" → Export to ChMS general bucket
- **No reply**: Same as 4 after Day 7 timeout

### General Volunteer Message Template

```
Hi {first_name}! Thanks for wanting to volunteer at {church_name}!

We currently have needs in these areas:

1. {need_1_category} - {need_1_description}
2. {need_2_category} - {need_2_description}
3. {need_3_category} - {need_3_description}

Reply 1, 2, or 3 to get connected with a leader.

Reply 4 if none of these fit right now - we'll add you to our
volunteer list and reach out when new opportunities come up!
```

### Data Model Additions Needed

```prisma
model Volunteer {
  // Existing fields...

  // Document tracking (for readyForExport logic)
  documentsSentAt          DateTime?   // When docs were emailed

  // General volunteer automation tracking
  automationStatus         AutomationStatus?  // PENDING | DAY1_SENT | DAY3_SENT | RESPONDED | EXPIRED
  automationStartedAt      DateTime?          // When sequence began
  automationResponseAt     DateTime?          // When they replied

  // Export tracking
  exportedAt               DateTime?          // When exported to ChMS
}

enum AutomationStatus {
  PENDING      // Queued for Day 1 message
  DAY1_SENT    // Day 1 sent, waiting for response
  DAY3_SENT    // Day 3 follow-up sent, waiting
  RESPONDED    // They replied (processing)
  EXPIRED      // Day 7 timeout, exported
}
```

### Church Settings Needed

```prisma
model Organization {
  // ... existing fields

  // General volunteer automation toggle
  generalVolunteerAutomationEnabled  Boolean @default(false)
}
```

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

### 2. Leader Auto-Notification

**Impact:** Ministry leaders don't know when someone wants to volunteer
**Status:** ✅ Complete

**Implemented:**

- [x] Auto-email ministry leader when volunteer assigned
- [x] Include volunteer info (name, email, phone, category)
- [x] Dashboard link for quick access
- [ ] Optional SMS notification (future)

---

### 3. Document Auto-Send

**Impact:** Volunteers wait for someone to manually send them paperwork
**Status:** ✅ Complete

**Implemented:**

- [x] Auto-email volunteer their required docs based on ministry
- [x] Use ministry requirements config (GLOBAL + ministry-specific docs)
- [x] Include background check URL if required
- [x] Include training URL if required

---

### 4. Ready for Export Flag

**Impact:** No clear handoff point to ChMS
**Status:** ✅ Complete

**Implemented:**

- [x] `readyForExport` boolean field on Volunteer model
- [x] Auto-set when BG check done + docs sent (or BG not required)
- [x] "Export Ready" column in volunteer table with filter
- [x] CSV export includes Export Ready status

---

### 5. Volunteer Assignment UX Polish

**Impact:** Staff confused about what actions trigger during connect card review
**Status:** ✅ Complete
**Location:** Connect Card Review Queue (`/church/{slug}/admin/connect-cards/review/{batchId}`)

**Implemented:**

- [x] Renamed "Send Background check information" → "Send onboarding documents" (clearer intent)
- [x] Dynamic helper text shows what will be sent (docs, training, BG check link)
- [x] Disabled send checkbox when volunteer has no email (prevents silent failures)
- [x] Clear assigned leader automatically when category changes to incompatible one
- [x] Deep link to team page includes category context (`?highlight=Kids%20Ministry`)
- [x] Leader dropdown shows email in parentheses for verification
- [x] Auto-check "Send message to leader" when a leader is selected

**Future Enhancements:**

- [ ] Preview of what documents will be sent before checkbox is checked
- [ ] Auto-select lone leader when only one matches category
- [ ] "My Volunteers" queue for leaders (filter by assignedLeaderId)

---

## 📊 Implementation Progress

| Priority | Feature                       | Status | PR  |
| -------- | ----------------------------- | ------ | --- |
| 1        | Leader notification           | ✅     | #47 |
| 2        | Document auto-send            | ✅     | #47 |
| 3        | Ready for export flag         | ✅     | #52 |
| 4        | getExportableVolunteers()     | ✅     | #52 |
| 5        | Check All toggle fix          | ✅     | #53 |
| 6        | Welcome email on activation   | ✅     | #61 |
| 7        | Token-based BG confirmation   | ✅     | #61 |
| 8        | Staff BG check review queue   | ✅     | #61 |
| 9        | Email service + audit logging | ✅     | #61 |
| 10       | Vitest test suite (37 tests)  | ✅     | #61 |
| 11       | Arcjet rate limiting (public) | ✅     | #61 |
| 12       | Volunteer Assignment UX       | ✅     | -   |
| 13       | Event resources tracking      | ✅     | #92 |
| 14       | GHL SMS parsing module        | ✅     | #92 |
| 15       | E2E tests for events UI       | ✅     | #92 |

---

## 🎯 Phase 2: MVP Onboarding Automation (Dec 2025)

**Status:** ✅ **COMPLETE** - PR #61 merged Dec 9, 2025
**Decided:** 2025-12-05 | **Completed:** 2025-12-09

### Design Decisions

These decisions were made through structured Q&A to define the MVP automation system:

| #   | Question            | Decision                                                                                                                   |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Entry point         | Connect card (physical + digital) is primary entry                                                                         |
| 2   | Who processes       | Small centralized team; system handles ministry-specific logic based on category                                           |
| 3   | Who owns onboarding | **System owns entire process**; leaders informed, not tasked                                                               |
| 4   | Leader involvement  | Dashboard pull, not email push. Opt-in alerts per category (email/SMS/both)                                                |
| 5   | BG check tracking   | Volunteer self-reports → staff review queue. Manual override available. Future: we process directly (revenue opportunity)  |
| 6   | Who pays for BG     | Simple toggle: Church pays / Volunteer pays (no subsidized option)                                                         |
| 7   | BG providers        | Protect My Ministry, Sterling, Ministry Safe, Custom. Explore affiliate partnerships.                                      |
| 8   | Ideal sequence      | 10-step automated flow, only 3 manual touchpoints                                                                          |
| 9   | Staff dashboard     | Stats banner (Awaiting BG, Pending Review, Ready to Export, Stalled 7+d). Clickable filters. No elaborate pipeline/kanban. |
| 10  | Our role            | Onboarding bridge → export to ChMS (including BG status, date, expiry)                                                     |

### Automation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1: CONNECT CARD PROCESSED                                      │
│  Staff assigns volunteer category, clicks "Process"                  │
│  Owner: Staff (manual)                                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 2-4: AUTOMATION TRIGGERS (immediate)                           │
│  • Welcome email: docs + BG check link (if required)                 │
│  • Payment info included ("no cost" vs "$XX fee")                    │
│  • documentsSentAt timestamp recorded                                │
│  Owner: System (automatic)                                           │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 5: FOLLOW-UP (5-7 days later)                                  │
│  • Volunteer receives "Have you completed your BG check?"            │
│  • Includes unique confirmation link                                 │
│  Owner: System (automatic) - refinement TBD                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 6: VOLUNTEER SELF-REPORTS                                      │
│  • Clicks confirmation link                                          │
│  • Status → PENDING_REVIEW (not auto-cleared)                        │
│  Owner: Volunteer                                                    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 7-8: STAFF VERIFICATION                                        │
│  • Appears in review queue                                           │
│  • Staff checks provider portal, clicks "Confirm Cleared"            │
│  Owner: Staff (manual)                                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 9: READY FOR EXPORT                                            │
│  • readyForExport: true (auto-set)                                   │
│  • Appears in export queue                                           │
│  Owner: System (automatic)                                           │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Step 10: EXPORT TO CHMS                                             │
│  • Staff exports batch (CSV with BG status, date, expiry)            │
│  • Volunteer moves to Planning Center for scheduling                 │
│  Owner: Staff (manual)                                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Total manual touchpoints:** 3 (process card, verify BG check, export)
**Everything else is automated.**

### Stats Banner Design

Staff sees at-a-glance numbers on the volunteers page:

```
┌─────────────────┬──────────────────┬─────────────────┬─────────────────┐
│ Awaiting BG     │ Pending Review   │ Ready to Export │ Stalled (7+ d)  │
│ Check           │ (needs verify)   │                 │                 │
│      5          │       3          │       8         │       2         │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

- **Awaiting BG Check:** Docs sent, waiting on volunteer to complete
- **Pending Review:** Volunteer self-reported completion, needs staff verification
- **Ready to Export:** Cleared and ready for ChMS
- **Stalled (7+ days):** Docs sent but no response

Each stat clickable → filters the table below.

### Leader Notification System

- **Default:** No automatic emails (prevents inbox fatigue)
- **Dashboard:** Leaders see their category's volunteers on-demand
- **Opt-in alerts:** Per-category toggle with preference (email / SMS / both)
- Leaders choose to get notified when there's a crunch/event coming

### Implementation Phases

#### Phase 1: Schema & Foundation

| Task | Description                                                                         |
| ---- | ----------------------------------------------------------------------------------- |
| 1.1  | Add `PENDING_REVIEW` to BackgroundCheckStatus enum                                  |
| 1.2  | Simplify payment toggle: remove `SUBSIDIZED`, keep `CHURCH_PAID` / `VOLUNTEER_PAID` |

#### Phase 2: Core Automation

| Task | Description                                                      |
| ---- | ---------------------------------------------------------------- |
| 2.1  | Wire `processVolunteer` → send welcome email with docs + BG link |
| 2.2  | Update welcome email to include payment info                     |
| 2.3  | Set `documentsSentAt` timestamp when email sent                  |

#### Phase 3: Volunteer Self-Report

| Task | Description                                                 |
| ---- | ----------------------------------------------------------- |
| 3.1  | Generate unique token-based confirmation link               |
| 3.2  | Build public endpoint to mark volunteer as `PENDING_REVIEW` |
| 3.3  | Add follow-up email template with confirm link              |

#### Phase 4: Staff Review Queue

| Task | Description                                                     |
| ---- | --------------------------------------------------------------- |
| 4.1  | Build review queue UI (volunteers with `PENDING_REVIEW` status) |
| 4.2  | One-click verification action ("Confirm Cleared" / "Not Yet")   |
| 4.3  | Bulk verification support                                       |

#### Phase 5: Dashboard Stats

| Task | Description                             |
| ---- | --------------------------------------- |
| 5.1  | Build stats banner component            |
| 5.2  | Add stats data query (count per bucket) |
| 5.3  | Wire clickable filters                  |

#### Phase 6: Leader Notifications

| Task | Description                                                            |
| ---- | ---------------------------------------------------------------------- |
| 6.1  | Add leader notification preferences (per-category: off/email/SMS/both) |
| 6.2  | Trigger notifications when enabled                                     |

#### Phase 7: Export Enhancement

| Task | Description                                                            |
| ---- | ---------------------------------------------------------------------- |
| 7.1  | Update CSV export to include BG status, cleared date, expiry, provider |

### Future Revenue Opportunity

**Direct BG Check Processing:**

- Partner with providers (affiliate model)
- Church pays us, we handle submission + tracking
- Full integration - status updates automatically
- Premium feature with margin built in

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

**✅ Complete:**

- Connect card volunteer interest extraction (AI Vision)
- Volunteer category assignment (Hospitality, Kids, Worship, etc.)
- Volunteer directory with TanStack Table (sorting, search, filtering)
- Background check status tracking (column + filter)
- CSV export (PCO/Breeze compatible format)
- Settings UI for volunteer onboarding:
  - Document upload/management (S3 integration)
  - Ministry requirements config (which ministries need BG checks, training)
  - Background check provider settings (URL-based for liability)
  - Template library (10 suggested docs with priority badges)
- Leader auto-notification (email ministry leader when volunteer assigned)
- Document auto-send (email volunteer their required docs based on ministry)
- Ready for export flag + filter (auto-set when BG check done or not required)

**📋 Phase 3: Volunteer Events MVP (HIGH PRIORITY):**

Based on pilot church demo feedback (Dec 2025), churches need simple event capacity tracking:

- Create events with volunteer needs ("Sunday Kids Check-in - Dec 22, need 5")
- At-a-glance capacity status (Full / Partial / Needs Help)
- Quick outreach to fill gaps via GHL (SMS/Email)
- Track confirmations and attendance

**NOT building:** Full scheduling, shift management, time tracking (Planning Center's job).
**See:** [Events Spec](/docs/archive/2025-12-volunteer-events-spec.md) for detailed requirements.

**📋 Future (Planning Center Integration):**

1. **ChMS API Integration** - Direct API push to Planning Center when ready

**📋 Future (Bulk Messaging):**

- Filter volunteers by ministry/location/status/background check
- Compose messages with merge tags ({first_name}, etc.)
- Send via GHL (SMS and/or Email)

**❌ Not Building (ChMS handles these):**

- Elaborate pipeline/kanban dashboard
- Permanent volunteer directory
- Skills/certification long-term tracking
- Shift scheduling
- Availability management
- Check-in/check-out tracking
- Volunteer hours tracking

---

**Last Updated:** 2025-12-17
**Document Purpose:** Clarify product vision - onboarding automation + simple event tracking
**Strategic Position:** Feed Planning Center, don't compete with it
**Current Priority:** Phase 3 - Volunteer Events MVP (from demo feedback)
**Recent PRs:** #61 (Phase 2 MVP), #53 (Check All fix), #52 (export tracking), #47 (email automation)

---

## 📚 Related Documentation

- [Volunteer Events Spec](/docs/archive/2025-12-volunteer-events-spec.md) - Event capacity tracking (Phase 3)
- [Bulk Messaging Spec](./bulk-messaging-spec.md) - Detailed spec for volunteer outreach feature
- [ChMS Export](/docs/features/integrations/README.md) - Export volunteers to Planning Center
- [Demo Feedback](/docs/archive/2025-12-demo-feedback.md) - Pilot church requirements
