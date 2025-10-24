# Platform Architecture & Vision

This document consolidates the business vision, multi-tenant architecture requirements, and roadmap planning.

## 🎯 Business Vision & Context

### Executive Summary

**Sidecar is a simplified UI wrapper over GoHighLevel for IV therapy clinics, providing easy-to-use features without complex GHL training.** Clinics use SideCar features directly instead of learning GoHighLevel's complex interface. We solve the critical problem facing GHL agencies: overwhelming client support demands that prevent agencies from scaling beyond a handful of clients.

**Current Status:** Building GHL wrapper MVP with placeholder pages for testing API integration. Multi-tenant architecture complete. LMS features repositioned as secondary (future agency onboarding tool).

**Product Strategy:** Direct feature usage (not training-based) - Clinics interact with simple, focused interfaces that hide GHL complexity.

**Target Market:** IV therapy clinics served by GoHighLevel agencies (starting with Digital Desk's 15+ clients).

### The Problem We Solve

The platform emerged from real business pain at **Digital Desk** (IV therapy clinic management agency):

- Clients needed constant support for GHL features causing 10+ hours per client monthly
- Manual appointment management and calendar troubleshooting
- Inventory tracking for medical supplies done in spreadsheets
- Support costs preventing agency growth beyond 15 clients
- No unified view of client operations across GHL, calendars, and inventory

**The Universal Challenge**: GHL agencies can't scale because client support demands grow linearly with each new client. Agencies need intelligent automation to deliver exceptional service while reducing manual effort by 80%.

### The Solution: AI-Powered Operations Hub

**Core Value Proposition:**

- **Reduce support time from 10+ hours to 2 hours per client per month**
- Real-time GHL data integration for proactive issue detection
- Calendar and appointment management automation
- Inventory tracking for medical supplies
- AI-powered insights and recommendations (coming Phase 2)

**Business Impact:**

- Agencies can scale from 10 clients to 50+ clients with same team
- Higher profit margins through reduced support overhead
- Better client retention through proactive service
- Revenue growth without proportional cost increases

## 🏗️ Multi-Tenant B2B SaaS Architecture

### Multi-Tenant Architecture (IMPLEMENTED)

**Current State**: Full multi-tenant B2B SaaS platform with organization-based data isolation.

**Business Model**:

- **Sidecar** sells CRM dashboard access to GHL agencies (Platform Customers)
- **Agencies** get isolated environments to manage multiple end clients
- **End Clients** (medical practices) get managed through the agency dashboard
- Each agency has separate GHL API credentials, calendar integrations, and client data

### Technical Architecture (Implemented)

#### Current Database Schema

```typescript
// Core multi-tenant models
Organization {
  id, name, slug, type, domain, website,
  subscriptionStatus, trialEndsAt,
  stripeCustomerId, stripeSubscriptionId
}

User {
  id, email, name, role (platform_admin | agency_owner | agency_admin | user),
  organizationId, emailVerified, stripeCustomerId
}

Member {
  userId, organizationId, role,
  createdAt, updatedAt
}

// GHL Integration (Primary Use Case)
GHLContact {
  id, ghlContactId, organizationId,
  firstName, lastName, email, phone,
  tags, customFields, locationId,
  lastSyncedAt
}

GHLLocation {
  id, ghlLocationId, organizationId,
  name, address, phone, timezone,
  apiKey (encrypted), webhookId
}

// Calendar Integration (Core Feature)
CalendarEvent {
  id, organizationId, contactId,
  calendarProvider (cal.com | calendly | ghl),
  eventType, startTime, endTime,
  status, metadata, syncedAt
}

// Inventory Management (Medical Practices)
InventoryItem {
  id, organizationId, locationId,
  name, sku, category, quantity,
  reorderPoint, cost, supplier
}

InventoryTransaction {
  id, itemId, organizationId,
  type (usage | purchase | adjustment),
  quantity, date, userId, notes
}

// Training Platform (Secondary - Future Academy)
Course {
  id, title, organizationId, userId,
  stripePriceId (optional), isFree,
  status, level, category
}

Invitation {
  id, email, organizationId, role,
  token, status, expiresAt
}
```

#### Authentication System

- **Better Auth** with Email OTP and GitHub OAuth
- **Role-based access control** (UserRole enum)
- **Organization plugin** for multi-tenancy
- **Smart redirects** based on user role and organization

#### Security Requirements

- **Row-Level Security**: All queries filtered by organizationId
- **Route Protection**: API middleware enforces tenant boundaries
- **API Key Isolation**: GHL credentials encrypted per organization
- **File Isolation**: S3 structure: `orgs/{orgId}/files/`
- **Stripe Isolation**: Separate customers per organization

#### Integration Architecture

**GoHighLevel Integration (Primary)**:

- OAuth 2.0 authentication per agency
- Webhook handlers for real-time contact updates
- API polling for locations and opportunities
- Rate limiting and error handling
- Data sync every 15 minutes + webhook updates

**Calendar Integration (Core Feature)**:

- Cal.com API for appointment management
- Event sync with GHL contacts
- Availability management
- Automated reminders and follow-ups
- Multi-location support

**AI Capabilities (Phase 2 - Planned)**:

- Vercel AI SDK integration
- GPT-4 for intelligent insights
- Predictive analytics for client needs
- Automated support ticket triage
- Natural language queries for data

### Data Migration Strategy

1. Create default organization for existing data
2. Update all existing users/courses to reference default org
3. Test data isolation with multiple organizations
4. Deploy with feature flags for gradual rollout

## 📈 Product Roadmap

### Phase 1: CRM Operations Dashboard (COMPLETE)

**Core Features**

- [x] GHL contact management with real-time sync
- [x] Calendar integration (Cal.com)
- [x] Multi-tenant architecture
- [x] Operations dashboard with key metrics
- [x] Contact filtering and search
- [x] Mobile-responsive design
- [x] Role-based access control

### Phase 2: AI-Powered Intelligence (NEXT - Q2 2025)

**AI Capabilities with Vercel AI SDK**

- [ ] Natural language queries for contact data
- [ ] Predictive client support needs
- [ ] Automated appointment scheduling recommendations
- [ ] Intelligent inventory reorder predictions
- [ ] Support ticket auto-categorization
- [ ] Client health scoring and alerts

**Enhanced Operations**

- [ ] Inventory management for medical supplies
- [ ] Advanced reporting and analytics
- [ ] Custom workflows and automations
- [ ] Multi-location dashboard views

### Phase 3: Agency Growth Tools (Q3 2025)

**Scale Features**

- [ ] White-label options for agencies
- [ ] Client portal for end users
- [ ] Advanced team collaboration
- [ ] Custom integrations marketplace
- [ ] API access for third-party tools

### Phase 4: Training Academy (Q4 2025)

**Optional Training Platform**

- [ ] Agency onboarding courses
- [ ] GHL training for end clients
- [ ] Best practices library
- [ ] Certification programs
- [ ] Community knowledge base

## 🔄 Success Metrics

### Technical Metrics

- [x] Multi-tenant data isolation verified
- [x] Real-time GHL sync operational
- [ ] 99.9% uptime for production platform
- [ ] < 2s page load times across all features
- [ ] Zero cross-tenant data leakage incidents
- [ ] AI response time < 3s for queries

### Business Metrics (Digital Desk Pilot)

- [ ] Agency support time: 10+ hours → 2 hours per client/month
- [ ] Client satisfaction score: > 4.5/5
- [ ] Proactive issue detection: 80% of problems caught before client calls
- [ ] Appointment no-show reduction: -30%
- [ ] Inventory stockouts: -90%

### Platform Metrics (Post-Launch)

- [ ] 10 GHL agencies using platform (6 months)
- [ ] $10k MRR within 6 months
- [ ] 95% customer retention rate
- [ ] 50 medical practices managed via platform
- [ ] 80% reduction in agency support costs

## 🚀 Go-to-Market Strategy

### Target Customer Profile

**Primary**: GoHighLevel agencies with:

- 5-20 clients currently (growth constrained by support overhead)
- Serving medical practices (IV therapy, aesthetics, med spas)
- High-touch service model (10+ hours support per client)
- Strong GHL technical knowledge
- Desire to scale to 50+ clients

**Secondary**: Other GHL agencies:

- Home services (plumbing, HVAC, roofing)
- Professional services (lawyers, accountants)
- Local retail and e-commerce
- Fitness and wellness centers

### Value Proposition

- **Scale Without Hiring**: Manage 3x more clients with same team size
- **Reduce Support Costs**: 80% reduction in manual support work
- **Proactive Service**: AI detects issues before clients complain
- **Higher Margins**: Better profit per client with automation
- **Better Retention**: Clients love proactive, responsive support

### Competitive Advantages

1. **Built by GHL Agency for Agencies**: Deep domain expertise
2. **AI-First Design**: Not bolted on, designed for intelligent automation
3. **Medical Practice Focus**: Purpose-built for IV therapy and aesthetics
4. **Cal.com Integration**: Best-in-class calendar management
5. **Real-Time Sync**: Always current data, no manual updates

## 🎯 Initial Market Focus: IV Therapy Clinics

### Why IV Therapy Clinics First?

**Perfect Product-Market Fit:**

- Digital Desk has 15+ IV therapy clients (built-in pilot group)
- Medical practices have complex operational needs
- High appointment volume requires calendar automation
- Inventory management is critical (IV supplies)
- Regulatory compliance needs careful data handling
- High willingness to pay for quality tools

**Market Characteristics:**

- 3,000+ IV therapy clinics in US (rapidly growing market)
- Average clinic spends $500-1,000/month on software
- Most use GHL + spreadsheets (huge upgrade opportunity)
- Strong agency referral network
- Clear ROI from reduced no-shows and better inventory management

**Expansion Path:**

1. IV therapy clinics (Q2 2025)
2. Medical spas and aesthetics (Q3 2025)
3. All medical practices (Q4 2025)
4. General GHL agencies (2026)

---

## 📚 Technical Architecture Details

### File Structure

```
/app
├── agency/[slug]/
│   ├── admin/              # Agency operations dashboard (PRIMARY)
│   │   ├── contacts/       # GHL contact management
│   │   ├── calendar/       # Calendar integration
│   │   ├── inventory/      # Medical supply tracking (coming)
│   │   └── insights/       # AI-powered analytics (coming)
│   ├── courses/            # Training platform (SECONDARY)
│   └── settings/
├── platform/               # Sidecar admin tools
└── (marketing)/            # Public pages

/actions
├── ghl/                    # GHL API integration
├── calendar/               # Cal.com integration
├── inventory/              # Inventory management (coming)
└── ai/                     # AI capabilities (coming)

/lib
├── ghl-client.ts           # GHL API wrapper
├── calendar-client.ts      # Cal.com integration
└── ai-client.ts            # Vercel AI SDK (coming)
```

### Server Actions Pattern

- **Direct imports** from `/actions/*` (no wrapper components)
- Rate limiting on all server actions
- Organization context validation
- Error handling with user-friendly messages
- Audit logging for compliance

### Component Architecture

- **Shared components** in `/components/shared/`
- **Feature-specific** in feature directories
- **No component duplication** (learned from earlier mistakes)
- Shadcn/ui for consistent design system
- Tailwind for styling

---

## 🔐 Security & Compliance

### Medical Practice Requirements

- **HIPAA Considerations**: Patient data isolation and encryption
- **Audit Logging**: All data access and modifications tracked
- **Secure API Keys**: GHL credentials encrypted at rest
- **Role-Based Access**: Strict permissions for medical data
- **Data Retention**: Configurable policies per organization

### Platform Security

- Better Auth with OTP (no passwords to leak)
- Rate limiting on all endpoints
- SQL injection prevention via Prisma
- XSS protection via React
- CSRF tokens on forms
- Security headers configured

---

_Last updated: 2025-10-16 (Post-CRM Pivot)_
