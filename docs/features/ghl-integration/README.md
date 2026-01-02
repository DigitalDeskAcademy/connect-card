# GHL (GoHighLevel) Integration

**Status:** 🟡 Phase 1 Complete, Phase 2 Planning
**Worktree:** `tech-debt`
**Priority:** High - Required for MVP demo
**Last Updated:** 2026-01-01

---

## Overview

Integrate GoHighLevel (GHL) as the communication and automation engine for Church Connect Hub. GHL handles SMS, email automation, and contact management while our app remains the source of truth for business logic.

### Why GHL?

- **SMS capability** - Churches need SMS for volunteer coordination
- **Automation workflows** - Welcome sequences, follow-ups, reminders
- **Contact sync** - Unified contact database for communication
- **Existing infrastructure** - Many churches already use GHL

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHURCH CONNECT HUB (Source of Truth)             │
│                                                                      │
│  Connect Card → Volunteer Signup → Background Check → Ready to Serve │
│       ↓              ↓                   ↓                ↓          │
│    [Sync]        [Trigger]           [Trigger]        [Trigger]      │
└───────┬──────────────┬───────────────────┬───────────────┬──────────┘
        │              │                   │               │
        ▼              ▼                   ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GHL (Communication Engine)                        │
│                                                                      │
│  Contacts DB ←→ SMS/Email Sending ←→ Workflows/Automations          │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Our app owns the data and business logic. GHL is the communication layer. Churches don't interact with GHL directly.

---

## Multi-Tenant Design

Each church (organization) has their own GHL sub-account:

| Component                       | Per-Organization |
| ------------------------------- | ---------------- |
| GHL Location ID                 | Yes              |
| Private Integration Token (PIT) | Yes              |
| OAuth Tokens (alternative)      | Yes              |
| Contacts                        | Isolated         |
| Workflows                       | Isolated         |

---

## Phase Plan

### Phase 1: Foundation ✅ COMPLETE

**Goal:** GHL service layer + demo-ready volunteer onboarding SMS

| Task             | Description                      | Status      |
| ---------------- | -------------------------------- | ----------- |
| MCP Server Setup | Connect GHL MCP to Claude Code   | ✅ Complete |
| Service Layer    | Create `lib/ghl/` abstraction    | ✅ Complete |
| Contact Sync     | Sync contact on Save & Next      | ✅ Complete |
| Welcome SMS      | Send SMS when onboarding checked | ✅ Complete |
| Demo Test        | End-to-end demo flow             | ✅ Complete |

**Deliverable:** Check "Send onboarding materials" → Volunteer gets welcome SMS + email ✅

**Files Created:**

- `lib/ghl/` - Service layer (types, client, contacts, messages, service, index)
- `actions/connect-card/update-connect-card.ts` - GHL integration added

---

### Phase 2: Ministry Management & Custom Templates

**Goal:** Churches can manage ministries and customize messaging templates

#### 2A: Dynamic Ministry Categories

Replace hardcoded enum with flexible, per-church ministry management.

| Task                  | Description                            | Status     |
| --------------------- | -------------------------------------- | ---------- |
| Ministry Model        | New `Ministry` table per org           | 🔲 Pending |
| Default Seeding       | Seed standard ministries on org create | 🔲 Pending |
| Ministry CRUD         | Add, hide, (delete custom only)        | 🔲 Pending |
| Ministry Settings UI  | `/volunteer/settings/[ministry]`       | 🔲 Pending |
| Migrate Existing Data | Move from enum to dynamic model        | 🔲 Pending |

**Ministry Protection Rules:**

| Type                     | Can Rename | Can Hide | Can Delete |
| ------------------------ | ---------- | -------- | ---------- |
| **System** (defaults)    | No         | Yes      | No         |
| **Custom** (church-made) | Yes        | Yes      | Yes        |
| **General Volunteer**    | No         | No       | No         |

**Default Ministries (seeded):**

- General Volunteer (required, can't hide)
- Kids Ministry
- Worship Team
- Greeters
- Ushers
- Parking Team
- Hospitality
- AV/Tech
- Prayer Team

#### 2B: Message Templates

Churches customize SMS/email templates per ministry.

| Task               | Description                       | Status     |
| ------------------ | --------------------------------- | ---------- |
| Template Fields    | Add to Ministry model             | 🔲 Pending |
| Template Editor UI | Textarea with placeholder preview | 🔲 Pending |
| Template Rendering | Replace placeholders at send time | 🔲 Pending |
| Default Templates  | Sensible defaults per ministry    | 🔲 Pending |

**Available Placeholders:**

| Placeholder         | Description              |
| ------------------- | ------------------------ |
| `{{firstName}}`     | Volunteer's first name   |
| `{{lastName}}`      | Volunteer's last name    |
| `{{ministryName}}`  | Ministry name            |
| `{{churchName}}`    | Church/organization name |
| `{{leaderName}}`    | Assigned leader's name   |
| `{{leaderPhone}}`   | Assigned leader's phone  |
| `{{leaderEmail}}`   | Assigned leader's email  |
| `{{bgCheckLink}}`   | Background check URL     |
| `{{trainingLink}}`  | Training URL             |
| `{{documentsLink}}` | Documents download link  |

**Template Types:**

1. **Welcome SMS** - Sent when volunteer approved
2. **Welcome Email** - Sent with documents
3. **Leader Notification** - Sent to ministry leader

#### 2C: Ministry Leadership

Assign staff to manage each ministry.

| Task                 | Description                            | Status     |
| -------------------- | -------------------------------------- | ---------- |
| Leadership Fields    | primaryAdmin, teamLeaders, autoAssign  | 🔲 Pending |
| Leader Assignment UI | Dropdown to assign staff               | 🔲 Pending |
| Auto-Assignment      | New volunteers auto-assigned to leader | 🔲 Pending |

#### Data Model

```prisma
model Ministry {
  id             String   @id @default(uuid())
  organizationId String

  // Identity
  name           String   // "Kids Ministry"
  slug           String   // "kids-ministry"
  description    String?
  sortOrder      Int      @default(0)

  // Protection
  isSystem       Boolean  @default(false)  // Seeded - can't rename/delete
  isRequired     Boolean  @default(false)  // General Volunteer - can't hide
  isActive       Boolean  @default(true)   // Hidden if false

  // Leadership
  primaryAdminId    String?
  teamLeaderIds     String[]
  autoAssignToId    String?

  // Requirements (migrated from MinistryRequirements)
  backgroundCheckRequired Boolean @default(false)
  trainingRequired        Boolean @default(false)
  trainingUrl             String?
  trainingDescription     String?

  // Templates
  welcomeSmsTemplate      String?
  welcomeEmailTemplate    String?
  leaderNotifyTemplate    String?

  // Automation
  autoSendWelcomeSms   Boolean @default(true)
  autoSendDocuments    Boolean @default(true)
  autoNotifyLeader     Boolean @default(true)

  // Relations
  organization   Organization @relation(...)
  volunteers     VolunteerMinistry[]
  documents      VolunteerDocument[]

  @@unique([organizationId, slug])
  @@index([organizationId, isActive])
  @@map("ministry")
}
```

#### UI Structure

```
Volunteer (sidebar)
├── Directory
├── Pending
├── BG Check Review
├── Export
└── Settings              ← NEW TAB
    ├── Overview          (list all ministries + Add button)
    └── [ministry-slug]   (detail page for each)
        ├── Basic Info    (name, description - readonly for system)
        ├── Leadership    (primary admin, team leaders)
        ├── Requirements  (BG check, training)
        ├── Documents     (ministry-specific uploads)
        ├── Templates     (SMS, email editors)
        └── Automation    (toggle switches)
```

---

### Phase 3: Bulk Messaging

**Goal:** Staff can send bulk SMS to filtered volunteer groups

| Task              | Description                | Status     |
| ----------------- | -------------------------- | ---------- |
| Bulk SMS UI       | Filter + compose interface | 🔲 Pending |
| Message Templates | Reusable message templates | 🔲 Pending |
| Delivery Tracking | Track send status          | 🔲 Pending |
| Rate Limiting     | Queue with GHL rate limits | 🔲 Pending |

---

### Phase 4: GHL Connection Settings

**Goal:** Churches can connect their own GHL account (for multi-tenant prod)

| Task                  | Description                    | Status     |
| --------------------- | ------------------------------ | ---------- |
| GHL Settings Page     | UI to enter/manage credentials | 🔲 Pending |
| Connection Test       | Verify GHL connection works    | 🔲 Pending |
| Credential Encryption | Encrypt PIT in database        | 🔲 Pending |
| OAuth Flow (optional) | Full OAuth for enterprise      | 🔲 Pending |

---

## Technical Specifications

### Service Layer Structure (Phase 1 - Complete)

```
lib/ghl/
├── index.ts           # Main exports
├── types.ts           # TypeScript types
├── client.ts          # GHL API client (auth, rate limits)
├── contacts.ts        # Contact operations (sync, upsert)
├── messages.ts        # SMS/Email operations + templates
└── service.ts         # High-level workflows
```

### Key Functions

```typescript
// High-level (main entry point)
syncConnectCardToGHL(orgId, contact, options) → { contactSync, smsResult }

// Contact operations
syncContactToGHL(organizationId, contact) → ContactSyncResult
upsertContact(params, credentials) → ContactSyncResult

// Messaging
sendSMS(organizationId, { contactId, message }) → SendSMSResult
sendGHLEmail(organizationId, { contactId, subject, html }) → SendSMSResult

// Configuration
isGHLConfigured() → boolean
getGHLStatus(organizationId) → { configured, syncedContacts, lastSync }
```

### Environment Variables

```env
# Required for GHL integration
GHL_PIT=pit-xxx                    # Private Integration Token
GHL_LOCATION_ID=xxx                # GHL Location ID (sub-account)
GHL_CALL_IN_DEV=true               # Set to make actual API calls in dev

# Optional (for OAuth flow - Phase 4)
GHL_CLIENT_ID=xxx
GHL_CLIENT_SECRET=xxx
GHL_REDIRECT_URI=xxx
```

---

## Integration Points

### 1. Connect Card Review → Save & Next

**Trigger:** Staff clicks "Save & Next"
**Action:** Sync contact to GHL + Send welcome SMS if checkbox checked

```typescript
// In updateConnectCard server action
if (isGHLConfigured()) {
  await syncConnectCardToGHL(
    organization.id,
    {
      name,
      email,
      phone,
    },
    {
      sendWelcomeSMS: data.sendBackgroundCheckInfo,
      ministryName: volunteerCategory,
      churchName: organization.name,
    }
  );
}
```

### 2. Future: Ministry Template Rendering

```typescript
// Phase 2: Use ministry-specific templates
const ministry = await getMinistry(organizationId, categorySlug);
const message = renderTemplate(ministry.welcomeSmsTemplate, {
  firstName: contact.firstName,
  ministryName: ministry.name,
  churchName: organization.name,
  leaderName: leader?.name,
});
await sendSMS(organizationId, { contactId, message });
```

---

## Demo Flow (Phase 1 - Working)

1. **Upload** connect card with volunteer interest
2. **Review** card, select volunteer category, check "Send onboarding materials"
3. **Save** → Contact synced to GHL, SMS + Email sent
4. **Volunteer receives:**
   - Welcome SMS via GHL
   - Email with documents, training links, BG check info via Resend

---

## Success Metrics

| Metric                 | Target                     | Phase 1 Status |
| ---------------------- | -------------------------- | -------------- |
| Contact sync latency   | < 2 seconds                | ✅ ~1s         |
| SMS delivery rate      | > 95%                      | ✅ Working     |
| Demo completion        | End-to-end working         | ✅ Complete    |
| Multi-tenant isolation | 100% (per-org credentials) | 🔲 Phase 4     |

---

## Risks & Mitigations

| Risk                | Mitigation                    |
| ------------------- | ----------------------------- |
| GHL rate limits     | Implement queue + backoff     |
| SMS costs           | Track usage, set org limits   |
| Credential security | Encrypt PIT in database       |
| GHL API changes     | Abstract behind service layer |

---

## References

- [GHL MCP Server Docs](https://marketplace.gohighlevel.com/docs/other/mcp/index.html)
- [GHL Private Integrations Guide](https://help.gohighlevel.com/support/solutions/articles/155000003054)
- [Existing OAuth Integration](../../../lib/ghl-token.ts)
