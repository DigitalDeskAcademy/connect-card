# Volunteer Events - Implementation Plan

**Created:** December 22, 2025
**Feature Spec:** `/docs/features/volunteer/volunteer-events-feature-spec.md`
**Worktree:** `volunteer` (branch: `feature/volunteer-management`)
**Status:** Planning Complete - Ready for Implementation

---

## Overview

This document breaks down the Volunteer Events feature into implementable phases. Each phase is designed to be a self-contained PR that adds incremental value.

**Total Phases:** 6 (matching spec) + 1 prep phase
**Dependencies:** GHL integration (exists), Volunteer model (exists)

---

## Phase 0: Schema Preparation & Cleanup

**Goal:** Prepare database schema for events system

**Why First:** All subsequent phases depend on having the correct data models in place.

### Tasks

#### 0.1 Add New Enums

```prisma
enum EventStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  CANCELLED
}

enum AssignmentStatus {
  ASSIGNED      // Direct assign by staff
  INVITED       // SMS invite sent, awaiting response
  CONFIRMED     // Volunteer replied YES
  DECLINED      // Volunteer replied NO
  NO_RESPONSE   // 48h timeout reached
  ATTENDED      // Showed up (auto-set or confirmed)
  NO_SHOW       // Didn't show up (marked by leader)
}
```

#### 0.2 Add VolunteerEvent Model

```prisma
model VolunteerEvent {
  id                    String        @id @default(cuid())
  organizationId        String
  locationId            String?
  name                  String
  description           String?
  category              VolunteerCategoryType?
  leaderId              String        // User who manages this event
  requiresBackgroundCheck Boolean     @default(false)
  volunteerPoolScope    String        @default("location") // "location" | "all"
  inviteMessage         String?       // SMS template with {variables}
  confirmationMessage   String?       // SMS template for YES response
  status                EventStatus   @default(DRAFT)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  organization   Organization    @relation(...)
  location       Location?       @relation(...)
  leader         User            @relation(...)
  sessions       EventSession[]
  attendanceTokens AttendanceToken[]

  @@index([organizationId, status])
  @@index([organizationId, locationId])
  @@map("volunteer_event")
}
```

#### 0.3 Add EventSession Model

```prisma
model EventSession {
  id            String    @id @default(cuid())
  eventId       String
  date          DateTime  @db.Date
  startTime     DateTime  @db.Time
  endTime       DateTime  @db.Time
  slotsNeeded   Int       @default(1)
  slotsFilled   Int       @default(0) // Denormalized for performance
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  event         VolunteerEvent    @relation(...)
  assignments   EventAssignment[]

  @@index([eventId])
  @@index([date])
  @@map("event_session")
}
```

#### 0.4 Add EventAssignment Model

```prisma
model EventAssignment {
  id                    String           @id @default(cuid())
  sessionId             String
  volunteerId           String
  status                AssignmentStatus @default(ASSIGNED)
  invitedAt             DateTime?
  respondedAt           DateTime?
  attendanceConfirmedAt DateTime?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  session    EventSession @relation(...)
  volunteer  Volunteer    @relation(...)

  @@unique([sessionId, volunteerId])
  @@index([status, invitedAt]) // For timeout job
  @@index([volunteerId])
  @@map("event_assignment")
}
```

#### 0.5 Add AttendanceToken Model

```prisma
model AttendanceToken {
  id        String    @id @default(cuid())
  token     String    @unique @default(cuid())
  eventId   String
  expiresAt DateTime  // 7 days from event completion
  usedAt    DateTime? // Track when leader confirmed
  createdAt DateTime  @default(now())

  event     VolunteerEvent @relation(...)

  @@index([token])
  @@index([expiresAt])
  @@map("attendance_token")
}
```

#### 0.6 Add Reliability Fields to Volunteer Model

```prisma
// Add to existing Volunteer model
model Volunteer {
  // ... existing fields ...

  // Reliability tracking (Phase 5)
  reliabilityScore   Float?    // 0-100, calculated
  totalAssignments   Int       @default(0)
  totalAttended      Int       @default(0)
  lastServedDate     DateTime?

  // New relation
  eventAssignments   EventAssignment[]
}
```

#### 0.7 Update Related Models

- Add `volunteerEvents` relation to `Organization`
- Add `volunteerEvents` relation to `Location`
- Add `ledEvents` relation to `User`

#### 0.8 Deprecate ServingOpportunity (Optional)

The `ServingOpportunity` model will be replaced by `VolunteerEvent`. Options:

- **Option A:** Remove model entirely (breaking if any code uses it)
- **Option B:** Add `@deprecated` comment, remove in future phase

**Recommendation:** Option B - deprecate now, remove after events feature is stable.

### Files to Modify

| File                   | Changes                      |
| ---------------------- | ---------------------------- |
| `prisma/schema.prisma` | Add all new models and enums |

### Validation Checklist

- [ ] Run `pnpm prisma generate` - no errors
- [ ] Run `pnpm prisma db push` - schema applied
- [ ] Verify indexes created in database
- [ ] No TypeScript errors in existing code

### PR Scope

**Title:** `feat(events): add database schema for volunteer events`

---

## Phase 1: Core Event CRUD

**Goal:** Staff can create, edit, and view events with sessions

**Depends On:** Phase 0

### Tasks

#### 1.1 Create Event Server Actions

**File:** `actions/events/events.ts`

| Action         | Description                                          |
| -------------- | ---------------------------------------------------- |
| `createEvent`  | Create event with sessions (draft status)            |
| `updateEvent`  | Update event details and sessions                    |
| `deleteEvent`  | Delete draft event (soft delete for others)          |
| `publishEvent` | Change status DRAFT → PUBLISHED                      |
| `cancelEvent`  | Change status → CANCELLED (with notification option) |
| `getEvent`     | Fetch single event with sessions and assignments     |

**Pattern to follow:** `actions/volunteers/volunteers.ts`

- requireDashboardAccess for auth
- Arcjet rate limiting
- Zod validation
- Multi-tenant organizationId filtering

#### 1.2 Create Event Data Layer

**File:** `lib/data/events.ts`

| Function            | Description                         |
| ------------------- | ----------------------------------- |
| `getEventsForScope` | List events with location filtering |
| `getEventById`      | Single event with full details      |
| `getEventStats`     | Counts by status for dashboard      |
| `getUpcomingEvents` | Events in next 7 days               |

**Pattern to follow:** `lib/data/volunteers.ts`

#### 1.3 Create Zod Schemas

**File:** `lib/zodSchemas.ts` (add to existing)

```typescript
export const eventSessionSchema = z.object({
  date: z.date(),
  startTime: z.string(), // "HH:mm" format
  endTime: z.string(),
  slotsNeeded: z.number().min(1).max(100),
});

export const eventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  locationId: z.string().optional(),
  category: z.nativeEnum(VolunteerCategoryType).optional(),
  leaderId: z.string(),
  requiresBackgroundCheck: z.boolean().default(false),
  volunteerPoolScope: z.enum(["location", "all"]).default("location"),
  inviteMessage: z.string().max(160).optional(), // SMS limit
  confirmationMessage: z.string().max(160).optional(),
  sessions: z.array(eventSessionSchema).min(1),
});
```

#### 1.4 Create Events List Page

**File:** `app/church/[slug]/admin/events/page.tsx`

**UI Elements:**

- Filter bar: Status, Category, Location dropdowns
- Event cards showing:
  - Name, date range, location
  - Category badge
  - Fill status indicator (🔴 <50%, ⚠️ 50-99%, ✅ 100%)
  - `X/Y volunteers` count
  - Action buttons: [Invite] [View]
- Empty state for no events
- [+ Create Event] button

**Pattern to follow:** `app/church/[slug]/admin/prayer/page.tsx`

#### 1.5 Create Event Detail Page

**File:** `app/church/[slug]/admin/events/[eventId]/page.tsx`

**UI Elements:**

- Back button to events list
- Event header: Name, date, location, leader, category
- Overall status card with progress bar
- Sessions list:
  - Each session shows time, fill status, volunteer names
  - [Invite to Fill] button for unfilled sessions
  - [View] button for filled sessions
- Edit/Cancel buttons (based on status)

#### 1.6 Create Event Form Component

**File:** `components/dashboard/events/event-form.tsx`

**Sections:**

1. Basic Info: Name, Location, Category, Leader dropdowns
2. Requirements: Background Check Required checkbox, Pool Scope radio
3. Sessions: Dynamic list with Add/Remove
4. Message Templates: Invite message, Confirmation message textareas
5. Actions: Cancel, Save Draft, Create & Publish

**Pattern to follow:** Connect card review form for complex forms

#### 1.7 Add Navigation Entry

**File:** `lib/navigation.ts`

Add "Events" to volunteer section navigation.

### Files to Create

| File                                                | Purpose          |
| --------------------------------------------------- | ---------------- |
| `actions/events/events.ts`                          | Server actions   |
| `lib/data/events.ts`                                | Data layer       |
| `app/church/[slug]/admin/events/page.tsx`           | List page        |
| `app/church/[slug]/admin/events/[eventId]/page.tsx` | Detail page      |
| `components/dashboard/events/event-form.tsx`        | Create/Edit form |
| `components/dashboard/events/event-card.tsx`        | List item card   |
| `components/dashboard/events/session-list.tsx`      | Sessions display |

### Files to Modify

| File                | Changes             |
| ------------------- | ------------------- |
| `lib/zodSchemas.ts` | Add event schemas   |
| `lib/navigation.ts` | Add Events nav item |

### Validation Checklist

- [ ] Can create event with multiple sessions
- [ ] Can edit draft event
- [ ] Can publish event
- [ ] Can view event list with filters
- [ ] Can view event detail with sessions
- [ ] Multi-tenant isolation verified
- [ ] Location filtering works

### PR Scope

**Title:** `feat(events): implement event CRUD and UI`

---

## Phase 2: Assignment System

**Goal:** Staff can assign volunteers to sessions (direct assign + invite pool)

**Depends On:** Phase 1

### Tasks

#### 2.1 Create Assignment Server Actions

**File:** `actions/events/assignments.ts`

| Action                   | Description                      |
| ------------------------ | -------------------------------- |
| `assignVolunteer`        | Direct assign (status: ASSIGNED) |
| `removeAssignment`       | Remove volunteer from session    |
| `getAvailableVolunteers` | Filtered pool for invite modal   |

#### 2.2 Implement Invite Pool Query

**File:** `lib/data/events.ts` (extend)

**Filters to apply:**

1. Category matches event category
2. BG check cleared (if event requires it)
3. Status = ACTIVE
4. Location matches (if event.volunteerPoolScope = "location")
5. Not already assigned to this session
6. No time conflict (not CONFIRMED/ASSIGNED for overlapping session)
7. No pending invite (no INVITED status in last 24h)

```typescript
export async function getAvailableVolunteersForSession(
  organizationId: string,
  sessionId: string,
  eventId: string
): Promise<AvailableVolunteer[]>;
```

#### 2.3 Create Invite Modal Component

**File:** `components/dashboard/events/invite-modal.tsx`

**UI Elements:**

- Session info header (time, spots remaining)
- Search input
- Available Volunteers list:
  - Checkbox, Name, Reliability %, Last served date
  - Sorted by reliability (highest first)
- Not Available section:
  - Shows blocked volunteers with reason (pending invite, time conflict)
- Selected count
- [Cancel] [Send Invites] buttons

#### 2.4 Update Session Display

Show assigned volunteers on event detail page:

- ✓ Name (confirmed/assigned)
- ○ Empty slot placeholder
- [Invite to Fill] button when slots available

#### 2.5 Update slotsFilled Counter

Implement trigger/function to update `session.slotsFilled` when assignments change:

- Increment on ASSIGNED, CONFIRMED, ATTENDED
- Decrement on removal, DECLINED, NO_SHOW

**Option A:** Prisma middleware
**Option B:** Manual update in actions

**Recommendation:** Option B for simplicity and explicit control.

### Files to Create

| File                                              | Purpose                   |
| ------------------------------------------------- | ------------------------- |
| `actions/events/assignments.ts`                   | Assignment actions        |
| `components/dashboard/events/invite-modal.tsx`    | Volunteer selection modal |
| `components/dashboard/events/assignment-list.tsx` | Show assigned volunteers  |

### Files to Modify

| File                                                | Changes                              |
| --------------------------------------------------- | ------------------------------------ |
| `lib/data/events.ts`                                | Add getAvailableVolunteersForSession |
| `app/church/[slug]/admin/events/[eventId]/page.tsx` | Add invite button, show assignments  |

### Validation Checklist

- [ ] Can direct assign volunteer to session
- [ ] Can remove assignment
- [ ] Invite pool filters work correctly
- [ ] Time conflict detection works
- [ ] slotsFilled updates correctly
- [ ] Cannot double-assign same volunteer

### PR Scope

**Title:** `feat(events): implement volunteer assignment system`

---

## Phase 3: GHL SMS Automation

**Goal:** Invite via SMS, parse responses, auto-confirm

**Depends On:** Phase 2, GHL integration (`lib/ghl/`)

### Tasks

#### 3.1 Extend GHL Service for Events

**File:** `lib/ghl/service.ts` (extend)

```typescript
export async function sendEventInvite(
  organizationId: string,
  volunteerId: string,
  eventDetails: {
    eventName: string;
    date: string;
    time: string;
    location: string;
  },
  customMessage?: string
): Promise<SendSMSResult>;

export async function sendEventConfirmation(
  organizationId: string,
  volunteerId: string,
  eventDetails: EventDetails
): Promise<SendSMSResult>;

export async function sendEventCancellation(
  organizationId: string,
  volunteerIds: string[],
  eventName: string,
  date: string
): Promise<SendSMSResult[]>;
```

#### 3.2 Create SMS Templates

**File:** `lib/ghl/messages.ts` (extend)

```typescript
export const eventSmsTemplates = {
  invite: vars =>
    `Hi ${vars.firstName}, can you serve at ${vars.eventName} on ${vars.date} at ${vars.time}? Reply YES or NO.`,

  confirmation: vars =>
    `Thanks ${vars.firstName}! You're confirmed for ${vars.eventName} on ${vars.date} at ${vars.time}. Questions? Contact ${vars.leaderName}.`,

  cancellation: vars =>
    `Hi ${vars.firstName}, ${vars.eventName} on ${vars.date} has been cancelled. Sorry for any inconvenience.`,
};
```

#### 3.3 Create Inbound SMS Webhook

**File:** `app/api/webhooks/ghl/inbound-sms/route.ts`

**Flow:**

1. Receive GHL webhook payload (contactId, message, timestamp)
2. Find volunteer by GHL contactId (MemberIntegration lookup)
3. Find EventAssignment where volunteerId + status = INVITED
4. Parse response (fuzzy YES/NO matching)
5. Update status: YES → CONFIRMED, NO → DECLINED
6. Update session.slotsFilled
7. If CONFIRMED: Send confirmation SMS

**Fuzzy Matching:**

```typescript
const YES_PATTERNS = /^(yes|yeah|yep|sure|ok|y|yea|absolutely|definitely)$/i;
const NO_PATTERNS = /^(no|nope|can't|cant|cannot|n|sorry|unable)$/i;
```

#### 3.4 Create Send Invites Action

**File:** `actions/events/invites.ts`

```typescript
export async function sendInvites(
  slug: string,
  sessionId: string,
  volunteerIds: string[]
): Promise<ApiResponse<{ sent: number; failed: number }>>;
```

**Flow:**

1. Create EventAssignment records (status: INVITED, invitedAt: now)
2. For each volunteer:
   - Get GHL contact ID
   - Call sendEventInvite
3. Return success/failure counts

#### 3.5 Implement Timeout Cron Job

**File:** `lib/jobs/process-stale-invites.ts`

```typescript
export async function processStaleInvites(): Promise<{
  processed: number;
  updated: number;
}> {
  // Find EventAssignments where:
  // - status = INVITED
  // - invitedAt < NOW - 48 hours
  // Update status = NO_RESPONSE
}
```

**Trigger:** Vercel Cron or manual API endpoint for now.

#### 3.6 Handle Late Responses

When volunteer replies YES after timeout:

1. Check if assignment exists with NO_RESPONSE status
2. Check if session still has open slots
3. If open: Update to CONFIRMED, send confirmation
4. If full: Ignore (future: suggest alternatives)

### Files to Create

| File                                        | Purpose             |
| ------------------------------------------- | ------------------- |
| `app/api/webhooks/ghl/inbound-sms/route.ts` | Webhook handler     |
| `actions/events/invites.ts`                 | Send invites action |
| `lib/jobs/process-stale-invites.ts`         | Timeout processor   |

### Files to Modify

| File                                           | Changes                 |
| ---------------------------------------------- | ----------------------- |
| `lib/ghl/service.ts`                           | Add event SMS functions |
| `lib/ghl/messages.ts`                          | Add event templates     |
| `components/dashboard/events/invite-modal.tsx` | Wire up send action     |

### GHL Setup Required

Document for churches:

1. Configure webhook URL in GHL: `https://app.../api/webhooks/ghl/inbound-sms`
2. Select "Inbound SMS" trigger
3. No GHL workflow needed - we handle everything

### Validation Checklist

- [ ] Can send invite SMS via GHL
- [ ] Webhook receives inbound SMS
- [ ] YES response → CONFIRMED + confirmation SMS
- [ ] NO response → DECLINED
- [ ] Timeout job marks NO_RESPONSE after 48h
- [ ] Late YES response handled (if slots open)
- [ ] Event cancellation sends SMS to all confirmed

### PR Scope

**Title:** `feat(events): implement GHL SMS automation for invites`

---

## Phase 4: Attendance Confirmation

**Goal:** Auto-complete events, magic link for leader to confirm attendance

**Depends On:** Phase 3

### Tasks

#### 4.1 Implement Event Status Auto-Transitions

**Option A:** Vercel Cron job checks hourly
**Option B:** Check on page load + webhook

**Recommendation:** Option B for simplicity (no extra cron).

```typescript
// In getEventById or dedicated function
async function checkAndUpdateEventStatus(eventId: string) {
  const event = await prisma.volunteerEvent.findUnique({...});
  const now = new Date();

  // PUBLISHED → IN_PROGRESS when first session starts
  if (event.status === 'PUBLISHED') {
    const firstSession = event.sessions[0];
    if (now >= firstSession.startDateTime) {
      await updateStatus(eventId, 'IN_PROGRESS');
    }
  }

  // IN_PROGRESS → COMPLETED when last session ends
  if (event.status === 'IN_PROGRESS') {
    const lastSession = event.sessions.at(-1);
    if (now >= lastSession.endDateTime) {
      await completeEvent(eventId);
    }
  }
}
```

#### 4.2 Implement Event Completion Logic

**File:** `actions/events/completion.ts`

```typescript
export async function completeEvent(eventId: string) {
  // 1. Update status → COMPLETED
  // 2. Update all CONFIRMED/ASSIGNED → ATTENDED
  // 3. Generate AttendanceToken (expires 7 days)
  // 4. Queue attendance email for next morning (or send immediately for MVP)
}
```

#### 4.3 Create Attendance Email Template

**File:** `lib/email/templates/attendance-confirmation.ts`

**Content:**

- Subject: "Confirm attendance: {event_name} ({date})"
- Lists all sessions with volunteer names
- Two buttons: [Yes, Confirm All] [Mark No-Shows]
- Footer: "No action needed if everyone attended - we'll auto-confirm in 7 days."

#### 4.4 Create Magic Link Page

**File:** `app/attendance/confirm/[token]/page.tsx`

**No auth required** - token validates access.

**Flow:**

1. Validate token (exists, not expired)
2. If expired: Show read-only "Auto-confirmed on {date}" message
3. If valid: Show attendance form
   - All volunteers pre-checked
   - Staff unchecks no-shows
   - Submit button

**UI Pattern:** Similar to volunteer BG check confirmation page (`app/volunteer/confirm/[token]/`)

#### 4.5 Create Attendance Update Action

**File:** `actions/events/attendance.ts`

```typescript
export async function confirmAttendance(
  token: string,
  noShowVolunteerIds: string[]
): Promise<ApiResponse> {
  // 1. Validate token
  // 2. Update unchecked volunteers: ATTENDED → NO_SHOW
  // 3. Update token.usedAt
  // 4. Trigger reliability score recalculation (Phase 5)
}
```

#### 4.6 Implement 7-Day Auto-Confirm

If leader doesn't use magic link within 7 days:

- Token expires
- All ATTENDED statuses remain (optimistic default)
- Show read-only view if they visit expired link

### Files to Create

| File                                             | Purpose                 |
| ------------------------------------------------ | ----------------------- |
| `actions/events/completion.ts`                   | Event completion logic  |
| `actions/events/attendance.ts`                   | Attendance confirmation |
| `lib/email/templates/attendance-confirmation.ts` | Email template          |
| `app/attendance/confirm/[token]/page.tsx`        | Magic link page         |

### Files to Modify

| File                 | Changes                      |
| -------------------- | ---------------------------- |
| `lib/data/events.ts` | Add status transition checks |

### Validation Checklist

- [ ] Event auto-transitions to IN_PROGRESS when started
- [ ] Event auto-transitions to COMPLETED when ended
- [ ] Attendance email sent to leader
- [ ] Magic link works without auth
- [ ] Can mark no-shows via magic link
- [ ] Expired token shows read-only view
- [ ] 7-day auto-confirm works (no action = all attended)

### PR Scope

**Title:** `feat(events): implement attendance confirmation flow`

---

## Phase 5: Reliability Score

**Goal:** Calculate and display volunteer reliability metrics

**Depends On:** Phase 4

### Tasks

#### 5.1 Implement Score Calculation

**File:** `lib/data/volunteers.ts` (extend)

```typescript
export async function calculateReliabilityScore(volunteerId: string): Promise<{
  score: number | null; // null if <5 assignments
  totalAssignments: number;
  totalAttended: number;
  lastServedDate: Date | null;
}> {
  // Query assignments from last 12 months
  // Only count ATTENDED and NO_SHOW (not DECLINED, NO_RESPONSE)
  // Score = (totalAttended / totalAssignments) * 100
  // Return null if totalAssignments < 5
}
```

#### 5.2 Trigger Recalculation on Attendance Confirm

**File:** `actions/events/attendance.ts` (modify)

After confirming attendance:

```typescript
// For each affected volunteer
await recalculateAndUpdateReliability(volunteerId);
```

#### 5.3 Add Score to Volunteer List

**File:** Volunteer table component

New column: "Reliability"

- Show percentage (e.g., "98%")
- Show "—" for new volunteers (<5 assignments)
- Show ⚠️ warning icon if below 80%

#### 5.4 Add Score to Volunteer Profile

**File:** Volunteer detail page

Display:

```
RELIABILITY SCORE: 74% ⚠️

Last 12 Months:
  Served: 14 times
  No-shows: 5 times
  Last served: Dec 15, 2025
```

#### 5.5 Add Score to Invite Modal

Show reliability score in available volunteers list:

- Sort by reliability (highest first)
- Display as secondary text: "98% · Last: Dec 15"

### Files to Modify

| File                                           | Changes                     |
| ---------------------------------------------- | --------------------------- |
| `lib/data/volunteers.ts`                       | Add reliability calculation |
| `actions/events/attendance.ts`                 | Trigger recalc              |
| Volunteer table component                      | Add reliability column      |
| Volunteer detail page                          | Add reliability section     |
| `components/dashboard/events/invite-modal.tsx` | Show reliability            |

### Validation Checklist

- [ ] Score calculates correctly (attended / total × 100)
- [ ] Only ATTENDED and NO_SHOW count (not DECLINED)
- [ ] Rolling 12-month window works
- [ ] New volunteers show "—" until 5+ assignments
- [ ] Score updates after attendance confirmation
- [ ] Score displays in all relevant places

### PR Scope

**Title:** `feat(events): implement volunteer reliability scoring`

---

## Phase 6: Polish & Edge Cases

**Goal:** Handle cancellations, archiving, empty states, UX polish

**Depends On:** Phase 5

### Tasks

#### 6.1 Cancel Event Flow

**File:** `actions/events/events.ts` (extend)

```typescript
export async function cancelEvent(
  slug: string,
  eventId: string,
  notifyVolunteers: boolean
): Promise<ApiResponse>;
```

**Flow:**

1. Confirm cancellation (dialog)
2. Ask: "Notify confirmed volunteers?" [Yes] [No]
3. If Yes: Send cancellation SMS to all CONFIRMED/ASSIGNED
4. Update status → CANCELLED

#### 6.2 Archive Old Events

**File:** `lib/jobs/archive-old-events.ts`

```typescript
export async function archiveOldEvents(): Promise<number> {
  // Find COMPLETED events where completedAt > 30 days ago
  // Update status → ARCHIVED
}
```

**Trigger:** Vercel Cron (weekly) or manual.

#### 6.3 Event Filters on Dashboard

Enhance events list page:

- Status filter: All, Draft, Published, In Progress, Completed
- Category filter: All categories
- Location filter: All locations
- Date range: Upcoming, Past, All

#### 6.4 "Not Available" Section in Invite Modal

Show blocked volunteers with reasons:

- 🚫 Pending invite (already invited to another event)
- 🚫 Time conflict (already serving at overlapping session)
- 🚫 BG check not cleared (if event requires it)

#### 6.5 Character Count on Message Templates

Event form message textareas:

- Show: "82/160 characters"
- Warn if over 160 (SMS limit)
- Error if over 320 (multi-part SMS)

#### 6.6 Empty States

| Page                          | Empty State                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Events list                   | "No events yet. Create your first event to start coordinating volunteers." [Create Event] |
| Event detail (no assignments) | "No volunteers assigned yet. Click 'Invite to Fill' to get started."                      |
| Invite modal (no available)   | "No volunteers available for this session. Try expanding your search or check conflicts." |

#### 6.7 Loading States

Add skeleton loaders for:

- Events list
- Event detail
- Invite modal volunteer list

#### 6.8 Mobile Responsiveness

Ensure all event pages work on mobile:

- Event cards stack vertically
- Session list scrolls horizontally on small screens
- Invite modal adapts to mobile

### Files to Modify

| File                                           | Changes                     |
| ---------------------------------------------- | --------------------------- |
| `actions/events/events.ts`                     | Add cancelEvent action      |
| `lib/jobs/archive-old-events.ts`               | Create archive job          |
| Events list page                               | Add filters                 |
| `components/dashboard/events/invite-modal.tsx` | Add "not available" section |
| `components/dashboard/events/event-form.tsx`   | Add character counts        |
| All event pages                                | Add empty/loading states    |

### Validation Checklist

- [ ] Can cancel event with/without notification
- [ ] Cancelled event shows in list with badge
- [ ] Old events auto-archive after 30 days
- [ ] All filters work correctly
- [ ] "Not available" shows blocked volunteers
- [ ] Character count works
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Mobile-friendly

### PR Scope

**Title:** `feat(events): add polish, cancellation flow, and edge case handling`

---

## Implementation Order Summary

```
Phase 0: Schema Preparation
    ↓
Phase 1: Core Event CRUD
    ↓
Phase 2: Assignment System
    ↓
Phase 3: GHL SMS Automation
    ↓
Phase 4: Attendance Confirmation
    ↓
Phase 5: Reliability Score
    ↓
Phase 6: Polish & Edge Cases
```

**Each phase is a separate PR.** Don't start next phase until current PR is merged.

---

## Testing Strategy

### Unit Tests (Vitest)

| Phase | Tests                               |
| ----- | ----------------------------------- |
| 0     | Schema generates without errors     |
| 1     | Event validation schemas            |
| 2     | Invite pool filter logic            |
| 3     | SMS response parsing (fuzzy YES/NO) |
| 4     | Token validation, expiry logic      |
| 5     | Reliability calculation             |

### E2E Tests (Playwright)

| Phase | Tests                               |
| ----- | ----------------------------------- |
| 1     | Create event flow, view events list |
| 2     | Assign volunteer, remove assignment |
| 4     | Magic link attendance confirmation  |
| 6     | Cancel event flow                   |

### Manual Testing Checklist

Each phase should be manually tested with:

- [ ] Multiple locations (multi-tenant)
- [ ] Different user roles (owner, admin, staff)
- [ ] Mobile device
- [ ] Edge cases documented in spec

---

## Risk Mitigation

| Risk                            | Mitigation                                                |
| ------------------------------- | --------------------------------------------------------- |
| GHL webhook reliability         | Log all webhook calls, retry logic                        |
| SMS delivery failures           | Track in database, surface in UI                          |
| Concurrent assignment conflicts | Use unique constraint on (sessionId, volunteerId)         |
| Timeout job race conditions     | Conditional update: `WHERE id = ? AND status = 'INVITED'` |
| Large events (100+ volunteers)  | Pagination in invite modal, batch SMS sending             |

---

## Success Metrics

After full implementation:

| Metric                    | Target                        |
| ------------------------- | ----------------------------- |
| Event creation time       | < 2 minutes                   |
| Invite send time          | < 5 seconds for 10 volunteers |
| Response parse accuracy   | > 95%                         |
| Attendance email delivery | > 99%                         |
| Magic link usage rate     | > 50% (vs auto-confirm)       |

---

## Deferred Features (Trimmed for MVP)

> **Context:** These features were discussed in the Dec 2025 pilot church meeting but are being
> deferred to ship a working MVP faster. They're documented here so we don't lose the ideas.
> Add back if user feedback indicates they'd bring value.

### From Phase 3: GHL SMS Automation (Partially Deferred)

| Feature                      | Status   | Original Rationale                                                | Why Deferred                                                                                   |
| ---------------------------- | -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **48-hour timeout cron job** | Deferred | Auto-mark INVITED → NO_RESPONSE after 48h                         | Complexity - just show "awaiting response" in UI for now. Staff can manually update if needed. |
| **Late response handling**   | Deferred | If volunteer replies YES after timeout, check if slots still open | Edge case - handle manually for MVP                                                            |
| **Fuzzy YES/NO parsing**     | Deferred | Parse "yeah", "yep", "nope", "can't" etc.                         | Start with exact YES/NO, expand later if needed                                                |

### From Phase 4: Attendance Confirmation (Simplified)

| Feature                        | Status     | Original Rationale                                       | Why Deferred                                               |
| ------------------------------ | ---------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| **7-day auto-confirm**         | Deferred   | If leader doesn't respond in 7 days, assume all attended | Complexity - leader can just click "all attended" manually |
| **Attendance email scheduler** | Deferred   | Send email "next morning" after event ends               | Just send immediately on event completion                  |
| **Magic link token expiry**    | Simplified | Complex token lifecycle                                  | Simpler: tokens don't expire, just one-time use            |

### From Phase 5: Reliability Score (Deferred Entirely)

| Feature                                 | Status   | Original Rationale                                 | Why Deferred                       |
| --------------------------------------- | -------- | -------------------------------------------------- | ---------------------------------- |
| **Reliability percentage**              | Deferred | Show "98%" for volunteers who show up consistently | Nice-to-have after core flow works |
| **Rolling 12-month window**             | Deferred | Only count last 12 months of history               | Adds query complexity              |
| **Minimum threshold (5 assignments)**   | Deferred | Don't show score until enough data                 | Can add when scores exist          |
| **Sort by reliability in invite modal** | Deferred | Prioritize reliable volunteers                     | Need scores first                  |

### From Phase 6: Polish (Deferred)

| Feature                                     | Status     | Original Rationale                     | Why Deferred                        |
| ------------------------------------------- | ---------- | -------------------------------------- | ----------------------------------- |
| **"Not Available" section in invite modal** | Deferred   | Show blocked volunteers with reasons   | Focus on available volunteers first |
| **Character count on SMS templates**        | Deferred   | Warn if over 160 chars                 | Use sensible defaults               |
| **Auto-archive after 30 days**              | Deferred   | COMPLETED → ARCHIVED automatically     | Manual archive is fine for MVP      |
| **Advanced filters on events list**         | Simplified | Status, category, location, date range | Just status tabs for now            |

### Church Meeting Notes (Dec 2025)

These specific requests came from the pilot church demo:

1. **"We need to see who's already confirmed vs who we still need"** → ✅ Building in Phase 2
2. **"Can we text everyone at once to fill gaps?"** → ✅ Building in Phase 2-3
3. **"Sometimes people say yes but don't show up"** → Reliability score (deferred)
4. **"We forget who served last week"** → Last served date (deferred, easy to add)
5. **"Planning Center is too complicated for this"** → Validates simple approach

### How to Reactivate

When ready to add a deferred feature:

1. Check this section for original spec
2. Review full implementation in phases above
3. Create focused PR for just that feature
4. Test with pilot church

---

## Future Enhancements (Post-MVP)

Not in scope for this implementation, but noted for future:

1. **Recurring events** - Templates that spawn weekly events
2. **GHL calendar sync** - Create calendar events in GHL
3. **Volunteer self-service** - View own assignments, update availability
4. **Alternative suggestions** - If event full, suggest other open events
5. **Reminder SMS** - Day-before reminder to confirmed volunteers
6. **Advanced reporting** - Attendance trends, busiest categories

---

**Document Status:** Complete - Ready for implementation
**Start With:** Phase 0 (Schema Preparation)
**Questions:** Coordinate in volunteer worktree
