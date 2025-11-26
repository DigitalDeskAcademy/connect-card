# Platform Architecture & Vision

This document consolidates the business vision, multi-tenant architecture requirements, and roadmap planning.

## 🎯 Business Vision & Context

### Executive Summary

**Church Connect Card is a visitor engagement platform for churches, digitizing connect cards and automating member follow-up workflows.** Churches scan paper connect cards to extract visitor information, categorize engagement levels (first visit → member), and automate follow-up communications. The platform solves the critical problem of manual data entry and inconsistent visitor follow-up that prevents churches from effectively engaging new attendees.

**Current Status:** Phase 2 Complete (Connect Card MVP). Multi-tenant architecture production-ready. Database schema updated for church operations (ChurchMember, ConnectCard, MemberType enum). LMS features available for church staff training. Moving to Phase 3 (Production Launch).

**Product Strategy:** Direct feature usage - Churches scan cards, system extracts data, staff manages follow-up through simple workflows.

**Target Market:** Churches (100-5000 members) wanting to eliminate manual connect card data entry and improve first-time visitor retention.

### The Problem We Solve

The platform addresses real operational pain experienced by churches:

- Manual data entry from paper connect cards taking hours each week
- Inconsistent visitor follow-up due to lost or misplaced cards
- No centralized system for tracking first-time visitors vs. returning guests
- Volunteer scheduling conflicts and communication gaps
- Prayer requests scattered across paper cards, texts, and emails

**The Universal Challenge**: Churches want to warmly welcome visitors and follow up effectively, but manual processes lead to data entry backlogs, missed follow-ups, and lost opportunities to engage new members.

### The Solution: Automated Visitor Engagement Platform

**Core Value Proposition:**

- **Eliminate manual connect card data entry** - Scan cards, AI Vision extracts structured data automatically with contextual understanding
- **Automated follow-up workflows** - N2N (New to Newlife) visitor categorization and task assignments
- **Centralized member management** - Track engagement: First visit → Second visit → Regular → Member
- **Volunteer scheduling** - Coordinate serving teams and ministry assignments
- **Prayer request tracking** - Capture, assign to prayer teams, track follow-up

**Business Impact:**

- Churches eliminate 5-10 hours/week of manual data entry
- 80% improvement in first-time visitor follow-up consistency
- Better member engagement tracking from first visit through membership
- Volunteer coordination reduces scheduling conflicts
- Prayer ministry becomes organized and trackable

## 🏗️ Multi-Tenant B2B SaaS Architecture

### Multi-Tenant Architecture (IMPLEMENTED)

**Current State**: Full multi-tenant B2B SaaS platform with organization-based data isolation.

**Business Model**:

- **Church Connect Card** sells visitor engagement platform to churches directly
- **Churches** get isolated environments to manage their own members and visitors
- **Multi-location support** - Large churches can manage multiple campuses in one system
- Each church has separate data isolation, GHL communications integration, and volunteer teams

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
  id, email, name, role (platform_admin | church_owner | church_admin | user),
  organizationId, emailVerified, stripeCustomerId
}

Member {
  userId, organizationId, role,
  createdAt, updatedAt
}

// Church Member Management (Primary Use Case)
ChurchMember {
  id, organizationId,
  firstName, lastName, email, phone,
  memberType (VISITOR | RETURNING | MEMBER | VOLUNTEER | STAFF),
  firstVisitDate, lastAttendance,
  tags, notes, customFields
}

ConnectCard {
  id, churchMemberId, organizationId,
  scanDate, prayerRequest,
  followUpStatus, assignedTo,
  imageUrl, extractedData (JSON)
}

// Volunteer Management
VolunteerAssignment {
  id, churchMemberId, organizationId,
  team, role, schedule,
  status, startDate
}

// Prayer Request Tracking
PrayerRequest {
  id, churchMemberId, organizationId,
  request, isPrivate, status,
  assignedTo, followUpDate
}

// GHL Integration (Communications Only)
GHLLocation {
  id, ghlLocationId, organizationId,
  name, apiKey (encrypted), webhookId
  // Used for SMS/email automations
}

// Training Platform (Church Staff Training)
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

**AI Vision Integration (Primary) - Claude Vision API**:

- Connect card image processing with contextual understanding
- Structured data extraction (names, emails, phones, prayer requests)
- Handwriting recognition for free-form fields with context awareness
- AI-powered validation and intelligent field mapping
- Batch processing for multiple cards

**GoHighLevel Integration (Communications)**:

- OAuth 2.0 authentication per church
- SMS and email automation workflows
- Visitor follow-up sequences
- Contact sync for member database
- Rate limiting and error handling

**Future Integrations (Planned)**:

- Planning Center Online (worship planning, check-ins)
- Church Community Builder (member management)
- Subsplash (giving and mobile app)
- Breeze ChMS (church management system)

**AI Capabilities (Phase 2 - Planned)**:

- Vercel AI SDK integration
- Smart follow-up recommendations
- Prayer request categorization
- Visitor engagement predictions
- Natural language queries for member data

### Data Migration Strategy

1. Create default organization for existing data
2. Update all existing users/courses to reference default org
3. Test data isolation with multiple organizations
4. Deploy with feature flags for gradual rollout

## 📈 Product Roadmap

### Phase 1: Core Platform Migration (IN PROGRESS)

**Migration Tasks**

- [x] Database schema updated (ChurchMember, ConnectCard models)
- [x] Folder structure renamed (/church/ routes)
- [x] Navigation reorganized (N2N, Volunteer, Prayer)
- [x] Complete URL migration (~90 references) ✅
- [x] Update all mock data for church context ✅
- [x] Replace IV therapy branding with church branding ✅

**Foundation Features**

- [x] Multi-tenant architecture ✅
- [x] Role-based access control ✅
- [x] Mobile-responsive design ✅
- [x] Connect card pages with full upload/extraction UI ✅
- [ ] Member management UI (Phase 4)
- [ ] Volunteer scheduling UI (Phase 6)

### Phase 2: Connect Card Scanning ✅ COMPLETE (Oct 26, 2025)

**AI Vision Integration**

- [x] Connect card image upload (multi-file drag-and-drop) ✅
- [x] Claude Vision API integration for contextual data extraction ✅
- [x] Structured data extraction and AI-powered validation
- [ ] Manual correction interface
- [ ] Batch processing workflow

**Member Management**

- [ ] ChurchMember CRUD operations
- [ ] N2N workflow (First visit → Second visit → Regular → Member)
- [ ] Follow-up task assignment
- [ ] Member engagement tracking
- [ ] Tags and custom fields

### Phase 3: Volunteer & Prayer Management

**Volunteer Features**

- [ ] Volunteer roster management
- [ ] Team and ministry assignments
- [ ] Serving schedule calendar
- [ ] Availability tracking
- [ ] Check-in system

**Prayer Request Features**

- [ ] Prayer request capture from connect cards
- [ ] Privacy controls (public/private requests)
- [ ] Prayer team assignments
- [ ] Follow-up tracking
- [ ] Answered prayer reporting

### Phase 4: Automation & Intelligence

**GHL Communications**

- [ ] SMS follow-up sequences
- [ ] Email automation workflows
- [ ] Contact sync with member database

**AI Capabilities**

- [ ] Smart follow-up recommendations
- [ ] Visitor engagement predictions
- [ ] Prayer request categorization
- [ ] Natural language member queries

### Phase 5: Training Platform

**Church Staff Training**

- [ ] Onboarding courses for new staff
- [ ] Volunteer training modules
- [ ] Ministry leadership development
- [ ] Platform usage tutorials

## 🔄 Success Metrics

### Technical Metrics

- [x] Multi-tenant data isolation verified
- [x] AI Vision extraction accuracy > 95% for handwritten connect cards
- [x] < 5 seconds average connect card processing time (Claude Vision API)
- [ ] 99.9% uptime for production platform
- [ ] < 2s page load times across all features
- [ ] Zero cross-tenant data leakage incidents
- [x] AI Vision response time < 5s for extraction

### Business Metrics (Digital Desk Pilot)

- [ ] Agency support time: 10+ hours → 2 hours per client/month
- [ ] Client satisfaction score: > 4.5/5
- [ ] Proactive issue detection: 80% of problems caught before client calls
- [ ] Appointment no-show reduction: -30%
- [ ] Inventory stockouts: -90%

### Platform Metrics (Post-Launch)

- [ ] 10 churches using platform (6 months)
- [ ] $10k MRR within 6 months
- [ ] 95% customer retention rate
- [ ] 50,000+ connect cards processed via platform
- [ ] 90% time savings on connect card data entry

## 🚀 Go-to-Market Strategy

### Target Customer Profile

**Primary**: Churches with:

- 100-5000 members (sweet spot for growth and engagement needs)
- Manual connect card data entry taking 5-10 hours per week
- Poor visitor follow-up consistency (typically 30% follow-up rate)
- Limited staff/volunteer time for administrative tasks
- Desire to improve first-time visitor retention
- Multi-campus operations needing centralized management

**Secondary**: Faith-based organizations:

- Para-church ministries (youth organizations, campus ministries)
- Christian schools and universities
- Faith-based nonprofits
- Mega-churches (5000+ members)

### Value Proposition

- **90% Time Savings**: Eliminate manual connect card data entry (5 min/card → 30 sec/card)
- **95% Follow-up Rate**: Automated workflows ensure no visitor falls through cracks
- **Better Engagement**: Track visitor journey from first visit → member
- **Volunteer Coordination**: Simplified scheduling and communication
- **Prayer Ministry**: Organized request tracking and follow-up

### Competitive Advantages

1. **Church-Specific Design**: Built for churches, not repurposed CRM
2. **AI Vision OCR**: Industry-leading handwriting recognition (60-85% accuracy)
3. **Mobile-First**: Church staff scan cards on phones, not computers
4. **Multi-Tenant SaaS**: Battle-tested architecture from fork
5. **GHL Integration**: Automated SMS/email campaigns for visitor follow-up

## 🎯 Initial Market Focus: Multi-Campus Churches

### Why Multi-Campus Churches First?

**Perfect Product-Market Fit:**

- Target church has 6 locations (built-in pilot for multi-campus features)
- Multi-campus churches have 3-5x the data entry burden
- Higher tech adoption rate (already using digital tools)
- Centralized staff need visibility across all campuses
- Willing to pay for tools that improve efficiency
- Strong referral network among church leadership

**Market Characteristics:**

- 5,000+ multi-campus churches in US (growing rapidly)
- Average church spends $200-500/month on engagement software
- Most use paper cards + spreadsheets (huge upgrade opportunity)
- Church networks provide referral channels
- Clear ROI from staff time savings and visitor retention

**Expansion Path:**

1. Multi-campus churches (Q4 2025)
2. Large single-campus churches 1000+ members (Q1 2026)
3. Medium churches 500-1000 members (Q2 2026)
4. Small churches 100-500 members (Q3 2026)

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
