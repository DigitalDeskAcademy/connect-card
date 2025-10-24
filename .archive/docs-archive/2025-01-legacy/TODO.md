# Production TODO List

This file tracks all tasks needed to prepare the LMS project for production deployment.

## 🚨 CRITICAL - Blocks Production

### Mobile Navigation COMPLETELY BROKEN

- [ ] **NO mobile navigation menu** - Navigation is hidden on mobile (`hidden md:flex`)
- [ ] **NO login/signup buttons on mobile** - All CTAs are hidden on mobile
- [ ] **Users stuck on landing page** - Cannot navigate, login, or signup from mobile devices
- [ ] **Affects ALL pages** - Entire site is unusable on mobile
- [ ] **Fix Required**: Add hamburger menu, ensure Login/Signup visible, test all mobile viewports

### Agency Authentication Flow COMPLETELY BROKEN

- [ ] **Unauthorized page after agency login** - Users successfully login but immediately see "unauthorized" page
- [ ] **"Sign in with different user" link broken** - Link doesn't work, prevents switching accounts
- [ ] **No proper redirect after authentication** - Users stuck on unauthorized page with no way forward
- [ ] **Multi-tenant session validation failing** - Authentication succeeds but authorization checks fail
- [ ] **No clear path to access agency dashboard** - Even authenticated users can't navigate to their workspace
- [ ] **Account switching flow non-functional** - Cannot switch between different agency accounts
- [ ] **Fix Required**: Debug session validation, fix redirect flow, implement proper account switching

### Multi-Tenant Architecture (B2B SaaS)

- [ ] **Multi-tenant database architecture** - Add Organization model and tenant isolation for B2B SaaS platform
- [ ] **Platform vs End-user signup flows** - Separate registration paths for Sidecar customers vs their employees
- [ ] **Row-level security implementation** - Ensure data isolation between different customer organizations
- [ ] **Admin user creation workflow** - Define how Sidecar creates platform customers with admin privileges

### Security & Authentication

- [ ] **S3 Upload/Delete Authentication Security Review** - Review multi-tenant authentication implementation in `/app/api/s3/upload/route.ts` and `/app/api/s3/delete/route.ts`
  - Verify session validation consistency with requireAdmin/requireAgencyAdmin patterns
  - Ensure proper role checking for platform_admin, agency_owner, agency_admin
  - Review error messages for information leakage
  - Consider per-organization rate limiting implementation
  - Added: 2025-09-19 - Direct session checking for API routes (see @security-review-needed tags)
- [ ] **Multi-tenant authentication security review** - Implement industry-standard authorization patterns
- [ ] **Webhook security hardening** (`app/api/webhook/stripe/route.ts:100`) - Add logging for signature verification failures
- [ ] **Error handling in webhook** (`app/api/webhook/stripe/route.ts:115,129`) - Improve error handling to prevent webhook crashes
- [ ] **Implement secure account switching flow** - Add server-side sign-out for "Use different email" links
- [ ] **Add CSRF tokens to authentication flows** - Enhance Better Auth CSRF protection
- [ ] **Implement session timeout warnings** - Alert users before session expiry
- [ ] **Add authentication audit logging** - Track login/logout/switch events
- [ ] **Add OTP resend functionality** - Add "Resend code" link with rate limiting for email OTP verification
  - Industry standard: 60-second cooldown between resends
  - Show countdown timer to user
  - Limit total resends (e.g., 3-5 per session)
  - Consider adding "Try different method" option

### Data Integrity

- [ ] **Stripe payment amount bug** (`app/api/webhook/stripe/route.ts:146`) - Amount stored in cents, should be dollars
- [ ] **Payment status verification** (`app/api/webhook/stripe/route.ts:134`) - Check session.payment_status === "paid"
- [ ] **Database transaction safety** (`app/api/webhook/stripe/route.ts:135`) - Wrap enrollment updates in atomic transactions

## 🔥 HIGH - Major UX/Performance Issues

### User Experience

- [ ] **Update Homepage Features Section** - Currently has IV therapy copy from old template

  - Replace with GoHighLevel agency-specific features and benefits
  - Update `/features` page content to match GHL agency focus
  - Align with new Sidecar Platform positioning for GHL agencies
  - Features should highlight: onboarding automation, client retention, support reduction
  - Reference content strategy in sidecar-marketing-guide.md

- [ ] **Agency Signup Flow** - Current /login page assumes returning users with "Welcome back" copy
  - Create dedicated /signup page for new agencies starting 14-day free trial
  - Differentiate between "Sign In" (existing) and "Start Free Trial" (new agencies)
  - Add onboarding flow for new agencies (organization setup, invite team, etc.)
  - Update navigation to show both "Sign In" and "Start Free Trial" options
  - Consider agency-specific signup at /agency/[slug]/signup for white-label experience
- [ ] **Loading states for lesson navigation** - 4-5 second delay with no user feedback when clicking lessons
- [ ] **Enrollment status handling** (`app/data/user/user-is-enrolled.tsx:60`) - Handle different enrollment statuses for better UX

### Performance

- [ ] **Remove development delays** (`app/data/course/get-all-courses.ts:74`) - Remove artificial delays simulating slow queries

### File Organization

- [ ] **S3 File Organization Restructure** - Replace UUID-based folders with human-readable path structure
  - Implement new path structure: `organizations/{org-slug}/courses/{course-slug}/...`
  - Update upload API to use organization/course slugs from session
  - Create migration script for existing UUID-based files
  - Add backwards compatibility for legacy paths
  - Benefits: Easy navigation, better cost tracking, simplified cleanup
  - Security: Continue using signed URLs for access control

## 📋 MEDIUM - Features & Improvements

### Course Management

- [ ] **Remove Course Pricing Fields** - Align with B2B subscription model

  - Make `price` field default to 0 in schema
  - Make `stripePriceId` nullable in database
  - Hide price field from course creation UI
  - Skip Stripe product creation in course actions
  - Update enrollment flow to handle null stripePriceId
  - Files to update: schema.prisma, course creation form, enrollment actions
  - Rationale: Platform uses $297/month subscription, not per-course pricing

- [ ] **Update Course Categories** - Make categories relevant to B2B software onboarding

  - Current categories are generic (Health & Fitness, etc.)
  - Replace with software-relevant categories:
    - CRM & Sales Tools
    - Marketing Automation
    - Project Management
    - Communication & Collaboration
    - Analytics & Reporting
    - E-commerce & Payments
    - Customer Support
    - Development Tools
  - Update in lib/zodSchemas.ts and seed data

- [ ] **Revamp Course Status for Agency Visibility Control**

  - Current: Draft, Published, Archived
  - New status options for platform course development:
    - Development: Course being built (not visible to agencies)
    - Testing: Internal QA phase (visible to test agencies only)
    - Production: Live and available to all agencies
    - Deprecated: Being phased out (visible but marked as outdated)
  - This allows platform admins to build/test courses without agencies seeing incomplete work
  - Update CourseStatus enum in schema.prisma
  - Add visibility logic to agency course queries

- [ ] **Progress tracking integration** (`app/data/user/get-enrolled-courses.ts:30`) - Add lessonProgress when implemented
- [ ] **Continue learning buttons** (`app/my-learning/page.tsx:90`) - Add progress bars and continue buttons
- [ ] **Course enrollment buttons** (`app/my-learning/page.tsx:122`) - Add enrollment buttons for non-enrolled courses
- [ ] **Stripe product cleanup integration** - Delete Stripe products when courses are deleted from database
- [ ] **Multi-admin Stripe organization** - Add admin metadata and structured naming for Stripe products (AdminName - CourseName)

### Analytics

- [ ] **Real database integration** (`app/admin/analytics/page.tsx:13`) - Replace mock data with live database queries

### Payment System

- [ ] **Enhanced Stripe tracking** - Add Transaction table, detailed payment records, improved webhook handling
- [ ] **Additional webhook events** (`app/api/webhook/stripe/route.ts:154`) - Handle invoice.payment_failed and other events
- [ ] **Payment monitoring** (`app/api/webhook/stripe/route.ts:151`) - Add success logging for enrollment activations

## 🐛 BUGS - Non-Critical Fixes

### Text & Messaging

- [ ] **Typo fix** (`app/(public)/courses/[slug]/actions.ts:310`) - "alredy enrolled" → "already enrolled"

### Navigation

- [ ] **Multi-Tenant Routing Review** - Review CourseProgressCard implementation

  - Component moved from single-tenant `/my-learning` to `/app/agency/[slug]/learning/_components/`
  - Now requires `agencySlug` prop to build correct URLs
  - Verify pattern is consistent across all client-facing components
  - Check if other components need similar slug prop updates
  - Added: 2025-09-15 - Part of single-tenant to multi-tenant migration

- [ ] **Post-login redirect** (`app/data/user/require-user.ts:56`) - Add returnUrl parameter for better UX

## 🧹 TECH DEBT - Code Quality

### Type Imports

- [ ] **Verify Organization type import** (`app/providers/organization-context.tsx:17`) - ESLint reports Organization as unused but it's actually used in the type definition. Verify this is a false positive and remove the eslint-disable comment if possible.

### Components

- [ ] **Student navigation components** (`app/my-learning/_components/DashboardAppSidebar.tsx:16`) - Create student-specific nav components after MVP

### Logging & Monitoring

- [ ] **Structured logging** (`app/api/s3/upload/route.ts:246`, `app/api/auth/[...all]/route.ts:245`, `app/api/s3/upload/delete/route.ts:209`) - Replace console.error with structured logging
- [ ] **Specific error messages** (`app/api/s3/upload/delete/route.ts:210`) - More specific error messages based on error type

## 📚 DOCS - Documentation

### Legal Pages

- [ ] **Create Terms of Service page** (`/terms`) - Required for welcome page checkbox link
- [ ] **Create Privacy Policy page** (`/privacy`) - Required for welcome page checkbox link

### SEO & Meta

- [ ] **App metadata** (`app/layout.tsx:65`) - Update metadata with actual app information
- [ ] **SEO architecture** (`app/layout.tsx:13`) - Update meta data with real app information

---

## Production Readiness Checklist

### Security

- [ ] Environment variables audit
- [ ] API rate limiting implementation
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention review
- [ ] XSS prevention review
- [ ] CSRF protection verification

### Performance

- [ ] Database query optimization
- [ ] Image optimization and CDN setup
- [ ] Bundle size analysis
- [ ] Core Web Vitals measurement
- [ ] Caching strategy implementation

### Monitoring

- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Database query monitoring
- [ ] Webhook delivery monitoring
- [ ] User analytics implementation

### Testing

- [ ] Unit test coverage audit
- [ ] Integration test suite
- [ ] E2E test scenarios
- [ ] Load testing for payment flows
- [ ] Security penetration testing

### Deployment

- [ ] CI/CD pipeline setup
- [ ] Database migration strategy
- [ ] Environment configuration management
- [ ] Backup and recovery procedures
- [ ] Rollback procedures

## 🐛 MINOR BUGS & IMPROVEMENTS

### UI/UX Issues

- [ ] **Button alignment issues** - When validation messages appear/disappear
- [ ] **Theme color consistency** - Across all components
- [ ] **Form field spacing** - Visual hierarchy improvements

### Visual Design

- [ ] **Consistent button styles** - Across admin interface
- [ ] **Improved loading states** - For forms and actions
- [ ] **Better visual feedback** - For user actions
- [ ] **Typography consistency** - Heading hierarchy and mobile responsiveness

### Performance & UX Enhancements

- [ ] **Auto-save for course creation** - Prevent data loss
- [ ] **File upload progress indicators** - Better user feedback
- [ ] **Code splitting for admin routes** - Performance optimization
- [ ] **Keyboard shortcuts** - For common actions

---

_Optional features moved to WISHLIST.md_  
_Last updated: 2025-09-06_
