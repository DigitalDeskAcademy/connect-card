# Integration Architecture

This document covers all external system integrations for the Sidecar CRM platform.

**Last Updated:** 2025-10-16
**Status:** Living document - updated as integrations evolve

---

## Overview

The Sidecar CRM integrates with multiple external services to provide a unified operations dashboard:

- **GoHighLevel (GHL)** - Primary CRM data source
- **Cal.com** - Calendar scheduling infrastructure
- **Vercel AI SDK** - AI-powered features (planned Phase 2)
- **Stripe** - Payment processing
- **Tigris/S3** - File storage
- **Better Auth** - Authentication

---

## 1. GoHighLevel Integration

**Purpose**: Primary integration for agency CRM data
**Documentation**: [GHL API Docs](https://highlevel.stoplight.io/docs/integrations/)
**Status**: Production ready

### Architecture Overview

```typescript
┌──────────────────────────────────────────────────────┐
│              GoHighLevel (External API)               │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Contacts │  │ Calendar │  │ Locations│          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────┬──────────┬──────────┬────────────────────┘
           │          │          │
      Webhooks    OAuth 2.0   API Polling
           │          │          │
┌──────────┴──────────┴──────────┴────────────────────┐
│            Sidecar Platform Integration Layer        │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ GHL Client   │  │ Webhook      │                │
│  │ (/lib/ghl)   │  │ Handlers     │                │
│  └──────────────┘  └──────────────┘                │
└──────────┬──────────────────────────────────────────┘
           │
      Prisma ORM
           │
┌──────────┴──────────────────────────────────────────┐
│           Sidecar Database (Source of Truth)         │
│                                                       │
│  GHLContact, GHLLocation, GHLLearner, Appointment    │
└───────────────────────────────────────────────────────┘
```

### OAuth 2.0 Setup

**Flow**: Agency connects their GHL account via OAuth

```typescript
// /app/api/integrations/ghl/auth/route.ts
import { ghlOAuthClient } from "@/lib/ghl-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // organizationId

  // Exchange code for tokens
  const tokens = await ghlOAuthClient.getAccessToken({
    code,
    redirect_uri: process.env.GHL_REDIRECT_URI,
  });

  // Store encrypted tokens in database
  await prisma.organization.update({
    where: { id: state },
    data: {
      ghlAccessToken: encrypt(tokens.access_token),
      ghlRefreshToken: encrypt(tokens.refresh_token),
      ghlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return redirect("/agency/[slug]/admin/settings?integration=success");
}
```

**Required Scopes:**

- `contacts.readonly` - Read contact data
- `contacts.write` - Create/update contacts
- `calendars.readonly` - Read calendar events
- `calendars.write` - Create appointments
- `locations.readonly` - Access location data
- `opportunities.readonly` - View pipelines and deals

### API Client Implementation

```typescript
// /lib/ghl-client.ts
import axios from "axios";

export class GHLClient {
  private baseURL = "https://services.leadconnectorhq.com";
  private accessToken: string;
  private organizationId: string;

  constructor(accessToken: string, organizationId: string) {
    this.accessToken = accessToken;
    this.organizationId = organizationId;
  }

  /**
   * Fetch all contacts for a location
   */
  async getContacts(
    locationId: string,
    options?: {
      limit?: number;
      skip?: number;
      query?: string;
    }
  ) {
    const response = await axios.get(`${this.baseURL}/contacts/`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      params: {
        locationId,
        limit: options?.limit ?? 100,
        skip: options?.skip ?? 0,
        query: options?.query,
      },
    });

    return response.data.contacts;
  }

  /**
   * Get locations accessible to this organization
   */
  async getLocations() {
    const response = await axios.get(`${this.baseURL}/locations/`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    return response.data.locations;
  }

  /**
   * Fetch calendar events for a location
   */
  async getCalendarEvents(
    locationId: string,
    params: {
      startDate: string; // ISO 8601
      endDate: string;
    }
  ) {
    const response = await axios.get(`${this.baseURL}/calendars/events`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      params: {
        locationId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });

    return response.data.events;
  }

  /**
   * Create a new contact
   */
  async createContact(
    locationId: string,
    data: {
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
      tags?: string[];
      customFields?: Record<string, any>;
    }
  ) {
    const response = await axios.post(
      `${this.baseURL}/contacts/`,
      {
        locationId,
        ...data,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.contact;
  }
}

/**
 * Factory function to create GHL client for an organization
 */
export async function createGHLClient(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      ghlAccessToken: true,
      ghlRefreshToken: true,
      ghlTokenExpiresAt: true,
    },
  });

  if (!org?.ghlAccessToken) {
    throw new Error("GHL not connected for this organization");
  }

  // Check if token needs refresh
  if (org.ghlTokenExpiresAt && org.ghlTokenExpiresAt < new Date()) {
    const newTokens = await refreshGHLToken(org.ghlRefreshToken!);

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ghlAccessToken: encrypt(newTokens.access_token),
        ghlTokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
      },
    });

    return new GHLClient(newTokens.access_token, organizationId);
  }

  return new GHLClient(decrypt(org.ghlAccessToken), organizationId);
}
```

### Webhook Integration

**Purpose**: Real-time updates when GHL data changes

```typescript
// /app/api/webhooks/ghl/route.ts
import { verifyGHLWebhook } from "@/lib/ghl-webhook-verify";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limiting
  const identifier = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit.limit(identifier);
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Verify webhook signature
  const signature = request.headers.get("x-ghl-signature");
  const body = await request.text();

  if (!verifyGHLWebhook(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Route to appropriate handler
  switch (event.type) {
    case "contact.created":
      await handleContactCreated(event);
      break;
    case "contact.updated":
      await handleContactUpdated(event);
      break;
    case "contact.deleted":
      await handleContactDeleted(event);
      break;
    case "appointment.created":
      await handleAppointmentCreated(event);
      break;
    case "appointment.updated":
      await handleAppointmentUpdated(event);
      break;
    default:
      console.log(`Unhandled webhook type: ${event.type}`);
  }

  return new Response("OK", { status: 200 });
}

async function handleContactUpdated(event: GHLWebhookEvent) {
  const { locationId, contactId, ...data } = event.data;

  // Find organization by location
  const location = await prisma.gHLLocation.findUnique({
    where: { ghlLocationId: locationId },
    select: { organizationId: true },
  });

  if (!location) {
    console.error(`Location not found: ${locationId}`);
    return;
  }

  // Upsert contact in our database
  await prisma.gHLContact.upsert({
    where: {
      ghlContactId_organizationId: {
        ghlContactId: contactId,
        organizationId: location.organizationId,
      },
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      tags: data.tags,
      customFields: data.customFields,
      lastSyncedAt: new Date(),
    },
    create: {
      ghlContactId: contactId,
      organizationId: location.organizationId,
      locationId: location.id,
      ...data,
      lastSyncedAt: new Date(),
    },
  });
}
```

### Data Sync Strategy

**Approach**: Hybrid - webhooks for real-time updates, polling for bulk sync

```typescript
// /lib/ghl-sync.ts

/**
 * Background job: Full sync of GHL data
 * Runs every 15 minutes via cron
 */
export async function syncGHLDataForOrganization(organizationId: string) {
  const client = await createGHLClient(organizationId);

  // 1. Sync locations
  const locations = await client.getLocations();

  for (const location of locations) {
    await prisma.gHLLocation.upsert({
      where: {
        ghlLocationId_organizationId: {
          ghlLocationId: location.id,
          organizationId,
        },
      },
      update: {
        name: location.name,
        address: location.address,
        phone: location.phone,
        timezone: location.timezone,
      },
      create: {
        ghlLocationId: location.id,
        organizationId,
        ...location,
      },
    });

    // 2. Sync contacts for this location
    let skip = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const contacts = await client.getContacts(location.id, { skip, limit });

      if (contacts.length === 0) {
        hasMore = false;
        break;
      }

      // Bulk upsert contacts
      await prisma.$transaction(
        contacts.map(contact =>
          prisma.gHLContact.upsert({
            where: {
              ghlContactId_organizationId: {
                ghlContactId: contact.id,
                organizationId,
              },
            },
            update: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              tags: contact.tags,
              customFields: contact.customFields,
              lastSyncedAt: new Date(),
            },
            create: {
              ghlContactId: contact.id,
              organizationId,
              locationId: location.id,
              ...contact,
              lastSyncedAt: new Date(),
            },
          })
        )
      );

      skip += limit;
      hasMore = contacts.length === limit;
    }

    // 3. Sync calendar events (30-day window)
    const events = await client.getCalendarEvents(location.id, {
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 30).toISOString(),
    });

    await syncCalendarEvents(organizationId, location.id, events);
  }

  // Update sync status
  await prisma.syncStatus.upsert({
    where: {
      organizationId_source: {
        organizationId,
        source: "GHL_CONTACTS",
      },
    },
    update: {
      lastSyncAt: new Date(),
      status: "HEALTHY",
      errorCount: 0,
    },
    create: {
      organizationId,
      source: "GHL_CONTACTS",
      lastSyncAt: new Date(),
      status: "HEALTHY",
    },
  });
}
```

### Rate Limiting

**GHL API Limits:**

- 300 requests per minute per location
- 10,000 requests per day per organization

**Our Strategy:**

```typescript
// /lib/ghl-rate-limiter.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function checkGHLRateLimit(organizationId: string) {
  const key = `ghl:ratelimit:${organizationId}:${Math.floor(Date.now() / 60000)}`;

  const count = await redis.incr(key);
  await redis.expire(key, 60); // 1 minute TTL

  if (count > 250) {
    // 250/min to leave buffer
    throw new Error("GHL rate limit exceeded, try again in 1 minute");
  }

  return count;
}
```

### Error Handling

```typescript
// /lib/ghl-error-handler.ts

export class GHLAPIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "GHLAPIError";
  }
}

export async function handleGHLError(error: any, organizationId: string) {
  // Log error for monitoring
  await prisma.syncStatus.update({
    where: {
      organizationId_source: {
        organizationId,
        source: "GHL_CONTACTS",
      },
    },
    data: {
      status: "ERROR",
      errorCount: { increment: 1 },
      lastError: error.message,
    },
  });

  // Handle specific error codes
  if (error.response?.status === 401) {
    // Token expired, attempt refresh
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ghlRefreshToken: true },
    });

    if (org?.ghlRefreshToken) {
      const newTokens = await refreshGHLToken(org.ghlRefreshToken);
      // Update tokens and retry...
    }
  }

  if (error.response?.status === 429) {
    // Rate limit exceeded
    throw new GHLAPIError(429, "Rate limit exceeded, please try again later");
  }

  throw error;
}
```

---

## 2. Cal.com Integration

**Purpose**: Calendar scheduling and booking infrastructure
**Documentation**: [Cal.com API Docs](https://cal.com/docs/api-reference)
**Status**: Planned Phase 2

### Architecture Overview

Cal.com serves as the calendar abstraction layer, allowing agencies to:

- Manage availability across multiple providers (Google, Outlook)
- Offer white-label booking pages to clients
- Handle timezone conversions automatically
- Block time slots based on GHL appointments

### Setup Options

**Option A: Managed Cal.com (Faster Launch)**

- Use Cal.com cloud service
- $12-15/seat/month
- Instant setup, no infrastructure management
- API key-based authentication

**Option B: Self-Hosted Cal.com (Enterprise)**

- Deploy Cal.com to our Vercel account
- Free for unlimited users
- Complete data control
- OAuth integration required

### API Client

```typescript
// /lib/calcom-client.ts
import axios from "axios";

export class CalcomClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = process.env.CALCOM_API_URL ?? "https://api.cal.com/v1";
  }

  /**
   * Create a booking
   */
  async createBooking(params: {
    eventTypeId: string;
    startTime: string;
    endTime: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone?: string;
    metadata?: Record<string, any>;
  }) {
    const response = await axios.post(`${this.baseURL}/bookings`, params, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.booking;
  }

  /**
   * Block time slots based on external appointments
   */
  async createBlockedSlots(
    slots: {
      startTime: string;
      endTime: string;
      reason?: string;
    }[]
  ) {
    const response = await axios.post(
      `${this.baseURL}/busy-times`,
      { slots },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    return response.data;
  }

  /**
   * Get availability for a date range
   */
  async getAvailability(params: {
    eventTypeId: string;
    startDate: string;
    endDate: string;
    timezone: string;
  }) {
    const response = await axios.get(`${this.baseURL}/availability`, {
      params,
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    return response.data.slots;
  }
}
```

### Webhook Handlers

```typescript
// /app/api/webhooks/calcom/route.ts

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  switch (type) {
    case "booking.created":
      await handleBookingCreated(data);
      break;
    case "booking.cancelled":
      await handleBookingCancelled(data);
      break;
    case "booking.rescheduled":
      await handleBookingRescheduled(data);
      break;
  }

  return new Response("OK");
}

async function handleBookingCreated(data: CalcomBooking) {
  // Sync to our database
  await prisma.appointment.create({
    data: {
      calcomBookingId: data.id,
      organizationId: data.metadata.organizationId,
      locationId: data.metadata.locationId,
      startsAt: new Date(data.startTime),
      endsAt: new Date(data.endTime),
      status: "SCHEDULED",
    },
  });

  // Sync to GHL
  const client = await createGHLClient(data.metadata.organizationId);
  await client.createCalendarEvent({
    locationId: data.metadata.locationId,
    contactId: data.metadata.ghlContactId,
    startTime: data.startTime,
    endTime: data.endTime,
    title: data.title,
  });
}
```

---

## 3. Vercel AI SDK Integration

**Purpose**: AI-powered features and intelligent automation
**Documentation**: [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
**Status**: Planned Phase 2

### AI Model Configuration

```typescript
// /lib/ai/config.ts
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const aiModels = {
  // Primary models
  chat: anthropic("claude-3-5-sonnet-20241022"),
  analysis: openai("gpt-4-turbo"),
  fast: anthropic("claude-3-5-haiku-20241022"),

  // Specialized models
  vision: openai("gpt-4-vision-preview"),
  embedding: openai("text-embedding-3-small"),
};
```

### Use Cases

**1. Natural Language Queries**

```typescript
// /actions/ai/query.ts
import { streamText } from "ai";
import { aiModels } from "@/lib/ai/config";

export async function queryDashboard(params: {
  query: string;
  organizationContext: OrganizationContext;
}) {
  // Fetch relevant data
  const contacts = await getRecentContacts(
    params.organizationContext.organizationId
  );
  const appointments = await getTodayAppointments(
    params.organizationContext.organizationId
  );

  const { textStream } = await streamText({
    model: aiModels.chat,
    system: `You are an AI assistant for a medical practice operations dashboard.
You have access to the following data:
- ${contacts.length} recent contacts
- ${appointments.length} appointments today

Answer questions clearly and provide actionable insights.`,
    messages: [{ role: "user", content: params.query }],
  });

  return textStream;
}
```

**2. Appointment No-Show Prediction**

```typescript
// /actions/ai/predict-no-show.ts
import { generateObject } from "ai";
import { z } from "zod";

export async function predictNoShow(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: {
        include: {
          appointments: {
            where: { status: { in: ["COMPLETED", "NO_SHOW"] } },
            take: 10,
          },
        },
      },
    },
  });

  const { object } = await generateObject({
    model: aiModels.analysis,
    schema: z.object({
      riskScore: z.number().min(0).max(1),
      riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
      reasoning: z.string(),
      recommendations: z.array(z.string()),
    }),
    prompt: `Analyze this appointment and predict no-show risk:

Appointment: ${appointment.type} on ${appointment.startsAt}
Client history: ${appointment.client.appointments.length} past appointments
No-shows: ${appointment.client.appointments.filter(a => a.status === "NO_SHOW").length}
Time until appointment: ${differenceInHours(appointment.startsAt, new Date())} hours

Provide risk assessment and recommendations.`,
  });

  // Store prediction
  await prisma.aIPrediction.create({
    data: {
      organizationId: appointment.organizationId,
      type: "APPOINTMENT_NO_SHOW",
      input: { appointmentId },
      output: object,
      confidence: object.riskScore,
      model: "gpt-4-turbo",
    },
  });

  return object;
}
```

**3. Smart Message Auto-Responder**

```typescript
// /actions/ai/auto-respond.ts
export async function generateAutoResponse(params: {
  message: string;
  conversationHistory: Message[];
  contactData: GHLContact;
  organizationContext: OrganizationContext;
}) {
  const { textStream } = await streamText({
    model: aiModels.fast, // Use Haiku for speed
    system: `You are a helpful assistant for ${params.organizationContext.name}.
You help respond to client messages professionally and efficiently.

Client information:
- Name: ${params.contactData.firstName} ${params.contactData.lastName}
- Tags: ${params.contactData.tags.join(", ")}
- Recent appointments: ...

Generate a professional response. Keep it concise and actionable.`,
    messages: params.conversationHistory,
    temperature: 0.7,
  });

  return textStream;
}
```

---

## 4. Stripe Integration

**Purpose**: Subscription billing and payment processing
**Status**: Production ready (course payments)

### Current Implementation

```typescript
// /lib/stripe-client.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

/**
 * Create subscription for agency
 */
export async function createAgencySubscription(params: {
  organizationId: string;
  email: string;
  priceId: string; // $297/month subscription
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: params.organizationId },
  });

  // Create or retrieve Stripe customer
  let customerId = organization?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: params.email,
      metadata: { organizationId: params.organizationId },
    });

    customerId = customer.id;

    await prisma.organization.update({
      where: { id: params.organizationId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/agency/${organization?.slug}/admin?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/agency/${organization?.slug}/admin?payment=cancelled`,
    metadata: { organizationId: params.organizationId },
  });

  return session;
}
```

### Webhook Handlers

```typescript
// /app/api/webhooks/stripe/route.ts

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response("OK");
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "ACTIVE",
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });
}
```

---

## 5. Tigris S3 Storage

**Purpose**: File uploads and course content storage
**Status**: Production ready

### Configuration

```typescript
// /lib/s3-client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(params: {
  file: File;
  organizationId: string;
  key: string;
}) {
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `orgs/${params.organizationId}/${params.key}`,
      Body: buffer,
      ContentType: params.file.type,
    })
  );

  return {
    url: `${process.env.S3_PUBLIC_URL}/orgs/${params.organizationId}/${params.key}`,
    key: params.key,
  };
}
```

---

## 6. Better Auth

**Purpose**: Authentication and session management
**Status**: Production ready

### Configuration

```typescript
// /lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: prisma,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    organizationPlugin({
      allowedRoles: ["platform_admin", "agency_owner", "agency_admin", "user"],
    }),
  ],
});
```

---

## Environment Variables Checklist

```bash
# GoHighLevel
GHL_CLIENT_ID=
GHL_CLIENT_SECRET=
GHL_REDIRECT_URI=

# Cal.com
CALCOM_API_KEY=
CALCOM_API_URL=
CALCOM_WEBHOOK_SECRET=

# Vercel AI SDK (Phase 2)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AI_DEFAULT_MODEL=claude-3-5-sonnet-20241022

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUBSCRIPTION_PRICE_ID=

# Tigris S3
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_PUBLIC_URL=

# Better Auth
BETTER_AUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://sidecar-crm.vercel.app
DATABASE_URL=
```

---

## Monitoring & Observability

### Integration Health Checks

```typescript
// /app/api/health/integrations/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkGHLIntegration(),
    checkStripeIntegration(),
    checkS3Integration(),
  ]);

  return Response.json({
    status: checks.every(c => c.status === "fulfilled")
      ? "healthy"
      : "degraded",
    integrations: {
      ghl: checks[0].status === "fulfilled" ? "up" : "down",
      stripe: checks[1].status === "fulfilled" ? "up" : "down",
      s3: checks[2].status === "fulfilled" ? "up" : "down",
    },
    timestamp: new Date().toISOString(),
  });
}
```

---

**Related Documentation:**

- [Architecture Decisions (ADRs)](./architecture-decisions.md)
- [Calendar Architecture](./calendar-architecture.md)
- [AI Architecture](./ai-architecture.md)
