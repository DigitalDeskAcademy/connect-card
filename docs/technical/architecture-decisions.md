# Architecture Decision Records

This document tracks significant architectural decisions made during the development of ChurchSyncAI.

**Code Examples:** See `/docs/technical/adr-code-examples.md` for implementation patterns referenced by these ADRs.

**Historical Context:** This project was forked from SideCar Platform (IV clinic management system) in October 2025 and rebranded for church connect card management. Some ADRs contain historical "clinic" references from the original project. These references are preserved for historical context but do not reflect current implementation.

---

## ADR-001: Direct Server Action Imports vs Callback Injection

**Date:** 2025-10-11
**Status:** Approved
**Decision Makers:** Development team after expert code review

### Context

After refactoring to eliminate 40% code duplication (1,002 lines), we implemented a callback injection pattern where wrapper components inject context-specific server actions as props to shared components.

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

**See:** `/docs/technical/adr-code-examples.md#adr-001` for implementation patterns.

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

### Industry Precedent

This pattern aligns with:

- **Vercel's own applications** (v0, Vercel Dashboard): Direct server action imports
- **Next.js 15 documentation**: Recommends importing server actions in client components
- **Linear (Next.js)**: Uses direct imports, not callback injection
- **Notion (Next.js)**: Progressive enhancement with direct action calls

### Expert Review Consensus

**Code Reviewer:** "Current callback pattern is appropriate for 2-3 contexts and production-ready, but the direct import pattern is simpler."

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

✅ **DO**: Import server actions directly in client components (see examples file)

❌ **DON'T**: Create wrapper components with callback injection

### References

- [Next.js 15 Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Code Examples: `/docs/technical/adr-code-examples.md#adr-001`
- Code Review Report: 2025-10-11
- Original implementation: Commit 82e6637 (used direct imports before refactor)

### Lessons Learned

1. **Sometimes simpler is better**: The original implementation had the right instinct
2. **Framework conventions matter**: Next.js provides patterns for a reason
3. **Abstraction has cost**: Every layer adds complexity and maintenance burden
4. **Share UI, not behavior**: UI logic should be shared; business logic should be imported
5. **Listen to expert feedback**: Both reviewers independently recommended this approach

---

## ADR-006: URL-Based Navigation Tabs vs Client-Side Tabs

**Date:** 2025-01-19
**Status:** Approved
**Decision Makers:** Development team, UX review

### Context

After implementing the Named Slots pattern (ADR-005), we needed to decide where page navigation tabs should live and how they should be implemented. Issues identified:

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

### Decision

**Use URL-based navigation tabs in page content area, remove tabs from PageHeader**

Navigation tabs should live in the content area and use URL query parameters for state management. The PageHeader component focuses solely on page title, subtitle, and actions.

**See:** `/docs/technical/adr-code-examples.md#adr-006` for implementation patterns.

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

- Removed tabs from all @header pages (Platform + Agency)

**DashboardContentWrapper:**

- Removed all padding/gap to support edge-to-edge layouts
- Gives pages full control over their own spacing

### Related Changes

**ContactsTable Optimization:**

As part of this work, we optimized the contacts table for maximum screen real estate:

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
- Code Examples: `/docs/technical/adr-code-examples.md#adr-006`
- Implementation: PR #42 - "feat: implement URL-based navigation tabs and optimize layout for data tables"
- Related: ADR-005 (Named Slots Pattern - Deprecated)

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

**See:** `/docs/technical/adr-code-examples.md#adr-008` for implementation patterns.

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

- ❌ No TypeScript type safety
- ❌ No JSDoc documentation
- ❌ Harder to enforce usage
- ✅ Simpler, less abstraction

**Layout Slot Pattern (Next.js Parallel Routes)**

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
- Code Examples: `/docs/technical/adr-code-examples.md#adr-008`
- TypeScript expert review: Agent analysis (2025-10-26)
- Code reviewer analysis: Agent analysis (2025-10-26)
- Industry patterns: Vercel, Stripe, Supabase component libraries
- Next.js 15 best practices: Server Components + responsive design

---

## ADR-009: Dual Role System for Multi-Tenant Access Control

**Date:** 2025-11-01
**Status:** Approved
**Decision Makers:** Development team, code-reviewer agent

### Context

Multi-tenant SaaS platforms require **two levels of role management**:

1. **Platform-level permissions** - What can a user do globally across the platform?
2. **Organization-level permissions** - What can a user do within a specific church?

This dual role system is the industry-standard pattern used by Slack (workspaces), GitHub (organizations), Discord (servers), and other enterprise multi-tenant platforms.

**Initial Implementation Problem:**

TypeScript errors occurred when creating/updating team members. The UI uses simplified roles (`"admin"`, `"member"`), but `User.role` expects Prisma enum values (`"church_admin"`, `"user"`).

### Decision

**Maintain TWO role systems with type-safe mapping utilities**

We will keep both role systems and create mapping functions to convert between UI roles and database enum values.

**See:** `/docs/technical/adr-code-examples.md#adr-009` for implementation patterns.

#### Role Systems Defined

**1. User.role (Global/Platform-Level Role)** - Prisma enum `UserRole`

Values: `platform_admin`, `church_owner`, `church_admin`, `volunteer_leader`, `user`

- **Purpose**: Platform-wide access control
- **Use Cases**:
  - Platform admins accessing any organization (support/debugging)
  - Determining if user can create organizations
  - Default dashboard redirects after login
  - Billing/subscription management permissions

**2. Member.role (Organization-Specific Role)** - String field

Values: `"owner"`, `"admin"`, `"member"`

- **Purpose**: Permissions within a specific organization (church)
- **Use Cases**:
  - Can this user manage team members in THIS church?
  - Can this user delete data in THIS church?
  - Can this user edit connect cards in THIS church?

#### Mapping Table

| UI Role | Member.role (String) | User.role (Prisma enum) | Permissions                         |
| ------- | -------------------- | ----------------------- | ----------------------------------- |
| Owner   | "owner"              | "church_owner"          | Full org access, billing, team mgmt |
| Admin   | "admin"              | "church_admin"          | Manage content, edit/delete data    |
| Staff   | "member"             | "user"                  | View and edit data, no deletions    |

### Benefits

1. **Industry-Standard Pattern**: Matches Slack, GitHub, Discord architecture

   - Slack: User account (global) + Workspace roles (per-workspace)
   - GitHub: User account (global) + Organization roles (per-org)
   - Discord: User account (global) + Server roles (per-server)

2. **Type Safety**: Compile-time guarantees prevent type errors

   - Role mapping utility enforces correct enum values
   - TypeScript catches invalid role assignments
   - Exhaustive checking with switch statements

3. **Multi-Organization Support**: Users can have different roles in different churches

   - User is "admin" in Church A but "member" in Church B
   - Platform admins can access any church for support
   - Organization-specific permissions properly scoped

4. **Clear Separation of Concerns**:

   - `User.role` = What can I do across the platform?
   - `Member.role` = What can I do in this church?

5. **Platform Admin Access**: Special case properly handled
   - Platform admins bypass organization membership
   - Can access any church without being a "member"
   - Permissions checked in `require-dashboard-access.ts`

### Tradeoffs

1. **Dual System Complexity**: Developers must understand when to use which role

   - Mitigated by clear documentation
   - Type-safe mapping utilities prevent errors

2. **Data Synchronization**: Must keep User.role and Member.role in sync

   - Solved with transactions: both updates succeed or both fail
   - Clear pattern documented in coding-patterns.md

3. **Migration Complexity**: Existing invitations/updates need mapping logic
   - One-time migration effort for existing code
   - All new code follows type-safe pattern

### Security Considerations

**Data Isolation:**

- Member.role ensures organization-specific permission checks
- User.role provides platform-wide access for support/debugging
- Both systems enforce multi-tenant data isolation

**Cross-Organization Access:**

- Platform admins (`user.role === "platform_admin"`) can access any org
- Regular users isolated to their organization via Member records
- No cross-tenant data leakage

### Alternatives Considered

**Single Role System (User.role only)**

- ✅ Simpler architecture
- ❌ No org-specific permissions
- ❌ User can only have ONE role globally
- ❌ Doesn't support multi-org membership

**Single Role System (Member.role only)**

- ✅ Organization-specific permissions
- ❌ No platform-level admin access
- ❌ No way to grant cross-org permissions
- ❌ Billing/org creation unclear

**Optional Role Field (User.role?: UserRole)**

- ✅ Simpler type definitions
- ❌ No compile-time safety for missing roles
- ❌ Runtime errors if role is null/undefined
- ❌ Can't distinguish between "no role" and "default role"

### Consequences

#### Files Created

- `/lib/role-mapping.ts` - Type-safe role mapping utilities (116 lines with docs)

#### Files Modified

**Server Actions:**

- `/actions/team/update-member.ts` - Uses mapUIRoleToUserRole()
- `/actions/team/accept-invitation.ts` - Uses mapUIRoleToUserRole()
- `/actions/team/remove-member.ts` - Fixed church_owner check

**Permission System:**

- `/app/data/dashboard/require-dashboard-access.ts` - Uses Member.role for org permissions

### Success Criteria

- ✅ All TypeScript errors resolved
- ✅ Role mapping utilities created and tested
- ✅ Both User.role and Member.role updated atomically (transactions)
- ✅ Platform admins can access any church
- ✅ Organization-specific permissions work correctly
- ✅ Documentation complete

### Future Enhancements

1. **Multi-Organization Support**: Allow users to belong to multiple churches
2. **Role Hierarchy Validation**: Prevent admins from promoting themselves
3. **Audit Logging**: Track all role changes for compliance

### Industry Validation

**Conclusion**: Our architecture matches industry-standard multi-tenant SaaS patterns used by Slack, GitHub, and Discord.

### References

- Code Review: code-reviewer agent analysis (2025-11-01)
- Implementation: `/lib/role-mapping.ts`
- Code Examples: `/docs/technical/adr-code-examples.md#adr-009`
- Slack Architecture: [Workspace permissions model](https://api.slack.com/methods/admin.users.setOwner)
- GitHub Organizations: [Organization permission levels](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles)
- Discord Servers: [Server member roles](https://discord.com/developers/docs/topics/permissions)
- Better Auth Documentation: [Organization plugin](https://www.better-auth.com/docs/plugins/organization)

---

## ADR-010: Volunteer Management Schema - Dedicated Tables Architecture

**Date:** 2025-11-11
**Status:** Approved
**Decision Makers:** Development team

### Context

Churches need robust volunteer management for coordinating Sunday services and ministry activities. The initial platform had no volunteer-specific tables - only a `VOLUNTEER` enum value in `ChurchMember.memberType`.

**Requirements:**

- Volunteer profiles (skills, availability, emergency contacts)
- Serving opportunities (ministry roles: Greeter, Usher, Kids Ministry, Worship Team)
- Shift scheduling with recurrence patterns
- Background check tracking (required for kids ministry)
- Check-in/check-out tracking
- Multi-campus support (location-based scheduling)
- Skills matching (not everyone can serve in every role)

**Architecture Options:**

**Option A: Extend ChurchMember (Lightweight)**

- Add volunteer fields via JSON columns
- Quick MVP, simpler data model
- Less scalable for complex scheduling

**Option B: Dedicated Volunteer Tables (Scalable)** ⭐ **CHOSEN**

- Separate models for volunteers, opportunities, shifts, skills, availability
- Industry standard for church management systems
- Better long-term scalability

### Decision

**Build dedicated volunteer management tables with full scheduling capabilities**

We chose Option B because:

1. **Churches have complex volunteer needs** - Sunday services require 10-20 volunteers across multiple roles
2. **Skills matter** - Background checks required for kids ministry, musical ability for worship team
3. **Availability scheduling is complex** - Volunteers have blackout dates, recurring schedules, preferred service times
4. **Industry validation** - Planning Center, Breeze, Church Community Builder all use dedicated volunteer tables
5. **Better separation of concerns** - Volunteer data separate from general member data

**See:** `/docs/technical/adr-code-examples.md#adr-010` for schema definitions.

### Schema Design

#### Core Models (6 Models, 5 Enums)

1. **Volunteer** - Profile extension with emergency contacts, background check tracking
2. **ServingOpportunity** - Ministry roles with recurrence patterns
3. **VolunteerShift** - Scheduled assignments with check-in/out tracking
4. **VolunteerSkill** - Skills & qualifications with verification/expiration
5. **VolunteerAvailability** - Recurring schedules, blackout dates, one-time availability
6. **ServingOpportunitySkill** - Required vs preferred skills per opportunity

**Enums:** VolunteerStatus, BackgroundCheckStatus, AvailabilityType, RecurrencePattern, ShiftStatus

### Benefits

1. **Scalable Architecture**

   - Supports 100+ volunteers across multiple campuses
   - Complex scheduling with recurrence patterns
   - Skills matching for role assignments

2. **Multi-Tenant Isolation**

   - `organizationId` on all tables
   - `locationId` for multi-campus filtering
   - Follows project's data isolation patterns

3. **Background Check Tracking**

   - Required for kids ministry and sensitive roles
   - Expiration tracking (typically 2-3 years)
   - Status workflow: NOT_STARTED → IN_PROGRESS → CLEARED

4. **Availability Management**

   - Recurring schedules (every Sunday 9am-12pm)
   - Blackout dates (vacation, work conflicts)
   - One-time availability for special events

5. **Shift Management**

   - Check-in/check-out tracking
   - No-show tracking for accountability
   - Reminder automation support

6. **Skills Matching**
   - Required vs preferred skills
   - Skill verification and expiration
   - Prevents unqualified volunteers in sensitive roles

### Tradeoffs

1. **Schema Complexity**

   - 6 new models vs 0 (current state)
   - 5 new enums
   - Higher initial implementation effort

2. **Migration Complexity**

   - Existing `ChurchMember` records with `memberType = VOLUNTEER` need migration
   - No breaking changes (volunteer field optional)

3. **Query Complexity**
   - More JOINs for volunteer shift assignments
   - Mitigated by proper indexes

### Implementation Phases

**Phase 1: Schema & Migrations** ✅ COMPLETE

- Create Prisma models
- Run `prisma db push`
- Generate Prisma client
- Create seed data

**Phase 2: Server Actions** ✅ COMPLETE

- CRUD operations for volunteers
- CRUD operations for serving opportunities
- Shift scheduling actions
- Skills management actions

**Phase 3: UI Components** 🔄 IN PROGRESS

- Volunteer directory (TanStack Table) ✅ COMPLETE
- Serving opportunities management
- Shift scheduling calendar
- Skills tracking interface

**Phase 4: Advanced Features**

- Automated reminders (SMS/email before shifts)
- Check-in mobile app
- Skills matching recommendations
- Volunteer analytics dashboard

### Alternatives Considered

**Option A: Extend ChurchMember with JSON**

- ✅ Faster MVP (less tables)
- ✅ Simpler queries
- ❌ No type safety for volunteer fields
- ❌ Can't query/filter on volunteer-specific data
- ❌ Poor scalability for complex scheduling
- ❌ Harder to add features later

**Option C: Third-Party Integration (Planning Center)**

- ✅ No development effort
- ✅ Battle-tested volunteer system
- ❌ External dependency
- ❌ Additional cost per church
- ❌ No control over feature development
- ❌ Data synchronization complexity

### Industry Validation

**Planning Center Services:**

- Uses dedicated volunteer tables
- Skills/positions tracking
- Scheduling with blackout dates
- Background check management

**Breeze ChMS:**

- Separate volunteer module
- Role assignments with recurrence
- Check-in tracking
- Skills matching

**Church Community Builder:**

- Volunteer database distinct from member database
- Serving opportunities with required skills
- Availability management

**Conclusion:** Dedicated tables is the industry-standard pattern for church volunteer management.

### Success Criteria

- ✅ Schema supports 100+ volunteers per church
- ✅ Multi-campus filtering works correctly
- ✅ Background check tracking with expiration
- ✅ Shift scheduling with recurrence patterns
- ✅ Skills matching for role assignments
- ✅ Check-in/check-out tracking
- ✅ No cross-tenant data leakage

### Future Enhancements

1. **Mobile Check-In App** - QR code scanning, geolocation verification, push notifications
2. **Skills Matching AI** - Suggest volunteers, predict burnout, optimize schedules
3. **Volunteer Portal** - Self-service shift sign-ups, availability management
4. **Analytics Dashboard** - Retention metrics, coverage heatmaps, skills gap analysis

### References

- Prisma Schema: `/prisma/schema.prisma` (lines 721-1024)
- Code Examples: `/docs/technical/adr-code-examples.md#adr-010`
- Planning Center Services: [Volunteer scheduling model](https://planning.center/services)
- Breeze ChMS: [Volunteer management](https://www.breezechms.com/features/volunteer-scheduling)
- Church Community Builder: [Volunteer tracking](https://www.churchcommunitybuilder.com/)
- Industry Research: Church volunteer management best practices (2025)

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
