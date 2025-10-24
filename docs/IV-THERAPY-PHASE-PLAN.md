# IV Therapy Clinic Platform - Phase Plan

## Executive Summary

**Vision:** Transform how GoHighLevel agencies serve IV therapy clinics by providing a simplified, focused interface that replaces the overwhelming complexity of GHL with only the features clinics need daily.

**Strategy:** Build a vertical SaaS on top of GHL that syncs data behind the scenes while presenting a clean, clinic-focused experience. Start with IV therapy clinics, then expand to other medical practices.

**Current Status:** Multi-tenant architecture complete, GHL OAuth working, basic UI built. Need to connect real data and add clinic-specific features.

**Target:** Get to paying customers with a focused MVP that delivers clear value: unified inbox, appointment management, and basic inventory tracking.

---

## Phase Overview

| Phase                           | Focus                     | Key Deliverables                                                                  | Success Metric                                      |
| ------------------------------- | ------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Phase 1: MVP Foundation**     | Core operations dashboard | GHL API integration, real-time appointments, unified inbox (read-only)            | 3 pilot clinics using daily                         |
| **Phase 2: Full Operations**    | Complete clinic workflow  | Message sending, inventory management, task system, mobile optimization           | 10 clinics onboarded, 50% reduction in support time |
| **Phase 3: Intelligence Layer** | AI-powered automation     | Predictive analytics, smart responses, proactive alerts, natural language queries | 80% reduction in manual work, $10k MRR              |
| **Phase 4: Scale & Polish**     | Growth features           | White-label options, advanced reporting, API access, training academy integration | 25 clinics, 95% retention                           |

---

## PHASE 1: MVP Foundation

**Goal:** Get real GHL data flowing and deliver immediate value to pilot clinics

### GHL API Integration & Real Data

**Backend Tasks:**

- [ ] **Implement GHL API client** (`/lib/ghl-client.ts`)

  - Create `GHLClient` class with methods: `getContacts()`, `getAppointments()`, `getConversations()`, `getLocations()`
  - Add rate limiting (250 requests/min per org)
  - Implement automatic token refresh using existing `getGHLAccessToken()`
  - Error handling and retry logic

- [ ] **Server actions for data fetching** (`/actions/ghl/`)

  - `fetchContacts` - Get contacts from GHL, sync to Contact table
  - `fetchAppointments` - Get calendar events for today/week
  - `fetchConversations` - Get unread messages across SMS/FB/IG
  - `syncGHLData` - Background job to keep data fresh

- [ ] **Database sync strategy**
  - Use existing `ContactIntegration` model to track GHL external IDs
  - Upsert logic: Update existing contacts, create new ones
  - Store last sync timestamp in `ContactIntegration.lastSyncAt`
  - Implement webhook endpoint at `/api/webhooks/ghl` for real-time updates

**Frontend Tasks:**

- [ ] **Dashboard widgets with real data** (`/app/agency/[slug]/admin/page.tsx`)
  - Replace mock data with actual counts
  - "Today's Appointments" widget - show count + next 3 appointments
  - "Unread Messages" widget - show count by channel (SMS, FB, IG)
  - "Outstanding Payments" widget - static for now (Phase 2)
  - "Inventory Alerts" widget - static for now (Phase 2)

### Unified Inbox (Read-Only)

**Backend Tasks:**

- [ ] **Message sync from GHL** (`/actions/ghl/fetch-conversations.ts`)

  - Fetch conversations from GHL API
  - Parse message threads (SMS, Facebook, Instagram)
  - Store in `Message` table with correct `channel` and `direction`
  - Link messages to contacts via `ContactIntegration.externalId`

- [ ] **Conversation aggregation** (`/actions/ghl/get-conversations.ts`)
  - Query messages grouped by contact
  - Get unread count per channel
  - Sort by most recent activity
  - Include contact details (name, phone, clinic)

**Frontend Tasks:**

- [ ] **Inbox UI** (`/app/agency/[slug]/admin/inbox/page.tsx`)
  - Left sidebar: List of conversations with contact name, last message, unread badge
  - Filter by channel (All, SMS, Facebook, Instagram)
  - Search contacts by name/phone
  - Right panel: Message thread view (read-only for now)
  - Show message timestamps, delivery status, channel icons

### Calendar & Appointments

**Backend Tasks:**

- [ ] **Appointment sync** (`/actions/ghl/sync-appointments.ts`)
  - Fetch calendar events from GHL
  - Store in `Appointment` table
  - Link to contacts
  - Handle timezones correctly
  - Track appointment status (scheduled, confirmed, completed, no-show)

**Frontend Tasks:**

- [ ] **Calendar page** (`/app/agency/[slug]/admin/calendar/page.tsx`)
  - Daily view showing time slots 8am-8pm
  - List view of appointments with contact details
  - Color coding by appointment type (consultation, treatment, follow-up)
  - Quick filters: Today, Tomorrow, This Week, All Upcoming

**Success Metrics:**

- API calls succeed 99%+ of time
- Data syncs promptly after GHL changes
- Dashboard loads quickly

---

## PHASE 2: Full Operations

**Goal:** Complete the core clinic workflow - make it useful enough that clinics use it daily

### Message Sending & Inbox Completion

**Backend Tasks:**

- [ ] **Send messages via GHL API** (`/actions/ghl/send-message.ts`)

  - Send SMS messages via GHL
  - Send Facebook messages
  - Send Instagram messages
  - Rate limiting for outbound messages
  - Store sent messages in database
  - Handle delivery status webhooks

- [ ] **Message templates** (`/actions/messages/templates.ts`)
  - Common IV therapy responses
  - Template variables: {patient_name}, {appointment_time}, {location}
  - CRUD operations for custom templates

**Frontend Tasks:**

- [ ] **Inbox reply interface**
  - Message composition textarea
  - Send button with channel selector (SMS, FB, IG)
  - Template dropdown for quick responses
  - Character count for SMS
  - Sending indicator and delivery confirmation

### Inventory Management System

**Backend Tasks:**

- [ ] **Add inventory models to Prisma schema**

  - InventoryItem model
  - InventoryTransaction model
  - Categories: IV_SUPPLIES, MEDICATIONS, SUPPLEMENTS, EQUIPMENT, CONSUMABLES

- [ ] **Inventory server actions** (`/actions/inventory/`)
  - `getInventoryItems` - List all items with current quantities
  - `getLowStockItems` - Items below reorder point
  - `recordUsage` - Decrement quantity when used
  - `recordPurchase` - Increment quantity when purchased

**Frontend Tasks:**

- [ ] **Inventory page** (`/app/agency/[slug]/admin/inventory/page.tsx`)
  - Table view with current quantities
  - Color coding: Green (sufficient), Yellow (low), Red (out of stock)
  - Quick filters: All, Low Stock, Out of Stock, By Category
  - Search items by name/SKU

### Task Management & Mobile Optimization

**Backend Tasks:**

- [ ] **Task server actions** (`/actions/tasks/`)
  - `getTasks` - Filter by status, assignee, due date
  - `createTask` - Create follow-up task
  - `updateTask` - Change status/assignee
  - `getOverdueTasks` - For dashboard widget

**Frontend Tasks:**

- [ ] **Task management UI**

  - Kanban board view: To Do, In Progress, Completed
  - List view with filters
  - Quick create task from any contact/appointment
  - Priority levels (Low, Medium, High, Urgent)

- [ ] **Mobile optimization pass**
  - Test all pages on mobile
  - Fix responsive layouts
  - Ensure touch-friendly interfaces

**Success Metrics:**

- 10 clinics onboarded and using daily
- 50% reduction in support time per clinic
- 95%+ message delivery success rate
- Mobile usage >30% of total traffic

---

## PHASE 3: Intelligence Layer

**Goal:** Add AI-powered features that reduce manual work by 80%

### Vercel AI SDK Integration & Smart Features

**Backend Tasks:**

- [ ] **AI infrastructure setup** (`/lib/ai/`)

  - Configure Vercel AI SDK
  - Set up Anthropic Claude 3.5 Sonnet
  - Implement streaming responses
  - Add cost tracking per organization

- [ ] **Natural language query system** (`/actions/ai/query-dashboard.ts`)

  - Parse natural language queries
  - Generate appropriate database queries
  - Return formatted results

- [ ] **Smart message suggestions** (`/actions/ai/suggest-response.ts`)
  - Analyze incoming message context
  - Suggest 3 response options
  - Learn from accepted suggestions

**Frontend Tasks:**

- [ ] **AI command palette**

  - Global keyboard shortcut (Cmd+K)
  - Natural language input
  - Streaming results display

- [ ] **Smart inbox features**
  - AI-suggested responses below messages
  - One-click send suggested response
  - Auto-categorize messages

### Proactive Automation & Alerts

**Backend Tasks:**

- [ ] **Proactive alert system** (`/actions/ai/proactive-alerts.ts`)

  - Detect patterns requiring attention
  - Inventory alerts based on usage patterns
  - Appointment alerts for no-show risks
  - Send alerts via dashboard notifications

- [ ] **Smart automation rules** (`/actions/ai/automations.ts`)
  - Auto-confirm appointments 24 hours before
  - Auto-send follow-ups after treatment
  - Auto-create tasks when inventory is low

**Frontend Tasks:**

- [ ] **Notification center**

  - Bell icon in header with unread count
  - Dropdown showing recent alerts
  - Filter by type

- [ ] **Automation rules page**
  - Pre-built automation templates
  - Enable/disable toggles
  - Automation history logs

**Success Metrics:**

- 60%+ AI suggestion acceptance rate
- Natural language queries work 80%+ of time
- 80% reduction in manual work
- User satisfaction score >4.5/5

---

## PHASE 4: Scale & Polish

**Goal:** Prepare for growth - add features that support 25+ clinics

### White-Label & Advanced Reporting

**Backend Tasks:**

- [ ] **White-label customization** (`/actions/branding/`)

  - Custom logo upload per organization
  - Brand color picker
  - Custom domain support
  - Email template branding

- [ ] **Advanced analytics** (`/actions/analytics/`)
  - Revenue analytics
  - Appointment analytics
  - Patient analytics
  - Staff analytics
  - Export to CSV/PDF

**Frontend Tasks:**

- [ ] **Branding settings page**

  - Logo uploader with preview
  - Color picker with live preview
  - Custom domain configuration

- [ ] **Analytics dashboard**
  - Revenue charts
  - Appointment heatmap
  - Patient lifecycle funnel
  - Comparative analytics

### API Access & Training Integration

**Backend Tasks:**

- [ ] **Public API for clinics** (`/app/api/v1/`)

  - REST API for external integrations
  - Authentication via API keys
  - Rate limiting per organization
  - Core endpoints for contacts, appointments, inventory, messages

- [ ] **Training platform integration**
  - Link courses to clinic staff
  - Onboarding course for new staff
  - Progress tracking and certificates

**Frontend Tasks:**

- [ ] **API keys management page**

  - Generate/revoke API keys
  - View usage stats
  - API documentation link

- [ ] **Training assignment UI**
  - Assign courses to staff
  - View completion status
  - Certificate downloads

**Success Metrics:**

- 25 clinics using platform
- $10k MRR
- 95% customer retention rate
- 80%+ clinics use white-label branding

---

## Technical Architecture Notes

### Multi-Tenant Data Isolation

```typescript
// Platform Admin
Query: prisma.contact.findMany(); // No filters

// Agency Admin
Query: prisma.contact.findMany({
  where: { organizationId: "digital-desk" },
});

// Clinic Admin/Staff
Query: prisma.contact.findMany({
  where: {
    organizationId: "digital-desk",
    OR: [{ id: clinicId }, { parentContactId: clinicId }],
  },
});
```

### Data Sync Architecture

- **Webhooks:** Real-time updates for appointments, messages
- **Polling:** Background sync for contacts at regular intervals
- **Cache:** Redis for frequently accessed data
- **Source of Truth:** GHL for contacts/appointments, our database for inventory/tasks

### GHL API Integration Strategy

- **Rate Limits:** 300 requests/minute per location (stay at 250)
- **Error Handling:** Automatic token refresh, exponential backoff
- **Caching:** 5-15 minute cache for API responses

---

## Success Metrics Summary

### Phase 1 (MVP Foundation)

- 3 pilot clinics actively using daily
- Dashboard loads quickly
- Data syncs reliably

### Phase 2 (Full Operations)

- 10 clinics onboarded
- 50% reduction in support time
- 95%+ message delivery success

### Phase 3 (Intelligence Layer)

- 80% reduction in manual work
- 60%+ AI suggestion acceptance
- User satisfaction >4.5/5

### Phase 4 (Scale & Polish)

- 25 clinics, $10k MRR
- 95% retention rate
- 80%+ using white-label

---

## Risk Mitigation

1. **GHL API Changes:** Build adapter pattern, monitor changelog
2. **AI Costs:** Track per-org costs, set limits at $100/month
3. **Poor Adoption:** Start with trusted pilot clinics, weekly check-ins
4. **Can't Compete with GHL:** Position as vertical SaaS, not generic CRM
5. **Performance Issues:** Redis caching, database indexes, pagination

---

## Pricing Model

### Starter: $297/month

- Single clinic, up to 500 patients
- Unified inbox, calendar, basic inventory
- Email support

### Professional: $497/month (Target)

- Up to 3 locations, unlimited patients
- AI features, advanced analytics
- Priority support, training access

### Enterprise: Custom

- Unlimited locations, white-label
- API access, dedicated success manager

---

## Go-to-Market Strategy

### Stage 1: Pilot Program

- 3 Digital Desk IV therapy clients
- Free pilot for feedback
- Regular check-ins

### Stage 2: Digital Desk Launch

- Convert pilots to $297/month
- Email remaining clients
- Goal: 10 paying customers

### Stage 3: Content Marketing

- Case studies from pilots
- LinkedIn outreach
- Goal: 25 customers

### Stage 4: Partner Program

- Recruit GHL agencies as resellers
- White-label options
- Goal: 3 agency partners

---

## Initial Implementation Tasks

**Infrastructure Setup:**

- [ ] Set up Redis for caching
- [ ] Create `/lib/ghl-client.ts`
- [ ] Test GHL API authentication

**Core API Methods:**

- [ ] Implement `getContacts()` method
- [ ] Implement `getAppointments()` method
- [ ] Test data sync with real GHL data

**Dashboard Integration:**

- [ ] Create background sync job
- [ ] Update dashboard with real appointment count
- [ ] Test with 3 pilot clinics

---

## Critical Success Factors

1. **Speed to Market:** Get Phase 1 done quickly
2. **Focus on Unified Inbox:** THE killer feature
3. **Nail the Pilot:** 3 happy pilots sell the next 20
4. **Don't Build GHL:** Simplified layer, not replacement
5. **Measure Everything:** Track usage continuously

---

_This plan gets you from "technically functional platform" to "50 paying IV therapy clinics" by focusing ruthlessly on daily clinic operations._
