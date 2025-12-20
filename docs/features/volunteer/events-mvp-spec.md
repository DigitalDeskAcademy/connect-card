# Volunteer Events MVP - Product Specification

**Status:** 🟡 Planning
**Worktree:** `/church-connect-hub/volunteer`
**Branch:** `feature/volunteer-management`
**Created:** 2025-12-17
**Priority:** HIGH VALUE (Demo Feedback)

---

## Executive Summary

Churches need a simple way to track volunteer capacity for events. Planning Center's volunteer module is too complex - many churches don't use it. We're building a lightweight "Events" feature that shows at-a-glance what's needed vs what's confirmed.

**From Demo Feedback:**

> "Planning Center's volunteer module is too complex - they don't use it"
> Need: Event tracking, capacity view, quick outreach

---

## What We're Building

### Simple Event Capacity Tracking

**Not** a full scheduling system. Just:

1. Create events with volunteer needs
2. See capacity status at-a-glance
3. Reach out to fill gaps
4. Track confirmations

### User Stories

**As church staff, I want to:**

- Create an event ("Sunday Kids Check-in - Dec 22") with volunteer needs (5 helpers)
- See at-a-glance which events need more volunteers
- Quickly message volunteers to fill gaps (via GHL)
- Track who's confirmed vs pending

**As a ministry leader, I want to:**

- See my ministry's events and their status
- Know when I need to recruit more help
- Export confirmed list for event day

---

## Feature Specification

### 1. Event Creation

```
┌─────────────────────────────────────────────────────────────┐
│  Create Event                                                │
├─────────────────────────────────────────────────────────────┤
│  Event Name: [Sunday Kids Check-in                      ]   │
│  Date: [December 22, 2025        ] Time: [9:00 AM     ]     │
│  Location: [Downtown Campus      ▼]                          │
│  Ministry: [Kids Ministry        ▼]                          │
│                                                              │
│  Volunteers Needed: [5   ]                                   │
│                                                              │
│  Description (optional):                                     │
│  [Need helpers for check-in desk and classroom           ]   │
│                                                              │
│                              [Cancel]  [Create Event]        │
└─────────────────────────────────────────────────────────────┘
```

**Fields:**

- `name` - Event name (required)
- `date` - Event date (required)
- `startTime` - Start time (optional)
- `endTime` - End time (optional)
- `locationId` - Multi-campus support
- `category` - Ministry/category (optional, for filtering)
- `volunteersNeeded` - Number needed (required, default: 1)
- `description` - Notes about the role (optional)

### 2. Events Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  Volunteer Events                           [+ New Event]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter: [All Ministries ▼] [All Locations ▼] [Upcoming ▼]  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ 🔴 NEEDS HELP            │  │ ⚠️ PARTIAL               │ │
│  │ Sunday Kids Check-in     │  │ Christmas Eve Service     │ │
│  │ Dec 22 • 9:00 AM         │  │ Dec 24 • 5:00 PM          │ │
│  │ Downtown Campus          │  │ All Campuses              │ │
│  │                          │  │                           │ │
│  │ Need 5 • Have 2          │  │ Need 15 • Have 12         │ │
│  │ [Invite Volunteers]      │  │ [Invite Volunteers]       │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ ✅ FULL                  │  │ ✅ FULL                   │ │
│  │ Youth Group Setup        │  │ Parking Team              │ │
│  │ Dec 18 • 6:00 PM         │  │ Dec 22 • 8:30 AM          │ │
│  │ Downtown Campus          │  │ Downtown Campus           │ │
│  │                          │  │                           │ │
│  │ Need 3 • Have 3          │  │ Need 4 • Have 4           │ │
│  │ [View Details]           │  │ [View Details]            │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Status Logic:**

- 🔴 **NEEDS HELP** - `confirmed < needed * 0.5` (less than 50%)
- ⚠️ **PARTIAL** - `confirmed >= needed * 0.5` but not full
- ✅ **FULL** - `confirmed >= needed`

### 3. Event Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Events                                            │
│                                                              │
│  Sunday Kids Check-in                              [Edit]    │
│  December 22, 2025 • 9:00 AM - 11:30 AM                     │
│  Downtown Campus • Kids Ministry                             │
│                                                              │
│  ═══════════════════════════════════════════════════════    │
│  Volunteers: 2 of 5 confirmed                                │
│  [████████░░░░░░░░░░░░] 40%                                  │
│  ═══════════════════════════════════════════════════════    │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ CONFIRMED (2)                                           ││
│  │ ☑ Sarah Johnson    sarah@email.com    📱 555-1234       ││
│  │ ☑ Mike Thompson    mike@email.com     📱 555-5678       ││
│  │                                                          ││
│  │ INVITED - PENDING (3)                                   ││
│  │ ○ Jane Smith       jane@email.com     📱 555-9012       ││
│  │ ○ Bob Williams     bob@email.com      📱 555-3456       ││
│  │ ○ Lisa Davis       lisa@email.com     📱 555-7890       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Invite More Volunteers]  [Send Reminder to Pending]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Volunteer Invitation Flow

When staff clicks "Invite Volunteers":

```
┌─────────────────────────────────────────────────────────────┐
│  Invite Volunteers to: Sunday Kids Check-in                  │
├─────────────────────────────────────────────────────────────┤
│  Select volunteers to invite:                                │
│                                                              │
│  Filter: [Kids Ministry ▼] [All Locations ▼] [BG Cleared ▼] │
│                                                              │
│  ☑ Sarah Johnson     Kids Ministry    ✅ BG Cleared          │
│  ☑ Mike Thompson     Kids Ministry    ✅ BG Cleared          │
│  ☑ Jane Smith        Kids Ministry    ✅ BG Cleared          │
│  ☐ Bob Williams      General          ⏳ BG Pending          │
│  ☐ Lisa Davis        Hospitality      ✅ BG Cleared          │
│                                                              │
│  Selected: 3 volunteers                                      │
│                                                              │
│  Message:                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Hi {first_name}!                                        ││
│  │                                                          ││
│  │ Can you help with Sunday Kids Check-in on Dec 22?       ││
│  │ We need volunteers from 9:00 AM - 11:30 AM.             ││
│  │                                                          ││
│  │ Reply YES to confirm or NO if you can't make it.        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Send via: ☑ SMS  ☐ Email  ☐ Both                           │
│                                                              │
│                      [Cancel]  [Send Invitations]            │
└─────────────────────────────────────────────────────────────┘
```

**Integration:** Uses GHL for SMS/Email delivery (existing integration from tech-debt worktree).

---

## Data Model

### New Model: VolunteerEvent

```prisma
model VolunteerEvent {
  id              String                @id @default(cuid())
  organizationId  String
  locationId      String?               // Multi-campus support
  name            String                // "Sunday Kids Check-in"
  description     String?               // Optional notes
  date            DateTime              // Event date
  startTime       String?               // "9:00 AM"
  endTime         String?               // "11:30 AM"
  category        VolunteerCategoryType? // Ministry filter
  volunteersNeeded Int                  @default(1)
  status          EventStatus           @default(UPCOMING)
  createdBy       String?               // Staff who created
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  // Relations
  organization    Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  location        Location?             @relation(fields: [locationId], references: [id])
  assignments     EventVolunteerAssignment[]

  @@index([organizationId])
  @@index([organizationId, date])
  @@index([organizationId, status])
  @@index([organizationId, category])
  @@map("volunteer_event")
}

enum EventStatus {
  UPCOMING      // Event hasn't happened yet
  IN_PROGRESS   // Event is happening now
  COMPLETED     // Event finished
  CANCELLED     // Event was cancelled
}

model EventVolunteerAssignment {
  id              String                @id @default(cuid())
  eventId         String
  volunteerId     String                // ChurchMember or Volunteer ID
  status          AssignmentStatus      @default(INVITED)
  invitedAt       DateTime              @default(now())
  respondedAt     DateTime?
  confirmedAt     DateTime?
  declinedReason  String?
  notes           String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  // Relations
  event           VolunteerEvent        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  volunteer       Volunteer             @relation(fields: [volunteerId], references: [id], onDelete: Cascade)

  @@unique([eventId, volunteerId])
  @@index([eventId])
  @@index([volunteerId])
  @@index([eventId, status])
  @@map("event_volunteer_assignment")
}

enum AssignmentStatus {
  INVITED         // Invitation sent, waiting response
  CONFIRMED       // Volunteer confirmed attendance
  DECLINED        // Volunteer declined
  NO_RESPONSE     // No response after X days
  ATTENDED        // Actually showed up (post-event)
  NO_SHOW         // Confirmed but didn't show
}
```

### Computed Fields

```typescript
// Derived from assignments
interface EventWithCounts extends VolunteerEvent {
  confirmedCount: number; // COUNT where status = CONFIRMED
  invitedCount: number; // COUNT where status = INVITED
  fillPercentage: number; // confirmedCount / volunteersNeeded * 100
  capacityStatus: "full" | "partial" | "needs_help";
}
```

---

## UI Routes

| Route                                        | Purpose                    |
| -------------------------------------------- | -------------------------- |
| `/church/[slug]/admin/volunteer?tab=events`  | Events dashboard (new tab) |
| `/church/[slug]/admin/volunteer/events/[id]` | Event detail view          |
| `/church/[slug]/admin/volunteer/events/new`  | Create event form          |

### Navigation Update

Add "Events" tab to volunteer page NavTabs:

```tsx
<NavTabs
  tabs={[
    { label: "All Volunteers", value: "all", count: allCount },
    { label: "Pending", value: "pending", count: pendingCount },
    { label: "BG Review", value: "review", count: reviewCount },
    { label: "Events", value: "events", count: upcomingCount, icon: Calendar }, // NEW
  ]}
/>
```

---

## Implementation Phases

### Phase 1: Schema & Data Layer

- [ ] Add `VolunteerEvent` model to schema
- [ ] Add `EventVolunteerAssignment` model
- [ ] Create `lib/data/volunteer-events.ts`
- [ ] Add server actions for CRUD

### Phase 2: Events List View

- [ ] Add "Events" tab to volunteer page
- [ ] Build events card grid component
- [ ] Implement status indicators (Full/Partial/Needs Help)
- [ ] Add filters (ministry, location, date range)

### Phase 3: Event Detail & Management

- [ ] Event detail page with volunteer list
- [ ] Create/edit event dialog
- [ ] Manual volunteer assignment UI

### Phase 4: Invitation Flow

- [ ] Volunteer selection dialog
- [ ] Message composer with templates
- [ ] GHL integration for SMS/Email
- [ ] Track invitation status

### Phase 5: Reporting

- [ ] Event history view (past events)
- [ ] Attendance tracking (post-event)
- [ ] Export confirmed list for event day

---

## NOT Building (Planning Center's Job)

Per demo feedback, we're NOT building:

| Feature                 | Why Not                       |
| ----------------------- | ----------------------------- |
| Recurring schedules     | PC handles complex scheduling |
| Shift management        | PC has robust shift system    |
| Time tracking           | PC tracks volunteer hours     |
| Availability management | PC handles preferences        |
| Check-in/check-out      | PC has dedicated system       |

**Our role:** Simple capacity view + quick outreach. Once volunteers are recruited, export to PC for scheduling.

---

## Success Metrics

| Metric                      | Target            |
| --------------------------- | ----------------- |
| Time to create event        | < 30 seconds      |
| Time to invite volunteers   | < 1 minute        |
| Events filled before day-of | > 80%             |
| Staff satisfaction          | "Simpler than PC" |

---

## Open Questions

1. **Recurring events?** Should we support "every Sunday" or just one-off events?

   - Recommendation: Start with one-off, add recurring if requested

2. **Volunteer self-service?** Can volunteers view and sign up for events?

   - Recommendation: Staff-driven for MVP, self-service in v2

3. **Response tracking?** Do we need webhook for GHL delivery status?
   - Recommendation: Track invitation sent, rely on manual confirmation for MVP

---

## Related Documentation

- [Demo Feedback](../demo-feedback-dec-2025.md) - Source requirements
- [Volunteer Vision](./vision.md) - Overall volunteer feature strategy
- [GHL Integration](../ghl-integration/vision.md) - SMS/Email delivery
