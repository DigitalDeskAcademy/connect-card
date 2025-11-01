# Architecture Decision Records

This document tracks significant architectural decisions made during the development of ChurchSyncAI.

**Historical Context:** This project was forked from SideCar Platform (IV clinic management system) in October 2025 and rebranded for church connect card management. Some ADRs contain historical "clinic" references from the original project. These references are preserved for historical context but do not reflect current implementation.

---

## ADR-001: Direct Server Action Imports vs Callback Injection

**Date:** 2025-10-11
**Status:** Approved
**Decision Makers:** Development team after expert code review

### Context

After refactoring to eliminate 40% code duplication (1,002 lines), we implemented a callback injection pattern where wrapper components inject context-specific server actions as props to shared components.

**Pattern implemented:**

```typescript
// Wrapper component
<NewChapterModal
  courseId={courseId}
  onSubmit={(data) => createChapter(slug, data)}  // ← Injected callback
/>

// Shared component receives callback as prop
interface NewChapterModalProps {
  courseId: string;
  onSubmit: (data: ChapterSchemaType) => Promise<ApiResponse>;
}
```

### Problem

Code review by both general code reviewer and Next.js expert revealed issues:

1. **Not Next.js Native**: Callback injection is a React SPA pattern, not idiomatic Next.js 15
2. **Unnecessary Wrappers**: 320 lines of wrapper component code add no value
3. **Circular Reference Risk**: Property names shadowing imports (caused production bug)
4. **Bundle Size**: Ships ~50KB of unnecessary routing code to client
5. **Complexity**: Adds abstraction layer that fights framework conventions
6. **Testing**: Requires mocking callbacks instead of simpler import mocking

### Decision

**Use direct server action imports with context parameters**

Shared components import unified server actions directly and pass organization context as data parameters, not callbacks.

**New pattern:**

```typescript
// No wrapper needed - use component directly in page
<NewChapterModal
  courseId={courseId}
  organizationContext={{ type: 'agency', slug: params.slug }}
/>

// Component imports action directly
import { createChapter } from '@/actions/courses';

export function NewChapterModal({ courseId, organizationContext }: Props) {
  async function handleSubmit(values: ChapterSchemaType) {
    await createChapter({
      ...values,
      context: organizationContext
    });
  }
}
```

### Implementation

#### Unified Server Actions

Create single action file that handles both platform and agency contexts:

```typescript
// actions/courses.ts
export async function createChapter(params: {
  name: string;
  courseId: string;
  context: OrganizationContext;
}) {
  if (params.context.type === 'agency') {
    const { organization } = await requireAgencyAdmin(params.context.slug);
    // Agency-specific logic with organizationId scoping
  } else {
    await requireAdmin();
    // Platform-specific logic
  }

  // Shared creation logic
  revalidatePath(...); // Context-specific path
}
```

#### Type Safety

```typescript
export type OrganizationContext =
  | { type: "platform" }
  | { type: "agency"; slug: string };
```

#### Component Pattern

```typescript
// Shared components import actions directly
import {
  createChapter,
  deleteChapter,
  reorderChapters,
} from "@/actions/courses";

export function CourseStructure({
  course,
  organizationContext,
  basePath,
}: Props) {
  // Direct action calls with context
  const handleReorder = async (data: ReorderData[]) => {
    await reorderChapters({
      courseId: course.id,
      chapters: data,
      context: organizationContext,
    });
  };
}
```

### Benefits

1. **Eliminates 320 lines** of wrapper component code
2. **Next.js Native**: Follows framework conventions for server actions
3. **No Circular References**: Can't happen with direct imports
4. **Better Tree-Shaking**: Next.js optimizes better with direct imports
5. **Smaller Bundle**: ~30KB reduction in client JavaScript
6. **Simpler Architecture**: One less abstraction layer
7. **Easier Testing**: Mock at import level with standard patterns
8. **Better DX**: Less prop drilling, clearer data flow

### Tradeoffs

1. **Server Actions More Complex**: Need to handle multiple contexts internally
2. **Context Passed Explicitly**: Slightly more verbose component props
3. **Migration Effort**: Refactoring of existing code required

### Consequences

#### Files Affected

- **Deleted**: Wrapper components (~320 lines)

  - `AgencyCourseEditClient.tsx`
  - `CourseEditClient.tsx`

- **Modified**: Shared components

  - `CourseStructure.tsx`
  - `NewChapterModal.tsx`
  - `NewLessonModal.tsx`
  - `EditCourseForm.tsx`
  - `DeleteChapter.tsx`
  - `DeleteLesson.tsx`

- **Created**: Unified actions
  - `/actions/courses.ts`

#### Pages Simplified

```typescript
// Before: Wrapper with callback injection
export default async function CourseEditPage({ params }) {
  const course = await getCourse(params.courseId);
  return <AgencyCourseEditClient course={course} courseId={params.courseId} slug={params.slug} />;
}

// After: Direct component usage
export default async function CourseEditPage({ params }) {
  const course = await getCourse(params.courseId);
  return (
    <CourseStructure
      course={course}
      organizationContext={{ type: 'agency', slug: params.slug }}
      basePath={`/agency/${params.slug}/admin/courses`}
    />
  );
}
```

### Industry Precedent

This pattern aligns with:

- **Vercel's own applications** (v0, Vercel Dashboard): Direct server action imports
- **Next.js 15 documentation**: Recommends importing server actions in client components
- **Linear (Next.js)**: Uses direct imports, not callback injection
- **Notion (Next.js)**: Progressive enhancement with direct action calls

### Expert Review Consensus

**Code Reviewer (General):** "Current callback pattern is appropriate for 2-3 contexts and production-ready, but the direct import pattern is simpler."

**Next.js Expert:** "Callback pattern fights Next.js conventions. Direct imports are idiomatic Next.js 15 and eliminate unnecessary abstraction."

**Conclusion:** Both experts agree direct imports are superior, though current pattern is functional.

### Comparison Matrix

| Aspect                    | Callback Injection             | Direct Imports       |
| ------------------------- | ------------------------------ | -------------------- |
| Shared UI components      | ✅ Yes                         | ✅ Yes               |
| Wrapper components needed | ❌ Yes (320 lines)             | ✅ No (0 lines)      |
| Server action files       | 2 separate                     | 1 unified            |
| Next.js native            | ⚠️ React pattern               | ✅ Next.js pattern   |
| Circular reference risk   | ❌ Yes (happened)              | ✅ No                |
| Bundle size               | ~65KB                          | ~35KB                |
| Architecture layers       | 3 (page → wrapper → component) | 2 (page → component) |
| Multi-tenant security     | ✅ Yes                         | ✅ Yes               |
| Type safety               | ✅ Yes                         | ✅ Yes               |

### Future Implications

**This pattern should be used for all new features:**

✅ **DO**: Import server actions directly in client components

```typescript
"use client";
import { performAction } from "@/actions/feature";

export function FeatureComponent({ organizationContext }) {
  const handleAction = async data => {
    await performAction({ data, context: organizationContext });
  };
}
```

❌ **DON'T**: Create wrapper components with callback injection

```typescript
// Avoid this pattern
interface Props {
  onPerformAction: (data) => Promise<void>;
}
```

### References

- [Next.js 15 Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Code Review Report: 2025-10-11
- Original implementation: Commit 82e6637 (used direct imports before refactor)

### Lessons Learned

1. **Sometimes simpler is better**: The original implementation had the right instinct
2. **Framework conventions matter**: Next.js provides patterns for a reason
3. **Abstraction has cost**: Every layer adds complexity and maintenance burden
4. **Share UI, not behavior**: UI logic should be shared; business logic should be imported
5. **Listen to expert feedback**: Both reviewers independently recommended this approach

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

## ADR-005: Named Slots Pattern for Page Headers

**Date:** 2025-01-17
**Status:** Superseded (Replaced by config-based header pattern)
**Superseded Date:** 2025-01-27
**Decision Makers:** Development team, architecture review

**Note:** This pattern was implemented but later replaced with a simpler config-based approach using `/lib/navigation.ts` and `SiteHeader` component. The config-based pattern provides a single source of truth for both sidebar navigation and page headers, reducing complexity and maintenance burden for the MVP phase. See "Navigation Pattern" in `/docs/PROJECT_OVERVIEW.md` for current implementation.

### Context

The platform needs a consistent way to render page-level headers (title, tabs, actions) across all dashboard pages. We have identified three different patterns currently in use:

1. **Platform courses**: Use React Context (`usePageHeader` hook)
2. **Agency courses**: Pass header props to components internally
3. **Conversations**: Hardcode headers inside components

This inconsistency creates:

- Maintenance burden (3 different patterns to maintain)
- Layout shift issues (client-side header rendering)
- Performance problems at scale (client component cascade)
- Developer confusion (which pattern to use?)

**Requirements:**

- Consistent header pattern across 15+ dashboard pages
- Support for title, subtitle, tabs, and action buttons
- Optional headers (some pages like Settings don't need them)
- Server-side rendering for performance
- Type-safe and developer-friendly
- Scale to 100 agencies × 1000s of users

**Options Considered:**

1. **React Context Pattern** - Keep and standardize existing Context approach
2. **Named Slots Pattern** - Use Next.js 15 parallel routes feature

### Decision

**Use Named Slots (Parallel Routes) pattern for all page headers**

Named Slots is the architecturally correct solution for Next.js 15 because it uses true Server Components, eliminates client-side state management, and follows framework conventions.

**Implementation Pattern:**

```typescript
// Layout accepts header slot parameter
export default async function AgencyAdminLayout({
  children,
  header, // ← Named slot for header content
  params,
}: {
  children: ReactNode;
  header?: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <DashboardLayout>
      {header} {/* Render header slot */}
      {children}
    </DashboardLayout>
  );
}

// Header file: @header/default.tsx
import { PageHeader } from "@/components/layout/page-header";

export default function ConversationsHeader() {
  return (
    <PageHeader
      title="Conversations"
      tabs={[
        { label: "All", href: "?view=all" },
        { label: "Unread", href: "?view=unread" },
      ]}
      actions={<Button>New Message</Button>}
    />
  );
}
```

### Benefits

1. **True Server Components**: Headers render server-side (0 extra client JS)
2. **Zero Layout Shift**: Headers present on initial HTML (CLS = 0)
3. **Scalable Performance**: No client state, no memory leaks
   - Context: 1000 users = 110MB bandwidth, 5-10GB RAM
   - Named Slots: 1000 users = 20MB bandwidth, minimal RAM
4. **Next.js Native**: Uses framework-provided parallel routes feature
5. **Type Safety**: TypeScript enforces layout contracts
6. **Better SEO**: Headers in initial HTML, not hydrated client-side
7. **Developer Experience**: Clear file structure, easy to discover

### Tradeoffs

1. **Migration Effort**: Multi-route refactoring required
2. **New File Structure**: Developers must learn `@header/` directory pattern
3. **Less Familiar**: Most React developers know Context, fewer know Named Slots
4. **Framework Lock-In**: Tied to Next.js App Router (acceptable given stack choice)

### Alternatives Considered

**React Context Pattern**

- ✅ Familiar to React developers
- ✅ Easier to implement initially
- ❌ Client component cascade (200KB+ per user)
- ❌ Memory leaks at scale (compounds with user count)
- ❌ Layout shift (CLS = 0.2, failing Core Web Vitals)
- ❌ Performance degradation (500ms delay per navigation at 1000 users)
- ❌ Not Next.js native (React SPA pattern)

**Conclusion**: Context is easier now but creates technical debt that becomes painful at 100 agencies. Named Slots is the correct long-term architecture.

### Consequences

#### Files to Modify

**Layouts (2 files):**

- `/app/platform/admin/layout.tsx` - Add header slot parameter
- `/app/agency/[slug]/admin/layout.tsx` - Add header slot parameter

**Headers to Create (15+ files):**

- `@header/default.tsx` for each route (dashboard, conversations, contacts, calendar, courses, analytics, insights, inventory, settings)

**Components to Clean Up:**

- Remove internal headers from `CourseListingPage.tsx` (lines 135-147)
- Remove `usePageHeader` from `CoursesPageClient.tsx`
- Update `PageHeader.tsx` to support client-side tab interactions

**Files to Delete:**

- `/app/providers/page-header-context.tsx` - No longer needed
- Context provider references in layouts

#### Migration Strategy

See `/docs/technical/NAMED-SLOTS-MIGRATION.md` for complete 3-phase implementation plan:

- **Phase 1**: Infrastructure Setup - Update layouts
- **Phase 2**: Create Headers for Routes - Create `@header/` files
- **Phase 3**: Clean Up Existing Components - Remove old patterns

#### Success Criteria

- ✅ All dashboard pages use Named Slots pattern
- ✅ Zero client-side header state management
- ✅ CLS score < 0.1 for all pages
- ✅ Page load times < 1 second
- ✅ Build passing with no TypeScript errors
- ✅ Consistent developer experience across all routes

### Industry Precedent

This pattern aligns with:

- **Next.js 15 Documentation**: Recommends parallel routes for layout composition
- **Vercel Dashboard**: Uses parallel routes for section headers
- **Linear**: Server-side layout composition
- **Notion**: Progressive enhancement with server components

### Lessons Learned

1. **Optimize for scale, not ease**: The "easier" solution (Context) doesn't scale to 100 agencies
2. **Trust framework conventions**: Next.js provides patterns for a reason
3. **Measure the right thing**: Initial implementation time < long-term maintainability
4. **Plan for growth**: Architecture decisions should consider 10× scale, not current state

### References

- [Next.js Parallel Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- Implementation Plan: `/docs/technical/NAMED-SLOTS-MIGRATION.md`
- Code examples: Migration document Phase 2 section
- Performance analysis: Migration document "Why Named Slots" section

---

## ADR-006: URL-Based Navigation Tabs vs Client-Side Tabs

**Date:** 2025-01-19
**Status:** Approved
**Decision Makers:** Development team, UX review

### Context

After implementing the Named Slots pattern (ADR-005), we needed to decide where page navigation tabs should live and how they should be implemented. We identified several issues with the previous approach:

1. **Tabs in PageHeader (header slot)**: Creates unnecessary coupling between header and content
2. **Client-Side State**: Tab selection lost on page refresh
3. **Not Bookmarkable**: Can't share URLs to specific tab views
4. **Poor SEO**: Search engines can't index individual tab content
5. **Server Component Limitations**: Tabs in headers require client components

**Requirements:**

- Bookmarkable URLs for each tab view (share links to specific tabs)
- SEO-friendly (each tab view has unique URL)
- Server Component compatible (no client-side state for navigation)
- Works with browser back/forward buttons
- Supports tab counts/badges from server data
- Clean separation between header (title/actions) and content (navigation)

**Options Considered:**

1. **Keep tabs in PageHeader** - Continue using tabs in header slot
2. **URL-based tabs in content** - Move tabs to page content using query parameters
3. **Hybrid approach** - Some tabs in header, some in content

### Decision

**Use URL-based navigation tabs in page content area, remove tabs from PageHeader**

Navigation tabs should live in the content area and use URL query parameters for state management. The PageHeader component focuses solely on page title, subtitle, and actions.

**Implementation Pattern:**

```typescript
// PageHeader - simplified (no tabs support)
export function PageHeader({
  title,
  subtitle,
  actions,
  compact
}: PageHeaderProps) {
  return (
    <div className="bg-background">
      <div className="flex items-center justify-between border-b px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground">›</span>
              <h2 className="text-lg text-primary font-medium">{subtitle}</h2>
            </>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// NavTabs component - URL-based navigation
export function NavTabs({ tabs, baseUrl, paramName = "tab" }: NavTabsProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get(paramName) || tabs[0]?.value || "";

  return (
    <div className="border-b bg-background">
      <nav className="flex gap-6 px-4 lg:px-6 py-3 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          const href = tab.value === tabs[0].value
            ? baseUrl  // Default tab doesn't need query param
            : `${baseUrl}?${paramName}=${tab.value}`;

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "border-b-2 px-1 text-sm font-medium whitespace-nowrap",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Page implementation - Server Component
type SearchParams = Promise<{ tab?: string }>;

export default async function ContactsPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "all";

  // Fetch data based on active tab (server-side)
  const contacts = await getContacts({ filter: activeTab });

  return (
    <div className="flex flex-1 flex-col gap-0">
      <NavTabs
        baseUrl="/platform/admin/contacts"
        tabs={[
          { label: "All", value: "all", count: 77 },
          { label: "Smart Lists", value: "smart-lists", count: 5 },
          { label: "Companies", value: "companies", count: 12 },
        ]}
      />

      {activeTab === "all" && <ContactsPageClient contacts={contacts} />}
      {activeTab === "smart-lists" && <SmartListsView />}
      {activeTab === "companies" && <CompaniesView />}
    </div>
  );
}
```

### Benefits

1. **Bookmarkable URLs**: Each tab view has a unique URL that can be shared
   - `/contacts?tab=smart-lists` → direct link to Smart Lists tab
   - Browser back/forward buttons work correctly
2. **SEO Friendly**: Search engines can crawl and index each tab's content separately
3. **Server Components**: Page can be a Server Component (no client state for navigation)
4. **Type Safe**: TypeScript ensures correct tab values and URL parameters
5. **Better UX**: Users can refresh page without losing tab selection
6. **Analytics**: Track which tabs users visit most frequently
7. **Clean Separation**: Headers focus on page identity, content handles navigation

### Tradeoffs

1. **URL Visible**: Tab selection visible in URL (but this is actually a benefit for sharing)
2. **Full Page Navigation**: Changing tabs triggers page navigation (mitigated by Next.js client-side routing)
3. **Slightly More Complex**: Requires reading searchParams and conditional rendering
4. **Migration Effort**: Need to update all pages using tabs (~17 pages affected)

### Alternatives Considered

**Keep Tabs in PageHeader**

- ✅ Familiar pattern (same as before)
- ✅ Tabs stay with page title
- ❌ Not bookmarkable (client-side state only)
- ❌ Poor SEO (tabs don't create unique URLs)
- ❌ Forces PageHeader to be client component
- ❌ Tab state lost on refresh

**Client-Side Tabs in Content**

- ✅ Smooth transitions (no page reload)
- ✅ Can use React state for tab selection
- ❌ Not bookmarkable
- ❌ Poor SEO
- ❌ State lost on refresh
- ❌ Forces client component

**Hybrid Approach (Both)**

- ❌ Inconsistent UX (some tabs bookmarkable, some not)
- ❌ Confusing for developers
- ❌ Maintenance burden (two patterns to maintain)

### Consequences

#### Files Created

- `/components/layout/nav-tabs.tsx` - URL-based tab navigation component

#### Files Modified

**PageHeader Component:**

- Removed `tabs` prop support
- Added `subtitle` and `compact` props
- Simplified to focus on page identity only

**17+ Header Pages:**

- Removed tabs from all @header pages:
  - Platform: analytics, api, appointments, conversations, help, inventory, payments, profile, projects, reviews, settings, team
  - Agency: analytics, calendar, conversations, insights, inventory

**Page Implementations:**

- `/app/platform/admin/contacts/page.tsx` - Converted from client-side Tabs to URL-based NavTabs
- Created `/app/platform/admin/contacts/_components/ContactsPageClient.tsx` for client state

**DashboardContentWrapper:**

- Removed all padding/gap to support edge-to-edge layouts
- Changed from `gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6` to just `flex-col`
- Gives pages full control over their own spacing

#### Pattern for Future Features

**DO:**

```typescript
// ✅ Use NavTabs in page content with URL params
<div className="flex flex-1 flex-col gap-0">
  <NavTabs
    baseUrl="/path"
    tabs={[
      { label: "Tab 1", value: "tab1" },
      { label: "Tab 2", value: "tab2" },
    ]}
  />

  {activeTab === "tab1" && <Tab1Content />}
  {activeTab === "tab2" && <Tab2Content />}
</div>
```

**DON'T:**

```typescript
// ❌ Don't put tabs in PageHeader
<PageHeader
  title="Page Title"
  tabs={[...]}  // ← This prop no longer exists
/>

// ❌ Don't use client-side tab state
const [activeTab, setActiveTab] = useState("tab1");
```

### Related Changes

**ContactsTable Optimization:**

As part of this work, we also optimized the contacts table for maximum screen real estate:

1. **Progressive Disclosure Pattern**: Action bar shows 3 core actions always, rest in three-dot menu below 1250px
2. **Edge-to-Edge Layout**: Removed global padding from wrapper for data tables
3. **Responsive Breakpoints**: Custom `min-[1250px]` breakpoint for optimal layout
4. **Consistent Button Heights**: All buttons fixed to `h-10` (40px)

This pattern should be followed for other data-heavy pages (payments, appointments, inventory, etc.)

### Success Metrics

- ✅ All tab views have unique, bookmarkable URLs
- ✅ Browser back/forward works correctly across tabs
- ✅ Page can remain Server Component (no forced client components)
- ✅ Tab counts/badges update from server data
- ✅ Build passes with no TypeScript errors
- ✅ Consistent pattern across all dashboard pages

### Industry Precedent

This pattern aligns with:

- **HubSpot CRM**: Uses URL parameters for tab navigation (`?view=list`)
- **Salesforce**: Tab selection reflected in URL
- **Linear**: URL-based navigation for different views
- **GoHighLevel**: Query parameters for filtering and tab state
- **Gmail**: Labels and categories in URL

### Lessons Learned

1. **Location Matters**: Navigation tabs belong in content, not headers
2. **URLs Are State**: For navigation state, URL is the source of truth
3. **SEO First**: Bookmarkable URLs are better for users and search engines
4. **Server Components Win**: URL-based navigation keeps pages as Server Components
5. **Data Tables Need Space**: Edge-to-edge layouts essential for data-heavy pages

### References

- [Next.js searchParams Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional)
- [React useSearchParams Hook](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- Implementation: PR #42 - "feat: implement URL-based navigation tabs and optimize layout for data tables"
- Related: ADR-005 (Named Slots Pattern)

---

## ADR-007: Role Framework Consolidation with Discriminated Union DataScope

**Date:** 2025-01-21
**Status:** Superseded (Simplified from 3-tier to 2-tier for church use case)
**Superseded Date:** 2025-10-26
**Decision Makers:** Development team, expert agent consultation (fullstack-developer, nextjs-developer, typescript-pro)

**Note:** This ADR was written for the original SideCar Platform (IV clinic system) with 3 tiers: platform → agency → clinic. ChurchSyncAI simplified this to 2 tiers: platform → church. Location filtering is now handled via `user.defaultLocationId` rather than a separate DataScope tier. The `ClinicScope` type has been removed.

### Context

The platform has 3 user tiers (platform_admin → agency_admin → clinic_user) with duplicate infrastructure instead of unified components. We have:

**Current Problem:**

- Contacts: 2 separate components (ContactsPageClient + AgencyContactsClient)
- Appointments: 2 implementations (CalendarClient + placeholder)
- Courses: 2 implementations (CourseEditClient + AgencyCourseEditClient)

**Existing Foundation:**

- `requireDashboardAccess()` returns DataScope with proper role-based filtering ✅
- Payments component already follows correct pattern (ONE component, shared) ✅
- Middleware extracts tenant from URL and validates ✅

**Business Impact:**

- 60% duplicate code slows feature development
- Building same feature 3× increases bug surface area
- New developers confused by multiple implementations
- Maintenance burden compounds with each new feature

### Decision

**Consolidate to unified component architecture with discriminated union DataScope**

1. **Component Location:** `/components/dashboard/` for shared dashboard components
2. **Type System:** Discriminated union DataScope with type guards
3. **Route Structure:** Keep separate routes (`/platform/admin/*` and `/agency/[slug]/admin/*`)
4. **Data Access:** Centralized scoped query helpers in `/lib/data/`
5. **Naming:** Standardize on "appointments" (not "calendar")

### Implementation Pattern

#### Discriminated Union DataScope

```typescript
interface DataScopeBase {
  organizationId: string;
  filters: {
    canSeeAllOrganizations: boolean;
    canEditData: boolean;
    canDeleteData: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
  };
}

export type PlatformScope = DataScopeBase & { type: "platform" };
export type AgencyScope = DataScopeBase & { type: "agency" };
export type ClinicScope = DataScopeBase & { type: "clinic"; clinicId: string };
export type DataScope = PlatformScope | AgencyScope | ClinicScope;

// Type guards for narrowing
export function isPlatformScope(scope: DataScope): scope is PlatformScope {
  return scope.type === "platform";
}
export function isAgencyScope(scope: DataScope): scope is AgencyScope {
  return scope.type === "agency";
}
export function isClinicScope(scope: DataScope): scope is ClinicScope {
  return scope.type === "clinic";
}
```

**Why Discriminated Union:**

- Compile-time enforcement that `clinicId` is required for clinic type
- Exhaustive type checking via switch statements
- Perfect type narrowing with type guards
- Industry standard for TypeScript RBAC patterns

#### Component Architecture

```
components/dashboard/contacts/contacts-client.tsx ← SHARED
app/platform/admin/contacts/page.tsx → imports shared component
app/agency/[slug]/admin/contacts/page.tsx → imports shared component
```

**Pattern:**

```typescript
// 1. Shared component accepts DataScope
interface ContactsClientProps {
  contacts: Contact[];
  dataScope: DataScope;
}

export function ContactsClient({ contacts, dataScope }: ContactsClientProps) {
  const showOrgFilter = isPlatformScope(dataScope);
  const canEdit = dataScope.filters.canEditData;
  return <ContactsTable contacts={contacts} canEdit={canEdit} showOrgColumn={showOrgFilter} />;
}

// 2. Platform page uses requireAdmin()
export default async function PlatformContactsPage() {
  await requireAdmin();
  const dataScope: PlatformScope = { type: "platform", ... };
  const contacts = await getContactsForScope(dataScope);
  return <ContactsClient contacts={contacts} dataScope={dataScope} />;
}

// 3. Agency page uses requireDashboardAccess()
export default async function AgencyContactsPage({ params }) {
  const { dataScope } = await requireDashboardAccess(params.slug);
  const contacts = await getContactsForScope(dataScope);
  return <ContactsClient contacts={contacts} dataScope={dataScope} />;
}

// 4. Scoped data helper with type safety
export async function getContactsForScope(dataScope: DataScope) {
  if (isPlatformScope(dataScope)) {
    return prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  }
  if (isClinicScope(dataScope)) {
    return prisma.contact.findMany({
      where: {
        organizationId: dataScope.organizationId,
        clinicId: dataScope.clinicId, // ✅ TypeScript knows this exists
      },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.contact.findMany({
    where: { organizationId: dataScope.organizationId },
    orderBy: { createdAt: "desc" },
  });
}
```

### Industry Validation

Consulted industry research (2025 best practices):

**Multi-tenant SaaS Architecture:**
✅ Path-based routing with shared DB + tenant_id is standard (not subdomains)
✅ Middleware-based tenant resolution recommended
✅ Shared components in `/components`, not nested in `/app` routes
✅ "Non-negotiable rule: every query must filter by tenant_id"

**TypeScript RBAC Patterns:**
✅ Discriminated unions recommended for role-based access control
✅ Type guards provide perfect type narrowing for permissions
✅ Exhaustive checking prevents missing cases in switch statements

**Next.js RSC Best Practices:**
✅ Shared components enable better code splitting and tree-shaking
✅ Server Components for data fetching, Client Components for interactivity
✅ File-system routing with separate admin paths is recognized B2B pattern

**Reference Sources:**

- Next.js 15 multi-tenant SaaS documentation (2025)
- TypeScript discriminated unions for RBAC (2025 patterns)
- Next.js App Router component organization (Vercel guidelines)
- Multi-tenant data isolation standards (AWS whitepapers)

### Expert Agent Consensus

**Fullstack Developer:** Recommended `/components/dashboard/` + separate routes

- Shared components for maintainability at scale
- Separate routes preserve platform-specific feature flexibility
- Scoped data helpers prevent data leakage bugs

**Next.js Developer:** Acknowledged both patterns valid, slight preference for unified routes

- Separate routes = clearer separation of concerns
- Unified routes = ~51% bundle reduction (not critical at current scale)
- Both patterns industry-recognized, chose based on flexibility needs

**TypeScript Pro:** Strongly recommended discriminated unions

- Compile-time safety for `clinicId` requirement
- Exhaustive checking prevents bugs
- Best auto-import experience with `/components/dashboard/`

### Benefits

1. **Type Safety:** Compile-time guarantees prevent data leakage

   - Impossible to forget `organizationId` filter
   - `clinicId` required for clinic type (TypeScript enforces)
   - Exhaustive checking catches missing scope cases

2. **Code Reduction:** ~60% reduction in component duplication

   - Contacts: 2 components → 1 shared component
   - Appointments: 2 implementations → 1 shared component
   - Courses: 2 implementations → 1 shared component

3. **Developer Velocity:** Build features once, not three times

   - New feature = 1 component, 2 page wrappers
   - Single test suite covers all roles
   - Clear patterns reduce onboarding time

4. **Production Stability:** Single tested component, not three variants

   - Bug fixes apply to all roles immediately
   - Consistent behavior across user tiers
   - Easier to audit security

5. **Scalability:** Proven pattern for 100+ multi-tenant agencies
   - Middleware tenant resolution (already implemented)
   - Database indexes on `organizationId` (existing)
   - React Server Components reduce client bundle
   - Separate routes support platform-specific features

### Tradeoffs

1. **Migration Effort:** Multi-phase consolidation required

   - Phase 1: Update DataScope type definitions
   - Phase 2: Consolidate Contacts, Payments, Appointments components
   - Phase 3: Create scoped data access helpers
   - Phase 4: Integration tests and validation
   - Phase 5: Documentation updates

2. **Learning Curve:** Team needs to learn discriminated union pattern

   - TypeScript type guards (new for some developers)
   - Component location convention (`/components/dashboard/`)
   - Scoped data fetching pattern

3. **Duplicate Pages:** Still have 2 page files per feature (but share components)
   - `/platform/admin/contacts/page.tsx`
   - `/agency/[slug]/admin/contacts/page.tsx`
   - Trade-off: Keep route separation for flexibility

### Consequences

#### Files to Create

```
/components/dashboard/
├── contacts/contacts-client.tsx
├── payments/payments-client.tsx        # Move from agency
├── appointments/appointments-client.tsx
└── conversations/conversations-client.tsx

/lib/data/
├── contacts.ts                         # getContactsForScope()
├── payments.ts                         # getPaymentsForScope()
├── appointments.ts                     # getAppointmentsForScope()
└── conversations.ts                    # getConversationsForScope()
```

#### Files to Delete

```
/app/platform/admin/contacts/_components/ContactsPageClient.tsx
/app/agency/[slug]/admin/contacts/client.tsx
/app/platform/admin/courses/[courseId]/edit/_components/CourseEditClient.tsx
/app/agency/[slug]/admin/courses/[courseId]/edit/_components/AgencyCourseEditClient.tsx
```

#### Files to Modify

```
/app/data/dashboard/require-dashboard-access.ts
  - Add discriminated union types
  - Add type guard functions
  - Keep existing requireDashboardAccess() function

/app/platform/admin/*/page.tsx (15+ files)
  - Import from @/components/dashboard/
  - Use scoped data helpers
  - Pass DataScope to components

/app/agency/[slug]/admin/*/page.tsx (15+ files)
  - Import from @/components/dashboard/
  - Use requireDashboardAccess()
  - Use scoped data helpers
```

### Success Criteria

- ✅ All dashboard features use ONE shared component per feature
- ✅ DataScope uses discriminated union with type guards
- ✅ All queries use scoped data helpers from `/lib/data/`
- ✅ Build passes with zero TypeScript errors
- ✅ Integration tests verify data isolation (platform/agency/clinic)
- ✅ All 3 roles tested manually (platform_admin, agency_admin, clinic_user)
- ✅ Documentation updated (`coding-patterns.md`, `STATUS.md`, `ROADMAP.md`)

### Migration Phases

**Phase 1: Type System Foundation**

- Update DataScope to discriminated union
- Add type guards
- Verify build passes

**Phase 2: Component Infrastructure**

- Create `/components/dashboard/` folders
- Move Payments component (proof of concept)
- Test both routes still work

**Phase 3: Consolidate Features**

- Contacts component consolidation
- Appointments component (rename calendar → appointments)
- Create scoped data helpers

**Phase 4: Testing & Validation**

- Integration tests for data isolation
- Manual testing with all 3 roles
- Build verification

**Phase 5: Documentation**

- Update STATUS.md, ROADMAP.md
- Coding patterns documentation
- This ADR

### Alternatives Considered

**Unified Routes (Remove /platform/admin/\*)**

Platform admins navigate to `/agency/platform/admin/*`

- ✅ TRUE single codebase (1 page file per feature)
- ✅ ~51% bundle size reduction
- ✅ Simpler route maintenance
- ❌ Semantically incorrect (platform admin is not an agency)
- ❌ Need "fake" platform slug
- ❌ Harder to add platform-specific features
- ❌ URL design confusion

**Rejected:** Separate routes provide flexibility for future platform-only features without significant maintenance burden.

**Keep Platform/Agency Separate (Status Quo)**

Continue building duplicate components

- ✅ No migration effort
- ✅ Developers already understand pattern
- ❌ 60% code duplication compounds with every feature
- ❌ Bug fixes require 3× effort
- ❌ Slower feature development
- ❌ Inconsistent behavior across roles
- ❌ Not scalable to 100+ agencies

**Rejected:** Technical debt compounds exponentially with each new feature.

**Single Component, No Type Safety**

Share components but use optional `clinicId?: string`

- ✅ Simpler type definitions
- ✅ Faster initial migration
- ❌ No compile-time guarantee for clinic scope
- ❌ Runtime errors if `clinicId` forgotten
- ❌ Can't use exhaustive type checking
- ❌ Type narrowing doesn't work properly

**Rejected:** TypeScript discriminated unions provide critical safety guarantees for multi-tenant data isolation.

### Security Considerations

1. **Data Leakage Prevention:**

   - Discriminated unions enforce `organizationId` filtering at compile-time
   - Type guards required before accessing `clinicId`
   - Exhaustive checking ensures all scope types handled

2. **Row-Level Security:**

   - Current: Application-level filtering via DataScope
   - Future: Add Postgres RLS policies for defense-in-depth
   - Integration tests validate isolation

3. **Middleware Validation:**

   - Already implemented: Tenant slug validation in middleware ✅
   - Security validation with regex (`/^[a-z0-9-]+$/`)
   - Invalid slugs logged for security monitoring

4. **Audit Trail:**
   - All data access goes through scoped helpers
   - Easy to add logging for compliance
   - Single code path to audit

### Performance Implications

1. **Bundle Size:**

   - Shared components reduce duplication
   - Better code splitting and tree-shaking
   - Estimated ~40% reduction in client-side JavaScript

2. **Database Queries:**

   - Add indexes: `@@index([organizationId, createdAt])`
   - Add indexes: `@@index([organizationId, clinicId])`
   - Queries already use `organizationId` filter

3. **Scalability:**
   - Pattern proven for 100+ agencies
   - Middleware tenant resolution (already fast)
   - React `cache()` wrapper on data fetching
   - Server Components minimize client load

### Related Decisions

- **ADR-001:** Direct Server Action Imports - Inspired our "pass context as data" approach
- **ADR-005:** Named Slots Pattern - Server Component philosophy applies here
- **ADR-006:** URL-Based Navigation - Reinforces server-first architecture

### References

- Industry Research: 2025 multi-tenant SaaS best practices
- Expert Consultation: fullstack-developer, nextjs-developer, typescript-pro agents
- TypeScript Patterns: Discriminated unions for RBAC
- Next.js Documentation: Multi-tenant architecture guide
- Implementation Plan: `/docs/STATUS.md` and `/docs/ROADMAP.md`
- Coding Patterns: `/docs/essentials/coding-patterns.md` (Universal Component Pattern section)

---

## ADR-008: PageContainer Component for Standardized Page Spacing

**Date:** 2025-10-26
**Status:** Approved
**Decision Makers:** Development team, TypeScript expert, Code reviewer

### Context

The platform has 28+ admin pages with inconsistent spacing patterns. Before PageContainer, every page manually chose `p-6`, `gap-6`, and `flex-1`, causing:

1. **Inconsistency**: 4 different spacing patterns found across pages
2. **Repetitive Conversations**: Each new page requires spacing decisions
3. **Visual Inconsistency**: Similar pages (e.g., dashboard vs settings) have different spacing
4. **No Standard Template**: No default pattern for new pages

**Current Patterns Found:**

| Pattern                     | Pages | Issues              |
| --------------------------- | ----- | ------------------- |
| `flex flex-col p-6 gap-6`   | ~12   | Standard pages      |
| `flex-1 flex-col p-6 gap-6` | ~8    | Data tables         |
| `flex flex-col gap-4`       | ~4    | Tighter spacing     |
| `flex flex-col gap-0`       | ~4    | NavTabs integration |

**Requirements:**

- Cover all 28+ admin pages with standardized spacing
- Support responsive spacing (mobile vs desktop)
- Semantic HTML for accessibility
- Type-safe with TypeScript
- Industry-standard pattern
- Zero migration friction

### Decision

**Create PageContainer component with 6 variants for full coverage**

The PageContainer component enforces consistent page spacing across all admin pages using a variant pattern similar to shadcn/ui components.

**Implementation:**

```typescript
export type PageContainerVariant =
  | "default"   // p-4 md:p-6 gap-4 md:gap-6 (most common)
  | "padded"    // flex-1 p-4 md:p-6 gap-4 md:gap-6 (data tables)
  | "fill"      // flex-1 (custom layouts)
  | "tight"     // p-4 md:p-6 gap-3 md:gap-4 (contacts-style)
  | "tabs"      // p-4 md:p-6 gap-0 (NavTabs integration)
  | "none";     // No wrapper (split-pane layouts)

export function PageContainer({
  children,
  variant = "default",
  className,
  as: Component = "div", // Semantic HTML support
}: PageContainerProps) {
  // Special case: "none" renders children directly
  if (variant === "none") return <>{children}</>;

  const variantStyles: Record<PageContainerVariant, string> = {
    default: "p-4 md:p-6 gap-4 md:gap-6",
    padded: "flex-1 p-4 md:p-6 gap-4 md:gap-6",
    fill: "flex-1",
    tight: "p-4 md:p-6 gap-3 md:gap-4",
    tabs: "p-4 md:p-6 gap-0",
    none: "",
  };

  return (
    <Component
      data-component="page-container"
      data-variant={variant}
      className={cn("flex flex-col", variantStyles[variant], className)}
    >
      {children}
    </Component>
  );
}
```

**Usage Pattern:**

```typescript
// Standard page
export default async function DashboardPage() {
  return (
    <PageContainer as="main">
      <StatsCards />
    </PageContainer>
  );
}

// Data table page
export default async function MembersPage() {
  return (
    <PageContainer variant="padded" as="main">
      <SummaryCards />
      <MembersTable />
    </PageContainer>
  );
}
```

### Benefits

1. **Full Coverage**: All 28+ pages can migrate (100% coverage)

   - `default` → 12 standard pages
   - `padded` → 8 data table pages
   - `tight` → 4 contacts-style pages
   - `tabs` → 4 NavTabs pages
   - `fill` → 4 custom layout pages
   - `none` → Split-pane layouts (conversations)

2. **Type Safety**: Exhaustiveness checking prevents missed variants

   - `Record<PageContainerVariant, string>` enforces all variants defined
   - TypeScript errors if variant added but not implemented

3. **Responsive Design**: Mobile-first spacing

   - `p-4` (16px) on mobile → `p-6` (24px) on desktop
   - Industry standard pattern (Vercel, Stripe, Supabase)

4. **Semantic HTML**: Accessibility best practices

   - `as="main"` for top-level page content
   - `as="section"` for sub-sections
   - Improves SEO and screen reader support

5. **Developer Experience**: Makes correct spacing the default

   - No more manual spacing decisions
   - Consistent across all pages
   - Clear variant names describe intent

6. **Testing Support**: Data attributes for E2E tests
   - `data-component="page-container"`
   - `data-variant="padded"`

### Tradeoffs

1. **Fixed Layout Pattern**: Always `flex flex-col` (acceptable for admin pages)
2. **Variant Proliferation Risk**: 6 variants (monitored, max 6 enforced)
3. **Migration Effort**: 28+ pages to migrate (gradual rollout strategy)
4. **Learning Curve**: Developers must learn 6 variants (documented in coding-patterns.md)

### Alternatives Considered

**CSS Utility Classes**

```css
@layer utilities {
  .page-default {
    @apply flex flex-col p-6 gap-6;
  }
}
```

- ❌ No TypeScript type safety
- ❌ No JSDoc documentation
- ❌ Harder to enforce usage
- ✅ Simpler, less abstraction

**Layout Slot Pattern (Next.js Parallel Routes)**

```
app/platform/admin/dashboard/
├── page.tsx
└── @layout/default.tsx
```

- ❌ Significant file structure changes
- ❌ Over-engineered for simple spacing
- ✅ Framework-native
- ✅ Enforced by file system

**Do Nothing (Status Quo)**

- ✅ Zero migration cost
- ❌ Inconsistencies remain
- ❌ No enforced standards
- ❌ Harder to change globally

### Expert Review Findings

**TypeScript Expert Rating: 9.5/10**

✅ Strengths:

- Proper type safety with discriminated union variant type
- Semantic HTML support (`as` prop)
- Data attributes for testing
- Comprehensive JSDoc documentation

⚠️ Recommendations Applied:

- Added `Record<PageContainerVariant, string>` for exhaustiveness
- Added `as` prop for semantic HTML (`main`, `section`, `div`)
- Added responsive spacing (`p-4 md:p-6`)
- Added testing attributes (`data-component`, `data-variant`)

**Code Reviewer Rating: Conditional Approval**

✅ Strengths:

- Solves real problem (28+ inconsistent pages)
- Follows industry patterns (Vercel, Stripe, Supabase)
- Clean, minimal implementation
- Excellent documentation

⚠️ Concerns Addressed:

- Missing variants added (tight, tabs, none)
- Renamed "canvas" → "fill" (more descriptive)
- Added responsive spacing
- Created comprehensive ADR

### Consequences

#### Files Created

- `/components/layout/page-container.tsx` - Component implementation (195 lines with docs)

#### Files Modified

- `/docs/essentials/coding-patterns.md` - Added PageContainer usage section
- `/docs/technical/architecture-decisions.md` - This ADR

#### Migration Strategy

**Phase 1: Pilot Migration (3 pages)**

- `/platform/admin/dashboard/page.tsx` → `variant="default"`
- `/platform/admin/payments/page.tsx` → `variant="padded"`
- `/platform/admin/profile/page.tsx` → `variant="default"`

**Phase 2: Category Migration**

- Standard pages (12 pages) → `variant="default"`
- Data tables (8 pages) → `variant="padded"`

**Phase 3: Complex Layouts**

- NavTabs pages (4 pages) → `variant="tabs"`
- Custom layouts (4 pages) → `variant="fill"` or `variant="none"`

**Phase 4: Validation**

- Visual regression testing
- Build verification
- Documentation updates

### Success Criteria

- ✅ All 6 variants implemented with type safety
- ✅ Responsive spacing (mobile/desktop)
- ✅ Semantic HTML support (`<main>`)
- ✅ Testing attributes (data-component)
- ✅ Documentation complete (coding-patterns.md, ADR-008)
- ✅ Pilot migration successful (3 pages)
- ✅ Build passes with zero errors
- ✅ 100% coverage of admin page patterns

### Industry Precedent

This pattern aligns with:

- **Vercel Dashboard**: Consistent page padding with responsive variants
- **Stripe Dashboard**: Standard spacing for all admin pages
- **Supabase Studio**: Unified page container with semantic HTML
- **shadcn/ui**: Variant pattern for component styling (`variant="default" | "destructive"`)
- **Radix UI**: Compound components with consistent spacing

### Performance Impact

- **Bundle Size**: ~200 bytes gzipped (Server Component)
- **Runtime**: Zero performance impact (pure function)
- **Tree-Shaking**: Properly exported, unused variants don't affect bundle
- **Client Bundle**: Only impacts Client Components that import it (minimal)

### References

- Component implementation: `/components/layout/page-container.tsx`
- Usage documentation: `/docs/essentials/coding-patterns.md`
- TypeScript expert review: Agent analysis (2025-10-26)
- Code reviewer analysis: Agent analysis (2025-10-26)
- Industry patterns: Vercel, Stripe, Supabase component libraries
- Next.js 15 best practices: Server Components + responsive design

---

## Template for Future ADRs

```markdown
## ADR-XXX: Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Approved | Superseded
**Decision Makers:** Team members

### Context

What is the issue we're facing?

### Decision

What did we decide?

### Consequences

What are the trade-offs?

### Alternatives Considered

What other options did we evaluate?
```
