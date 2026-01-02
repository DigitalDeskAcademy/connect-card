# Bulk SMS Outreach - Feature Spec

**Status:** 📋 Planned
**Worktree:** `volunteer` (feature/volunteer-management)
**Priority:** Phase 3 (after MVP automation)
**Last Updated:** 2025-12-12

---

## 🎯 Problem

Churches need to quickly reach out to volunteers for:

- Urgent needs ("We need 3 more parking volunteers Sunday")
- Events ("Sign up for Christmas Eve service")
- Follow-ups ("Training session reminder")

Current pain: Manual texting one-by-one or using personal phones.

---

## ✅ Solution: Bulk SMS Outreach

A simple, spam-conscious way to reach filtered groups of volunteers.

### Key Features

1. **Smart Filtering**

   - Filter by ministry category
   - Filter by location
   - Filter by status (active, pending, etc.)
   - Filter by background check status
   - Combine filters (e.g., "Kids Ministry + BG Cleared + Main Campus")

2. **Message Composer**

   - Text input with character count
   - Merge tags: `{first_name}`, `{ministry}`, etc.
   - Link insertion (calendar signups, forms)
   - Preview before sending

3. **Response Tracking (Spam Prevention)**

   - Include opt-out option in every message
   - Simple response system:
     - Reply **1** = Interested / Yes
     - Reply **2** = Not interested / No (don't contact for this need)
   - Track responses automatically
   - Prevent repeat contacts for same campaign

4. **Campaign History**
   - Log of all sent campaigns
   - Response rates
   - Who responded what

---

## 📱 User Flow

### Staff Creates Campaign

```
┌─────────────────────────────────────────────────────┐
│  BULK SMS OUTREACH                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. SELECT RECIPIENTS                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ Ministry: [Kids Ministry ▼]                 │   │
│  │ Location: [All Locations ▼]                 │   │
│  │ Status:   [Active ▼]                        │   │
│  │ BG Check: [Cleared ▼]                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Matching: 24 volunteers                            │
│                                                     │
│  2. COMPOSE MESSAGE                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Hi {first_name}! We need extra help with    │   │
│  │ Kids Ministry this Sunday. Can you serve?   │   │
│  │                                              │   │
│  │ Sign up here: [calendar link]               │   │
│  │                                              │   │
│  │ Reply 1 if interested                       │   │
│  │ Reply 2 if not available                    │   │
│  │                                              │   │
│  │ 156/160 characters                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ Insert Link ] [ Preview ] [ Send to 24 ]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Volunteer Receives

```
Hi Sarah! We need extra help with Kids Ministry this
Sunday. Can you serve?

Sign up here: https://cal.com/newlife/kids-sunday

Reply 1 if interested
Reply 2 if not available
```

### Response Handling

| Reply    | Action                                                             |
| -------- | ------------------------------------------------------------------ |
| **1**    | Mark as "Interested" - staff sees in dashboard                     |
| **2**    | Mark as "Not Available" - excluded from this campaign's follow-ups |
| **STOP** | Opt-out from all future messages (compliance)                      |

---

## 🗄️ Database Schema

```prisma
model BulkMessageCampaign {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  name           String?  // Optional campaign name
  message        String   // Message template
  linkUrl        String?  // Calendar/signup link

  // Filters used
  filters        Json     // { category, locationId, status, bgStatus }

  // Stats
  recipientCount Int
  sentAt         DateTime
  sentBy         String   // userId

  // Response tracking
  responses      BulkMessageResponse[]

  createdAt      DateTime @default(now())

  @@index([organizationId])
}

model BulkMessageResponse {
  id         String   @id @default(cuid())
  campaignId String
  campaign   BulkMessageCampaign @relation(fields: [campaignId], references: [id])

  volunteerId String
  volunteer   Volunteer @relation(fields: [volunteerId], references: [id])

  response    BulkMessageResponseType
  respondedAt DateTime @default(now())

  @@unique([campaignId, volunteerId])
}

enum BulkMessageResponseType {
  INTERESTED      // Reply 1
  NOT_AVAILABLE   // Reply 2
  OPTED_OUT       // Reply STOP
}
```

---

## 🔧 Technical Requirements

### SMS Provider Integration

- Use GHL (GoHighLevel) for SMS delivery
- Or Twilio as fallback
- Webhook endpoint for inbound responses

### Rate Limiting

- Max 100 recipients per campaign (MVP)
- 1 campaign per hour per organization (prevent abuse)
- Arcjet rate limiting on send endpoint

### Compliance

- TCPA compliance (opt-out handling)
- Include opt-out instructions in every message
- Maintain suppression list

---

## 📊 Success Metrics

| Metric            | Target        |
| ----------------- | ------------- |
| Response rate     | >30%          |
| Opt-out rate      | <5%           |
| Time to fill need | <24 hours     |
| Staff time saved  | 80% vs manual |

---

## 🚀 Implementation Phases

### Phase 1: Basic Send

- [ ] Filter UI for volunteers
- [ ] Message composer
- [ ] Send via GHL API
- [ ] Campaign log

### Phase 2: Response Tracking

- [ ] Webhook for inbound SMS
- [ ] Response storage
- [ ] Dashboard showing responses

### Phase 3: Smart Features

- [ ] Don't re-contact "Not Available" for same campaign
- [ ] Auto-follow-up for non-responders (after 24h)
- [ ] Campaign templates (save common messages)

---

## 📍 Route

```
/church/[slug]/admin/volunteers?tab=outreach
```

Or as a separate route:

```
/church/[slug]/admin/volunteers/message
```

---

## 🆕 Volunteer Settings Tab - Top 3 Needs

**Related Feature:** Add a Settings tab to volunteer NavTabs where staff can configure the top 3 needed volunteer categories.

### How It Works

1. Staff goes to `/volunteers?tab=settings`
2. Selects top 3 current volunteer needs from category dropdown
3. Adds optional description for each (e.g., "Sunday morning 9am service")
4. Saves configuration

### Automation Integration

When a "general volunteer" interest comes in (no specific ministry selected):

1. System sends welcome message with top 3 needs
2. Volunteer replies 1, 2, 3 to select a ministry
3. Reply 4 = "None interest me right now" → added to general pool
4. Selected ministry triggers normal onboarding flow

### Message Template

```
Hi {first_name}! Thanks for wanting to volunteer at {church_name}!

We currently have needs in these areas:

1. {need_1} - {description_1}
2. {need_2} - {description_2}
3. {need_3} - {description_3}

Reply 1, 2, or 3 to get connected with a leader.
Reply 4 if none of these fit right now.
```

### Database

```prisma
model VolunteerNeedConfig {
  id             String   @id @default(cuid())
  organizationId String   @unique
  organization   Organization @relation(fields: [organizationId], references: [id])

  need1Category  VolunteerCategoryType?
  need1Desc      String?
  need2Category  VolunteerCategoryType?
  need2Desc      String?
  need3Category  VolunteerCategoryType?
  need3Desc      String?

  updatedAt      DateTime @updatedAt
  updatedBy      String   // userId
}
```

---

**Related Docs:**

- [Volunteer](./README.md) - Overall volunteer feature
- [ChMS Export](/docs/features/integrations/README.md) - Export to ChMS
