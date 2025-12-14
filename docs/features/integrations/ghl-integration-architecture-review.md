# GoHighLevel Integration - Critical Architecture Review

**Purpose:** Brutally honest technical review of proposed GHL integration for Church Connect Hub
**Date:** 2025-12-12
**Reviewer:** Senior Backend Engineer
**Status:** 🔴 **NEEDS MAJOR REVISIONS**

---

## Executive Summary

The proposed GHL integration has **significant architectural flaws** that will cause production incidents at scale. While the basic service layer concept is sound, the implementation plan is missing critical components for enterprise reliability, security, and resilience.

**Verdict:** **DO NOT IMPLEMENT AS PROPOSED.** Read this entire review first.

---

## 1. Architecture Concerns

### ❌ CRITICAL: No Error Isolation Strategy

**Current Plan:**

```typescript
lib/ghl/
├── client.ts          # GHL API client
├── contacts.ts        # Contact operations
├── messaging.ts       # SMS/Email operations
```

**What's Missing:**

1. **Circuit Breaker Pattern** - When GHL is down, you'll spam failed requests and timeout users
2. **Fallback Strategy** - No plan for what happens when GHL fails (queue? skip? retry?)
3. **Timeout Configuration** - HTTP requests can hang indefinitely
4. **Retry Logic** - Network blips will cause permanent failures

**What Will Happen in Production:**

- Sunday morning: 50 volunteers sign up
- GHL has a 2-minute outage (happens monthly)
- All 50 sync operations fail with no retry
- You manually re-process 50 records while angry church staff call you

**Required Fix:**

```typescript
// lib/ghl/client.ts
import { CircuitBreaker } from "opossum"; // Industry standard

const ghlCircuitBreaker = new CircuitBreaker(ghlRequest, {
  timeout: 5000, // 5s max
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // Try again after 30s
});

// With fallback queue
async function syncContact(contact: ContactData) {
  try {
    return await ghlCircuitBreaker.fire(contact);
  } catch (error) {
    // GHL is down - queue for later
    await queueForRetry(contact);
    return { queued: true };
  }
}
```

### ❌ CRITICAL: Synchronous API Calls in Request Path

**Current Plan:**

```
Connect Card Review → Save & Next → Sync to GHL → Show next card
```

**Problem:** GHL API calls take 500ms-2s. You're adding 2 seconds to every card review.

**What Will Happen:**

- Staff processes 30 cards = 60 seconds of artificial delay
- Sunday morning rush = GHL rate limits = 10-second waits per card
- Staff complaints → workarounds → data inconsistency

**Required Fix: Background Job Queue**

```typescript
// Use BullMQ or similar
import { Queue } from "bullmq";

const ghlQueue = new Queue("ghl-sync", {
  connection: redis,
});

// In save action - fire and forget
await saveConnectCard(data);
await ghlQueue.add(
  "sync-contact",
  { contactId: data.id },
  {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  }
);

// Return immediately to user
return { success: true };
```

**Why This Matters:**

- User experience: instant feedback vs 2-second freezes
- Reliability: retries happen in background, users never see failures
- Scalability: handles Sunday rush without blocking

### ❌ HIGH: No Observability Strategy

**Current Plan:** None mentioned.

**What's Missing:**

- How do you debug "Why didn't this volunteer get an SMS?"
- How do you track GHL API quota consumption?
- How do you alert when sync failure rate spikes?

**Required Fix:**

```typescript
// lib/ghl/observability.ts
import { logger } from "@/lib/logger"; // Use Pino or similar
import { metrics } from "@/lib/metrics"; // Use Prometheus client

export async function trackGHLRequest(
  operation: string,
  fn: () => Promise<any>
) {
  const start = Date.now();
  const requestId = generateId();

  logger.info({ operation, requestId }, "GHL request started");

  try {
    const result = await fn();
    const duration = Date.now() - start;

    metrics.ghlRequestDuration.observe({ operation }, duration);
    metrics.ghlRequestTotal.inc({ operation, status: "success" });

    logger.info({ operation, requestId, duration }, "GHL request succeeded");
    return result;
  } catch (error) {
    const duration = Date.now() - start;

    metrics.ghlRequestTotal.inc({ operation, status: "error" });

    logger.error(
      {
        operation,
        requestId,
        duration,
        error: error.message,
        stack: error.stack,
      },
      "GHL request failed"
    );

    throw error;
  }
}
```

**Critical Metrics to Track:**

- Request duration (p50, p95, p99)
- Success/failure rate by operation
- Rate limit headroom
- Queue depth (if using queue)
- Retry attempts per operation

### ⚠️ MEDIUM: Service Layer Structure Is Too Thin

**Current Plan:**

```typescript
lib/ghl/
├── client.ts
├── contacts.ts
├── messaging.ts
```

**Missing Layers:**

1. **Domain Layer** - Business logic abstraction
2. **Repository Layer** - GHL credential access
3. **Cache Layer** - Avoid duplicate API calls
4. **Validation Layer** - Pre-flight data validation

**Better Structure:**

```typescript
lib/ghl/
├── core/
│   ├── client.ts           // HTTP client with retry/timeout
│   ├── circuit-breaker.ts  // Resilience wrapper
│   ├── credentials.ts      // Credential management
│   └── rate-limiter.ts     // Client-side rate limiting
├── domain/
│   ├── contacts.ts         // Contact sync business logic
│   ├── messaging.ts        // Message send business logic
│   └── webhooks.ts         // Webhook handling (future)
├── repository/
│   ├── credentials-repo.ts // Encrypted credential access
│   └── sync-state-repo.ts  // Track sync status
├── queue/
│   ├── contact-sync-job.ts // Background contact sync
│   └── message-send-job.ts // Background message send
├── types.ts                // TypeScript types
├── errors.ts               // Custom error classes
├── observability.ts        // Logging/metrics
└── index.ts                // Public API exports
```

---

## 2. Multi-Tenant Security

### ❌ CRITICAL: Encryption Strategy Missing

**Current Plan:**

```prisma
model GHLCredentials {
  privateIntegrationToken String  // Needs encryption
}
```

**Problem:** Storing PIT tokens in plaintext = security violation. If database is compromised, attacker gets API access to ALL churches.

**Required Fix: Field-Level Encryption**

```typescript
// lib/ghl/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// NEVER store this in code - use AWS KMS or similar
const ENCRYPTION_KEY = process.env.GHL_ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = "aes-256-gcm";

export function encryptToken(token: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptToken(data: {
  encrypted: string;
  iv: string;
  authTag: string;
}): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(data.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(data.authTag, "hex"));

  let decrypted = decipher.update(data.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

**Updated Schema:**

```prisma
model GHLCredentials {
  id                      String   @id @default(uuid())
  organizationId          String   @unique
  locationId              String
  encryptedToken          String   // AES-256-GCM encrypted
  tokenIV                 String   // Initialization vector
  tokenAuthTag            String   // Authentication tag
  encryptionKeyVersion    Int      @default(1)  // For key rotation
  isConnected             Boolean  @default(true)
  lastSyncAt              DateTime?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

**Why This Matters:**

- SOC 2 compliance requirement
- Prevents credential theft from database dumps
- Supports key rotation (mandatory for enterprise)

### ❌ CRITICAL: No Credential Rotation Strategy

**Current Plan:** None mentioned.

**Problem:** When PIT tokens leak (employee leaves, laptop stolen, etc.), you have no way to rotate them.

**Required:**

```typescript
// actions/ghl/rotate-credentials.ts
export async function rotateGHLCredentials(organizationId: string) {
  // 1. Generate new PIT in GHL UI
  // 2. User enters new token
  // 3. Test connection with new token
  // 4. Only if successful, replace old token
  // 5. Log rotation event for audit

  await prisma.gHLCredentials.update({
    where: { organizationId },
    data: {
      encryptedToken: newEncrypted,
      encryptionKeyVersion: currentVersion,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      action: "GHL_CREDENTIALS_ROTATED",
      performedBy: userId,
      timestamp: new Date(),
    },
  });
}
```

### ⚠️ MEDIUM: Insufficient Tenant Isolation

**Current Plan:**

```typescript
const token = await getCredentials(organizationId);
```

**Missing:**

- Validation that organizationId matches auth context
- Protection against IDOR (Insecure Direct Object Reference)

**Required Fix:**

```typescript
// lib/ghl/credentials.ts
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

export async function getGHLCredentials(slug: string) {
  // Use existing auth pattern from codebase
  const { organization } = await requireDashboardAccess(slug);

  // NEVER trust organizationId from request params
  const creds = await prisma.gHLCredentials.findUnique({
    where: { organizationId: organization.id },
  });

  if (!creds) return null;

  // Decrypt token
  const token = decryptToken({
    encrypted: creds.encryptedToken,
    iv: creds.tokenIV,
    authTag: creds.tokenAuthTag,
  });

  return { locationId: creds.locationId, token };
}
```

---

## 3. Reliability & Resilience

### ❌ CRITICAL: No Queue System for Message Delivery

**Current Plan:**

```
Volunteer checkbox "Send onboarding materials" → Send SMS + Email
```

**Problem:**

- GHL rate limits: 100 requests per 10 seconds
- Sunday rush: 50 volunteers checked at once = instant rate limit
- Failed sends = lost messages, angry volunteers

**Required: Message Queue with Rate Limiting**

```typescript
// lib/ghl/queue/message-queue.ts
import { Queue, Worker } from "bullmq";

// Create queue with rate limiting
export const messageQueue = new Queue("ghl-messages", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

// Rate limit worker to respect GHL limits
export const messageWorker = new Worker(
  "ghl-messages",
  async job => {
    const { organizationId, contactId, messageType } = job.data;

    // Get credentials
    const creds = await getGHLCredentials(organizationId);

    // Send via GHL API
    await sendGHLMessage(creds, contactId, messageType);
  },
  {
    connection: redis,
    limiter: {
      max: 100, // 100 requests
      duration: 10000, // per 10 seconds (GHL limit)
    },
  }
);

// In your action
export async function sendVolunteerOnboarding(contactId: string) {
  await messageQueue.add("volunteer-welcome", {
    organizationId,
    contactId,
    messageType: "welcome",
  });

  // Return immediately - user doesn't wait
  return { queued: true };
}
```

**Infrastructure Requirements:**

- Redis instance (for BullMQ)
- Queue worker process (separate from web server)
- Dead letter queue for permanent failures

### ❌ CRITICAL: No Idempotency Protection

**Current Plan:** Direct API calls with no deduplication.

**Problem:**

- User clicks "Send" twice → duplicate messages
- Retry logic → duplicate messages
- Background job retry → duplicate messages

**Required: Idempotency Keys**

```typescript
// lib/ghl/messaging.ts
export async function sendMessage(params: {
  organizationId: string;
  contactId: string;
  messageType: string;
  idempotencyKey?: string;
}) {
  const key = params.idempotencyKey || generateIdempotencyKey(params);

  // Check if we've already sent this message
  const existing = await prisma.gHLMessageLog.findUnique({
    where: { idempotencyKey: key },
  });

  if (existing && existing.status === "SENT") {
    return { alreadySent: true, messageId: existing.externalId };
  }

  // Send via GHL
  const result = await ghlClient.sendSMS({
    locationId,
    contactId,
    message,
  });

  // Log with idempotency key
  await prisma.gHLMessageLog.create({
    data: {
      organizationId: params.organizationId,
      contactId: params.contactId,
      messageType: params.messageType,
      idempotencyKey: key,
      externalId: result.messageId,
      status: "SENT",
      sentAt: new Date(),
    },
  });

  return result;
}
```

**New Table:**

```prisma
model GHLMessageLog {
  id              String   @id @default(uuid())
  organizationId  String
  contactId       String
  messageType     String
  idempotencyKey  String   @unique
  externalId      String?  // GHL message ID
  status          String   // PENDING, SENT, FAILED
  error           String?
  sentAt          DateTime?
  createdAt       DateTime @default(now())

  @@index([organizationId, contactId])
  @@index([idempotencyKey])
}
```

### ⚠️ HIGH: No GHL Downtime Handling

**Current Plan:** None mentioned.

**What Happens When GHL is Down:**

- 9am Sunday: GHL has outage (happens every few months)
- All volunteer syncs fail
- Staff see error messages
- Panic ensues

**Required: Graceful Degradation**

```typescript
// In your action
export async function saveConnectCard(data: ConnectCardData) {
  // Always save to your database first
  const card = await prisma.connectCard.create({ data });

  // Try to sync to GHL (non-blocking)
  try {
    await ghlQueue.add(
      "sync-contact",
      { cardId: card.id },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 10000 },
      }
    );

    return {
      status: "success",
      message: "Card saved and queued for sync",
      syncStatus: "pending",
    };
  } catch (queueError) {
    // Queue failed (Redis down?) - log and continue
    await logError("GHL queue unavailable", queueError);

    return {
      status: "success",
      message: "Card saved (will sync to GHL later)",
      syncStatus: "deferred",
    };
  }
}
```

**Dashboard Indicator:**

```typescript
// Show sync status to staff
<Badge variant={card.ghlSyncStatus === "synced" ? "success" : "warning"}>
  {card.ghlSyncStatus === "synced" ? "Synced to GHL" : "Pending Sync"}
</Badge>
```

---

## 4. Code Organization

### ✅ Location: `lib/ghl/` is CORRECT

**Reasoning:**

- Aligns with existing `lib/email/` pattern
- Reusable across routes and actions
- Clear separation from app logic

### ❌ Should NOT be a separate package (yet)

**Current Scale:** 10 churches max
**Decision:** Keep it in-tree until you hit 100+ churches or need to share code with other apps.

**Why:**

- Monorepo overhead not justified
- Versioning complexity not needed
- Deploy coupling is fine at this scale

### ✅ Integration Pattern Matches Existing Code

**Existing Pattern (Email):**

```typescript
lib/email/
├── service.ts
├── client.ts
└── templates/
```

**GHL Should Follow:**

```typescript
lib/ghl/
├── service.ts        // Public API (like email service)
├── client.ts         // HTTP client
├── credentials.ts    // Credential management
├── queue/           // Background jobs
└── templates/       // Message templates (future)
```

---

## 5. Missing Pieces (Will Bite You)

### ❌ No Webhook Handler

**GHL sends webhooks for:**

- Contact updates
- Message delivery status
- Opt-out requests (REQUIRED for compliance)

**You Need:**

```typescript
// app/api/webhooks/ghl/route.ts
export async function POST(request: Request) {
  // 1. Verify webhook signature (prevent spoofing)
  const signature = request.headers.get("x-ghl-signature");
  if (!verifyGHLSignature(signature, await request.text())) {
    return new Response("Invalid signature", { status: 401 });
  }

  // 2. Parse event
  const event = await request.json();

  // 3. Handle based on type
  switch (event.type) {
    case "contact.updated":
      await handleContactUpdate(event.data);
      break;
    case "message.delivered":
      await updateMessageStatus(event.data);
      break;
    case "contact.opted_out":
      await handleOptOut(event.data); // CRITICAL for compliance
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### ❌ No Rate Limit Handling

**GHL Limits:**

- 100 requests per 10 seconds per location
- 429 response when exceeded

**You Need:**

```typescript
// lib/ghl/rate-limiter.ts
import Bottleneck from "bottleneck";

// Per-location rate limiter
const limiters = new Map<string, Bottleneck>();

function getLimiter(locationId: string) {
  if (!limiters.has(locationId)) {
    limiters.set(
      locationId,
      new Bottleneck({
        reservoir: 100, // 100 requests
        reservoirRefreshAmount: 100,
        reservoirRefreshInterval: 10 * 1000, // per 10 seconds
        minTime: 100, // 100ms between requests
      })
    );
  }
  return limiters.get(locationId)!;
}

export async function rateLimitedRequest<T>(
  locationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const limiter = getLimiter(locationId);
  return limiter.schedule(fn);
}
```

### ❌ No Contact Deduplication Strategy

**Problem:**

- Church adds contact via connect card
- Same person fills out GHL form
- Now you have duplicates in GHL

**You Need:**

```typescript
// Before creating contact, search for duplicates
const existing = await ghlClient.searchContacts({
  locationId,
  email: contact.email,
});

if (existing.contacts.length > 0) {
  // Update existing instead of create
  await ghlClient.updateContact({
    locationId,
    contactId: existing.contacts[0].id,
    data: contact,
  });
} else {
  await ghlClient.createContact({ locationId, data: contact });
}
```

### ❌ No SMS Opt-Out Compliance

**Legal Requirement (TCPA):**

- Must honor STOP/UNSUBSCRIBE
- Must have opt-in record
- Must provide opt-out instructions

**You Need:**

```prisma
model ConsentLog {
  id              String   @id @default(uuid())
  organizationId  String
  contactId       String
  channel         String   // SMS, EMAIL
  action          String   // OPT_IN, OPT_OUT
  source          String   // CONNECT_CARD, GHL_WEBHOOK
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())

  @@index([organizationId, contactId])
}
```

### ❌ No Custom Field Mapping

**Problem:**

- Each church has custom fields in GHL
- Your hardcoded field names won't match

**You Need:**

```prisma
model GHLFieldMapping {
  id              String @id @default(uuid())
  organizationId  String
  churchField     String  // Your field name
  ghlFieldKey     String  // GHL custom field key

  @@unique([organizationId, churchField])
}
```

---

## 6. Recommendations (Prioritized)

### Phase 1: Critical Blockers (DO NOT LAUNCH WITHOUT THESE)

| Priority | Item                             | Why                          | Time Estimate |
| -------- | -------------------------------- | ---------------------------- | ------------- |
| 🔴 P0    | Encrypt PIT tokens (AES-256-GCM) | Legal/security requirement   | 4 hours       |
| 🔴 P0    | Add message queue (BullMQ)       | Prevent rate limit disasters | 8 hours       |
| 🔴 P0    | Implement circuit breaker        | Prevent cascading failures   | 4 hours       |
| 🔴 P0    | Add idempotency keys             | Prevent duplicate messages   | 6 hours       |
| 🔴 P0    | Background sync (non-blocking)   | User experience critical     | 6 hours       |

**Total: 4-5 days**

### Phase 2: Production Requirements (MUST HAVE)

| Priority | Item                         | Why                     | Time Estimate |
| -------- | ---------------------------- | ----------------------- | ------------- |
| 🟠 P1    | Webhook handler for opt-outs | Legal compliance (TCPA) | 6 hours       |
| 🟠 P1    | Rate limiter (client-side)   | Prevent 429 errors      | 4 hours       |
| 🟠 P1    | Observability (logs/metrics) | Debuggability           | 6 hours       |
| 🟠 P1    | Credential rotation UI       | Security ops            | 4 hours       |
| 🟠 P1    | Graceful degradation         | Handle GHL outages      | 4 hours       |

**Total: 3 days**

### Phase 3: Nice to Have (Can Launch Without)

| Priority | Item                  | Why                      | Time Estimate |
| -------- | --------------------- | ------------------------ | ------------- |
| 🟡 P2    | Custom field mapping  | Multi-church flexibility | 8 hours       |
| 🟡 P2    | Contact deduplication | Data quality             | 4 hours       |
| 🟡 P2    | Consent logging       | Audit trail              | 4 hours       |
| 🟡 P2    | Dead letter queue UI  | Operations               | 6 hours       |

**Total: 2-3 days**

---

## 7. Industry Patterns to Follow

### Pattern 1: Jobs-Based Architecture (Recommended)

**Instead of:** Sync in request/response cycle
**Do:** Queue-based async processing

**Reference Implementation:**

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Vercel's Job Queue Pattern](https://vercel.com/blog/queues)
- See your existing email service pattern - apply same to GHL

### Pattern 2: Secrets Management

**Instead of:** Database-encrypted tokens
**Better:** AWS Secrets Manager or Vault

**Why:**

- Automatic key rotation
- Audit logging built-in
- No encryption key in env vars

**Migration Path:**

1. Start with database encryption (Phase 1)
2. Migrate to Secrets Manager when you hit 50+ churches

### Pattern 3: Circuit Breaker (Netflix Hystrix Pattern)

**Library:** `opossum` (Node.js standard)

**Configuration:**

```typescript
const breaker = new CircuitBreaker(ghlRequest, {
  timeout: 5000, // Request timeout
  errorThresholdPercentage: 50, // Open circuit at 50% errors
  resetTimeout: 30000, // Try again after 30s
  rollingCountTimeout: 10000, // 10s window
  volumeThreshold: 10, // Min requests before tripping
});

breaker.fallback(() => {
  return { queued: true, message: "GHL temporarily unavailable" };
});
```

---

## 8. What Will Bite You in Production

### Issue 1: Sunday Morning Rush

**Scenario:**

- 8:30am: 100 connect cards scanned
- 9:00am: Service starts, 50 volunteers sign up
- 9:15am: Staff batch-processes all cards

**What Breaks:**

- GHL rate limits hit → 429 errors
- Synchronous processing → staff waits 5 minutes
- No queue → failed syncs lost forever

**Fix:** Queue + rate limiter (Phase 1 requirements)

### Issue 2: GHL Outage

**Scenario:**

- GHL has 15-minute outage (happens quarterly)
- All sync operations fail
- Staff see error messages

**What Breaks:**

- No retry logic → permanent failures
- No graceful degradation → blocking UI
- No observability → you don't know it happened

**Fix:** Circuit breaker + background queue (Phase 1 requirements)

### Issue 3: Credential Leak

**Scenario:**

- Staff member leaves, takes laptop
- PIT token in plaintext in database dump
- Attacker has API access to all church contacts

**What Breaks:**

- GDPR violation → fines
- Church trust → lost customers
- Your reputation → destroyed

**Fix:** Field-level encryption (Phase 1 requirement)

---

## 9. Cost Analysis

### Without Queue (Current Plan)

**Assumptions:**

- 50 churches
- 20 volunteers/week/church = 1,000 volunteers/week
- 2 GHL API calls per volunteer (create contact + send message)

**Cost:**

- API calls: 2,000/week = ~8,000/month
- GHL limits: 100/10s = 36,000/hour (safe)

**But:**

- Sunday rush: 1,000 volunteers in 2 hours
- 2,000 API calls in 2 hours
- Rate limit headroom: 50% (risky)
- One retry storm → circuit breaker trips

### With Queue (Recommended)

**Benefits:**

- Spread requests over 24 hours
- Rate limit headroom: 95%
- Automatic retries
- Zero user-facing failures

**Infrastructure Cost:**

- Redis (Upstash): $10/month
- Worker dyno (Vercel function): $0 (included)

**ROI:** $10/month prevents 100% of rate limit incidents

---

## 10. Final Verdict

### ❌ DO NOT implement the plan as written

**Critical gaps:**

1. No encryption (legal risk)
2. No queue (reliability risk)
3. No circuit breaker (outage risk)
4. No observability (ops risk)

### ✅ DO implement this revised plan

**Phase 1 (1 week):**

1. Set up BullMQ with Redis
2. Encrypt PIT tokens (AES-256-GCM)
3. Background queue for contact sync
4. Circuit breaker wrapper
5. Idempotency keys

**Phase 2 (3 days):**

1. Webhook handler for opt-outs
2. Rate limiter (client-side)
3. Logging + metrics
4. Graceful degradation

**Phase 3 (3 days):**

1. Custom field mapping
2. Credential rotation UI
3. Dead letter queue UI

**Total: 2-3 weeks of senior engineer time**

---

## 11. Testing Strategy

### Integration Tests Required

```typescript
describe("GHL Integration", () => {
  it("handles GHL rate limits gracefully", async () => {
    // Mock GHL API returning 429
    mockGHL.rateLimit();

    // Should queue and retry later
    const result = await syncContact(contact);
    expect(result.queued).toBe(true);
  });

  it("prevents duplicate messages via idempotency", async () => {
    const key = "test-key";

    // Send twice with same key
    await sendMessage({ ...params, idempotencyKey: key });
    const result = await sendMessage({ ...params, idempotencyKey: key });

    expect(result.alreadySent).toBe(true);
  });

  it("handles GHL outage via circuit breaker", async () => {
    // Mock GHL timeout
    mockGHL.timeout();

    // Circuit should open after threshold
    for (let i = 0; i < 10; i++) {
      await syncContact(contact);
    }

    // Next call should fail fast (not timeout)
    const start = Date.now();
    await syncContact(contact);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Instant failure
  });
});
```

### Load Tests Required

```bash
# Simulate Sunday rush
k6 run --vus 50 --duration 30s ghl-load-test.js

# Should handle:
# - 50 concurrent users
# - 1000 requests/minute
# - No rate limit errors
# - No timeouts
```

---

## Appendix A: Complete File Structure

```
lib/ghl/
├── core/
│   ├── client.ts              # HTTP client with retry/timeout
│   ├── circuit-breaker.ts     # opossum wrapper
│   ├── credentials.ts         # Encrypted credential access
│   ├── rate-limiter.ts        # bottleneck per location
│   └── encryption.ts          # AES-256-GCM encryption
├── domain/
│   ├── contacts.ts            # Contact sync logic
│   ├── messaging.ts           # Message send logic
│   └── webhooks.ts            # Webhook event handling
├── queue/
│   ├── setup.ts               # BullMQ config
│   ├── contact-sync-job.ts    # Background contact sync
│   ├── message-send-job.ts    # Background message send
│   └── workers.ts             # Worker process
├── repository/
│   ├── credentials-repo.ts    # Database access for creds
│   ├── sync-state-repo.ts     # Track sync status
│   └── message-log-repo.ts    # Track sent messages
├── observability/
│   ├── logger.ts              # Structured logging
│   ├── metrics.ts             # Prometheus metrics
│   └── alerts.ts              # Alert definitions
├── types.ts                   # TypeScript types
├── errors.ts                  # Custom error classes
├── service.ts                 # Public API (like email service)
└── index.ts                   # Exports
```

---

## Appendix B: Required Database Migrations

```prisma
// Add to schema.prisma

model GHLCredentials {
  id                   String   @id @default(uuid())
  organizationId       String   @unique
  locationId           String
  encryptedToken       String
  tokenIV              String
  tokenAuthTag         String
  encryptionKeyVersion Int      @default(1)
  isConnected          Boolean  @default(true)
  lastSyncAt           DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("ghl_credentials")
}

model GHLContactSync {
  id                String   @id @default(uuid())
  organizationId    String
  contactId         String   // Your internal contact ID
  ghlContactId      String?  // GHL contact ID
  status            String   // PENDING, SYNCED, FAILED
  lastSyncAt        DateTime?
  lastError         String?
  retryCount        Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, contactId])
  @@index([organizationId, status])
  @@map("ghl_contact_sync")
}

model GHLMessageLog {
  id              String   @id @default(uuid())
  organizationId  String
  contactId       String
  messageType     String   // WELCOME, DOCUMENTS, etc.
  idempotencyKey  String   @unique
  ghlMessageId    String?
  status          String   // PENDING, SENT, FAILED
  error           String?
  sentAt          DateTime?
  createdAt       DateTime @default(now())

  @@index([organizationId, contactId])
  @@index([idempotencyKey])
  @@map("ghl_message_log")
}

model ConsentLog {
  id              String   @id @default(uuid())
  organizationId  String
  contactId       String
  channel         String   // SMS, EMAIL
  action          String   // OPT_IN, OPT_OUT
  source          String   // CONNECT_CARD, GHL_WEBHOOK
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())

  @@index([organizationId, contactId])
  @@map("consent_log")
}
```

---

**Bottom Line:** Your plan is 30% of a production-ready integration. The other 70% is resilience, security, and observability. Budget 2-3 weeks, not 1 week.
