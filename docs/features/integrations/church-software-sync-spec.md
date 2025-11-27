# Church Software Sync - Feature Specification

**Status:** Planning
**Worktree:** `/church-connect-hub/connect-card` (recommended)
**Target Route:** `/church/[slug]/admin/integrations`
**Last Updated:** 2025-11-26

---

## Executive Summary

Churches use Church Management Software (ChMS) like Planning Center, Breeze, or Church Community Builder as their system of record. Our connect card system captures visitor data - but that data needs to flow INTO their existing ChMS.

**This feature bridges that gap** with:

1. **Manual CSV Export** - Download data formatted for import into any ChMS
2. **Direct API Sync** - One-click sync to connected Planning Center/Breeze accounts

---

## Industry Research

### How Similar Products Handle Data Export

| Product          | Export Methods                   | UI Pattern                           | Strengths                         |
| ---------------- | -------------------------------- | ------------------------------------ | --------------------------------- |
| **HubSpot**      | CSV, Native integrations, API    | Settings → Integrations hub          | Clean OAuth flow, field mapping   |
| **Mailchimp**    | CSV, Direct integrations         | Audience → Export + Integrations tab | Bulk selection, scheduled exports |
| **Stripe**       | CSV, API webhooks                | Dashboard → Reports → Export         | Date range filters, clean UI      |
| **Typeform**     | CSV, Zapier, Native integrations | Results → Integrations               | Per-response or bulk export       |
| **Jotform**      | CSV, PDF, Integrations tab       | Submissions → Export                 | Multiple format options           |
| **Google Forms** | Sheets link, CSV                 | Responses → Spreadsheet              | Automatic sync option             |

### Church Software Ecosystem

| ChMS                         | Market Share | Import Method   | API Available |
| ---------------------------- | ------------ | --------------- | ------------- |
| **Planning Center**          | ~40%         | CSV import, API | Yes (REST)    |
| **Breeze**                   | ~25%         | CSV import, API | Yes (REST)    |
| **Church Community Builder** | ~15%         | CSV import      | Limited       |
| **Realm (ACS)**              | ~10%         | CSV import      | Limited       |
| **Elvanto**                  | ~5%          | CSV import, API | Yes           |
| **Other/Custom**             | ~5%          | CSV only        | Varies        |

**Key Insight:** CSV export covers 100% of use cases. API integration covers the top 2-3 systems (Planning Center, Breeze) for a premium experience.

---

## Problem Statement

### Current Pain Points

1. **Manual Data Entry**

   - Staff processes connect card in our system
   - Then manually re-enters same data into Planning Center
   - Double work, error-prone, time-consuming

2. **Data Format Mismatch**

   - Our fields don't match their ChMS fields exactly
   - Staff has to mentally map "Visit Type" → "Member Status"
   - Custom fields get lost in translation

3. **No Sync Tracking**

   - No way to know which records have been exported
   - Risk of duplicate entries in ChMS
   - No audit trail

4. **Timing Friction**
   - Weekly batch export? Per-card? Automatic?
   - Churches have different workflows

---

## Solution: Integrations Hub

A dedicated page (`/integrations`) that provides:

1. **Export Center** - CSV downloads with ChMS-specific formatting
2. **Connected Accounts** - OAuth connections to Planning Center, Breeze
3. **Sync History** - Audit trail of what was exported/synced when
4. **Field Mapping** - Customize how our fields map to their ChMS fields

---

## User Interface Design

### Main Integrations Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Integrations                                                        │
│  Connect your church software to sync visitor data automatically     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  CONNECTED ACCOUNTS                                              ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐               ││
│  │  │  [Planning Center]  │  │  [Breeze ChMS]      │               ││
│  │  │  ✅ Connected       │  │  ○ Not Connected    │               ││
│  │  │  Last sync: 2h ago  │  │                     │               ││
│  │  │  [Sync Now] [Manage]│  │  [Connect Account]  │               ││
│  │  └─────────────────────┘  └─────────────────────┘               ││
│  │                                                                  ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐               ││
│  │  │  [Elvanto]          │  │  [CSV Export]       │               ││
│  │  │  ○ Coming Soon      │  │  ✅ Always Available││
│  │  │                     │  │                     │               ││
│  │  │  [Request Access]   │  │  [Export Data →]    │               ││
│  │  └─────────────────────┘  └─────────────────────┘               ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  RECENT SYNC ACTIVITY                                            ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  Today, 2:34 PM    Planning Center    47 contacts synced    ✅  ││
│  │  Yesterday         CSV Export         23 contacts exported  📥  ││
│  │  Nov 24            Planning Center    31 contacts synced    ✅  ││
│  │  Nov 23            Planning Center    Failed (auth expired) ❌  ││
│  │                                                                  ││
│  │                                          [View Full History →]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### CSV Export Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Export Data                                               [← Back] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Select Data Source                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ◉ Connect Cards (Processed)     247 records                    ││
│  │  ○ Connect Cards (All)           312 records                    ││
│  │  ○ Volunteers                    89 records                     ││
│  │  ○ Prayer Requests               156 records                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Step 2: Filter Records                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐│
│  │ Location ▼   │ │ Date Range ▼ │ │ Export Status ▼              ││
│  │ All          │ │ Last 30 days │ │ Not yet exported             ││
│  └──────────────┘ └──────────────┘ └──────────────────────────────┘│
│                                                                      │
│  Matching records: 47                                                │
│                                                                      │
│  Step 3: Choose Format                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ◉ Planning Center Format                                       ││
│  │    Columns: First Name, Last Name, Email, Phone, etc.           ││
│  │    Ready for People → Import                                    ││
│  │                                                                  ││
│  │  ○ Breeze Format                                                ││
│  │    Columns: Name, Email Address, Mobile Phone, etc.             ││
│  │    Ready for People → Import People                             ││
│  │                                                                  ││
│  │  ○ Generic CSV                                                  ││
│  │    All fields, standard column names                            ││
│  │    Compatible with any system                                   ││
│  │                                                                  ││
│  │  ○ Custom Format                                                ││
│  │    Choose which fields to include                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Step 4: Download                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ☑ Mark records as "Exported" after download                    ││
│  │  ☑ Include header row                                           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│                                              [Download CSV →]        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Planning Center OAuth Connection

```
┌─────────────────────────────────────────────────────────────────────┐
│  Connect Planning Center                                   [← Back] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                  ││
│  │     [Planning Center Logo]                                       ││
│  │                                                                  ││
│  │     Connect your Planning Center account to automatically       ││
│  │     sync visitor data from connect cards.                       ││
│  │                                                                  ││
│  │     What we'll sync:                                            ││
│  │     ✓ Name, email, phone, address                               ││
│  │     ✓ Visit type (First Time → "Visitor" status)                ││
│  │     ✓ Volunteer interests (→ Tags)                              ││
│  │     ✓ Prayer requests (→ Notes, if enabled)                     ││
│  │                                                                  ││
│  │     We will NOT:                                                ││
│  │     ✗ Access giving/financial data                              ││
│  │     ✗ Modify existing people records                            ││
│  │     ✗ Delete any data from Planning Center                      ││
│  │                                                                  ││
│  │                   [Connect with Planning Center]                 ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  By connecting, you agree to our Privacy Policy and Terms of Service│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Sync Settings (After Connection)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Planning Center Settings                                  [← Back] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Connection Status                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ✅ Connected as: admin@firstbaptist.org                        ││
│  │  Organization: First Baptist Church                             ││
│  │  Last sync: Today at 2:34 PM (47 contacts)                      ││
│  │                                                    [Disconnect] ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Sync Settings                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                  ││
│  │  Sync Mode:                                                     ││
│  │  ◉ Manual (click "Sync Now" to push data)                       ││
│  │  ○ Automatic (sync when connect card is processed)              ││
│  │                                                                  ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │                                                                  ││
│  │  What to Sync:                                                  ││
│  │  ☑ Connect Cards (processed status)                             ││
│  │  ☐ Volunteers (Planning Center ready)                           ││
│  │  ☐ Prayer Requests (as notes on person record)                  ││
│  │                                                                  ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │                                                                  ││
│  │  Duplicate Handling:                                            ││
│  │  ◉ Skip if email already exists in Planning Center              ││
│  │  ○ Update existing record if email matches                      ││
│  │  ○ Always create new (may cause duplicates)                     ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Field Mapping                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Our Field           →    Planning Center Field                 ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │  Name                →    First Name + Last Name                ││
│  │  Email               →    Primary Email                         ││
│  │  Phone               →    Mobile Phone                          ││
│  │  Address             →    Primary Address                       ││
│  │  Visit Type          →    Membership Status ▼                   ││
│  │    "First Time"      →      "Visitor"                           ││
│  │    "Regular"         →      "Attendee"                          ││
│  │    "Member"          →      "Member"                            ││
│  │  Volunteer Interest  →    Tags (auto-create) ▼                  ││
│  │  Prayer Request      →    ☐ Add as Note                         ││
│  │                                                                  ││
│  │                                      [Edit Field Mapping]        ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│                                    [Save Settings]  [Sync Now →]    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Field Mapping Reference

| Our Field       | Planning Center           | Breeze           | Generic CSV      |
| --------------- | ------------------------- | ---------------- | ---------------- |
| `name`          | `first_name`, `last_name` | `name`           | `Full Name`      |
| `email`         | `emails[0].address`       | `email_address`  | `Email`          |
| `phone`         | `phone_numbers[0].number` | `mobile_phone`   | `Phone`          |
| `address`       | `addresses[0].*`          | `street_address` | `Address`        |
| `visitType`     | `membership` (mapped)     | `status`         | `Visit Type`     |
| `interests[]`   | `tags`                    | `tags`           | `Interests`      |
| `prayerRequest` | `notes` (optional)        | `notes`          | `Prayer Request` |
| `scannedAt`     | `created_at`              | `created_on`     | `Date`           |
| `locationName`  | `campus`                  | `campus`         | `Location`       |

### Database Additions

```prisma
/// Integration connection for external ChMS
model ChMSIntegration {
  id             String   @id @default(cuid())
  organizationId String

  // Provider info
  provider       ChMSProvider  // PLANNING_CENTER, BREEZE, etc.

  // OAuth tokens
  accessToken    String
  refreshToken   String?
  expiresAt      DateTime?

  // Provider-specific IDs
  externalOrgId  String?       // Their organization ID

  // Settings
  syncMode       SyncMode      @default(MANUAL)
  syncConnectCards Boolean     @default(true)
  syncVolunteers   Boolean     @default(false)
  duplicateHandling DuplicateHandling @default(SKIP)
  fieldMapping     Json?       // Custom field mappings

  // Audit
  connectedBy    String        // User ID who connected
  connectedAt    DateTime      @default(now())
  lastSyncAt     DateTime?

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization   Organization  @relation(fields: [organizationId], references: [id])
  syncLogs       ChMSSyncLog[]

  @@unique([organizationId, provider])
  @@map("chms_integration")
}

/// Sync history/audit log
model ChMSSyncLog {
  id            String   @id @default(cuid())
  integrationId String

  // Sync details
  syncType      SyncType      // MANUAL, AUTOMATIC, CSV_EXPORT
  dataSource    String        // "connect_cards", "volunteers", etc.
  recordCount   Int

  // Status
  status        SyncStatus    @default(PENDING)
  errorMessage  String?

  // Audit
  initiatedBy   String?       // User ID (null for automatic)
  startedAt     DateTime      @default(now())
  completedAt   DateTime?

  integration   ChMSIntegration @relation(fields: [integrationId], references: [id])

  @@index([integrationId, startedAt])
  @@map("chms_sync_log")
}

/// Track which records have been exported/synced
model ExportRecord {
  id             String   @id @default(cuid())
  organizationId String

  // What was exported
  recordType     String        // "connect_card", "volunteer", etc.
  recordId       String        // ID of the exported record

  // Where it went
  destination    String        // "planning_center", "breeze", "csv"
  externalId     String?       // ID in external system (if API sync)

  // Audit
  exportedAt     DateTime      @default(now())
  exportedBy     String        // User ID

  @@unique([organizationId, recordType, recordId, destination])
  @@index([organizationId, recordType])
  @@map("export_record")
}

enum ChMSProvider {
  PLANNING_CENTER
  BREEZE
  CCB
  ELVANTO
  CSV
}

enum SyncMode {
  MANUAL
  AUTOMATIC
}

enum DuplicateHandling {
  SKIP
  UPDATE
  CREATE_NEW
}

enum SyncType {
  MANUAL
  AUTOMATIC
  CSV_EXPORT
}

enum SyncStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

---

## API Design

### Planning Center Integration

```typescript
// OAuth endpoints
GET  /api/integrations/planning-center/connect
  → Redirects to Planning Center OAuth

GET  /api/integrations/planning-center/callback
  → Handles OAuth callback, stores tokens

DELETE /api/integrations/planning-center
  → Disconnects account, revokes tokens

// Sync endpoints
POST /api/integrations/planning-center/sync
  → Triggers manual sync
  Body: { dataSource: "connect_cards" | "volunteers" }

GET  /api/integrations/planning-center/status
  → Returns connection status, last sync time
```

### CSV Export

```typescript
POST /api/export/csv
  Body: {
    dataSource: "connect_cards" | "volunteers" | "prayer_requests",
    format: "planning_center" | "breeze" | "generic" | "custom",
    filters: {
      locationId?: string,
      dateFrom?: string,
      dateTo?: string,
      exportedStatus?: "not_exported" | "all"
    },
    markAsExported: boolean,
    customFields?: string[]  // For custom format
  }
  → Returns CSV file download
```

---

## Implementation Phases

### Phase 1: CSV Export (MVP)

- [ ] Export page UI with filters
- [ ] Planning Center CSV format
- [ ] Breeze CSV format
- [ ] Generic CSV format
- [ ] Export tracking (mark as exported)
- [ ] Export history log

### Phase 2: Planning Center API

- [ ] OAuth connection flow
- [ ] Token storage and refresh
- [ ] Manual sync trigger
- [ ] Field mapping UI
- [ ] Duplicate detection (email match)
- [ ] Sync status/history

### Phase 3: Breeze API

- [ ] OAuth connection flow
- [ ] Sync implementation
- [ ] Field mapping for Breeze

### Phase 4: Advanced Features

- [ ] Automatic sync on card processing
- [ ] Custom field mapping editor
- [ ] Scheduled exports (weekly email)
- [ ] Webhook notifications on sync complete

---

## Technical Considerations

### Rate Limiting

- Planning Center: 100 requests/minute
- Breeze: 60 requests/minute
- Implement queue-based sync for large batches

### Error Handling

- Token refresh on 401
- Retry with exponential backoff
- User notification on persistent failures
- Partial sync recovery (don't re-sync successful records)

### Security

- Tokens encrypted at rest
- Scoped OAuth permissions (read/write people only)
- Audit log all sync operations
- User must have admin role to manage integrations

### Data Privacy

- Prayer requests optional in sync (checkbox)
- Clear disclosure of what data is shared
- Easy disconnect with token revocation

---

## Success Metrics

| Metric               | Target                             |
| -------------------- | ---------------------------------- |
| Time to export (CSV) | < 10 seconds                       |
| Time to sync (API)   | < 30 seconds for 50 records        |
| Sync success rate    | > 99%                              |
| Duplicate prevention | > 95% accuracy                     |
| Feature adoption     | 60% of churches use within 60 days |

---

## Open Questions

1. **Pricing:** Is this a premium feature or included in base subscription?
2. **Bi-directional sync:** Should we ever pull data FROM their ChMS?
3. **Conflict resolution:** What if data differs between systems?
4. **Historical data:** Export all cards ever, or just since last export?
5. **Scheduled exports:** Email weekly CSV to admin?

---

## Volunteer Onboarding Pipeline Sync

### The Problem We Solve

Connect cards capture volunteer interest, but getting that person **compliant and ready to serve** is a multi-step process that existing church software handles poorly. We bridge this gap.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OUR UNIQUE VALUE                                │
│                                                                     │
│   Connect Card → Automated Onboarding → Sync When Ready             │
│                                                                     │
│   We handle the messy middle:                                       │
│   - Automated welcome messages                                      │
│   - Background check requests                                       │
│   - Training completion tracking                                    │
│   - Compliance verification                                         │
│   - THEN sync to church software when ready to schedule            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Volunteer Pipeline Stages

```
INTERESTED          → Detected from connect card volunteer checkbox
    │
    ▼  (Auto-send welcome message)
CONTACTED           → Initial outreach sent
    │
    ▼  (Send requirements checklist)
REQUIREMENTS_PENDING → Background check, training in progress
    │
    ▼  (All requirements complete)
READY_TO_SERVE      → Compliant, ready for scheduling
    │
    ▼  (Sync to church software)
SYNCED              → Pushed to Planning Center/Breeze/CCB
```

### What We Sync vs What Church Software Handles

| Our System (Onboarding Pipeline)    | Church Software (Ongoing Management) |
| ----------------------------------- | ------------------------------------ |
| Capture interest from connect card  | Scheduling shifts                    |
| Automated welcome outreach          | Team management                      |
| Background check request + tracking | Service history                      |
| Training assignment + tracking      | Availability management              |
| Compliance verification             | Ongoing communications               |
| **Sync when READY_TO_SERVE**        | Everything after handoff             |

### Database Additions for Volunteer Pipeline

```prisma
/// Volunteer onboarding pipeline tracking
model VolunteerOnboarding {
  id                String   @id @default(cuid())
  organizationId    String
  churchMemberId    String

  // What ministry they're interested in
  category          VolunteerCategoryType

  // Pipeline stage
  stage             OnboardingStage
  stageUpdatedAt    DateTime @default(now())

  // Compliance tracking
  backgroundCheckRequired  Boolean @default(false)
  backgroundCheckStatus    BackgroundCheckStatus?
  backgroundCheckSentAt    DateTime?
  backgroundCheckCompletedAt DateTime?
  backgroundCheckExpiresAt   DateTime?

  trainingRequired         Boolean @default(false)
  trainingStatus           TrainingStatus?
  trainingCompletedAt      DateTime?

  // Communication tracking
  welcomeMessageSentAt     DateTime?
  requirementsMessageSentAt DateTime?
  remindersSent            Int @default(0)
  lastReminderAt           DateTime?

  // Sync tracking
  syncedToSystem           String?    // "planning_center", "breeze", "ccb"
  syncedAt                 DateTime?
  externalId               String?    // ID in their church software

  // Source
  connectCardId            String?    // If came from connect card

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  organization             Organization @relation(...)
  churchMember             ChurchMember @relation(...)
  connectCard              ConnectCard? @relation(...)

  @@index([organizationId, stage])
  @@index([organizationId, category])
}

enum OnboardingStage {
  INTERESTED
  CONTACTED
  REQUIREMENTS_PENDING
  READY_TO_SERVE
  SYNCED
  DROPPED
}

enum TrainingStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}
```

---

## Multi-Church Flexibility Principles

**CRITICAL:** Every configuration must work for different churches, not just the demo church.

### 1. Configurable Requirements Per Ministry

Different ministries have different requirements. This must be church-configurable:

```
Church A (Small church):
├── Kids Ministry: Background check required
├── Worship Team: No requirements
└── Parking: No requirements

Church B (Large church):
├── Kids Ministry: Background check + SafeChurch training
├── Worship Team: Background check
├── Parking: Volunteer orientation course
└── All ministries: Signed volunteer agreement
```

**Database Model:**

```prisma
model MinistryRequirements {
  id                String   @id @default(cuid())
  organizationId    String
  category          VolunteerCategoryType

  // Requirements (all optional, church-configurable)
  backgroundCheckRequired    Boolean @default(false)
  backgroundCheckProvider    String?   // URL or provider name
  backgroundCheckValidMonths Int?      // How long before expiry

  trainingRequired           Boolean @default(false)
  trainingCourseId           String?   // Link to LMS course

  customRequirements         Json?     // Flexible for future needs

  organization               Organization @relation(...)

  @@unique([organizationId, category])
}
```

### 2. Configurable Background Check Providers

Churches use different providers. We DON'T integrate with providers - we just store their URL and track status:

```
Church A: Protect My Ministry
├── URL: https://protectmyministry.com/apply/churchA
└── Valid for: 24 months

Church B: Sterling Volunteers
├── URL: https://sterlingvolunteers.com/churchB
└── Valid for: 36 months

Church C: State-specific form
├── URL: https://churchC.org/background-check-form.pdf
└── Valid for: 12 months
```

**What we track:**

- Status: `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` → `EXPIRED`
- Completion date (NOT the actual results - liability)
- Expiration date
- Reminder schedule

**What we DON'T do:**

- Store background check results
- Integrate with provider APIs (too fragmented)
- Make decisions based on results (church's responsibility)

### 3. Configurable Message Templates

Every automated message must be customizable per church:

```prisma
model MessageTemplate {
  id                String   @id @default(cuid())
  organizationId    String

  // Template identification
  templateType      TemplateType
  name              String        // "Welcome Message", "Background Check Request"

  // Content (supports merge fields)
  subject           String?       // For emails
  body              String        // Supports {first_name}, {ministry}, {link}, etc.

  // Channel
  channel           MessageChannel // SMS, EMAIL, BOTH

  // Status
  isActive          Boolean @default(true)
  isDefault         Boolean @default(false)  // System default

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  organization      Organization @relation(...)

  @@unique([organizationId, templateType])
}

enum TemplateType {
  VOLUNTEER_WELCOME
  VOLUNTEER_REQUIREMENTS
  BACKGROUND_CHECK_REQUEST
  TRAINING_REMINDER
  VOLUNTEER_READY
  STALLED_REMINDER_7DAY
  STALLED_REMINDER_14DAY
  BACKGROUND_CHECK_EXPIRING
}

enum MessageChannel {
  SMS
  EMAIL
  BOTH
}
```

**Default Templates (Church can override):**

```
VOLUNTEER_WELCOME:
"Hi {first_name}, thank you for your interest in serving with {ministry}!
We're excited to have you join our team. {next_steps}"

BACKGROUND_CHECK_REQUEST:
"Hi {first_name}, to serve in {ministry}, we need you to complete a
background check. It takes about 10 minutes.

Click here to get started: {background_check_url}

{custom_instructions}

Questions? Reply to this message."

VOLUNTEER_READY:
"Great news! {first_name} has completed all requirements and is ready
to serve in {ministry}. View their profile: {volunteer_url}"
```

### 4. Merge Field Reference

Available merge fields for templates:

| Field                    | Description                          | Example                     |
| ------------------------ | ------------------------------------ | --------------------------- |
| `{first_name}`           | Volunteer's first name               | "John"                      |
| `{last_name}`            | Volunteer's last name                | "Smith"                     |
| `{full_name}`            | Full name                            | "John Smith"                |
| `{ministry}`             | Ministry/category they're joining    | "Kids Ministry"             |
| `{church_name}`          | Organization name                    | "First Baptist Church"      |
| `{background_check_url}` | Church's BG check provider URL       | "https://..."               |
| `{training_url}`         | Link to required training course     | "https://..."               |
| `{volunteer_url}`        | Link to volunteer's profile          | "https://..."               |
| `{custom_instructions}`  | Church's custom instructions         | "Bring ID to office"        |
| `{next_steps}`           | Auto-generated based on requirements | "Complete background check" |
| `{coordinator_name}`     | Volunteer coordinator's name         | "Sarah Johnson"             |
| `{coordinator_email}`    | Coordinator's email                  | "sarah@..."                 |

---

## Sync Trigger: When READY_TO_SERVE

Unlike connect cards (sync immediately), volunteers sync when they reach `READY_TO_SERVE`:

```typescript
// Automatic sync when volunteer becomes compliant
async function onVolunteerReady(onboarding: VolunteerOnboarding) {
  const org = await getOrganization(onboarding.organizationId);
  const integration = await getActiveIntegration(org.id);

  if (!integration) {
    // No integration - just mark as ready, manual export later
    return;
  }

  if (integration.autoSyncVolunteers) {
    await syncVolunteerToChMS(onboarding, integration);
  } else {
    // Manual mode - notify coordinator
    await notifyCoordinator(onboarding, "READY_TO_SYNC");
  }
}

// Sync to church software
async function syncVolunteerToChMS(
  onboarding: VolunteerOnboarding,
  integration: ChMSIntegration
) {
  const member = await getMember(onboarding.churchMemberId);

  switch (integration.provider) {
    case "PLANNING_CENTER":
      const pcPerson = await planningCenter.people.create({
        first_name: member.firstName,
        last_name: member.lastName,
        email: member.email,
        phone: member.phone,
      });

      // Add to team based on category mapping
      const teamId =
        integration.fieldMapping.categoryToTeam[onboarding.category];
      await planningCenter.services.addToTeam(pcPerson.id, teamId);
      break;

    case "BREEZE":
      // Similar for Breeze
      break;
  }

  // Update our record
  await prisma.volunteerOnboarding.update({
    where: { id: onboarding.id },
    data: {
      stage: "SYNCED",
      syncedToSystem: integration.provider,
      syncedAt: new Date(),
      externalId: pcPerson.id,
    },
  });
}
```

---

## Settings UI: Volunteer Onboarding Configuration

Location: `/church/[slug]/admin/settings/volunteer-onboarding`

```
┌─────────────────────────────────────────────────────────────────────┐
│  Volunteer Onboarding Settings                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MINISTRY REQUIREMENTS                                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Ministry          │ Background Check │ Training    │ Other    ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │  Kids Ministry     │ ✅ Required      │ SafeChurch  │ -        ││
│  │  Youth Ministry    │ ✅ Required      │ SafeChurch  │ -        ││
│  │  Worship Team      │ ☐ Not Required   │ None        │ -        ││
│  │  Greeting Team     │ ☐ Not Required   │ Orientation │ -        ││
│  │  Parking Team      │ ☐ Not Required   │ None        │ -        ││
│  │                                                                  ││
│  │                                           [Edit Requirements]    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  BACKGROUND CHECK SETTINGS                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                  ││
│  │  Provider Name:     [Protect My Ministry          ]             ││
│  │  Application URL:   [https://protectmyministry.com/apply/123  ] ││
│  │  Valid For:         [24] months                                  ││
│  │                                                                  ││
│  │  Custom Instructions (shown to volunteers):                      ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │ Please have your driver's license ready. The check takes    │││
│  │  │ about 10-15 minutes. Contact the church office if you have  │││
│  │  │ any questions.                                              │││
│  │  └─────────────────────────────────────────────────────────────┘││
│  │                                                                  ││
│  │  Reminders:                                                      ││
│  │  ☑ Send reminder 30 days before expiration                       ││
│  │  ☑ Send reminder 7 days before expiration                        ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  MESSAGE TEMPLATES                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Template                    │ Channel │ Status   │ Action     ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │  Welcome Message             │ Email   │ ✅ Active │ [Edit]     ││
│  │  Background Check Request    │ Both    │ ✅ Active │ [Edit]     ││
│  │  Training Reminder           │ Email   │ ✅ Active │ [Edit]     ││
│  │  Stalled Reminder (7 day)    │ SMS     │ ☐ Off    │ [Edit]     ││
│  │  Ready Notification          │ Email   │ ✅ Active │ [Edit]     ││
│  │                                                                  ││
│  │                                           [Manage Templates →]   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  AUTOMATION SETTINGS                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                  ││
│  │  ☑ Auto-send welcome message when volunteer interest detected    ││
│  │  ☑ Auto-send requirements checklist after welcome                ││
│  │  ☐ Auto-advance stages (vs manual advancement)                   ││
│  │                                                                  ││
│  │  Stalled Pipeline Reminders:                                     ││
│  │  ☑ Send reminder after [7] days of no progress                   ││
│  │  ☐ Send second reminder after [14] days                          ││
│  │  ☐ Auto-mark as DROPPED after [30] days                          ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│                                                    [Save Settings]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Worktree

**Primary:** `connect-card` worktree (for sync/export features)

- Connect cards are the main data source
- Route fits naturally at `/integrations` (adjacent to `/connect-cards`)
- Most export logic relates to connect card data

**Volunteer worktree** handles:

- Volunteer onboarding pipeline UI (`/volunteer` page)
- Onboarding settings UI (`/settings/volunteer-onboarding`)
- Pipeline stage management
- Does NOT handle the sync itself (that's integrations worktree)

**Alternative:** Could warrant its own `integrations` worktree if scope expands beyond connect cards (member sync, giving import, etc.)

---

## Related Documents

- [Connect Cards Vision](/docs/features/connect-cards/vision.md)
- [Volunteer Onboarding Vision](/docs/features/volunteer-management/vision.md)
- [GHL Integration Guide](/docs/technical/integrations.md)

---

**Next Steps:**

1. Review spec with stakeholders
2. Decide: MVP with CSV only, or include Planning Center API?
3. Implement in connect-card worktree
4. Add route to navigation
