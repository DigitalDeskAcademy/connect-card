# Volunteer Events Feature Specification

**Created:** December 21, 2025  
**Purpose:** Feature branch roadmap for volunteer events MVP  
**Status:** Approved for development

---

## 1. Philosophy

### What We're Building

A **low-friction event coordination system** that lets church staff:

1. Create events with volunteer needs
2. Invite volunteers via SMS automation
3. Track responses without manual follow-up
4. Confirm attendance with minimal effort

### Design Principles

| Principle                           | Implementation                                     |
| ----------------------------------- | -------------------------------------------------- |
| Staff dips in, takes action, leaves | System handles everything between visits           |
| Automate the happy path             | Manual overrides for edge cases                    |
| Optimistic defaults                 | Auto-confirm attendance, staff corrects exceptions |
| No housekeeping chores              | System unblocks stale invites, sends reminders     |

### What We're NOT Building

- Full volunteer scheduling (shifts, recurring availability)
- Volunteer self-service portal
- ChMS replacement features

---

## 2. Data Architecture

### New Models

**VolunteerEvent** (the container)

```
- id
- organizationId
- locationId
- name (e.g., "Sunday Kids Ministry")
- category (e.g., "children")
- leaderId → User (event leader, receives attendance email)
- requiresBackgroundCheck: boolean
- volunteerPoolScope: "location" | "all" (default: "location")
- inviteMessage (customizable template)
- confirmationMessage (customizable template)
- status: "draft" | "published" | "in_progress" | "completed" | "archived" | "cancelled"
- createdAt
- updatedAt
```

**EventSession** (time slots within event)

```
- id
- eventId → VolunteerEvent
- date
- startTime
- endTime
- slotsNeeded: int
- slotsFilled: int (derived/cached)
```

**EventAssignment** (junction: volunteer ↔ session)

```
- id
- sessionId → EventSession
- volunteerId → Volunteer
- status: "assigned" | "invited" | "confirmed" | "declined" | "no_response" | "attended" | "no_show"
- invitedAt: datetime (nullable)
- respondedAt: datetime (nullable)
- attendanceConfirmedAt: datetime (nullable)

- @@unique([sessionId, volunteerId])
- @@index([status, invitedAt]) // for timeout job
```

**AttendanceToken** (magic link for attendance confirmation)

```
- id
- token (32+ char random string)
- eventId → VolunteerEvent
- expiresAt: datetime (7 days from event)
- usedAt: datetime (nullable, but reusable within window)
```

**EventResource** (equipment/supplies needed for event)

```
- id
- eventId → VolunteerEvent
- name: string (e.g., "Folding Chairs")
- quantity: int (default: 1)
- notes: string? (optional notes like "Located in storage room B")
- status: ResourceStatus (NEEDED → CONFIRMED → READY)
- isCommon: boolean (true if from preset list)
- sortOrder: int
- statusUpdatedAt: datetime?
- createdAt
- updatedAt
```

**ResourceStatus Enum**

```
NEEDED     - Resource identified but not yet secured
CONFIRMED  - Resource has been located/reserved
READY      - Resource is on-site and ready for event
```

### Models to Modify

**Volunteer**

- Add: `reliabilityScore: float` (calculated, 0-100)
- Add: `totalAssignments: int` (cached count)
- Add: `totalAttended: int` (cached count)
- Add: `lastServedDate: datetime`

### Models to Remove

- VolunteerShift ✓ (already removed)
- VolunteerAvailability ✓ (already removed)
- ServingOpportunity (replace with VolunteerEvent)
- ServingOpportunitySkill ✓ (already removed)

### Enums to Remove

- ShiftStatus ✓ (already removed)
- AvailabilityType ✓ (already removed)
- RecurrencePattern ✓ (already removed)

---

## 3. Event Lifecycle

```
DRAFT
  │
  ├── Staff clicks "Publish" → PUBLISHED
  │
  └── Staff deletes → removed

PUBLISHED
  │
  ├── Event first session starts → IN_PROGRESS (auto)
  │
  └── Staff clicks "Cancel Event" → prompt: notify volunteers?
        ├── Yes → SMS sent → CANCELLED
        └── No → CANCELLED (silent)

IN_PROGRESS
  │
  └── Event last session ends → COMPLETED (auto)
        │
        └── Next morning: attendance email sent to leader

COMPLETED
  │
  └── 30 days pass → ARCHIVED (auto)
```

---

## 4. Event Creation Flow

### UI: Create Event Form

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATE VOLUNTEER EVENT                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Name: [________________________________]                 │
│                                                                 │
│  Location: [Dropdown_____▼]                                     │
│                                                                 │
│  Category: [Dropdown_____▼]    Leader: [Dropdown_____▼]        │
│                                                                 │
│  [ ] Background Check Required                                  │
│                                                                 │
│  Volunteer Pool:                                                │
│    (•) This location only                                       │
│    ( ) All locations                                            │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  SESSIONS                                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Date       Start    End      Volunteers     [Remove]   │    │
│  │ [12/22]    [08:00]  [09:15]  [4__]                     │    │
│  │ [12/22]    [09:30]  [10:45]  [6__]          [Remove]   │    │
│  │ [12/22]    [11:00]  [12:15]  [6__]          [Remove]   │    │
│  └────────────────────────────────────────────────────────┘    │
│  [+ Add Session]                                                │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  INVITE MESSAGE                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Hi {first_name}, can you serve at {event_name} on      │    │
│  │ {date}? Reply YES or NO.                               │    │
│  └────────────────────────────────────────────────────────┘    │
│  Variables: {first_name} {event_name} {date} {time} {location} │
│  Character count: 82/160                                        │
│                                                                 │
│  CONFIRMATION MESSAGE                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Thanks {first_name}! You're confirmed for {event_name} │    │
│  │ on {date} at {time}. Questions? Contact {leader_name}. │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  [Cancel]                      [Save Draft]  [Create & Publish] │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Rules

- Event name required
- At least one session required
- Each session needs date, start time, end time, slotsNeeded > 0
- Leader required
- Invite message should contain YES/NO instruction (warn if missing)

---

## 5. Events Dashboard

### UI: Events List

```
┌─────────────────────────────────────────────────────────────────┐
│  VOLUNTEER EVENTS                              [+ Create Event] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filters: [All Statuses ▼] [All Categories ▼] [All Locations ▼]│
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 Sunday Kids Ministry           Dec 22 · 8AM-12:15PM  │   │
│  │    Downtown Campus · Children                           │   │
│  │    8/16 volunteers                      [Invite] [View] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️  Worship Team Practice          Dec 21 · 6PM-8PM     │   │
│  │    Eastside Campus · Worship                            │   │
│  │    3/4 volunteers                       [Invite] [View] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ Parking Team                    Dec 22 · 8AM-12PM    │   │
│  │    All Campuses · Hospitality                           │   │
│  │    6/6 volunteers                              [View]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Legend:
🔴 < 50% filled
⚠️  50-99% filled
✅ 100% filled
```

### UI: Event Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Events                                               │
│                                                                 │
│  SUNDAY KIDS MINISTRY                          [Edit] [Cancel]  │
│  December 22, 2025 · Downtown Campus                            │
│  Leader: Pastor Sarah · Category: Children                      │
│  Background Check Required ✓                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OVERALL STATUS                                ⚠️ 12/16  │   │
│  │  ████████████░░░░ 75% filled                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SESSIONS                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔴 8:00 AM - 9:15 AM                            2/4    │   │
│  │     ✓ John Smith (confirmed)                            │   │
│  │     ✓ Mary Johnson (confirmed)                          │   │
│  │     ○ __ empty __                                       │   │
│  │     ○ __ empty __                                       │   │
│  │                                        [Invite to Fill]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ 9:30 AM - 10:45 AM                           6/6    │   │
│  │     ✓ John Smith · Mary Johnson · Tom Lee               │   │
│  │     ✓ Sarah Kim · James Park · Lisa Chen                │   │
│  │                                                 [View]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ⚠️ 11:00 AM - 12:15 PM                          4/6    │   │
│  │     ✓ John Smith · Mary Johnson                         │   │
│  │     ✓ Tom Lee · Sarah Kim                               │   │
│  │     ○ __ empty __ · __ empty __                         │   │
│  │                                        [Invite to Fill]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Resources & Equipment

Simple checklist-style resource tracking with status workflow:

**Status Workflow:** `NEEDED` → `CONFIRMED` → `READY`

| Status    | Color  | Meaning                               |
| --------- | ------ | ------------------------------------- |
| NEEDED    | Yellow | Resource required but not yet secured |
| CONFIRMED | Blue   | Resource secured/reserved             |
| READY     | Green  | Resource on-site and ready to use     |

**Common Resource Presets:**

- Folding Chairs, Round Tables, Rectangular Tables
- Projector, Projector Screen, Sound System
- Microphones (Wireless/Wired), Extension Cords, Power Strips
- Tablecloths, Name Tags, Sign-in Table, Welcome Banner
- Coffee Maker, Water Dispenser, Snack Table Supplies
- First Aid Kit, Cleaning Supplies, Trash Bags

**Features:**

- Add from preset list (bulk select with quantities)
- Add custom resources (name, quantity, notes)
- Status dropdown to update workflow state
- Delete resources
- Summary badges (count per status)
- Only editable for DRAFT/PUBLISHED events

---

## 6. Assignment Flow

### Two Paths

| Path          | Use Case                         | Flow                                             |
| ------------- | -------------------------------- | ------------------------------------------------ |
| Direct Assign | Staff already spoke to volunteer | Click "Assign" → ASSIGNED → counts toward filled |
| Invite        | Recruiting volunteers            | Select → "Invite" → SMS sent → wait for response |

### Invite Pool Filters (Applied Automatically)

| Filter                               | Logic                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Category matches                     | Volunteer has event's category in their categories                                |
| BG check cleared                     | If event requires it, volunteer.backgroundCheckStatus = "cleared"                 |
| Active status                        | Volunteer.status = "active"                                                       |
| Location match                       | If event.volunteerPoolScope = "location", volunteer.locationId = event.locationId |
| Not already assigned to this session | No existing EventAssignment for this volunteer + session                          |
| No time conflict                     | No CONFIRMED/ASSIGNED for overlapping session on same date                        |
| No pending invite                    | No INVITED status on any EventAssignment (24h rule)                               |

### UI: Invite Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  INVITE VOLUNTEERS                                         [X]  │
│  8:00 AM - 9:15 AM Session · 2 spots remaining                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Search: [_________________________]                            │
│                                                                 │
│  Available Volunteers (12)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [ ] Tom Lee                    98% · Last: Dec 15       │   │
│  │ [ ] Sarah Kim                  95% · Last: Dec 8        │   │
│  │ [ ] James Park                 92% · Last: Dec 1        │   │
│  │ [ ] Lisa Chen                  — (new)                  │   │
│  │ ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Not Available                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🚫 Mike Wilson — pending invite (Youth Event)           │   │
│  │ 🚫 Jane Doe — serving 8:00 AM (Parking Team)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  2 selected                                                     │
│                                                                 │
│  [Cancel]                                    [Send Invites]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. SMS Automation (GHL Integration)

### Outbound: Invite

**Trigger:** Staff clicks "Send Invites"

**Our System:**

1. Create EventAssignment records (status: INVITED, invitedAt: now)
2. For each volunteer:
   - Get GHL contact ID from MemberIntegration
   - Call GHL SMS API with invite message (variables substituted)

**GHL Setup Required:**

- Webhook configured to send inbound SMS to our endpoint
- No workflow needed - we call API directly

### Inbound: Response

**Trigger:** GHL webhook fires on inbound SMS

**Payload from GHL:**

```
{
  contactId: "ghl-contact-123",
  message: "Yes",
  timestamp: "2025-12-20T10:30:00Z"
}
```

**Our System:**

1. Find volunteer by GHL contact ID (MemberIntegration lookup)
2. Find EventAssignment where:
   - volunteerId matches
   - status = INVITED
   - (should only be one due to 24h rule)
3. Parse response:
   - Fuzzy YES: "yes", "yeah", "yep", "sure", "ok", "y"
   - Fuzzy NO: "no", "nope", "can't", "cant", "n"
   - Unrecognized: ignore (or future: "Please reply YES or NO")
4. Update status:
   - YES → CONFIRMED, respondedAt = now
   - NO → DECLINED, respondedAt = now
5. Update session.slotsFilled count
6. If CONFIRMED: send confirmation SMS via GHL

### Outbound: Confirmation

**Trigger:** Response parsed as YES

**Our System:**

1. Substitute variables in confirmation message
2. Call GHL SMS API
3. No response tracking needed

### Outbound: Event Cancelled

**Trigger:** Staff cancels event, chooses "Notify volunteers"

**Our System:**

1. Find all CONFIRMED/ASSIGNED for this event
2. Send SMS: "Hi {first_name}, {event_name} on {date} has been cancelled."
3. Update all statuses (or leave as-is with event.status = CANCELLED)

---

## 8. Timeout Automation

### Cron Job: Process Stale Invites

**Schedule:** Hourly

**Logic:**

```
Find EventAssignments where:
  - status = INVITED
  - invitedAt < NOW - 48 hours

For each:
  - UPDATE status = NO_RESPONSE
    WHERE id = {id} AND status = INVITED  // conditional update
```

**Index Required:**

```
@@index([status, invitedAt])
```

### Late Response Handling

**Scenario:** Volunteer replies YES after timeout

**Logic:**

1. Find assignment (status = NO_RESPONSE)
2. Check session.slotsFilled < session.slotsNeeded
3. If slots open:
   - Update status → CONFIRMED
   - Send confirmation SMS
4. If full:
   - Ignore (future: suggest alternatives)

---

## 9. Attendance Confirmation

### Automatic Transition

**Trigger:** Event last session end time passes

**System:**

1. Update event.status → COMPLETED
2. Update all CONFIRMED/ASSIGNED → ATTENDED
3. Generate AttendanceToken (expires 7 days)
4. Queue attendance email for next morning

### Attendance Email

**Trigger:** Morning after event (e.g., 8 AM)

**Recipient:** Event leader (event.leaderId)

**Content:**

```
Subject: Confirm attendance: {event_name} ({date})

Hi {leader_name},

Here's who was scheduled for {event_name}:

{for each session}
{session.startTime} Session ({count} volunteers)
  • {volunteer names, comma separated}
{end for}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Did everyone show up?

    [Yes, Confirm All]

Someone didn't make it?

    [Mark No-Shows]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No action needed if everyone attended —
we'll auto-confirm in 7 days.
```

**Links:**

- "Yes, Confirm All" → `https://app.../attendance/confirm/{token}?all=true`
- "Mark No-Shows" → `https://app.../attendance/confirm/{token}`

### Magic Link Page

**Route:** `/attendance/confirm/[token]` (no auth required)

**Token Validation:**

- Exists in AttendanceToken table
- Not expired (< 7 days)
- Event status = COMPLETED

**UI:** (see Section 4 for full mockup)

- All volunteers pre-checked
- Staff unchecks no-shows
- Submit → update unchecked to NO_SHOW
- Success message → page done

**After 7 Days:**

- Token expired
- Show read-only view: "Attendance was auto-confirmed on {date}"

---

## 10. Reliability Score

### Calculation

```
Score = (totalAttended / totalAssignments) × 100

Where:
- totalAssignments = count of ATTENDED + NO_SHOW (last 12 months)
- totalAttended = count of ATTENDED (last 12 months)
```

### Rules

| Rule                     | Implementation                            |
| ------------------------ | ----------------------------------------- |
| Rolling window           | Only assignments from last 12 months      |
| Minimum threshold        | No score displayed until 5+ assignments   |
| DECLINED doesn't hurt    | Not counted in calculation                |
| NO_RESPONSE doesn't hurt | Not counted in calculation                |
| Only commitments count   | ASSIGNED/CONFIRMED that reached event day |

### Display

**Volunteer List Column:**

```
RELIABILITY
98%
95%
74% ⚠️  (below 80%)
— (new)
```

**Volunteer Profile:**

```
RELIABILITY SCORE: 74%

Last 12 Months:
  Served: 14 times
  No-shows: 5 times
```

### Cache Update

**Trigger:** Attendance confirmed (ATTENDED or NO_SHOW)

**Action:** Recalculate and store on Volunteer record:

- reliabilityScore
- totalAssignments
- totalAttended
- lastServedDate

---

## 11. Scale Considerations

### Build Now (Zero Complexity)

| Item                           | Why                    |
| ------------------------------ | ---------------------- |
| Index on (status, invitedAt)   | Fast timeout queries   |
| Conditional update for timeout | Prevent race condition |

### Monitor From Day One

| Metric                    | Alert Threshold |
| ------------------------- | --------------- |
| Timeout job duration      | > 10 seconds    |
| GHL webhook response time | > 500ms         |
| GHL 429 errors            | Any             |

### Build When Needed

| Feature                 | Trigger               |
| ----------------------- | --------------------- |
| Batched timeout updates | Job > 30 seconds      |
| Webhook queue           | Webhook timeouts      |
| Outbound SMS queue      | GHL rate limit errors |

---

## 12. Implementation Phases

### Phase 1: Core Event CRUD

- [ ] VolunteerEvent model + migration
- [ ] EventSession model + migration
- [ ] Event creation form (with sessions)
- [ ] Events list page
- [ ] Event detail page
- [ ] Edit event
- [ ] Delete event (draft only)
- [ ] Publish event action
- [ ] Event status transitions (auto)

### Phase 2: Assignment System

- [ ] EventAssignment model + migration
- [ ] Invite pool query (all filters)
- [ ] Invite modal UI
- [ ] Direct assign action
- [ ] Assignment status display on event detail
- [ ] slotsFilled calculation

### Phase 3: GHL Automation

- [ ] Send invite SMS via GHL API
- [ ] Inbound SMS webhook endpoint
- [ ] Response parsing (fuzzy YES/NO)
- [ ] Status update on response
- [ ] Send confirmation SMS
- [ ] Timeout cron job
- [ ] Late response handling

### Phase 4: Attendance

- [ ] AttendanceToken model + migration
- [ ] Auto-transition to COMPLETED
- [ ] Auto-mark ATTENDED
- [ ] Attendance email (queued for morning)
- [ ] Magic link page (no auth)
- [ ] Attendance update action
- [ ] 7-day expiration logic

### Phase 5: Reliability Score

- [ ] Add score fields to Volunteer
- [ ] Score calculation function
- [ ] Trigger recalc on attendance confirm
- [ ] Display on volunteer list
- [ ] Display on volunteer profile

### Phase 6: Polish

- [ ] Cancel event flow (with notification prompt)
- [ ] Archive old events (30 days)
- [ ] Event filters on dashboard
- [ ] "Not available" section in invite modal
- [ ] Character count on message templates
- [ ] Empty states

---

## 13. Future Wishlist

| Feature                   | Notes                                         |
| ------------------------- | --------------------------------------------- |
| GHL calendar sync         | Create calendar event, volunteers self-signup |
| Recurring event templates | "Standard Sunday" template spawns events      |
| Alternative suggestions   | If event full, reply with other open events   |
| Reminder SMS              | Day-before reminder to confirmed volunteers   |
| Volunteer self-service    | View own assignments, update availability     |
| Advanced reporting        | Attendance trends, busiest categories, etc.   |

---

## 14. Key Files Reference

| Purpose          | Suggested Path                                      |
| ---------------- | --------------------------------------------------- |
| Event actions    | `actions/events/*.ts`                               |
| Event data layer | `lib/data/events.ts`                                |
| GHL service      | `lib/ghl/service.ts` (extend existing)              |
| Timeout job      | `lib/jobs/process-stale-invites.ts`                 |
| Attendance page  | `app/attendance/confirm/[token]/page.tsx`           |
| Events dashboard | `app/church/[slug]/admin/events/page.tsx`           |
| Event detail     | `app/church/[slug]/admin/events/[eventId]/page.tsx` |
| Webhook endpoint | `app/api/webhooks/ghl/inbound-sms/route.ts`         |

---

**Document Status:** Complete - Ready for development
