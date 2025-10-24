# Calendar Architecture

**Platform**: Sidecar CRM - Multi-Tenant Calendar Infrastructure
**Primary Integration**: Cal.com + GoHighLevel
**Status**: Phase 2 (Planned Implementation)
**Last Updated**: 2025-10-16

---

## Overview

This document defines the calendar architecture for Sidecar CRM, a critical component of the operations dashboard. The calendar system handles appointment scheduling, availability management, and booking flows across multiple agencies, locations, and calendar providers.

**Key Requirements:**

- Multi-tenant isolation (agency → location → provider)
- Bidirectional sync with GoHighLevel calendars
- Integration with external calendar providers (Google, Outlook, Apple)
- White-label booking pages for client-facing scheduling
- Real-time availability checking
- Timezone handling across multiple locations
- Conflict detection and resolution

---

## Architecture Decision

As documented in [ADR-004](./architecture-decisions.md#adr-004-calendar-as-core-feature-vs-integration), **calendar is a CORE FEATURE**, not just an integration.

**Why:**

1. AI features require local appointment data
2. White-label clients need booking without GHL branding
3. Performance requires cached data (no API calls per page load)
4. Future features (resource scheduling, team management) require ownership

---

## System Architecture

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                    Client Booking Interface                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Operations  │  │  White-Label │  │   Public     │          │
│  │  Dashboard   │  │  Booking     │  │   Widget     │          │
│  │  (Staff)     │  │  Page        │  │   (Embed)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────┬────────────────┬────────────────┬────────────────────┘
           │                │                │
     Server Actions   Cal.com API       REST API
           │                │                │
┌──────────┴────────────────┴────────────────┴────────────────────┐
│                    Sidecar Calendar Layer                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               Appointment Database (Source of Truth)        │ │
│  │  - organizationId, locationId scoping                       │ │
│  │  - Timezone-aware storage                                   │ │
│  │  - Status tracking (SCHEDULED, CONFIRMED, COMPLETED, etc.)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │  Cal.com   │  │    GHL     │  │  Provider  │               │
│  │   Sync     │  │   Sync     │  │   Sync     │               │
│  │  Engine    │  │  Engine    │  │  Engine    │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└──────────┬────────────┬────────────────┬────────────────────────┘
           │            │                │
      Webhooks     Webhooks          OAuth 2.0
           │            │                │
┌──────────┴────────────┴────────────────┴────────────────────────┐
│                    External Calendar Systems                     │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Cal.com  │  │   GHL    │  │  Google  │  │ Outlook  │       │
│  │ Platform │  │ Calendar │  │ Calendar │  │ Calendar │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Entities

```prisma
// prisma/schema.prisma

model Organization {
  id                   String    @id @default(cuid())
  name                 String
  slug                 String    @unique

  // Cal.com integration
  calcomTeamId         String?   @unique
  calcomApiKey         String?   // Encrypted
  calcomWebhookSecret  String?

  // GHL integration
  ghlAccessToken       String?   // Encrypted
  ghlRefreshToken      String?   // Encrypted
  ghlTokenExpiresAt    DateTime?

  appointments         Appointment[]
  locations            GHLLocation[]
  calendarProviders    CalendarProvider[]

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model GHLLocation {
  id                String    @id @default(cuid())
  organizationId    String
  ghlLocationId     String    @unique

  name              String
  address           String?
  phone             String?
  timezone          String    @default("America/New_York")

  // Cal.com mapping
  calcomEventTypeId String?   // Default booking type for this location

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  appointments      Appointment[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([ghlLocationId, organizationId])
  @@index([organizationId])
}

model CalendarProvider {
  id                String                @id @default(cuid())
  userId            String
  organizationId    String

  provider          CalendarProviderType  // GOOGLE, OUTLOOK, CALDAV, APPLE
  providerId        String                // External calendar ID
  providerEmail     String?

  // OAuth tokens (encrypted)
  accessToken       String
  refreshToken      String?
  tokenExpiresAt    DateTime?

  isDefault         Boolean               @default(false)
  isActive          Boolean               @default(true)

  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization      Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  @@unique([userId, organizationId, provider])
  @@index([organizationId])
  @@index([userId])
}

enum CalendarProviderType {
  GOOGLE
  OUTLOOK
  CALDAV
  APPLE
}

model Appointment {
  id                String              @id @default(cuid())
  organizationId    String
  locationId        String

  // External system IDs
  calcomBookingId   String?             @unique
  ghlEventId        String?             @unique
  providerEventId   String?             // Google/Outlook event ID

  // Participants
  clientId          String?
  staffId           String?
  clientName        String?
  clientEmail       String?
  clientPhone       String?

  // Scheduling
  startsAt          DateTime
  endsAt            DateTime
  timezone          String              @default("America/New_York")
  allDay            Boolean             @default(false)

  // Details
  type              String?             // "IV Therapy", "Consultation", etc.
  title             String?
  description       String?             @db.Text
  location          String?             // Physical location or video link
  price             Decimal?            @db.Decimal(10, 2)

  // Status tracking
  status            AppointmentStatus   @default(SCHEDULED)
  confirmationSentAt DateTime?
  reminderSentAt    DateTime?
  cancelledAt       DateTime?
  cancelReason      String?             @db.Text
  completedAt       DateTime?

  // Metadata
  metadata          Json?               // Custom fields, integrations data
  notes             String?             @db.Text

  // Relations
  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  ghlLocation       GHLLocation?        @relation(fields: [locationId], references: [id], onDelete: Cascade)
  client            User?               @relation("AppointmentClient", fields: [clientId], references: [id], onDelete: SetNull)
  staff             User?               @relation("AppointmentStaff", fields: [staffId], references: [id], onDelete: SetNull)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([organizationId])
  @@index([locationId])
  @@index([clientId])
  @@index([staffId])
  @@index([startsAt])
  @@index([status])
}

enum AppointmentStatus {
  SCHEDULED       // Initial state
  CONFIRMED       // Client confirmed attendance
  RESCHEDULED     // Time changed
  CANCELLED       // Cancelled by client or staff
  NO_SHOW         // Client didn't show up
  COMPLETED       // Service delivered
  IN_PROGRESS     // Currently happening
}

model AvailabilityRule {
  id                String              @id @default(cuid())
  organizationId    String
  locationId        String?
  userId            String?             // Staff member (null = location-wide)

  dayOfWeek         Int                 // 0 = Sunday, 6 = Saturday
  startTime         String              // "09:00"
  endTime           String              // "17:00"
  timezone          String

  isActive          Boolean             @default(true)
  effectiveFrom     DateTime?
  effectiveUntil    DateTime?

  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([organizationId])
  @@index([locationId])
  @@index([userId])
}

model CalendarBlock {
  id                String              @id @default(cuid())
  organizationId    String
  userId            String?             // Staff member (null = all staff)

  startsAt          DateTime
  endsAt            DateTime
  timezone          String

  reason            String?             // "Lunch", "Meeting", "PTO", etc.
  isRecurring       Boolean             @default(false)
  recurrenceRule    String?             // iCal RRULE format

  createdBy         String              // User who created the block
  organization      Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([organizationId])
  @@index([userId])
  @@index([startsAt])
}
```

---

## Multi-Tenant Calendar Hierarchy

### Three Levels of Scoping

```typescript
Organization (Agency)
  └─ Location (Physical location or sub-account)
      └─ Provider (Individual staff calendar)
```

**Example:**

```
Digital Desk (Organization)
  ├─ Miami Location
  │   ├─ Dr. Smith (Provider: Google Calendar)
  │   └─ Nurse Johnson (Provider: Outlook Calendar)
  └─ Fort Lauderdale Location
      ├─ Dr. Williams (Provider: Google Calendar)
      └─ Nurse Davis (Provider: Apple Calendar)
```

### Data Isolation Rules

1. **Organizations cannot see each other's data**
2. **Locations within org can see org-level appointments**
3. **Staff can only see their own appointments + location appointments**

```typescript
// /lib/calendar/permissions.ts
export async function getVisibleAppointments(params: {
  userId: string;
  organizationId: string;
  locationId?: string;
}) {
  const user = await getUser(params.userId);

  // Platform admins see everything
  if (user.role === "platform_admin") {
    return prisma.appointment.findMany();
  }

  // Agency owners see all org appointments
  if (user.role === "agency_owner") {
    return prisma.appointment.findMany({
      where: { organizationId: params.organizationId },
    });
  }

  // Location staff see location + their own appointments
  if (params.locationId) {
    return prisma.appointment.findMany({
      where: {
        organizationId: params.organizationId,
        OR: [{ locationId: params.locationId }, { staffId: params.userId }],
      },
    });
  }

  // Default: only user's appointments
  return prisma.appointment.findMany({
    where: {
      organizationId: params.organizationId,
      staffId: params.userId,
    },
  });
}
```

---

## Sync Architecture

### Three-Way Sync Strategy

**Data flows between:**

1. Sidecar Database (source of truth)
2. GoHighLevel Calendar
3. Cal.com + Provider Calendars (Google, Outlook)

### Sync Patterns

#### 1. Initial Sync (Onboarding)

```typescript
// /actions/calendar/initial-sync.ts
export async function performInitialCalendarSync(organizationId: string) {
  const ghlClient = await createGHLClient(organizationId);
  const locations = await ghlClient.getLocations();

  for (const location of locations) {
    // Import 30 days of past appointments (history)
    const pastEvents = await ghlClient.getCalendarEvents(location.id, {
      startDate: subDays(new Date(), 30).toISOString(),
      endDate: new Date().toISOString(),
    });

    // Import 90 days of future appointments
    const futureEvents = await ghlClient.getCalendarEvents(location.id, {
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 90).toISOString(),
    });

    const allEvents = [...pastEvents, ...futureEvents];

    // Bulk import to database
    await prisma.appointment.createMany({
      data: allEvents.map(event => ({
        organizationId,
        locationId: location.id,
        ghlEventId: event.id,
        clientName: event.contactName,
        clientEmail: event.contactEmail,
        clientPhone: event.contactPhone,
        startsAt: new Date(event.startTime),
        endsAt: new Date(event.endTime),
        timezone: location.timezone,
        type: event.appointmentType,
        status: mapGHLStatusToOurs(event.status),
        title: event.title,
      })),
      skipDuplicates: true,
    });
  }

  // Mark initial sync complete
  await prisma.syncStatus.upsert({
    where: {
      organizationId_source: {
        organizationId,
        source: "GHL_APPOINTMENTS",
      },
    },
    update: {
      lastSyncAt: new Date(),
      status: "HEALTHY",
    },
    create: {
      organizationId,
      source: "GHL_APPOINTMENTS",
      lastSyncAt: new Date(),
      status: "HEALTHY",
    },
  });
}
```

#### 2. Real-Time Sync (Webhooks)

```typescript
// /app/api/webhooks/ghl/appointments/route.ts
export async function POST(request: Request) {
  const event = await request.json();

  switch (event.type) {
    case "appointment.created":
      await handleAppointmentCreated(event.data);
      break;
    case "appointment.updated":
      await handleAppointmentUpdated(event.data);
      break;
    case "appointment.deleted":
      await handleAppointmentDeleted(event.data);
      break;
  }

  return new Response("OK");
}

async function handleAppointmentCreated(data: GHLAppointmentEvent) {
  const location = await prisma.gHLLocation.findUnique({
    where: { ghlLocationId: data.locationId },
  });

  if (!location) {
    console.error(`Location not found: ${data.locationId}`);
    return;
  }

  // Create in our database
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: location.organizationId,
      locationId: location.id,
      ghlEventId: data.appointmentId,
      clientName: data.contact.name,
      clientEmail: data.contact.email,
      startsAt: new Date(data.startTime),
      endsAt: new Date(data.endTime),
      timezone: data.timezone,
      type: data.appointmentType,
      status: "SCHEDULED",
    },
  });

  // Sync to Cal.com if enabled
  if (location.calcomEventTypeId) {
    await syncToCalcom(appointment);
  }

  // Sync to staff's personal calendar if connected
  await syncToProviderCalendar(appointment);
}
```

#### 3. Background Sync (Cron)

```typescript
// /app/api/cron/sync-calendars/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    where: {
      ghlAccessToken: { not: null },
    },
    select: { id: true },
  });

  for (const org of organizations) {
    try {
      await syncAppointmentsFromGHL(org.id);
    } catch (error) {
      console.error(`Sync failed for org ${org.id}:`, error);
      // Continue with next organization
    }
  }

  return Response.json({ synced: organizations.length });
}

async function syncAppointmentsFromGHL(organizationId: string) {
  const ghlClient = await createGHLClient(organizationId);
  const locations = await prisma.gHLLocation.findMany({
    where: { organizationId },
  });

  for (const location of locations) {
    // Sync 7 days window (past 1 day + future 6 days)
    const events = await ghlClient.getCalendarEvents(location.ghlLocationId, {
      startDate: subDays(new Date(), 1).toISOString(),
      endDate: addDays(new Date(), 6).toISOString(),
    });

    // Upsert appointments
    for (const event of events) {
      await prisma.appointment.upsert({
        where: {
          ghlEventId: event.id,
        },
        update: {
          startsAt: new Date(event.startTime),
          endsAt: new Date(event.endTime),
          status: mapGHLStatusToOurs(event.status),
          clientName: event.contactName,
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          locationId: location.id,
          ghlEventId: event.id,
          startsAt: new Date(event.startTime),
          endsAt: new Date(event.endTime),
          timezone: location.timezone,
          type: event.appointmentType,
          status: mapGHLStatusToOurs(event.status),
          clientName: event.contactName,
        },
      });
    }
  }

  // Update sync status
  await prisma.syncStatus.update({
    where: {
      organizationId_source: {
        organizationId,
        source: "GHL_APPOINTMENTS",
      },
    },
    data: {
      lastSyncAt: new Date(),
      status: "HEALTHY",
      errorCount: 0,
    },
  });
}
```

### Conflict Resolution

**When appointment data differs between systems:**

```typescript
// /lib/calendar/conflict-resolution.ts
export async function resolveAppointmentConflict(params: {
  ourVersion: Appointment;
  ghlVersion: GHLAppointment;
}) {
  const { ourVersion, ghlVersion } = params;

  // Rule 1: Most recent update wins
  const ourUpdateTime = ourVersion.updatedAt.getTime();
  const ghlUpdateTime = new Date(ghlVersion.updatedAt).getTime();

  if (ghlUpdateTime > ourUpdateTime) {
    // GHL is newer, update our database
    await prisma.appointment.update({
      where: { id: ourVersion.id },
      data: {
        startsAt: new Date(ghlVersion.startTime),
        endsAt: new Date(ghlVersion.endTime),
        status: mapGHLStatusToOurs(ghlVersion.status),
        updatedAt: new Date(),
      },
    });

    // Also update Cal.com and provider calendars
    await syncToCalcom(ourVersion);
    await syncToProviderCalendar(ourVersion);

    return "GHL_WINS";
  }

  // Rule 2: If our version is newer, push to GHL
  if (ourUpdateTime > ghlUpdateTime) {
    const ghlClient = await createGHLClient(ourVersion.organizationId);

    await ghlClient.updateAppointment({
      appointmentId: ghlVersion.id,
      startTime: ourVersion.startsAt.toISOString(),
      endTime: ourVersion.endsAt.toISOString(),
      status: mapOurStatusToGHL(ourVersion.status),
    });

    return "OURS_WINS";
  }

  // Rule 3: Identical timestamps - compare content
  const hasContentDifference =
    ourVersion.startsAt.getTime() !==
      new Date(ghlVersion.startTime).getTime() ||
    ourVersion.status !== mapGHLStatusToOurs(ghlVersion.status);

  if (hasContentDifference) {
    // Log conflict for manual review
    await prisma.syncConflict.create({
      data: {
        organizationId: ourVersion.organizationId,
        entity: "appointment",
        entityId: ourVersion.id,
        ourData: ourVersion,
        externalData: ghlVersion,
        resolution: "MANUAL_REVIEW_REQUIRED",
      },
    });

    return "CONFLICT_LOGGED";
  }

  return "NO_CONFLICT";
}
```

---

## Availability Management

### Checking Availability

```typescript
// /lib/calendar/availability.ts
import { addMinutes, isWithinInterval } from "date-fns";

export async function getAvailableSlots(params: {
  locationId: string;
  staffId?: string;
  date: Date;
  duration: number; // minutes
  timezone: string;
}) {
  // 1. Get availability rules for this staff/location
  const rules = await prisma.availabilityRule.findMany({
    where: {
      locationId: params.locationId,
      userId: params.staffId,
      dayOfWeek: params.date.getDay(),
      isActive: true,
    },
  });

  if (rules.length === 0) {
    return []; // No availability configured
  }

  // 2. Get existing appointments (blocks time)
  const appointments = await prisma.appointment.findMany({
    where: {
      locationId: params.locationId,
      staffId: params.staffId,
      status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      startsAt: {
        gte: startOfDay(params.date),
        lt: endOfDay(params.date),
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // 3. Get calendar blocks (PTO, meetings, etc.)
  const blocks = await prisma.calendarBlock.findMany({
    where: {
      organizationId: params.locationId,
      userId: params.staffId,
      startsAt: {
        gte: startOfDay(params.date),
        lt: endOfDay(params.date),
      },
    },
  });

  // 4. Generate available time slots
  const slots: TimeSlot[] = [];

  for (const rule of rules) {
    const [startHour, startMinute] = rule.startTime.split(":").map(Number);
    const [endHour, endMinute] = rule.endTime.split(":").map(Number);

    let slotStart = setHours(setMinutes(params.date, startMinute), startHour);
    const dayEnd = setHours(setMinutes(params.date, endMinute), endHour);

    while (slotStart < dayEnd) {
      const slotEnd = addMinutes(slotStart, params.duration);

      // Check if slot conflicts with existing appointments
      const hasConflict = appointments.some(
        apt =>
          isWithinInterval(slotStart, {
            start: apt.startsAt,
            end: apt.endsAt,
          }) ||
          isWithinInterval(slotEnd, { start: apt.startsAt, end: apt.endsAt })
      );

      // Check if slot conflicts with calendar blocks
      const hasBlock = blocks.some(block =>
        isWithinInterval(slotStart, {
          start: block.startsAt,
          end: block.endsAt,
        })
      );

      if (!hasConflict && !hasBlock) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          available: true,
        });
      }

      // Move to next slot (15-minute intervals)
      slotStart = addMinutes(slotStart, 15);
    }
  }

  return slots;
}
```

---

## Cal.com Integration

### Booking Widget

```typescript
// /components/calendar/CalcomBookingWidget.tsx
'use client';

export function CalcomBookingWidget({ eventTypeId, organizationContext }: Props) {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      data-cal-link={`${organizationContext.slug}/${eventTypeId}`}
      data-cal-config='{"theme":"light"}'
    >
      Click to schedule
    </div>
  );
}
```

### Webhook Handler

```typescript
// /app/api/webhooks/calcom/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get("x-cal-signature");
  const body = await request.text();

  // Verify webhook signature
  if (!verifyCalcomWebhook(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case "BOOKING_CREATED":
      await handleCalcomBookingCreated(event.payload);
      break;
    case "BOOKING_RESCHEDULED":
      await handleCalcomBookingRescheduled(event.payload);
      break;
    case "BOOKING_CANCELLED":
      await handleCalcomBookingCancelled(event.payload);
      break;
  }

  return new Response("OK");
}

async function handleCalcomBookingCreated(payload: CalcomBooking) {
  const { organizationId, locationId } = payload.metadata;

  // Create appointment in our database
  const appointment = await prisma.appointment.create({
    data: {
      organizationId,
      locationId,
      calcomBookingId: payload.id,
      clientName: payload.attendees[0].name,
      clientEmail: payload.attendees[0].email,
      clientPhone: payload.attendees[0].phoneNumber,
      startsAt: new Date(payload.startTime),
      endsAt: new Date(payload.endTime),
      timezone: payload.timeZone,
      type: payload.eventType.title,
      status: "SCHEDULED",
    },
  });

  // Sync to GHL
  const ghlClient = await createGHLClient(organizationId);
  await ghlClient.createCalendarEvent({
    locationId,
    contactId: payload.metadata.ghlContactId,
    startTime: payload.startTime,
    endTime: payload.endTime,
    title: payload.eventType.title,
  });

  return appointment;
}
```

---

## Timezone Handling

### Best Practices

1. **Always store in UTC**: Database stores all times in UTC
2. **Display in user timezone**: Convert on read
3. **Schedule in location timezone**: Bookings use location timezone
4. **Explicit timezone parameter**: Never assume timezone

```typescript
// /lib/calendar/timezone.ts
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export function convertToLocationTimezone(params: {
  utcDate: Date;
  locationTimezone: string;
}) {
  return utcToZonedTime(params.utcDate, params.locationTimezone);
}

export function convertToUTC(params: {
  localDate: Date;
  locationTimezone: string;
}) {
  return zonedTimeToUtc(params.localDate, params.locationTimezone);
}

// Usage in appointment creation
export async function createAppointment(params: {
  startsAt: Date; // In location timezone
  endsAt: Date; // In location timezone
  locationId: string;
}) {
  const location = await prisma.gHLLocation.findUnique({
    where: { id: params.locationId },
    select: { timezone: true },
  });

  // Convert to UTC for storage
  const startsAtUTC = convertToUTC({
    localDate: params.startsAt,
    locationTimezone: location!.timezone,
  });

  const endsAtUTC = convertToUTC({
    localDate: params.endsAt,
    locationTimezone: location!.timezone,
  });

  return prisma.appointment.create({
    data: {
      ...params,
      startsAt: startsAtUTC,
      endsAt: endsAtUTC,
      timezone: location!.timezone,
    },
  });
}
```

---

## Performance Optimizations

### 1. Caching Availability

```typescript
// /lib/calendar/availability-cache.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getCachedAvailability(params: {
  locationId: string;
  staffId?: string;
  date: string;
}) {
  const cacheKey = `availability:${params.locationId}:${params.staffId}:${params.date}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached as string);
  }

  // Generate availability
  const slots = await getAvailableSlots({
    locationId: params.locationId,
    staffId: params.staffId,
    date: new Date(params.date),
    duration: 60,
    timezone: "America/New_York",
  });

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(slots));

  return slots;
}
```

### 2. Optimistic Updates

```typescript
// /actions/calendar/book-appointment.ts
export async function bookAppointment(params: AppointmentCreate) {
  // Optimistically create appointment
  const appointment = await prisma.appointment.create({
    data: params,
  });

  // Async sync to external systems (non-blocking)
  Promise.all([
    syncToGHL(appointment).catch(error => {
      console.error("GHL sync failed:", error);
      // Rollback if critical
    }),
    syncToCalcom(appointment).catch(error => {
      console.error("Cal.com sync failed:", error);
    }),
  ]);

  return appointment;
}
```

---

## Monitoring & Health Checks

```typescript
// /app/api/health/calendar/route.ts
export async function GET() {
  const [appointmentCount, syncStatus, avgSyncLatency] = await Promise.all([
    prisma.appointment.count({
      where: {
        startsAt: { gte: startOfDay(new Date()) },
      },
    }),
    prisma.syncStatus.findMany({
      where: { source: "GHL_APPOINTMENTS" },
    }),
    prisma.syncStatus.aggregate({
      _avg: { lastSyncDurationMs: true },
    }),
  ]);

  const healthyOrgs = syncStatus.filter(s => s.status === "HEALTHY").length;
  const totalOrgs = syncStatus.length;

  return Response.json({
    status: healthyOrgs === totalOrgs ? "healthy" : "degraded",
    metrics: {
      todayAppointments: appointmentCount,
      syncHealth: `${healthyOrgs}/${totalOrgs} healthy`,
      avgSyncLatency: `${avgSyncLatency._avg.lastSyncDurationMs}ms`,
    },
    timestamp: new Date().toISOString(),
  });
}
```

---

## Related Documentation

- [Architecture Decisions - ADR-002 (Cal.com)](./architecture-decisions.md#adr-002-calcom-for-calendar-infrastructure)
- [Architecture Decisions - ADR-004 (Calendar as Core Feature)](./architecture-decisions.md#adr-004-calendar-as-core-feature-vs-integration)
- [Integrations - Cal.com Section](./integrations.md#2-calcom-integration)
- [GHL Integration](./integrations.md#1-gohighlevel-integration)
