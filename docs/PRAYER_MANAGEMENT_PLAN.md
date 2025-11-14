# Prayer Management Feature - Implementation Plan

**Feature Branch:** `feature/prayer-management`
**Status:** Planning
**Last Updated:** 2025-11-12

---

## 🎯 Feature Overview

### Business Problem

Churches collect prayer requests via connect cards but have no organized system to:

- Track prayer requests from submission to completion
- Assign requests to prayer team members
- Follow up on answered prayers
- Maintain privacy for sensitive requests
- Export prayer lists for weekly team meetings

### Solution

Build a prayer request management system that:

- Extracts prayer requests from connect cards (AI extraction already working)
- Provides organized tracking and assignment workflows
- Maintains privacy controls (public/private)
- Supports multi-campus prayer team coordination
- Enables follow-up tracking and answered prayer reporting

### Success Criteria

- ✅ All prayer requests from connect cards are tracked in database
- ✅ Prayer team members can view and filter requests
- ✅ Privacy controls prevent public display of sensitive requests
- ✅ Multi-campus churches can manage location-specific prayer ministries
- ✅ Weekly prayer list export for team meetings

---

## 📊 Current State Analysis

### What Exists

- ✅ Connect card AI extraction captures `prayerRequest` field (Claude Vision API)
- ✅ Navigation item configured (`/church/[slug]/admin/prayer`)
- ✅ Placeholder page exists (`app/church/[slug]/admin/prayer/page.tsx`)
- ✅ Multi-tenant architecture with location-based filtering
- ✅ Server action patterns with rate limiting
- ✅ Shadcn UI components (DataTable, Empty, Pagination, etc.)

### What's Missing

- ❌ PrayerRequest database model
- ❌ Data extraction pipeline (ConnectCard → PrayerRequest)
- ❌ Prayer request list UI with filtering
- ❌ Privacy controls and status management
- ❌ Prayer team assignment workflow
- ❌ Follow-up tracking and answered prayers
- ❌ Export functionality for prayer teams

---

## 🗄️ Database Schema Design

### PrayerRequest Model

```prisma
model PrayerRequest {
  id             String   @id @default(uuid())
  organizationId String
  locationId     String?

  // Request details
  request        String   @db.Text
  category       String?  // "Health", "Family", "Salvation", "Other"
  isPrivate      Boolean  @default(false)
  isUrgent       Boolean  @default(false)

  // Source tracking
  connectCardId  String?  // Link to originating connect card
  submittedBy    String?  // Name of person submitting (if not from connect card)
  submitterEmail String?
  submitterPhone String?

  // Assignment and tracking
  status         PrayerRequestStatus @default(PENDING)
  assignedToId   String?
  assignedToName String?
  followUpDate   DateTime?
  answeredDate   DateTime?
  answeredNotes  String?  @db.Text

  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  location       Location?    @relation(fields: [locationId], references: [id], onDelete: SetNull)
  connectCard    ConnectCard? @relation(fields: [connectCardId], references: [id], onDelete: SetNull)
  assignedTo     User?        @relation("AssignedPrayerRequests", fields: [assignedToId], references: [id], onDelete: SetNull)

  @@index([organizationId, createdAt])
  @@index([organizationId, locationId])
  @@index([organizationId, status])
  @@index([assignedToId])
  @@map("prayer_request")
}

enum PrayerRequestStatus {
  PENDING     // Newly submitted, needs review
  ASSIGNED    // Assigned to prayer team member
  PRAYING     // Actively praying for this request
  ANSWERED    // Prayer answered, marked complete
  ARCHIVED    // Archived (no longer active)
}
```

### Schema Updates Required

```prisma
// Add to ConnectCard model
model ConnectCard {
  // ... existing fields
  prayerRequests PrayerRequest[]
}

// Add to User model
model User {
  // ... existing fields
  assignedPrayerRequests PrayerRequest[] @relation("AssignedPrayerRequests")
}

// Add to Organization model
model Organization {
  // ... existing fields
  prayerRequests PrayerRequest[]
}

// Add to Location model
model Location {
  // ... existing fields
  prayerRequests PrayerRequest[]
}
```

---

## 🏗️ Implementation Phases

### Phase 1: Database Foundation

**Goal:** Create prayer request database model and migration pipeline

#### Tasks

1. **Update Prisma Schema**

   - Add `PrayerRequest` model with all fields
   - Add `PrayerRequestStatus` enum
   - Add relations to ConnectCard, User, Organization, Location
   - Add indexes for query performance

2. **Generate Prisma Client**

   - Run `pnpm prisma generate`
   - Run `pnpm prisma db push` (development)

3. **Create Data Migration Utilities**

   - `/lib/data/prayer-requests.ts` - Scoped query helpers
   - `/lib/types/prayer-request.ts` - TypeScript types
   - Functions:
     - `getPrayerRequestsForScope(dataScope)` - Multi-tenant query
     - `createPrayerRequestFromConnectCard(connectCard)` - Extract from card
     - `updatePrayerRequestStatus(id, status)` - Status management

4. **Seed Data for Testing**
   - Create `prisma/seed-prayer-requests.ts`
   - Generate 20-30 test prayer requests across multiple locations
   - Mix of public/private, different statuses, categories

**Deliverables:**

- ✅ Database schema updated and pushed
- ✅ TypeScript types generated
- ✅ Scoped query helpers created
- ✅ Test data seeded

**Patterns to Follow:**

- Multi-tenant data isolation (filter by organizationId)
- Location-based filtering (use getLocationFilter)
- Reference: `/lib/data/location-filter.ts`

---

### Phase 2: Data Extraction Pipeline

**Goal:** Automatically create PrayerRequest records from connect cards

#### Tasks

1. **Update Connect Card Review Action**

   - Modify `/actions/connect-cards/review-card.ts`
   - Extract prayer request data from `extractedData.prayerRequest`
   - Create PrayerRequest record when card is reviewed
   - Link via `connectCardId` foreign key

2. **Backfill Existing Connect Cards**

   - Create `/scripts/backfill-prayer-requests.ts`
   - Query all connect cards with `extractedData.prayerRequest` populated
   - Create PrayerRequest records for historical data
   - Run once: `tsx scripts/backfill-prayer-requests.ts`

3. **Privacy Detection Logic**

   - Analyze prayer request text for sensitive keywords
   - Auto-mark as private if contains: "confidential", "private", "don't share"
   - Allow manual override in UI

4. **Category Detection (Optional)**
   - Use keyword matching or AI categorization
   - Categories: "Health", "Family", "Salvation", "Financial", "Other"
   - Store in `category` field for filtering

**Deliverables:**

- ✅ Connect card review creates PrayerRequest records
- ✅ Historical data backfilled
- ✅ Privacy detection working
- ✅ Category assignment (if implemented)

**Patterns to Follow:**

- Server actions with rate limiting
- Transaction handling (card + prayer request together)
- Reference: `/actions/connect-cards/review-card.ts`

---

### Phase 3: Prayer Request List UI

**Goal:** Build prayer request management interface with filtering

#### Tasks

1. **Create Data Table Components**

   - `/components/dashboard/prayer-requests/columns.tsx`
   - `/components/dashboard/prayer-requests/data-table.tsx`
   - `/components/dashboard/prayer-requests/prayer-requests-table.tsx`
   - Follow TanStack Table pattern (Reference: `/components/dashboard/payments/`)

2. **Column Definitions**

   - Request preview (truncated to 80 chars)
   - Category badge
   - Status badge (color-coded)
   - Location (for multi-campus)
   - Assigned to
   - Created date (relative: "2 days ago")
   - Actions (View, Edit, Mark Answered)

3. **Filtering Features**

   - Search by request text
   - Filter by status (Pending/Assigned/Praying/Answered)
   - Filter by location (multi-campus support)
   - Filter by privacy (Show Private toggle, default OFF)
   - Filter by category dropdown
   - Date range filter

4. **Empty States**

   - Use shadcn `Empty` component
   - "No prayer requests found" state
   - "No prayer requests match filters" state
   - "Get started" CTA for first prayer request

5. **Pagination**

   - Use shadcn `Pagination` component
   - 10 requests per page
   - Show total count: "Showing 1-10 of 47 requests"

6. **Update Prayer Page**
   - Replace placeholder with `<PrayerRequestsTable />`
   - Use `PageContainer variant="padded"` for data table
   - Add page actions: "New Request", "Export List", "Settings"

**Deliverables:**

- ✅ Prayer request list displays all requests
- ✅ Filtering and search working
- ✅ Multi-campus location filtering
- ✅ Privacy toggle hides private requests
- ✅ Pagination working
- ✅ Empty states for no data

**Patterns to Follow:**

- TanStack Table pattern
- Shadcn components (Empty, Pagination, InputGroup)
- PageContainer with variant="padded"
- Reference: `/components/dashboard/payments/`

---

### Phase 4: Prayer Request Detail View

**Goal:** Individual prayer request viewing and editing

#### Tasks

1. **Create Detail Sheet/Dialog**

   - Use shadcn `Sheet` component (side panel)
   - Triggered from table row click or Actions menu
   - Full request text (no truncation)
   - All metadata displayed

2. **Detail View Sections**

   - **Request Details:** Full text, category, urgency badge
   - **Source Information:** Connect card link (if applicable), submitter name
   - **Privacy Status:** Public/Private toggle with explanation
   - **Assignment:** Assigned to dropdown (select prayer team member)
   - **Follow-up:** Follow-up date picker, notes textarea
   - **Status Management:** Status dropdown with transitions
   - **Answered Prayer:** Answered date, testimony/notes textarea
   - **Timestamps:** Created, last updated (relative dates)

3. **Actions Available**

   - Assign to me (quick action)
   - Change status
   - Mark as answered (opens answered form)
   - Edit request text
   - Delete (with confirmation)
   - View connect card (if linked)

4. **Status Transitions**
   - PENDING → ASSIGNED (when assigned to someone)
   - ASSIGNED → PRAYING (when prayer team starts praying)
   - PRAYING → ANSWERED (when prayer answered)
   - Any status → ARCHIVED (manual archive)

**Deliverables:**

- ✅ Detail sheet shows full prayer request
- ✅ Edit capabilities working
- ✅ Status transitions validated
- ✅ Assignment workflow functional
- ✅ Answered prayer capture

**Patterns to Follow:**

- Shadcn Sheet component
- Server actions for mutations
- Optimistic updates for better UX
- Reference: `/components/dashboard/connect-cards/` for similar patterns

---

### Phase 5: Server Actions & Mutations

**Goal:** Secure server actions for all prayer request operations

#### Tasks

1. **Create Server Actions**

   - `/actions/prayer-requests/create-prayer-request.ts`
   - `/actions/prayer-requests/update-prayer-request.ts`
   - `/actions/prayer-requests/delete-prayer-request.ts`
   - `/actions/prayer-requests/assign-prayer-request.ts`
   - `/actions/prayer-requests/mark-answered.ts`
   - `/actions/prayer-requests/toggle-privacy.ts`

2. **Validation Schemas**

   - `/lib/zodSchemas.ts` - Add prayer request schemas
   - `createPrayerRequestSchema` - Request text (required, max 2000 chars)
   - `updatePrayerRequestSchema` - Partial updates
   - `assignPrayerRequestSchema` - User ID validation
   - Generic error messages (don't expose validation details)

3. **Security Requirements**

   - Rate limiting via Arcjet (5 requests/minute)
   - Multi-tenant isolation (filter by organizationId)
   - Location-based access control (use getLocationFilter)
   - Privacy enforcement (staff can't see others' private requests)
   - Audit logging for sensitive operations

4. **Error Handling**
   - Generic error messages to users
   - No console.error in production
   - Return `ApiResponse` type consistently
   - Handle concurrent updates (optimistic locking)

**Deliverables:**

- ✅ All CRUD operations have server actions
- ✅ Rate limiting implemented
- ✅ Multi-tenant security validated
- ✅ Privacy controls enforced
- ✅ Zod validation complete

**Patterns to Follow:**

- Server actions template from coding-patterns.md
- Rate limiting with Arcjet
- `requireDashboardAccess()` for auth
- Reference: `/actions/connect-cards/` for similar patterns

---

### Phase 6: Prayer Team Features

**Goal:** Assignment workflow and team coordination

#### Tasks

1. **Prayer Team Member Selection**

   - Query users with role permissions
   - Filter by location (if multi-campus)
   - Dropdown in assignment UI
   - "Assign to me" quick action

2. **Assignment Notifications (Future)**

   - Email notification when assigned
   - Optional: SMS notification via GHL
   - Notification preferences per user

3. **My Assignments View**

   - Filter: "Assigned to me"
   - Quick access from dashboard
   - Count badge in navigation

4. **Prayer List Export**

   - "Export to PDF" button
   - Generate printable prayer list
   - Include: request text, category, created date
   - Exclude: private requests (unless user has permission)
   - Filter by location, date range

5. **Weekly Prayer Report**
   - Auto-generate every Sunday
   - Summary statistics
   - New requests this week
   - Answered prayers this week
   - Email to prayer team leader

**Deliverables:**

- ✅ Assignment workflow functional
- ✅ Prayer team member selection
- ✅ Export to PDF working
- ✅ Filtering by assignment

**Patterns to Follow:**

- Location-based filtering
- Role-based access control
- Reference: Team management patterns

---

### Phase 7: Privacy & Permissions

**Goal:** Implement privacy controls and access permissions

#### Tasks

1. **Privacy Rules**

   - Public requests: visible to all church staff
   - Private requests: only visible to:
     - Account Owner
     - Assigned prayer team member
     - Person who submitted (if they're a user)
   - Auto-detect sensitive language and suggest marking private

2. **Permission Levels**

   - Account Owner: See all, edit all, delete all
   - Admin: See all, edit all, no delete
   - Staff: See public, edit assigned, no delete
   - Privacy override: Account Owner can view all private requests

3. **Privacy Indicators**

   - Lock icon for private requests
   - Privacy badge in detail view
   - Warning when changing request to public
   - Audit log for privacy changes

4. **Sensitive Data Handling**
   - Never display private requests in analytics
   - Exclude from prayer wall (public display)
   - Redact from exports unless explicit permission

**Deliverables:**

- ✅ Privacy controls enforced
- ✅ Role-based access working
- ✅ Audit logging for privacy changes
- ✅ Private request indicators

**Patterns to Follow:**

- DataScope permissions
- Location filtering
- Reference: Multi-tenant patterns in coding-patterns.md

---

### Phase 8: Analytics & Insights

**Goal:** Prayer request analytics for church leadership

#### Tasks

1. **Dashboard Widgets**

   - Total active prayer requests
   - New requests this week
   - Answered prayers this month
   - Average response time (submitted → assigned)
   - Prayer team workload (requests per person)

2. **Trend Charts**

   - Prayer requests over time (line chart)
   - Requests by category (pie chart)
   - Response time trends
   - Answered prayer rate

3. **Location Breakdown**

   - Multi-campus comparison
   - Requests per location
   - Prayer team size per campus

4. **Category Analysis**
   - Most common prayer categories
   - Category-specific answered prayer rates

**Deliverables:**

- ✅ Dashboard widgets displaying metrics
- ✅ Trend charts functional
- ✅ Multi-campus analytics
- ✅ Category breakdown

**Patterns to Follow:**

- Recharts for data visualization
- Weekly aggregation patterns
- Reference: `/app/church/[slug]/admin/_components/ConnectCardChart.tsx`

---

### Phase 9: Testing & Quality Assurance

**Goal:** Comprehensive testing before production deployment

#### Tasks

1. **Manual Testing Checklist**

   - [ ] Create prayer request from connect card
   - [ ] View prayer request list with all filters
   - [ ] Assign prayer request to team member
   - [ ] Mark prayer as answered
   - [ ] Toggle privacy status
   - [ ] Export prayer list to PDF
   - [ ] Multi-campus filtering works correctly
   - [ ] Private requests hidden from staff
   - [ ] Empty states display correctly
   - [ ] Pagination works with 50+ requests

2. **Multi-Tenant Isolation Testing**

   - [ ] User A cannot see Church B's prayer requests
   - [ ] Location filtering isolates campus-specific requests
   - [ ] Platform admin can access all organizations

3. **Security Testing**

   - [ ] Rate limiting prevents abuse
   - [ ] SQL injection attempts blocked (Prisma protection)
   - [ ] XSS attempts sanitized (React protection)
   - [ ] Privacy controls cannot be bypassed

4. **Performance Testing**

   - [ ] Page loads in <2 seconds with 100+ requests
   - [ ] Filtering/search responds instantly
   - [ ] Database queries use proper indexes
   - [ ] No N+1 query problems

5. **Accessibility Testing**
   - [ ] Keyboard navigation works
   - [ ] Screen reader compatible
   - [ ] Color contrast meets WCAG AA
   - [ ] Focus management in dialogs/sheets

**Deliverables:**

- ✅ All manual tests passing
- ✅ Security validated
- ✅ Performance benchmarks met
- ✅ Accessibility compliance

---

### Phase 10: Documentation & Launch

**Goal:** Complete documentation and prepare for production

#### Tasks

1. **Update Documentation**

   - Update STATUS.md - Mark prayer management as COMPLETE
   - Update ROADMAP.md - Move to completed section
   - Update coding-patterns.md - Add prayer request patterns
   - Create user guide: "How to manage prayer requests"

2. **Admin Training Guide**

   - How to view prayer requests
   - How to assign requests to team members
   - How to mark prayers as answered
   - Privacy best practices
   - Export for weekly prayer meetings

3. **Migration Guide**

   - Run backfill script for existing connect cards
   - Verify data integrity
   - Train church staff on new features

4. **Launch Preparation**
   - Build passes: `pnpm build`
   - TypeScript: 0 errors
   - Lint: Clean
   - Database indexes verified
   - Rate limiting configured

**Deliverables:**

- ✅ Documentation complete
- ✅ Training guide created
- ✅ Production build passing
- ✅ Ready for pilot church testing

---

## 🔗 Key References

### Existing Patterns to Follow

- **Multi-tenant data isolation:** `/docs/essentials/coding-patterns.md#multi-tenant-data-scoping-pattern`
- **Location-based filtering:** `/lib/data/location-filter.ts`
- **Server actions template:** `/docs/essentials/coding-patterns.md#server-actions-pattern`
- **TanStack Table pattern:** `/components/dashboard/payments/`
- **Shadcn components:** `/docs/essentials/shadcn.md`

### Similar Features for Reference

- **Connect Cards:** `/app/church/[slug]/admin/connect-cards/`
- **Team Management:** `/app/church/[slug]/admin/team/`
- **Payments Table:** `/components/dashboard/payments/`

### Documentation

- **Project Overview:** `/docs/PROJECT_OVERVIEW.md`
- **Architecture:** `/docs/essentials/architecture.md`
- **Roadmap:** `/docs/ROADMAP.md`
- **Status:** `/docs/STATUS.md`

---

## 🚦 Decision Log

### Decisions Made

1. **Database Model:** PrayerRequest as separate model (not embedded in ConnectCard)

   - Rationale: Better query performance, cleaner separation of concerns

2. **Privacy Model:** Boolean field + role-based access control

   - Rationale: Simple implementation, meets security requirements

3. **Status Enum:** 5 states (PENDING/ASSIGNED/PRAYING/ANSWERED/ARCHIVED)

   - Rationale: Clear workflow progression, supports common prayer ministry patterns

4. **UI Pattern:** TanStack Table + shadcn components
   - Rationale: Consistent with existing payments/connect cards patterns

### Decisions Pending

- [ ] Category list: Fixed enum or free text?
- [ ] Assignment notifications: Email only or include SMS?
- [ ] Prayer wall: Separate feature or part of this implementation?
- [ ] Answered prayer testimonies: Rich text editor or plain textarea?

---

## 📊 Success Metrics

### Technical Metrics

- ✅ Build passes with 0 TypeScript errors
- ✅ All database queries use proper indexes
- ✅ Page load time <2 seconds
- ✅ 100% multi-tenant data isolation
- ✅ Privacy controls cannot be bypassed

### Feature Metrics

- ✅ All prayer requests from connect cards tracked
- ✅ Prayer team can assign and track requests
- ✅ Privacy controls working
- ✅ Export functionality operational
- ✅ Multi-campus filtering functional

### User Experience Metrics

- ✅ Church staff can find and manage prayer requests
- ✅ Privacy concerns addressed (sensitive requests protected)
- ✅ Weekly prayer list export saves 2+ hours manual work
- ✅ Answered prayer tracking increases team morale

---

## 🔄 Next Steps

1. **Review this plan** - Get user approval for scope and approach
2. **Start Phase 1** - Database schema design and implementation
3. **Incremental progress** - Complete one phase before moving to next
4. **Regular commits** - Commit after each completed task
5. **Testing throughout** - Test each phase before proceeding

---

**Last Updated:** 2025-11-12
**Status:** Awaiting approval to proceed
