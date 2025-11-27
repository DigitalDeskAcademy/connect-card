# Bulk Message Volunteers - Feature Specification

**Status:** Planning
**Worktree:** `/church-connect-hub/volunteer`
**Target Route:** `/church/[slug]/admin/volunteer/message`
**Last Updated:** 2025-11-26

---

## Problem Statement

Church staff need to communicate with groups of volunteers efficiently:

- **Scheduling changes:** "Sunday service moved to 9am this week"
- **Training reminders:** "Kids Ministry training Saturday - here's the calendar link"
- **Document distribution:** "Updated safe sanctuary policy attached"
- **Event coordination:** "Christmas Eve volunteer signup open"
- **Appreciation:** "Thank you for serving this month!"

**Current pain points:**

- Manual copy/paste to individual volunteers
- No way to filter by ministry, status, or location
- No tracking of who received/read messages
- Calendar links and documents sent separately
- Easy to miss volunteers or send duplicates

---

## Solution Overview

A dedicated messaging interface within the volunteer section that allows staff to:

1. **Filter & Select** volunteers by criteria (ministry, location, status, background check)
2. **Compose** messages with rich content (text, calendar links, document attachments)
3. **Preview & Send** via SMS and/or email
4. **Track** delivery status and engagement

---

## User Flow

### Step 1: Select Recipients

```
┌─────────────────────────────────────────────────────────────┐
│  Bulk Message Volunteers                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter Volunteers:                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Ministry ▼   │ │ Location ▼   │ │ Status ▼     │         │
│  │ Kids Ministry│ │ Bainbridge   │ │ Active       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐                          │
│  │ Background ▼ │ │ Availability │                          │
│  │ Cleared      │ │ Sundays      │                          │
│  └──────────────┘ └──────────────┘                          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Selected: 24 volunteers                    [Select All]     │
│                                                              │
│  ☑ Sarah Johnson     Kids Ministry    Bainbridge            │
│  ☑ Mike Peters       Kids Ministry    Bainbridge            │
│  ☑ Jane Smith        Kids Ministry    Bainbridge            │
│  ☐ Tom Wilson        Kids Ministry    Bremerton  (excluded) │
│  ...                                                         │
│                                                              │
│                                    [Continue to Message →]   │
└─────────────────────────────────────────────────────────────┘
```

**Filter Options:**

| Filter           | Options                                   | Description              |
| ---------------- | ----------------------------------------- | ------------------------ |
| Ministry         | Kids, Worship, Hospitality, Parking, etc. | Volunteer category       |
| Location         | All, Bainbridge, Bremerton, etc.          | Campus filter            |
| Status           | Active, On Break, Pending Approval        | Volunteer status         |
| Background Check | All, Cleared, Pending, Expired            | For sensitive ministries |
| Availability     | Sundays, Saturdays, Weekdays              | Serving availability     |

### Step 2: Compose Message

```
┌─────────────────────────────────────────────────────────────┐
│  Compose Message                          24 recipients      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Delivery Method:                                            │
│  ◉ SMS + Email    ○ SMS Only    ○ Email Only                │
│                                                              │
│  Subject (email only):                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Kids Ministry Training Reminder                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Message:                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Hi {first_name}!                                        ││
│  │                                                          ││
│  │ Just a reminder about our Kids Ministry training this   ││
│  │ Saturday at 9am. Please review the attached policy      ││
│  │ document before attending.                               ││
│  │                                                          ││
│  │ Click here to add to your calendar: {calendar_link}     ││
│  │                                                          ││
│  │ See you there!                                           ││
│  │ - Pastor Mike                                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Character count: 287 / 1600 (SMS limit)                    │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Attachments:                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ + Add Calendar Link                                      ││
│  │ + Attach Document                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Calendar Link (optional):                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Event: Kids Ministry Training                           ││
│  │ Date: Saturday, Dec 7, 2025                             ││
│  │ Time: 9:00 AM - 11:00 AM                                ││
│  │ Location: Bainbridge Campus - Room 201                  ││
│  │                                                          ││
│  │ [Generate Calendar Link]  [Remove]                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Documents (optional):                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📄 Safe_Sanctuary_Policy_2025.pdf        [Remove]       ││
│  │ + Add another document                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                    [← Back]  [Preview Message]  [Send →]    │
└─────────────────────────────────────────────────────────────┘
```

**Message Features:**

| Feature              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| Personalization      | `{first_name}`, `{last_name}`, `{ministry}` merge tags |
| Calendar Links       | Generate .ics link from event details                  |
| Document Attachments | Upload PDFs, link to Tigris S3                         |
| Character Counter    | SMS limit awareness (160 chars/segment)                |
| Delivery Method      | SMS, Email, or Both                                    |

### Step 3: Preview & Send

```
┌─────────────────────────────────────────────────────────────┐
│  Preview Message                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Sending to: 24 volunteers                                   │
│  Method: SMS + Email                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📱 SMS Preview                                         ││
│  │  ─────────────────────────────────────────────────────  ││
│  │  Hi Sarah!                                               ││
│  │                                                          ││
│  │  Just a reminder about our Kids Ministry training this  ││
│  │  Saturday at 9am. Please review the attached policy     ││
│  │  document before attending.                              ││
│  │                                                          ││
│  │  Calendar: https://cal.church/abc123                    ││
│  │  Policy: https://docs.church/xyz789                     ││
│  │                                                          ││
│  │  See you there!                                          ││
│  │  - Pastor Mike                                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ⚠️  2 volunteers have no phone number (email only)         │
│  ⚠️  1 volunteer has no email (SMS only)                    │
│                                                              │
│                    [← Edit]  [Schedule Later]  [Send Now →] │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Track Delivery

```
┌─────────────────────────────────────────────────────────────┐
│  Message Sent Successfully                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "Kids Ministry Training Reminder"                           │
│  Sent: Nov 26, 2025 at 2:34 PM                              │
│                                                              │
│  Delivery Status:                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ✅ Delivered: 22                                        ││
│  │  ⏳ Pending: 1                                           ││
│  │  ❌ Failed: 1 (invalid phone)                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Recipients:                                                 │
│  ☑ Sarah Johnson     ✅ SMS Delivered    ✅ Email Opened    │
│  ☑ Mike Peters       ✅ SMS Delivered    ⏳ Email Pending   │
│  ☑ Jane Smith        ❌ SMS Failed       ✅ Email Delivered │
│  ...                                                         │
│                                                              │
│                              [View Full Report]  [Done]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Database Schema Additions

```prisma
/// Bulk message campaign tracking
model VolunteerMessageCampaign {
  id             String   @id @default(cuid())
  organizationId String
  locationId     String?

  // Campaign details
  subject        String?          // Email subject
  message        String           // Message body with merge tags
  deliveryMethod DeliveryMethod   // SMS, EMAIL, BOTH

  // Attachments
  calendarEvent  Json?            // { title, date, time, location }
  documentUrls   String[]         // S3 URLs for attached documents

  // Stats (denormalized for performance)
  recipientCount Int      @default(0)
  deliveredCount Int      @default(0)
  failedCount    Int      @default(0)

  // Metadata
  sentBy         String           // User ID who sent
  sentAt         DateTime?
  status         CampaignStatus   @default(DRAFT)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  recipients     VolunteerMessageRecipient[]
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId, sentAt])
  @@map("volunteer_message_campaign")
}

/// Individual recipient tracking
model VolunteerMessageRecipient {
  id         String   @id @default(cuid())
  campaignId String
  volunteerId String

  // Delivery status
  smsStatus    MessageDeliveryStatus @default(PENDING)
  emailStatus  MessageDeliveryStatus @default(PENDING)
  smsDeliveredAt   DateTime?
  emailDeliveredAt DateTime?
  emailOpenedAt    DateTime?

  // Error tracking
  smsError     String?
  emailError   String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  campaign     VolunteerMessageCampaign @relation(fields: [campaignId], references: [id])

  @@unique([campaignId, volunteerId])
  @@index([campaignId])
  @@map("volunteer_message_recipient")
}

enum DeliveryMethod {
  SMS
  EMAIL
  BOTH
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  FAILED
}

enum MessageDeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}
```

### Integration Points

| System      | Purpose            | Notes                                       |
| ----------- | ------------------ | ------------------------------------------- |
| GoHighLevel | SMS/Email delivery | Existing OAuth integration                  |
| Tigris S3   | Document storage   | Upload PDFs, generate signed URLs           |
| Arcjet      | Rate limiting      | Prevent abuse (max 500 recipients/campaign) |

### API Routes

```
POST /api/volunteer/message/preview
  - Generate preview with merge tags resolved
  - Validate recipient list
  - Return warnings (missing phone/email)

POST /api/volunteer/message/send
  - Queue messages for delivery
  - Create campaign record
  - Trigger GHL webhook

GET /api/volunteer/message/campaigns
  - List past campaigns with stats
  - Filter by date range

GET /api/volunteer/message/campaigns/[id]
  - Campaign details with recipient status
```

---

## UI/UX Considerations

### Location in App

**Option A: Tab in Volunteer Page** (Recommended)

```
/church/[slug]/admin/volunteer
  ├── Directory (default tab)
  ├── Pipeline (onboarding)
  └── Message (bulk messaging) ← NEW
```

**Option B: Separate Route**

```
/church/[slug]/admin/volunteer/message
```

**Recommendation:** Option A (tab) for discoverability, but deep-linkable via Option B URL.

### Mobile Considerations

- Recipient selection should work on mobile (scrollable list with checkboxes)
- Message composition needs adequate textarea size
- Preview should show SMS vs Email side-by-side on desktop, stacked on mobile

### Accessibility

- All form inputs properly labeled
- Keyboard navigation for recipient selection
- Screen reader announcements for delivery status updates

---

## Implementation Phases

### Phase 1: Basic Messaging

- [ ] Filter volunteers by ministry, location, status
- [ ] Select individual volunteers or "select all"
- [ ] Compose plain text message
- [ ] Send via GHL SMS API
- [ ] Basic delivery tracking (sent/failed)

### Phase 2: Rich Content

- [ ] Email delivery option
- [ ] Merge tags ({first_name}, etc.)
- [ ] Calendar link generation (.ics)
- [ ] Document attachments (S3 upload)

### Phase 3: Advanced Features

- [ ] Message templates (save/reuse)
- [ ] Scheduled sending
- [ ] Delivery analytics dashboard
- [ ] Email open tracking
- [ ] Reply handling (future)

---

## Success Metrics

| Metric                    | Target                             |
| ------------------------- | ---------------------------------- |
| Time to send bulk message | < 2 minutes (vs 15+ manual)        |
| Delivery success rate     | > 95%                              |
| Staff adoption            | 80% of churches use within 30 days |
| Volunteer satisfaction    | "Communication is clear" > 90%     |

---

## Open Questions

1. **Templates:** Should we provide pre-built templates (training reminder, schedule change, thank you)?
2. **Replies:** How do we handle SMS replies? Route to sender? Central inbox?
3. **Opt-out:** Do volunteers need opt-out capability? Legal requirements?
4. **Rate Limits:** Max recipients per campaign? Per day?
5. **History:** How long to retain message history? GDPR considerations?

---

## Related Documents

- [Volunteer Onboarding Vision](./vision.md)
- [GHL Integration Guide](/docs/technical/integrations.md)
- [Coding Patterns](/docs/essentials/coding-patterns.md)

---

**Next Steps:**

1. Review this spec with stakeholders
2. Create database migrations in volunteer worktree
3. Build recipient selection UI
4. Implement GHL message sending
5. Add delivery tracking

---

**Implementation Location:** This feature should be built in the `volunteer` worktree (`feature/volunteer-management` branch).
