# Deprecated Architecture Decision Records

**Archive Date:** 2025-11-12
**Reason:** These ADRs were written for the original **SideCar Platform** (IV therapy clinic management system) before the project was forked and rebranded to **Church Connect Card** (church visitor engagement platform).

## Why These ADRs Are Deprecated

These decisions are **no longer relevant** to the current product:

### ADR-002: Cal.com for Calendar Infrastructure ❌

- **Original Use Case:** IV clinic appointment scheduling with Google Calendar/Outlook integration
- **Why Deprecated:** Church Connect Card doesn't use calendar appointments - we scan paper connect cards for visitor follow-up

### ADR-003: Vercel AI SDK for AI Features ❌

- **Original Use Case:** AI chatbots, lead qualification, revenue forecasting for IV clinics
- **Why Deprecated:** Replaced by Claude Vision API for handwriting OCR on connect cards

### ADR-004: Calendar as Core Feature vs Integration ❌

- **Original Use Case:** Deciding whether to build custom appointment booking or integrate with GHL calendars
- **Why Deprecated:** Church product doesn't have appointment scheduling feature

### ADR-005: Named Slots for Page Headers ❌

- **Status:** Already marked DEPRECATED in main file
- **Why Deprecated:** Replaced by simpler config-based navigation pattern (`/lib/navigation.ts`)

## Current Product Focus

**Church Connect Card** is a visitor engagement platform:

- ✅ Connect card AI Vision scanning (Claude API)
- ✅ Visitor follow-up and member management
- ✅ Volunteer scheduling (different from clinic appointments)
- ✅ Prayer request tracking
- ✅ Multi-campus church management

These archived ADRs are preserved for historical context but should **NOT** guide current development decisions.

---

## ADR-002: Cal.com for Calendar Infrastructure

**Date:** 2025-10-16
**Status:** Approved
**Decision Makers:** Development team, product strategy

### Context

The platform is pivoting from a training-focused LMS to an AI-powered CRM for GoHighLevel agencies. Calendar functionality is core to the operations dashboard - agencies need to see appointments, schedule resources, and manage bookings across multiple locations.

**Requirements:**

- Multi-tenant calendar support (agency → location → provider hierarchy)
- Calendar provider abstraction (support Google Calendar, Outlook, etc.)
- Booking widget integration for client-facing scheduling
- Real-time availability checking
- Integration with GHL calendar data
- White-label customization for agency branding

**Options Considered:**

1. Build custom calendar system from scratch
2. Use Cal.com open-source platform
3. Use Calendly API integration
4. Direct Google Calendar API integration

### Decision

**Use Cal.com as the calendar infrastructure layer**

Cal.com provides a complete, production-ready calendar scheduling platform that we can self-host or use their managed service. It solves the complex problems of availability management, timezone handling, booking flows, and multi-provider support.

**Implementation Pattern:**

```typescript
// Multi-tenant calendar configuration
Organization {
  id, name, slug,
  calcomTeamId,        // Cal.com team mapping
  calcomWebhookSecret  // For real-time updates
}

Location {
  id, organizationId,
  calcomEventTypeId,   // Default booking type for location
  timezone
}

CalendarProvider {
  id, userId, organizationId,
  provider (google | outlook | caldav),
  providerId,          // External calendar ID
  isDefault, isActive
}

Appointment {
  id, organizationId, locationId,
  calcomBookingId,     // Reference to Cal.com booking
  providerId,          // Which calendar it's on
  clientId, staffId,
  startsAt, endsAt, timezone,
  status, type, notes
}
```

**Integration Approach:**

```typescript
// actions/calendar.ts
export async function syncCalendarFromGHL(params: {
  organizationContext: OrganizationContext;
  locationId: string;
}) {
  // 1. Fetch appointments from GHL API
  const ghlAppointments = await ghlClient.getAppointments(locationId);

  // 2. Sync to Cal.com for availability management
  await calcomClient.createBlockedSlots(ghlAppointments);

  // 3. Store in our database for dashboard display
  await prisma.appointment.createMany({
    data: ghlAppointments.map(apt => ({
      organizationId: context.organizationId,
      locationId,
      calcomBookingId: apt.id,
      startsAt: apt.startTime,
      endsAt: apt.endTime,
      // ... other fields
    })),
  });
}
```

### Benefits

1. **Production-Ready**: Cal.com handles complex scheduling logic, timezone conversions, conflict detection
2. **Provider Agnostic**: Supports Google Calendar, Outlook, CalDAV out of the box
3. **White-Label Ready**: Customizable booking pages, embed widgets, email templates
4. **Webhook Support**: Real-time updates when bookings are created/cancelled
5. **Multi-Tenant Native**: Team and organization features built-in
6. **Open Source**: Can self-host for complete control and data sovereignty
7. **API-First**: Full REST API for programmatic access
8. **Battle-Tested**: Used by thousands of businesses, actively maintained

### Tradeoffs

1. **External Dependency**: Relying on Cal.com infrastructure (mitigated by self-hosting option)
2. **Data Sync Complexity**: Need to sync between GHL → Cal.com → Our DB
3. **Learning Curve**: Team needs to learn Cal.com API and architecture
4. **Pricing**: Managed service has per-seat costs (mitigated by self-hosting for enterprise)

### Alternatives Considered

**Build Custom Calendar System**

- ❌ Massive engineering effort (significant time investment)
- ❌ Timezone handling is notoriously complex
- ❌ Provider integrations require OAuth flows for each provider
- ✅ Complete control over features and UX

**Calendly API Integration**

- ✅ Simple integration, well-documented API
- ❌ Expensive at scale ($12-15/user/month)
- ❌ Limited white-label capabilities
- ❌ No self-hosting option

**Direct Google Calendar API**

- ✅ No middle layer, direct integration
- ❌ Locks agencies into Google ecosystem
- ❌ Complex OAuth management per user
- ❌ No booking widget or scheduling UI

### Consequences

#### Files to Create

- `/lib/calcom-client.ts` - Cal.com API wrapper
- `/actions/calendar.ts` - Calendar sync and management actions
- `/app/api/webhooks/calcom/route.ts` - Cal.com webhook handler
- `/components/calendar/` - Calendar UI components
  - `AppointmentCalendar.tsx` - Full calendar view
  - `AppointmentList.tsx` - List view for dashboard
  - `BookingWidget.tsx` - Client-facing scheduling
  - `AvailabilityManager.tsx` - Staff availability settings

#### Database Changes

```prisma
model Organization {
  calcomTeamId        String?  @unique
  calcomWebhookSecret String?
  calcomApiKey        String?  // Encrypted
}

model Location {
  calcomEventTypeId   String?
  timezone            String   @default("America/New_York")
}

model CalendarProvider {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  provider       CalendarProviderType
  providerId     String   // External calendar ID
  accessToken    String   // Encrypted
  refreshToken   String?  // Encrypted
  isDefault      Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User         @relation(...)
  organization Organization @relation(...)
}

model Appointment {
  id              String   @id @default(cuid())
  organizationId  String
  locationId      String
  calcomBookingId String?  @unique
  providerId      String?

  clientId        String?
  staffId         String?

  startsAt        DateTime
  endsAt          DateTime
  timezone        String

  status          AppointmentStatus
  type            String?
  notes           String?   @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization Organization @relation(...)
  location     GHLLocation  @relation(...)
  client       User?        @relation("AppointmentClient", ...)
  staff        User?        @relation("AppointmentStaff", ...)
}

enum CalendarProviderType {
  GOOGLE
  OUTLOOK
  CALDAV
  APPLE
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}
```

### Implementation Phases

**Phase 1: Foundation**

- Set up Cal.com instance (managed or self-hosted)
- Implement Cal.com API client
- Create webhook endpoint for booking events
- Basic appointment sync from GHL

**Phase 2: Dashboard Integration**

- Today's appointments widget
- Full calendar view
- Appointment detail modal
- Status management (confirm, cancel, reschedule)

**Phase 3: Provider Connections**

- Google Calendar OAuth flow
- Outlook Calendar integration
- Provider selection and management UI
- Two-way sync (Cal.com ↔ Provider)

**Phase 4: White-Label Booking**

- Custom booking widget for agency clients
- Agency branding customization
- Embed code generation
- Client-facing booking pages

### Future Enhancements

- **AI-Powered Scheduling**: Use Vercel AI SDK to suggest optimal appointment times
- **Smart Conflicts**: Detect and resolve scheduling conflicts across providers
- **Resource Scheduling**: Book treatment rooms, equipment, staff together
- **Recurring Appointments**: Series booking for ongoing treatments
- **Wait List Management**: Automatic notification when slots open up
- **No-Show Prediction**: AI model to predict and prevent no-shows

### References

- [Cal.com Documentation](https://cal.com/docs)
- [Cal.com API Reference](https://cal.com/docs/api-reference)
- [Cal.com Self-Hosting Guide](https://cal.com/docs/self-hosting)
- GHL Calendar API Documentation

---

## ADR-003: Vercel AI SDK for AI Features

**Date:** 2025-10-16
**Status:** Approved
**Decision Makers:** Development team, AI strategy

### Context

The platform's AI-powered CRM vision requires several AI capabilities:

- Smart message auto-responders
- Appointment scheduling optimization
- Lead qualification and routing
- Predictive analytics (churn risk, revenue forecasting)
- Natural language query interface for dashboard data

**Technology Landscape:**

- Multiple AI providers (OpenAI, Anthropic, Google, local models)
- Streaming responses for real-time UX
- Function calling for tool integration
- Multi-modal inputs (text, images, voice)
- Edge runtime compatibility for performance

**Options Considered:**

1. Direct OpenAI API integration
2. LangChain framework
3. Vercel AI SDK
4. Custom abstraction layer over AI APIs

### Decision

**Use Vercel AI SDK as the AI integration layer**

The Vercel AI SDK provides a unified, framework-agnostic interface for AI model integration with first-class support for streaming, function calling, and multi-provider flexibility.

**Implementation Pattern:**

```typescript
// lib/ai/config.ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const aiModels = {
  chat: anthropic('claude-sonnet-4-5-20250929'),     // Primary chat
  analysis: openai('gpt-4-turbo'),                   // Data analysis
  fast: anthropic('claude-3-5-haiku-20241022'),      // Quick responses
  vision: openai('gpt-4-vision-preview'),            // Image analysis
};

// actions/ai/chat.ts
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { aiModels } from '@/lib/ai/config';

export async function generateAutoResponse(params: {
  conversationHistory: Message[];
  organizationContext: OrganizationContext;
}) {
  const stream = createStreamableValue('');

  (async () => {
    const { textStream } = await streamText({
      model: aiModels.chat,
      system: `You are a helpful assistant for ${params.organizationContext.name}...`,
      messages: params.conversationHistory,
      temperature: 0.7,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

// actions/ai/schedule.ts
export async function suggestOptimalTime(params: {
  clientPreferences: ClientPreferences;
  staffAvailability: Availability[];
  historicalData: Appointment[];
}) {
  const { object } = await generateObject({
    model: aiModels.analysis,
    schema: z.object({
      suggestedTimes: z.array(z.object({
        startsAt: z.string(),
        score: z.number(),
        reasoning: z.string(),
      })),
      staffMemberId: z.string(),
    }),
    prompt: `Analyze the following data and suggest 3 optimal appointment times...`,
  });

  return object;
}

// components/ai/ChatAssistant.tsx
'use client';
import { useChat } from 'ai/react';

export function ChatAssistant({ organizationContext }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: {
      organizationContext,
    },
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### Benefits

1. **Provider Flexibility**: Swap between OpenAI, Anthropic, Google without changing code
2. **Streaming First**: Built-in streaming support for real-time responses
3. **React Server Components**: Native RSC integration with React hooks
4. **Function Calling**: Type-safe tool/function calling with Zod schemas
5. **Edge Compatible**: Works in Vercel Edge Runtime for low latency
6. **Cost Optimization**: Easy to route requests to cheaper/faster models
7. **TypeScript Native**: Full type safety for AI interactions
8. **Framework Agnostic**: Core SDK works with any framework

### Tradeoffs

1. **Vercel Ecosystem**: Optimized for Vercel deployment (but works elsewhere)
2. **Abstraction Cost**: Additional layer over raw AI APIs
3. **Bundle Size**: Adds ~50KB to client bundle for React hooks
4. **Learning Curve**: Team needs to learn SDK patterns vs direct API calls

### Alternatives Considered

**Direct OpenAI API Integration**

- ✅ Full control, no abstraction
- ✅ Smallest bundle size
- ❌ Vendor lock-in to OpenAI
- ❌ Manual streaming implementation
- ❌ No provider switching capability

**LangChain Framework**

- ✅ Extensive tooling ecosystem
- ✅ Chain composition patterns
- ❌ Heavy framework (200KB+ bundle)
- ❌ Complex abstraction layers
- ❌ Slower iteration on new AI features
- ❌ Not optimized for Next.js/RSC

**Custom Abstraction Layer**

- ✅ Tailored exactly to our needs
- ✅ No external dependencies
- ❌ Significant engineering time investment required
- ❌ Maintenance burden for every AI provider
- ❌ Reinventing solved problems (streaming, retries, rate limits)

### Consequences

#### AI Features to Implement

**Phase 1: Foundation**

- Chat assistant for dashboard queries
- Smart conversation categorization
- Auto-suggest responses for common questions
- Sentiment analysis on client messages

**Phase 2: Automation**

- Appointment scheduling optimization
- Lead qualification scoring
- Priority inbox (urgent vs routine)
- Auto-draft responses (human-in-loop)

**Phase 3: Analytics**

- Churn risk prediction
- Revenue forecasting
- Anomaly detection (unusual patterns)
- Natural language business insights

**Phase 4: Advanced**

- Voice-to-text for phone integrations
- Image analysis (treatment photos, documents)
- Multi-agent workflows
- Custom AI assistants per agency vertical

#### Files to Create

```
/lib/ai/
  ├── config.ts              # AI model configuration
  ├── prompts.ts             # Reusable system prompts
  ├── tools.ts               # Function calling tools
  └── utils.ts               # AI helper utilities

/actions/ai/
  ├── chat.ts                # Chat completions
  ├── analyze.ts             # Data analysis
  ├── generate.ts            # Content generation
  └── schedule.ts            # Scheduling optimization

/app/api/ai/
  ├── chat/route.ts          # Chat endpoint
  ├── analyze/route.ts       # Analysis endpoint
  └── webhooks/route.ts      # AI webhook handlers

/components/ai/
  ├── ChatAssistant.tsx      # Chat interface
  ├── SmartComposer.tsx      # Message composer with AI
  ├── InsightCard.tsx        # AI-generated insights
  └── PredictionWidget.tsx   # Predictive analytics
```

#### Environment Variables

```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# AI Configuration
AI_DEFAULT_MODEL=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Rate Limiting
AI_RATE_LIMIT_PER_USER=100  # requests per hour
AI_RATE_LIMIT_PER_ORG=1000  # requests per hour
```

#### Database Changes

```prisma
model AIConversation {
  id             String   @id @default(cuid())
  organizationId String
  userId         String

  messages       AIMessage[]
  context        Json?     // Additional context
  model          String    // Which model was used
  totalTokens    Int       @default(0)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(...)
  user           User         @relation(...)
}

model AIMessage {
  id               String   @id @default(cuid())
  conversationId   String
  role             AIMessageRole
  content          String   @db.Text
  toolCalls        Json?    // Function calls made
  tokenCount       Int      @default(0)

  createdAt        DateTime @default(now())

  conversation     AIConversation @relation(...)
}

enum AIMessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

model AIPrediction {
  id             String   @id @default(cuid())
  organizationId String
  type           PredictionType

  input          Json     // Input data
  output         Json     // Prediction results
  confidence     Float    // 0-1 confidence score
  model          String   // Which model generated it

  createdAt      DateTime @default(now())

  organization   Organization @relation(...)
}

enum PredictionType {
  CHURN_RISK
  REVENUE_FORECAST
  LEAD_SCORE
  APPOINTMENT_NO_SHOW
  SENTIMENT
}
```

### Security Considerations

1. **Rate Limiting**: Implement per-user and per-organization limits
2. **Cost Tracking**: Monitor token usage to prevent runaway costs
3. **Data Privacy**: Never send PII to AI without explicit consent
4. **Prompt Injection**: Sanitize user inputs, use structured outputs
5. **Audit Logging**: Log all AI interactions for compliance
6. **Model Fallbacks**: Graceful degradation if AI service is down

### Performance Optimizations

1. **Edge Runtime**: Deploy AI endpoints to edge for low latency
2. **Response Caching**: Cache common queries (analytics, insights)
3. **Streaming UI**: Show partial results as they generate
4. **Model Routing**: Use fast/cheap models for simple tasks
5. **Batch Processing**: Group multiple requests when possible

### Future Enhancements

- **Fine-Tuned Models**: Custom models trained on agency-specific data
- **Multi-Modal Agents**: Combine text, image, voice inputs
- **Autonomous Workflows**: AI agents that execute multi-step tasks
- **Real-Time Collaboration**: Multiple users with AI assistant
- **Voice Interface**: Natural language dashboard control

### References

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK Core Concepts](https://sdk.vercel.ai/docs/ai-sdk-core)
- [React Server Components + AI](https://sdk.vercel.ai/docs/ai-sdk-rsc)
- [Anthropic Claude Documentation](https://docs.anthropic.com)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

---

## ADR-004: Calendar as Core Feature vs Integration

**Date:** 2025-10-16
**Status:** Approved
**Decision Makers:** Product strategy, development team

### Context

The platform pivot to an AI-powered CRM raises a critical architectural question: Should the calendar be a **core platform feature** we own and build upon, or an **integration** with existing calendar systems?

**Business Requirements:**

- Operations dashboard must show today's appointments
- Agencies need booking capabilities for their clients
- Multi-location support (franchise businesses)
- Real-time availability management
- Integration with existing GHL calendars

**Two Competing Approaches:**

**Approach A: Calendar as Integration**

- Treat calendar as external data source
- Fetch appointments from GHL on-demand
- Display read-only appointment data
- Deep link to GHL for booking management

**Approach B: Calendar as Core Feature**

- Bidirectional sync with GHL
- Build native booking capabilities
- Store appointment data in our database
- Extend with AI features (optimization, predictions)

### Decision

**Calendar is a CORE FEATURE with intelligent sync, not just an integration**

The calendar must be a first-class citizen in our platform because:

1. It's central to operations dashboards across all verticals
2. AI features require local data for predictions and optimization
3. White-label clients need booking without GHL branding
4. Future features (resource management, team scheduling) require ownership

**Architecture Pattern:**

```typescript
// Hybrid approach: Own the data, sync bidirectionally

// 1. Background sync job (every 5 minutes)
export async function syncAppointmentsFromGHL(organizationId: string) {
  const locations = await getGHLLocations(organizationId);

  for (const location of locations) {
    const ghlAppointments = await ghlClient.getCalendarEvents({
      locationId: location.ghlId,
      startDate: startOfDay(new Date()),
      endDate: endOfDay(addDays(new Date(), 30)), // 30-day window
    });

    // Upsert to our database (source of truth becomes our DB + GHL combined)
    await prisma.appointment.upsert({
      where: { ghlEventId: apt.id },
      update: { status: apt.status, startsAt: apt.startTime, ... },
      create: {
        organizationId,
        locationId: location.id,
        ghlEventId: apt.id,
        ...apt
      },
    });
  }
}

// 2. Real-time webhook handler (GHL → Our DB)
export async function handleGHLWebhook(event: GHLWebhookEvent) {
  if (event.type === 'appointment.created') {
    await prisma.appointment.create({
      data: {
        ghlEventId: event.data.id,
        organizationId: event.organizationId,
        // ... map all fields
      },
    });
  }

  if (event.type === 'appointment.updated') {
    await prisma.appointment.update({
      where: { ghlEventId: event.data.id },
      data: { status: event.data.status, ... },
    });
  }
}

// 3. Create appointments in our platform → Sync to GHL
export async function createAppointment(params: {
  organizationContext: OrganizationContext;
  appointmentData: AppointmentCreate;
}) {
  // Create in our database first
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: params.organizationContext.organizationId,
      ...params.appointmentData,
    },
  });

  // Then sync to GHL (async, non-blocking)
  await queue.add('sync-to-ghl', {
    appointmentId: appointment.id,
    action: 'create',
  });

  // Also sync to Cal.com for availability blocking
  await calcomClient.createBooking({
    eventTypeId: location.calcomEventTypeId,
    startTime: appointment.startsAt,
    endTime: appointment.endsAt,
    // ... other fields
  });

  return appointment;
}
```

**Data Flow Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Our Platform (Source of Truth)            │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │ Appointments │ ←──→ │   Cal.com    │ ←─→ │  Providers │ │
│  │   Database   │      │  (Scheduling)│     │  (Google)  │ │
│  └──────┬───────┘      └──────────────┘     └────────────┘ │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │ Bidirectional Sync
          ↓
┌─────────────────────────────────────────────────────────────┐
│                    GoHighLevel (Legacy System)               │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ GHL Calendar │      │  GHL Contacts│                     │
│  └──────────────┘      └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

1. **AI Capabilities Unlocked**: Can analyze appointment patterns, predict no-shows, optimize scheduling
2. **White-Label Ready**: Agencies can offer booking without GHL branding
3. **Performance**: Fast dashboard loads (local data, no API calls per page view)
4. **Offline Resilience**: Platform works even if GHL API is down
5. **Feature Velocity**: Can ship calendar features without waiting for GHL
6. **Data Ownership**: Complete control over appointment analytics and reporting
7. **Multi-Provider**: Can aggregate from GHL + native bookings + Cal.com

### Tradeoffs

1. **Sync Complexity**: Need robust bidirectional sync with conflict resolution
2. **Data Consistency**: Risk of drift between our DB and GHL
3. **Storage Costs**: Storing appointment data in our database
4. **Migration Effort**: Existing GHL users need data import
5. **Maintenance Burden**: Own the calendar feature stack

### Conflict Resolution Strategy

When appointment data conflicts between systems:

```typescript
export async function resolveAppointmentConflict(
  ourVersion: Appointment,
  ghlVersion: GHLAppointment
) {
  // Rule 1: Most recent update wins
  if (ghlVersion.updatedAt > ourVersion.updatedAt) {
    return await prisma.appointment.update({
      where: { id: ourVersion.id },
      data: mapGHLToOurSchema(ghlVersion),
    });
  }

  // Rule 2: Status changes always propagate
  if (ourVersion.status !== ghlVersion.status) {
    await ghlClient.updateAppointment({
      id: ghlVersion.id,
      status: ourVersion.status,
    });
  }

  // Rule 3: Deletions propagate both ways
  if (ourVersion.status === "DELETED") {
    await ghlClient.deleteAppointment(ghlVersion.id);
  }

  // Rule 4: Log conflicts for manual review
  await prisma.syncConflict.create({
    data: {
      entity: "appointment",
      ourData: ourVersion,
      externalData: ghlVersion,
      resolution: "auto_resolved",
    },
  });
}
```

### Alternatives Considered

**Pure Integration Approach**

- ✅ Simpler implementation
- ✅ No data duplication
- ❌ No AI capabilities (requires local data)
- ❌ Poor performance (API call per dashboard load)
- ❌ GHL branding on all bookings
- ❌ Dependent on GHL API uptime

**Full Custom Calendar (No GHL Integration)**

- ✅ Complete control
- ✅ No sync complexity
- ❌ Agencies must migrate away from GHL calendars
- ❌ High customer friction
- ❌ Lose existing GHL appointment data

### Implementation Phases

**Phase 1: Read-Only Sync**

- Set up GHL webhook listeners
- Import appointments to our database
- Display on operations dashboard
- No write-back yet

**Phase 2: Bidirectional Sync**

- Enable creating appointments in our platform
- Sync new appointments to GHL
- Implement conflict resolution
- Add sync status monitoring

**Phase 3: Cal.com Integration**

- Connect Cal.com for booking flows
- Sync availability to Cal.com
- Block time slots from GHL appointments
- White-label booking pages

**Phase 4: AI Features**

- No-show prediction model
- Optimal scheduling suggestions
- Appointment clustering analysis
- Revenue forecasting from booking patterns

### Monitoring & Observability

```typescript
// Track sync health
model SyncStatus {
  id             String   @id @default(cuid())
  organizationId String
  source         SyncSource
  lastSyncAt     DateTime?
  status         SyncStatusType
  errorCount     Int      @default(0)
  lastError      String?  @db.Text

  organization   Organization @relation(...)
}

enum SyncSource {
  GHL_APPOINTMENTS
  GHL_CONTACTS
  CALCOM_BOOKINGS
  STRIPE_PAYMENTS
}

enum SyncStatusType {
  HEALTHY
  WARNING
  ERROR
  DISABLED
}
```

### Success Metrics

- **Sync Latency**: < 30 seconds from GHL update to our dashboard
- **Conflict Rate**: < 0.1% of appointments have sync conflicts
- **Uptime**: 99.9% dashboard availability even during GHL outages
- **Performance**: Dashboard loads in < 1 second (cached appointment data)
- **Data Accuracy**: 99.99% match between GHL and our database

### References

- GHL Calendar API Documentation
- Cal.com Webhook Integration Guide
- [Event Sourcing Patterns](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Bidirectional Sync Best Practices](https://github.com/supabase/realtime/discussions/123)

---

## ADR-005: Named Slots for Page Headers (DEPRECATED)

**Date:** 2025-01-17
**Status:** Superseded
**Superseded Date:** 2025-01-27

**Historical Note:** Named Slots (@header directories using Next.js Parallel Routes) was implemented but replaced with simpler config-based navigation pattern using `/lib/navigation.ts` and `SiteHeader` component. The config-based pattern provides a single source of truth for both sidebar navigation and page headers, reducing complexity and maintenance burden for the MVP phase.

**Current Implementation:** See [Navigation Configuration Pattern](../essentials/coding-patterns.md#navigation-configuration-pattern) for current approach.

**Removed:** All @header directories have been removed from the codebase (October 2025).

---
