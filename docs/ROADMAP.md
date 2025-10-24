# Project Roadmap

> 📋 **NEW: See `/docs/IV-THERAPY-PHASE-PLAN.md` for the detailed 14-week implementation plan**

**Current Focus**: IV Therapy Clinic Vertical SaaS - Simplified GHL Interface
**Primary Product**: Clean, focused operations dashboard for IV therapy clinics
**Core Vision**: Take the complexity of GoHighLevel and distill it to exactly what clinics need daily
**Target Market**: IV therapy clinics (pilot) → Medical practices (expansion)

## 🛠️ Technology Stack

### Core Infrastructure

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (OTP + OAuth)
- **File Storage**: Tigris S3
- **Payments**: Stripe

### AI & Intelligence (Phase 2)

- **AI Framework**: Vercel AI SDK
- **Models**: OpenAI GPT-4, Claude 3.5, local models
- **Vector DB**: Pinecone/Supabase (for semantic search)
- **Analytics**: Custom predictive models

### Integrations

- **Calendar**: Cal.com (embed → platform → self-hosted)
- **CRM**: GoHighLevel API (OAuth + Webhooks)
- **Communications**: Twilio/SendGrid for notifications
- **Monitoring**: Sentry, Vercel Analytics

---

## 🚀 PHASE 0: Critical Fixes ✅ COMPLETED

### Launch Blockers - ALL FIXED

- [x] **Fix Mobile Navigation** - Add hamburger menu ✅
- [x] **Fix Lesson Save Button** - UUID validation issue ✅
- [x] **Sub-Navigation Framework** - Universal page header system ✅
- [x] **Console.log Cleanup** - Production security ✅
- [x] **Record First Course Content** - Platform needs actual content ✅
- [x] **Add Security Headers** - Production security configuration ✅
- [x] **Fix Video Content Protection** - Prevent downloads ✅
- [x] **Fix CreateCourseForm Alignment** - Generate Slug button ✅
- [x] **Fix Double Header Issue** - Create Course pages ✅
- [x] **Consolidate CourseForm** - Eliminate CreateCourseForm/EditCourseForm duplication ✅
- [x] **Fix Video Replacement** - Clean up old videos when replaced ✅ (S3 cleanup working)
- [x] **S3 Cleanup Architecture** - Production-ready batch deletion utilities ✅
- [x] **Enhanced Delete Safety** - Type-to-confirm deletion with course details ✅

### Video Management ✅ COMPLETED

- [x] **Test Upload Workflow** - S3 integration working ✅
- [x] **Fix CORS for Preview Deployments** - Vercel preview uploads now working ✅
- [x] **Test Video Replacement** - Old files are cleaned up ✅ TESTED & VERIFIED!
- [ ] **Add Client Validation** - Size/format checks before upload (non-critical)
- [ ] **Implement Storage Tracking** - Monitor usage per organization (future)
- [ ] **Create Cleanup Job** - Scheduled cleanup for orphaned files (future)

### Documentation Cleanup

- [x] Review and consolidate documentation ✅
- [x] Archive outdated review documents ✅
- [x] Move course planning to archive ✅
- [x] Update STATUS.md with Phase 0 completion ✅
- [x] Update ROADMAP.md with Phase 1 tasks ✅
- [ ] Archive GHL_PRODUCTION_SCOPES.md (no longer needed)

---

## 🚀 PHASE 1: Church Connect Card Fork Migration (Current)

> **🎯 PROJECT PIVOT: Forked to Church Connect Card platform**
> This is a complete rebrand from IV therapy clinic SaaS to church visitor engagement platform.
> Focus: Connect card scanning, visitor follow-up, volunteer management, prayer requests.

### Church Platform Migration (Current Priority)

**Phase 1: Core Infrastructure** ✅ COMPLETED (This PR)

- [x] Database schema migration (Contact → ChurchMember, added ConnectCard model)
- [x] Rename /app/agency/ → /app/church/ folder structure (58 files)
- [x] Update navigation (Dashboard, N2N, Volunteer, Prayer)
- [x] Create placeholder pages for church features
- [x] Update core utilities (tenant-utils, use-navigation, auth)

**Phase 2: URL Migration** (Next PR) - 90+ references across 30+ files

- [ ] Auth flows: login, callback, church-specific login, organization setup
- [ ] Church navbar: AgencyNavbar.tsx (17 references)
- [ ] Learning portal: All learning pages and sidebar (13+ references)
- [ ] Admin courses: CRUD operations, preview routes, revalidatePath calls
- [ ] Shared components: SharedCourseCard, SharedLessonItem, CourseListingPage
- [ ] Other pages: subscription-expired, church homepage
- [ ] Dev scripts: Update seed/test utilities (optional)

**Phase 3: Branding & UI** (Future)

- [ ] Replace IV therapy mock data with church examples
- [ ] Update landing page for church audience
- [ ] Rebrand from SideCar to Church Connect Card
- [ ] Update documentation and help content

### Role Framework Consolidation (Deferred)

**Problem:** Building same features 3 times instead of once with role-based scoping

**Solution:** Unified component architecture with DataScope

- [x] Research industry best practices (validated ✅ - matches 2025 multi-tenant SaaS standards)
- [x] Consult expert agents (fullstack, nextjs, typescript-pro - unanimous recommendations)
- [x] Create feature branch: `feat/role-framework-consolidation`
- [ ] Update DataScope type to discriminated union with type guards
- [ ] Create `/components/dashboard/` shared folder structure
- [ ] Move Payments component to shared location (proof of concept)
- [ ] Consolidate Contacts component with DataScope pattern
- [ ] Rename calendar → appointments and consolidate component
- [ ] Create scoped data access helpers in `/lib/data/`
- [ ] Write integration tests for data isolation
- [ ] Manual testing with all 3 roles (platform, agency, clinic)
- [ ] Update documentation with patterns (ADR-007)

**Architecture:**

- Discriminated union DataScope (`platform | agency | clinic`)
- Shared components in `/components/dashboard/`
- Separate routes maintained (`/platform/admin/*` and `/agency/[slug]/admin/*`)
- Scoped data helpers enforce `organizationId` filtering

**Impact:**

- 60% code reduction (2 duplicate components → 1 shared)
- Type-safe with compile-time guarantees
- Faster feature development (build once, works for all roles)

---

### Operations Dashboard Core

- [x] **Sidebar Redesign** - 24px icons with icon-only collapse ✅ COMPLETED!
- [x] **Operations Dashboard Layout** - Widget-based dashboard ✅ COMPLETED!
- [x] **Monochrome Design System** - Brutalist aesthetic ✅ COMPLETED!
- [x] **Framework Component Refactoring** - Clear naming conventions ✅ COMPLETED!
  - DashboardContentWrapper (minimal client component for sidebar state)
  - SideCarAISidebar (renamed from info-sidebar) with 4-tab interface
  - PlatformNavSidebar / AgencyNavSidebar (renamed from app-sidebar/agency-admin-sidebar)
  - PageHeader - Server Component with title/tabs/actions
  - Mutually exclusive sidebar toggles (left nav OR AI assistant)
- [x] **Conversations Page** - 3-column unified inbox interface ✅ COMPLETED!
  - 20% conversation list with search/filters
  - 50% message thread with SMS/WhatsApp tabs
  - 30% contact details panel
  - Mock data for IV therapy demo
- [x] **Named Slots Page Header Migration** - Standardize page header pattern ✅ COMPLETED! (PR #40)
  - [x] Phase 1: Update layouts to accept header slot parameter
  - [x] Phase 2: Create `@header/` parallel routes for all pages
  - [x] Phase 3: Clean up DashboardLayout → DashboardContentWrapper (Server Components)
  - [x] All admin pages created with placeholders (calendar, inventory, insights, analytics, settings, appointments, payments, reviews)
  - [x] See `/docs/technical/NAMED-SLOTS-MIGRATION.md` for implementation details
  - [x] Architectural decision documented in ADR-005
- [ ] **Cal.com Calendar Integration** - Core scheduling infrastructure
  - [ ] Create calendar page structure at `/agency/[slug]/admin/calendar`
  - [ ] Implement Cal.com embed (quick start approach)
  - [ ] Design multi-tenant calendar architecture
  - [ ] Evaluate Cal.com platform vs self-hosting
  - [ ] Build calendar provider abstraction layer
- [ ] **Connect GHL Appointments API** - Real-time appointments from calendar
- [ ] **Connect GHL Conversations API** - Unread messages (SMS, FB, IG)
- [ ] **Connect GHL Payments API** - Outstanding invoices/payments
- [ ] **Build Inventory System** - Custom database for stock tracking

### Payment Management ✅ COMPLETED (PR #44)

- [x] **Payment Tracking Infrastructure** - Database models for payments and services ✅
- [x] **Revenue Dashboard UI** - Summary cards and transactions table ✅
- [x] **GHL Webhook Architecture** - Ready for payment.created/updated events ✅
- [x] **Multi-Tenant Payment Views** - Platform admin (all orgs) + Agency admin (scoped) ✅
- [x] **Flexbox Layout Fixes** - Canvas Pattern established for full-height components ✅
- [ ] **GHL Webhook Handler** - `/api/webhook/ghl-payments` endpoint (NEXT)
- [ ] **Service Configuration UI** - Admin page to manage IV therapy catalog
- [ ] **GHL Products API Sync** - One-time sync of services to GHL

### Agency-Specific Features

- [ ] **IV Therapy Dashboard** - Specialized widgets for IV clinics
- [ ] **Med Spa Dashboard** - Treatment-focused operations view
- [ ] **Dental Dashboard** - Appointment and insurance tracking
- [ ] **Chiropractic Dashboard** - Patient flow and treatment plans
- [ ] **White-Label Customization** - Agency branding and colors

---

## 🚀 PHASE 1B: GHL Wrapper MVP Launch

**Goal**: Launch GHL wrapper features to first pilot clinics

> **PIVOT NOTE**: Removed training video strategy. Focus is now on building GHL wrapper features that clinics use directly (no training needed).

### GHL API Integration (Priority)

- [ ] **Complete Placeholder Pages** - All sidebar pages ready for API integration testing
- [ ] **Connect Real GHL Data** - Wire up appointments, contacts, conversations APIs
- [ ] **Test with Pilot Clinic** - Verify features work with real clinic data

### Customer Flow Setup

- [ ] **Write Email Template** - Welcome email with product demo link
- [ ] **Manual Process Documented** - Simple onboarding process for first 3 pilot clinics

### Launch Digital Desk Website

- [ ] **Upload Remaining Photos** - Or use stock photos
- [ ] **Test Booking Flow** - End-to-end verification
- [ ] **Hit Publish Button** - Site goes live

### Lead Generation

- [ ] **Google Maps Search** - 10 cities, IV therapy clinics
- [ ] **Email Collection** - Hunter.io for contact info
- [ ] **Spreadsheet Database** - Name, clinic, city, email, website

### Outreach Setup

- [ ] **Email Template Written** - Simple pain-point focused outreach
- [ ] **Load Leads into Email Tool** - Mailshake, Lemlist, or manual Gmail
- [ ] **Schedule Emails** - Regular cadence
- [ ] **Set Up Calendly** - Demo booking calendar

### Planning & Organization

- [ ] **Block Calendar** - Sales activities and customer support
- [ ] **Confirm Clare Availability** - For demo backup
- [ ] **Set Daily Priorities** - Task management system
- [ ] **Update Upwork Ad** - Backup demo person if needed

---

## 📦 PHASE 2: AI-Powered Intelligence (Next Phase)

### Vercel AI SDK Integration

- [ ] **AI Infrastructure Setup** - Configure Vercel AI SDK with OpenAI/Claude
- [ ] **Natural Language Queries** - "Show me all clients who missed appointments this week"
- [ ] **Predictive Analytics Dashboard**
  - [ ] No-show prediction model (based on history, weather, time of day)
  - [ ] Churn risk scoring (engagement metrics)
  - [ ] Revenue forecasting (appointment trends)
- [ ] **Smart Auto-Responders** - Context-aware message generation
- [ ] **Scheduling Optimization** - AI-suggested appointment times
- [ ] **Proactive Alerts** - AI detects patterns and issues
- [ ] **Conversation Summaries** - Auto-summarize long message threads

### Advanced GHL Integration

- [ ] **Webhook Listeners** - Receive GHL events in real-time
- [ ] **Data Caching** - Redis for performance optimization
- [ ] **Multi-Location Support** - Handle agency sub-accounts
- [ ] **Custom Fields Mapping** - Agency-specific data structures
- [ ] **Bulk Operations** - Mass updates across GHL

### Agency Management Portal

- [ ] **Agency Onboarding Flow** - Connect GHL, configure dashboard
- [ ] **Widget Marketplace** - Pre-built components for verticals
- [ ] **Custom Widget Builder** - Drag-drop dashboard customization
- [ ] **Role-Based Dashboards** - Different views per user role
- [ ] **Mobile-Responsive Views** - Operations on the go

### Analytics & Reporting

- [ ] **Performance Metrics** - Response times, conversion rates
- [ ] **Revenue Analytics** - Payment tracking and forecasting
- [ ] **Staff Productivity** - Message response times, task completion
- [ ] **Inventory Forecasting** - Predictive stock management
- [ ] **Export & Scheduling** - Automated reports to stakeholders

### Security & Production

- [x] Add production security headers ✅
- [x] Enable CSRF protection in production ✅ (via Better Auth)
- [x] Video content protection ✅ (Level 1 - 95% effective)
- [ ] Verify all environment variables configured
- [ ] Test full user flow (signup → enrollment → learning)
- [ ] Add Content-Security-Policy (CSP) - deferred to Phase 4 (post-$1k MRR)

### User Experience Improvements

- [ ] Update Homepage Features Section (remove old template copy)
- [ ] Create dedicated /signup page for agencies
- [ ] Add loading states for lesson navigation
- [ ] Improve error messages and user feedback

### Payment System & Monetization

- [ ] **Implement Subscription Webhooks** - Handle agency $297/month subscriptions
  - Add `customer.subscription.created` handler
  - Add `customer.subscription.deleted` handler
  - Add `invoice.payment_failed` handler
  - Keep enrollment logic for future agency course sales
- [ ] Configure production Stripe webhook endpoint
- [ ] Test subscription lifecycle events

---

## 🚀 PHASE 3: Scale & Enterprise Features

### Component Refactoring ✅ COMPLETED

- [x] ✅ Extract EditCourseForm.tsx to shared component (331 lines eliminated)
- [x] ✅ Extract LessonForm.tsx to shared component (160 lines eliminated)
- [x] ✅ Complete duplication analysis (1,783 lines identified)
- [x] ✅ Create comprehensive refactoring plan
- [x] ✅ **Execute Phase 1**: Extract high-impact components (1,360 lines)
  - CourseStructure.tsx (627 lines extracted)
  - CreateCourseForm (513 lines extracted)
  - NewLessonModal (203 lines extracted)
  - NewChapterModal (165 lines extracted)
- [x] ✅ **Execute Phase 2**: Extract medium components (391 lines)
  - DeleteLesson (139 lines extracted)
  - DeleteChapter (134 lines extracted)
  - DeleteCourseConfirmation (132 lines extracted)
  - LessonEditDialog (255 lines extracted)
- [x] ✅ **Execute Phase 3**: Consolidate CourseForm (750+ lines eliminated)
  - CourseForm.tsx (600 lines) - Unified create/edit component
  - Eliminated CreateCourseForm/EditCourseForm duplication
  - Fixed double header issue on Create pages
  - Fixed Generate Slug button alignment
- [x] ✅ **Complete**: 17 shared components, 4,670 lines, 85%+ duplication eliminated

**Refactoring complete! See `/docs/technical/REFACTORING-PLAN-2025.md` for implementation details**

### Code Quality

- [x] ✅ Remove code duplication (85%+ eliminated - industry standard achieved)
- [ ] Add integration tests for critical paths
- [ ] Add E2E tests for user workflows
- [ ] Implement structured logging system

---

## 🎯 PHASE 4: Enterprise Features / Growth Features

### White-Label Infrastructure

- [ ] **Custom Domains** - agency.theirurl.com support
- [ ] **Theme Engine** - Complete visual customization
- [ ] **API Access** - Let agencies integrate their tools
- [ ] **SSO Integration** - Enterprise authentication
- [ ] **Audit Logging** - Compliance and tracking

### AI & Automation

- [ ] **Smart Scheduling** - AI-optimized appointment booking
- [ ] **Auto-Responders** - Context-aware message replies
- [ ] **Predictive Analytics** - Churn and revenue forecasting
- [ ] **Workflow Automation** - If-this-then-that rules engine
- [ ] **Voice Assistant** - Phone call handling integration

### Analytics & Monitoring

- [ ] Replace mock analytics with real database queries
- [ ] Implement error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Create admin debugging dashboard

### Team Features

- [ ] Build UI for team invitation system
- [ ] Implement role management interface
- [ ] Add organization settings page
- [ ] Create billing management portal

### Content Management

- [ ] S3 file organization restructure (human-readable paths)
- [ ] Video progress tracking
- [ ] Bulk content upload tools
- [ ] Course duplication features

### Marketplace & Ecosystem

- [ ] **Template Store** - Sell/buy dashboard templates
- [ ] **Integration Hub** - Connect to 100+ tools
- [ ] **Developer SDK** - Let others build on platform
- [ ] **Training Academy** - Course content (using existing LMS code!)
- [ ] **Community Forum** - Agency knowledge sharing

---

## 💡 BACKLOG: Future Enhancements

### High Value

- [ ] Mobile-first redesign
- [ ] White-label custom domains
- [ ] Advanced analytics dashboard (LTV, churn, cohorts)
- [ ] API for external integrations
- [ ] Webhook system for automation

### Medium Value

- [ ] Course completion certificates
- [ ] Email notification system
- [ ] In-app messaging
- [ ] Course reviews and ratings
- [ ] Search functionality

### Nice to Have

- [ ] AI-powered course builder
- [ ] Conditional learning paths
- [ ] Gamification features
- [ ] Community forums
- [ ] Live training sessions

---

## ✅ DEFINITION OF DONE

### For MVP Launch

- ✅ Mobile navigation working on all devices
- ✅ At least one complete course with real content
- ✅ Payment processing functional
- ✅ No console.log statements in code
- ✅ Security headers configured
- ✅ Video content protection implemented
- ✅ UI bugs fixed (alignment, double headers)
- ✅ Code duplication eliminated (CourseForm consolidation)
- [ ] Core user flow tested and working

### For Each Feature

- Code reviewed and tested
- Documentation updated
- No regression in existing features
- Accessible on mobile and desktop
- Error handling implemented

---

## 📊 SUCCESS INDICATORS

### Technical Health

- ✅ Code duplication ~5% (industry standard achieved)
- ✅ Zero build errors
- ✅ Page load under 3 seconds
- ✅ No critical security vulnerabilities (security headers configured)

### Business Goals

- Platform supports 10+ agencies
- 80% of users complete onboarding
- Less than 5% monthly churn
- Support tickets reduced by 70%

---

## ⚠️ CURRENT BLOCKERS

1. **GHL API Authentication** - Need production API keys and OAuth setup
2. **Real-Time Data** - Mock data needs replacement with live GHL connections

Phase 0 complete. All critical fixes done including S3 cleanup. Ready for GHL dashboard MVP and customer acquisition.

---

## 📝 NOTES

- ✅ Mobile navigation fixed and working
- ✅ Component refactoring completed (85%+ duplication eliminated)
- ✅ First course content uploaded and live
- ✅ Security headers configured (X-Frame-Options, HSTS, etc.)
- ✅ Video content protection implemented (95% effective)
- ✅ UI bugs fixed (alignment, double headers)
- ✅ CourseForm consolidation complete (CreateCourseForm + EditCourseForm merged)
- ✅ S3 cleanup architecture implemented and tested
- ✅ Enhanced delete safety with type-to-confirm (GitHub-style)
- ✅ Video replacement working correctly - old files deleted automatically
- ✅ Operations dashboard UI complete with widget system
- ✅ Sidebar redesigned for CRM use case (24px icons, icon-only mode)
- ✅ Monochrome design system implemented
- ✅ Framework component naming conventions established (Jan 2025)
- ✅ Conversations page 3-column layout complete (Jan 2025)
- ✅ SideCar AI sidebar with 4-tab interface (Chat, Contact, Tasks, Insights)
- ✅ Mutually exclusive sidebar toggles working correctly
- ✅ URL-based navigation tabs with NavTabs component (PR #42 - Jan 2025)
- ✅ Edge-to-edge data table layouts with removed global padding
- ✅ Payment management system with GHL webhook architecture (PR #44 - Jan 2025)
- ✅ Canvas Pattern for full-height components (flex-1 instead of h-full)
- ✅ CalendarClient and PaymentsClient properly fill viewport
- ✅ Platform architecture supports multi-tenant agencies
- **Primary Focus**: AI-powered CRM with calendar integration and intelligent automation
- **Secondary Feature**: Training academy (LMS) for client onboarding and education
- **Next Priorities**:
  1. Cal.com calendar integration (core feature)
  2. Connect real GHL data APIs
  3. Launch to first IV therapy clinics
  4. Implement Vercel AI SDK for Phase 2
- Keep STATUS.md updated as tasks complete
