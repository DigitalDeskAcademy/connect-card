# GHL (GoHighLevel) Integration

**Status:** 🟡 In Progress
**Branch:** `feature/ghl-integration`
**Worktree:** `tech-debt` (renamed)
**Priority:** High - Required for MVP demo
**Last Updated:** 2025-12-12

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

**Key Principle:** Our app owns the data and business logic. GHL is the communication layer.

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

### Credential Storage

```
Organization
  └── GHLCredentials (new model)
        ├── locationId
        ├── privateIntegrationToken (encrypted)
        └── isConnected
```

---

## Phase Plan

### Phase 1: Foundation (Current Sprint)

**Goal:** GHL service layer + demo-ready volunteer onboarding SMS

| Task              | Description                      | Status      |
| ----------------- | -------------------------------- | ----------- |
| MCP Server Setup  | Connect GHL MCP to Claude Code   | ✅ Complete |
| Service Layer     | Create `lib/ghl/` abstraction    | 🔲 Pending  |
| Credentials Model | Add GHLCredentials to schema     | 🔲 Pending  |
| Contact Sync      | Sync contact on Save & Next      | 🔲 Pending  |
| Welcome SMS       | Send SMS when onboarding checked | 🔲 Pending  |
| Demo Test         | End-to-end demo flow             | 🔲 Pending  |

**Deliverable:** Check "Send onboarding materials" → Volunteer gets welcome SMS + email

### Phase 2: Volunteer Automation

**Goal:** Complete volunteer onboarding automation via GHL

| Task                  | Description                             | Status     |
| --------------------- | --------------------------------------- | ---------- |
| BG Check SMS Sequence | Reminder sequence for background checks | 🔲 Pending |
| Calendar Link SMS     | Send event calendar links               | 🔲 Pending |
| Status Update SMS     | Notify volunteer of status changes      | 🔲 Pending |
| GHL Workflow Triggers | Trigger GHL workflows via tags          | 🔲 Pending |

### Phase 3: Bulk Messaging

**Goal:** Staff can send bulk SMS to filtered volunteer groups

| Task              | Description                | Status     |
| ----------------- | -------------------------- | ---------- |
| Bulk SMS UI       | Filter + compose interface | 🔲 Pending |
| Message Templates | Reusable message templates | 🔲 Pending |
| Delivery Tracking | Track send status          | 🔲 Pending |
| Rate Limiting     | Respect GHL rate limits    | 🔲 Pending |

### Phase 4: Settings & Connection

**Goal:** Churches can connect their own GHL account

| Task                  | Description                    | Status     |
| --------------------- | ------------------------------ | ---------- |
| GHL Settings Page     | UI to enter/manage credentials | 🔲 Pending |
| Connection Test       | Verify GHL connection works    | 🔲 Pending |
| OAuth Flow (optional) | Full OAuth for enterprise      | 🔲 Pending |

---

## Technical Specifications

### Service Layer Structure

```
lib/ghl/
├── index.ts           # Main exports
├── types.ts           # TypeScript types
├── client.ts          # GHL API client
├── contacts.ts        # Contact operations
├── messaging.ts       # SMS/Email operations
└── credentials.ts     # Credential management
```

### Key Functions

```typescript
// Contact operations
syncContactToGHL(organizationId, contact) → GHLContactResult
getGHLContact(organizationId, contactId) → GHLContact | null

// Messaging
sendSMS(organizationId, contactId, message) → GHLMessageResult
sendEmail(organizationId, contactId, subject, html) → GHLMessageResult

// Credentials
getGHLCredentials(organizationId) → GHLCredentials | null
hasGHLConnected(organizationId) → boolean
```

### Database Schema Addition

```prisma
model GHLCredentials {
  id                       String       @id @default(uuid())
  organizationId           String       @unique
  locationId               String
  privateIntegrationToken  String       // Encrypted
  isConnected              Boolean      @default(true)
  lastSyncAt               DateTime?
  createdAt                DateTime     @default(now())
  updatedAt                DateTime     @updatedAt
  organization             Organization @relation(...)
}
```

---

## Integration Points

### 1. Connect Card Review → Save & Next

**Trigger:** Staff clicks "Save & Next"
**Action:** Sync contact to GHL (create or update)

```typescript
// In updateConnectCard server action
if (hasGHLConnected(organizationId)) {
  await syncContactToGHL(organizationId, {
    firstName,
    lastName,
    email,
    phone,
    tags: ["connect-card", volunteerCategory],
  });
}
```

### 2. Volunteer Onboarding Checkbox

**Trigger:** "Send onboarding materials" checked + Save
**Action:** Send welcome SMS via GHL + existing email

```typescript
// In updateConnectCard, after email send
if (sendBackgroundCheckInfo && hasGHLConnected(organizationId)) {
  await sendSMS(organizationId, ghlContactId, welcomeSMSTemplate);
}
```

### 3. Bulk SMS (Future)

**Trigger:** Staff selects volunteers + composes message
**Action:** Send SMS to all selected via GHL conversations API

---

## Demo Flow

For the MVP demo, the flow is:

1. **Upload** connect card with volunteer interest
2. **Review** card, check "Send onboarding materials"
3. **Save** → Contact synced to GHL, SMS + Email sent
4. **Volunteer receives:**
   - Welcome SMS with key info
   - Email with documents, training links, BG check info

### Demo Credentials

For development/demo, use environment variables:

```env
GHL_PRIVATE_INTEGRATION_TOKEN=pit-xxx
GHL_LOCATION_ID=xxx
```

---

## GHL MCP Tools Available

The GHL MCP server provides 36 tools:

| Category            | Tools                                              |
| ------------------- | -------------------------------------------------- |
| **Contacts**        | get, create, update, upsert, add-tags, remove-tags |
| **Conversations**   | search, get-messages, send-message                 |
| **Calendar**        | get-events, get-appointment-notes                  |
| **Opportunities**   | search, get, update, get-pipelines                 |
| **Locations**       | get-location, get-custom-fields                    |
| **Payments**        | get-order, list-transactions                       |
| **Social Media**    | get-accounts, get-posts, create-post               |
| **Blogs**           | get-blogs, get-posts, create-post                  |
| **Email Templates** | fetch, create                                      |

---

## Success Metrics

| Metric                 | Target                     |
| ---------------------- | -------------------------- |
| Contact sync latency   | < 2 seconds                |
| SMS delivery rate      | > 95%                      |
| Demo completion        | End-to-end working         |
| Multi-tenant isolation | 100% (per-org credentials) |

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
