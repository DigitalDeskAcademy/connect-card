# AI Architecture & Integration Patterns

**Platform**: Sidecar CRM - AI-Powered Operations Dashboard
**AI Framework**: Vercel AI SDK
**Status**: Phase 2 (Planned Implementation)
**Last Updated**: 2025-10-16

---

## Overview

This document defines the AI architecture for Sidecar CRM, outlining how we integrate AI capabilities to reduce agency support overhead by 80%. The system uses Vercel AI SDK to provide intelligent automation, predictive analytics, and natural language interfaces across all CRM operations.

**Core AI Capabilities:**

1. Natural language dashboard queries
2. Predictive analytics (churn, no-shows, revenue)
3. Smart message auto-responders
4. Appointment scheduling optimization
5. Inventory management predictions
6. Client health scoring

---

## Architecture Principles

### 1. Multi-Model Strategy

**Use the right model for the job:**

- **Complex reasoning**: Claude 3.5 Sonnet (primary)
- **Data analysis**: GPT-4 Turbo
- **Fast responses**: Claude 3.5 Haiku
- **Image analysis**: GPT-4 Vision
- **Embeddings**: OpenAI text-embedding-3-small

### 2. Human-in-the-Loop

**AI augments, doesn't replace:**

- Auto-draft responses require human approval
- Predictions show confidence scores
- All AI actions are auditable
- Users can override AI suggestions

### 3. Cost Optimization

**Intelligent model routing:**

- Use cheaper models for simple tasks
- Cache common queries
- Batch processing when possible
- Rate limiting per organization

### 4. Privacy & Security

**Data protection:**

- Never send PII to AI without consent
- Sanitize inputs to prevent prompt injection
- Audit log all AI interactions
- Encrypted data in transit and at rest

---

## System Architecture

```typescript
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Chat     │  │  Insights  │  │ Predictions│            │
│  │ Assistant  │  │   Cards    │  │   Widgets  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
         RSC Streams    Server Actions   API Routes
               │              │              │
┌──────────────┴──────────────┴──────────────┴────────────────┐
│                  Vercel AI SDK Layer                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Model Router (Intelligent Selection)               │ │
│  │  - Task type analysis                                  │ │
│  │  - Cost optimization                                   │ │
│  │  - Fallback handling                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Anthropic│  │  OpenAI  │  │  Google  │  │  Local   │   │
│  │  Claude  │  │   GPT    │  │  Gemini  │  │  Models  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────┬──────────────────────────────────────────────┘
               │
        Rate Limiting
        Cost Tracking
        Caching Layer
               │
┌──────────────┴───────────────────────────────────────────────┐
│                  Application Data Layer                       │
│                                                                │
│  GHL Contacts  │  Appointments  │  Inventory  │  Analytics   │
└────────────────────────────────────────────────────────────────┘
```

---

## Core AI Modules

### 1. Chat Assistant

**Purpose**: Natural language interface for dashboard data

**Implementation:**

```typescript
// /actions/ai/chat.ts
import { streamText, CoreMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function chatWithDashboard(params: {
  messages: CoreMessage[];
  organizationContext: OrganizationContext;
}) {
  const { organizationId } = params.organizationContext;

  // Fetch relevant context
  const [contacts, appointments, inventory] = await Promise.all([
    getRecentContacts(organizationId, 10),
    getTodayAppointments(organizationId),
    getLowStockItems(organizationId),
  ]);

  const systemPrompt = `You are an AI assistant for a medical practice operations dashboard.

Current data snapshot:
- Recent contacts: ${contacts.length} (${contacts.filter(c => c.tags.includes('new')).length} new)
- Today's appointments: ${appointments.length} (${appointments.filter(a => a.status === 'CONFIRMED').length} confirmed)
- Low stock alerts: ${inventory.length} items

You help the user understand their operations, answer questions, and provide actionable insights.
Be concise, professional, and data-driven. Include specific numbers and trends when relevant.`;

  const { textStream } = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    messages: params.messages,
    temperature: 0.7,
    maxTokens: 1000,
  });

  return textStream;
}

// /components/ai/ChatAssistant.tsx
'use client';
import { useChat } from 'ai/react';

export function ChatAssistant({ organizationContext }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { organizationContext },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask your AI assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map(m => (
            <div
              key={m.id}
              className={cn(
                'p-3 rounded-lg',
                m.role === 'user' ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted mr-12'
              )}
            >
              {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about appointments, contacts, inventory..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Thinking...' : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Example Queries:**

- "How many new contacts did we get this week?"
- "What's our appointment no-show rate?"
- "Which inventory items are running low?"
- "Show me high-priority clients who haven't booked in 30 days"

---

### 2. Predictive Analytics

**Purpose**: Forecast business outcomes and identify risks

#### 2.1 Appointment No-Show Prediction

```typescript
// /actions/ai/predict-no-show.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const NoShowPredictionSchema = z.object({
  riskScore: z.number().min(0).max(1).describe("Probability of no-show (0-1)"),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reasoning: z.string().describe("Explanation of the risk assessment"),
  recommendations: z
    .array(z.string())
    .describe("Actions to reduce no-show risk"),
  confidenceScore: z.number().min(0).max(1),
});

export async function predictAppointmentNoShow(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: {
        include: {
          appointments: {
            where: { status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED"] } },
            orderBy: { startsAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Calculate historical metrics
  const totalAppointments = appointment.client.appointments.length;
  const noShows = appointment.client.appointments.filter(
    a => a.status === "NO_SHOW"
  ).length;
  const noShowRate = totalAppointments > 0 ? noShows / totalAppointments : 0;
  const hoursUntilAppointment = differenceInHours(
    appointment.startsAt,
    new Date()
  );
  const dayOfWeek = format(appointment.startsAt, "EEEE");
  const timeOfDay = format(appointment.startsAt, "HH:mm");

  const prompt = `Analyze this medical appointment and predict no-show risk:

Client History:
- Total appointments: ${totalAppointments}
- No-shows: ${noShows} (${(noShowRate * 100).toFixed(1)}% rate)
- Last appointment: ${appointment.client.appointments[0]?.startsAt ? formatDistanceToNow(appointment.client.appointments[0].startsAt) + " ago" : "N/A"}

Appointment Details:
- Type: ${appointment.type}
- Scheduled for: ${format(appointment.startsAt, "PPpp")}
- Day of week: ${dayOfWeek}
- Time: ${timeOfDay}
- Hours until appointment: ${hoursUntilAppointment}
- Confirmation status: ${appointment.status}
- SMS reminder sent: ${appointment.reminderSentAt ? "Yes" : "No"}

Consider factors:
1. Client's historical no-show rate
2. Time until appointment (last-minute bookings higher risk)
3. Day/time patterns (Mondays, early mornings riskier)
4. Appointment type (some services have higher no-show rates)
5. Whether reminders have been sent

Provide a risk assessment and specific actions to reduce no-show probability.`;

  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: NoShowPredictionSchema,
    prompt,
  });

  // Store prediction
  const prediction = await prisma.aIPrediction.create({
    data: {
      organizationId: appointment.organizationId,
      type: "APPOINTMENT_NO_SHOW",
      input: {
        appointmentId,
        clientHistory: { totalAppointments, noShows, noShowRate },
        appointmentDetails: { dayOfWeek, timeOfDay, hoursUntilAppointment },
      },
      output: object,
      confidence: object.confidenceScore,
      model: "gpt-4-turbo",
    },
  });

  return { prediction: object, predictionId: prediction.id };
}
```

**Usage in Dashboard:**

```typescript
// /components/dashboard/AppointmentCard.tsx
export function AppointmentCard({ appointment }: Props) {
  const [prediction, setPrediction] = useState<NoShowPrediction | null>(null);

  useEffect(() => {
    // Predict no-show risk for high-value appointments
    if (appointment.startsAt < addDays(new Date(), 2)) {
      predictAppointmentNoShow(appointment.id).then(setPrediction);
    }
  }, [appointment.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{appointment.type}</CardTitle>
        <CardDescription>{format(appointment.startsAt, 'PPp')}</CardDescription>
      </CardHeader>
      <CardContent>
        {prediction && prediction.prediction.riskLevel !== 'LOW' && (
          <Alert variant={prediction.prediction.riskLevel === 'HIGH' ? 'destructive' : 'warning'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No-Show Risk: {prediction.prediction.riskLevel}</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{prediction.prediction.reasoning}</p>
              <ul className="list-disc pl-4 space-y-1">
                {prediction.prediction.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Revenue Forecasting

```typescript
// /actions/ai/forecast-revenue.ts
export async function forecastRevenue(params: {
  organizationId: string;
  forecastMonths: number;
}) {
  // Fetch historical data
  const historicalRevenue = await prisma.appointment.groupBy({
    by: ["createdAt"],
    where: {
      organizationId: params.organizationId,
      status: "COMPLETED",
      createdAt: {
        gte: subMonths(new Date(), 12),
      },
    },
    _sum: { price: true },
  });

  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: z.object({
      forecast: z.array(
        z.object({
          month: z.string(),
          predictedRevenue: z.number(),
          lowerBound: z.number(),
          upperBound: z.number(),
          confidence: z.number(),
        })
      ),
      trends: z.array(z.string()),
      riskFactors: z.array(z.string()),
      opportunities: z.array(z.string()),
    }),
    prompt: `Analyze this revenue data and forecast the next ${params.forecastMonths} months:

Historical monthly revenue: ${JSON.stringify(historicalRevenue, null, 2)}

Consider:
- Seasonal trends
- Growth/decline patterns
- Appointment volume changes
- Average transaction value trends

Provide monthly forecasts with confidence intervals and strategic insights.`,
  });

  return object;
}
```

#### 2.3 Client Churn Risk Scoring

```typescript
// /actions/ai/score-churn-risk.ts
export async function scoreClientChurnRisk(contactId: string) {
  const contact = await prisma.gHLContact.findUnique({
    where: { id: contactId },
    include: {
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 10,
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  const daysSinceLastAppointment = contact.appointments[0]
    ? differenceInDays(new Date(), contact.appointments[0].startsAt)
    : Infinity;

  const totalSpent = contact.appointments
    .filter(a => a.status === "COMPLETED")
    .reduce((sum, a) => sum + (a.price ?? 0), 0);

  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: z.object({
      churnRisk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      score: z.number().min(0).max(100),
      reasoning: z.string(),
      actions: z.array(
        z.object({
          action: z.string(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
          expectedImpact: z.string(),
        })
      ),
    }),
    prompt: `Assess churn risk for this medical practice client:

Engagement Metrics:
- Days since last appointment: ${daysSinceLastAppointment}
- Total appointments: ${contact.appointments.length}
- Lifetime value: $${totalSpent}
- Recent message sentiment: ${contact.messages.length > 0 ? "Available" : "None"}
- Tags: ${contact.tags.join(", ")}

Risk Factors:
- ${daysSinceLastAppointment > 90 ? "No recent appointments (high risk)" : "Recent engagement"}
- ${contact.messages.length === 0 ? "No communication history" : "Active communication"}

Provide churn risk assessment and retention actions prioritized by impact.`,
  });

  return object;
}
```

---

### 3. Smart Message Auto-Responder

**Purpose**: Draft professional responses to client messages

```typescript
// /actions/ai/auto-respond.ts
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

export async function generateMessageResponse(params: {
  incomingMessage: string;
  conversationHistory: Message[];
  contactData: GHLContact;
  organizationContext: OrganizationContext;
}) {
  const stream = createStreamableValue("");

  (async () => {
    const systemPrompt = `You are a professional customer service representative for ${params.organizationContext.name}, a medical practice.

Client Information:
- Name: ${params.contactData.firstName} ${params.contactData.lastName}
- Email: ${params.contactData.email}
- Phone: ${params.contactData.phone}
- Tags: ${params.contactData.tags.join(", ")}
- Customer since: ${format(params.contactData.createdAt, "MMMM yyyy")}

Guidelines:
1. Be professional, empathetic, and helpful
2. Reference their history when relevant
3. Provide clear next steps or calls to action
4. Keep responses concise (2-3 paragraphs max)
5. End with an invitation to reach out if needed
6. For medical questions, always recommend speaking with a practitioner

This is a DRAFT response that will be reviewed by staff before sending.`;

    const { textStream } = await streamText({
      model: anthropic("claude-3-5-haiku-20241022"), // Fast model for quick drafts
      system: systemPrompt,
      messages: [
        ...params.conversationHistory.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user",
          content: params.incomingMessage,
        },
      ],
      temperature: 0.8,
      maxTokens: 500,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
```

**UI Component:**

```typescript
// /components/ai/SmartComposer.tsx
'use client';
import { useState } from 'react';
import { generateMessageResponse } from '@/actions/ai/auto-respond';

export function SmartComposer({ contact, conversation }: Props) {
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    const result = await generateMessageResponse({
      incomingMessage: conversation.messages[conversation.messages.length - 1].content,
      conversationHistory: conversation.messages,
      contactData: contact,
      organizationContext: { type: 'agency', organizationId: contact.organizationId },
    });

    // Stream the response
    for await (const chunk of result.output) {
      setDraft(prev => prev + chunk);
    }

    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Your Response</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateDraft}
          disabled={isGenerating}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'AI Draft'}
        </Button>
      </div>
      <Textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={8}
        placeholder="Type your message or click 'AI Draft' to get started..."
      />
      <div className="flex gap-2">
        <Button onClick={() => sendMessage(draft)} disabled={!draft.trim()}>
          Send Message
        </Button>
        <Button variant="outline" onClick={() => setDraft('')}>
          Clear
        </Button>
      </div>
    </div>
  );
}
```

---

### 4. Appointment Scheduling Optimization

**Purpose**: Suggest optimal appointment times based on data

```typescript
// /actions/ai/optimize-schedule.ts
export async function suggestOptimalAppointmentTime(params: {
  contactId: string;
  appointmentType: string;
  organizationId: string;
}) {
  // Gather data
  const [staffAvailability, historicalBookings, clientPreferences] =
    await Promise.all([
      getStaffAvailability(params.organizationId),
      getHistoricalBookingPatterns(
        params.organizationId,
        params.appointmentType
      ),
      getClientPreferences(params.contactId),
    ]);

  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: z.object({
      suggestedSlots: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
          score: z.number().min(0).max(100),
          reasoning: z.string(),
          staffMember: z.string(),
        })
      ),
      insights: z.array(z.string()),
    }),
    prompt: `Analyze this data and suggest 3 optimal appointment times:

Staff Availability: ${JSON.stringify(staffAvailability)}
Client Preferred Days: ${clientPreferences.preferredDays?.join(", ") ?? "Not specified"}
Client Preferred Times: ${clientPreferences.preferredTimeOfDay ?? "Not specified"}
Historical Booking Patterns: ${JSON.stringify(historicalBookings)}
Appointment Type: ${params.appointmentType} (avg duration: ${historicalBookings.avgDuration} min)

Consider:
1. Client's past booking preferences
2. Staff with best track record for this service
3. Times with lowest no-show rates
4. Avoiding peak congestion times
5. Buffer time for complex procedures

Rank suggestions by likelihood of acceptance and completion.`,
  });

  return object;
}
```

---

### 5. Inventory Management AI

**Purpose**: Predict reorder needs and optimize stock levels

```typescript
// /actions/ai/inventory-predictions.ts
export async function predictInventoryNeeds(params: {
  organizationId: string;
  locationId: string;
}) {
  const [inventory, usage, appointments] = await Promise.all([
    getInventoryItems(params.locationId),
    getInventoryUsageHistory(params.locationId, 90), // 90 days
    getUpcomingAppointments(params.locationId, 30), // 30 days forecast
  ]);

  const { object } = await generateObject({
    model: openai("gpt-4-turbo"),
    schema: z.object({
      recommendations: z.array(
        z.object({
          itemId: z.string(),
          itemName: z.string(),
          action: z.enum(["ORDER_NOW", "ORDER_SOON", "MONITOR", "OVERSTOCKED"]),
          currentStock: z.number(),
          recommendedOrderQuantity: z.number(),
          daysUntilStockout: z.number().nullable(),
          reasoning: z.string(),
          urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        })
      ),
      insights: z.array(z.string()),
    }),
    prompt: `Analyze inventory data and predict reorder needs:

Current Inventory: ${JSON.stringify(inventory)}
Usage (last 90 days): ${JSON.stringify(usage)}
Upcoming Appointments (next 30 days): ${appointments.length}
Appointment breakdown: ${JSON.stringify(
      appointments.reduce(
        (acc, apt) => {
          acc[apt.type] = (acc[apt.type] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    )}

Consider:
1. Historical usage rates
2. Seasonal trends
3. Upcoming appointment schedule
4. Lead times for reordering
5. Storage capacity constraints
6. Cost optimization (bulk discounts)

Provide prioritized reorder recommendations with specific quantities.`,
  });

  return object;
}
```

---

## Rate Limiting & Cost Control

### Per-Organization Limits

```typescript
// /lib/ai/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour per org
  analytics: true,
});

export async function checkAIRateLimit(organizationId: string) {
  const { success, limit, remaining, reset } = await aiRateLimiter.limit(
    `ai:${organizationId}`
  );

  if (!success) {
    throw new Error(
      `AI rate limit exceeded. Resets at ${new Date(reset).toISOString()}`
    );
  }

  return { remaining, reset };
}
```

### Token Usage Tracking

```typescript
// /lib/ai/token-tracker.ts
export async function trackTokenUsage(params: {
  organizationId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}) {
  await prisma.aIUsage.create({
    data: {
      organizationId: params.organizationId,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens: params.inputTokens + params.outputTokens,
      cost: params.cost,
      timestamp: new Date(),
    },
  });

  // Check if organization is approaching budget limit
  const monthlyUsage = await prisma.aIUsage.aggregate({
    where: {
      organizationId: params.organizationId,
      timestamp: {
        gte: startOfMonth(new Date()),
      },
    },
    _sum: { cost: true },
  });

  const monthlyLimit = 100; // $100/month per org

  if ((monthlyUsage._sum.cost ?? 0) > monthlyLimit * 0.9) {
    // Alert when 90% of budget is used
    await sendBudgetAlert(
      params.organizationId,
      monthlyUsage._sum.cost ?? 0,
      monthlyLimit
    );
  }
}
```

---

## Caching Strategy

### Response Caching

```typescript
// /lib/ai/cache.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getCachedAIResponse(
  cacheKey: string
): Promise<string | null> {
  return await redis.get(cacheKey);
}

export async function setCachedAIResponse(
  cacheKey: string,
  response: string,
  ttlSeconds: number = 3600 // 1 hour default
) {
  await redis.setex(cacheKey, ttlSeconds, response);
}

// Usage example
export async function getCachedInsights(organizationId: string, date: string) {
  const cacheKey = `ai:insights:${organizationId}:${date}`;
  const cached = await getCachedAIResponse(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Generate new insights
  const insights = await generateDailyInsights(organizationId);

  // Cache for 24 hours
  await setCachedAIResponse(cacheKey, JSON.stringify(insights), 86400);

  return insights;
}
```

---

## Monitoring & Observability

### AI Performance Metrics

```typescript
// /lib/ai/monitoring.ts
export async function logAIInteraction(params: {
  organizationId: string;
  type: AIInteractionType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}) {
  await prisma.aIInteractionLog.create({
    data: {
      ...params,
      timestamp: new Date(),
    },
  });

  // Send to analytics platform
  await analytics.track({
    event: "ai_interaction",
    properties: params,
  });
}
```

### Health Dashboard

```typescript
// /app/api/admin/ai/health/route.ts
export async function GET() {
  const last24h = subHours(new Date(), 24);

  const [totalInteractions, successRate, avgLatency, costToday] =
    await Promise.all([
      prisma.aIInteractionLog.count({
        where: { timestamp: { gte: last24h } },
      }),
      prisma.aIInteractionLog.aggregate({
        where: { timestamp: { gte: last24h } },
        _avg: { success: true },
      }),
      prisma.aIInteractionLog.aggregate({
        where: { timestamp: { gte: last24h } },
        _avg: { latencyMs: true },
      }),
      prisma.aIUsage.aggregate({
        where: { timestamp: { gte: startOfDay(new Date()) } },
        _sum: { cost: true },
      }),
    ]);

  return Response.json({
    status: "healthy",
    metrics: {
      totalInteractions,
      successRate: ((successRate._avg.success ?? 0) * 100).toFixed(2) + "%",
      avgLatencyMs: avgLatency._avg.latencyMs,
      costToday: "$" + (costToday._sum.cost ?? 0).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  });
}
```

---

## Security Best Practices

### 1. Input Sanitization

```typescript
// /lib/ai/security.ts
import { z } from "zod";

const UserInputSchema = z
  .string()
  .max(5000)
  .refine(input => !input.includes("IGNORE PREVIOUS INSTRUCTIONS"), {
    message: "Potential prompt injection detected",
  });

export function sanitizeUserInput(input: string): string {
  const validated = UserInputSchema.parse(input);

  // Remove potential injection patterns
  return validated
    .replace(/IGNORE.*INSTRUCTIONS/gi, "")
    .replace(/SYSTEM:.*$/gim, "")
    .trim();
}
```

### 2. PII Detection

```typescript
export async function detectPII(text: string): Promise<boolean> {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}

export async function generateAIResponse(input: string) {
  if (await detectPII(input)) {
    throw new Error(
      "PII detected in input. Please remove sensitive information."
    );
  }

  // Proceed with AI generation...
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// /tests/ai/predict-no-show.test.ts
import { describe, it, expect } from "vitest";
import { predictAppointmentNoShow } from "@/actions/ai/predict-no-show";

describe("No-Show Prediction", () => {
  it("should predict HIGH risk for clients with >50% no-show rate", async () => {
    const appointment = await createMockAppointment({
      clientHistory: {
        totalAppointments: 10,
        noShows: 6,
      },
    });

    const result = await predictAppointmentNoShow(appointment.id);

    expect(result.prediction.riskLevel).toBe("HIGH");
    expect(result.prediction.riskScore).toBeGreaterThan(0.5);
  });

  it("should predict LOW risk for reliable clients", async () => {
    const appointment = await createMockAppointment({
      clientHistory: {
        totalAppointments: 20,
        noShows: 0,
      },
    });

    const result = await predictAppointmentNoShow(appointment.id);

    expect(result.prediction.riskLevel).toBe("LOW");
    expect(result.prediction.riskScore).toBeLessThan(0.3);
  });
});
```

---

## Deployment Checklist

- [ ] Environment variables configured (API keys)
- [ ] Rate limiting enabled
- [ ] Cost tracking dashboard deployed
- [ ] PII detection active
- [ ] Error logging configured
- [ ] Monitoring dashboards set up
- [ ] User feedback mechanisms in place
- [ ] A/B testing framework ready
- [ ] Model fallback strategy tested
- [ ] Documentation for users published

---

**Related Documentation:**

- [Architecture Decisions - ADR-003](./architecture-decisions.md#adr-003-vercel-ai-sdk-for-ai-features)
- [Integrations - AI SDK Section](./integrations.md#3-vercel-ai-sdk-integration)
- [Coding Patterns](../essentials/coding-patterns.md)
