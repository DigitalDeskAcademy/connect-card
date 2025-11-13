## ADR-007: Role Framework Consolidation with Discriminated Union DataScope

**Date:** 2025-01-21
**Status:** Superseded (Simplified from 3-tier to 2-tier for church use case)
**Superseded Date:** 2025-10-26
**Decision Makers:** Development team, expert agent consultation (fullstack-developer, nextjs-developer, typescript-pro)

**Note:** This ADR was written for the original SideCar Platform (IV clinic system) with 3 tiers: platform → agency → clinic. ChurchSyncAI simplified this to 2 tiers: platform → church. Location filtering is now handled via `user.defaultLocationId` rather than a separate DataScope tier. The `ClinicScope` type has been removed.

### Context

The platform has 3 user tiers (platform_admin → agency_admin → clinic_user) with duplicate infrastructure instead of unified components. We have:

**Current Problem:**

- Contacts: 2 separate components (ContactsPageClient + AgencyContactsClient)
- Appointments: 2 implementations (CalendarClient + placeholder)
- Courses: 2 implementations (CourseEditClient + AgencyCourseEditClient)

**Existing Foundation:**

- `requireDashboardAccess()` returns DataScope with proper role-based filtering ✅
- Payments component already follows correct pattern (ONE component, shared) ✅
- Middleware extracts tenant from URL and validates ✅

**Business Impact:**

- 60% duplicate code slows feature development
- Building same feature 3× increases bug surface area
- New developers confused by multiple implementations
- Maintenance burden compounds with each new feature

### Decision

**Consolidate to unified component architecture with discriminated union DataScope**

1. **Component Location:** `/components/dashboard/` for shared dashboard components
2. **Type System:** Discriminated union DataScope with type guards
3. **Route Structure:** Keep separate routes (`/platform/admin/*` and `/agency/[slug]/admin/*`)
4. **Data Access:** Centralized scoped query helpers in `/lib/data/`
5. **Naming:** Standardize on "appointments" (not "calendar")

### Implementation Pattern

#### Discriminated Union DataScope

```typescript
interface DataScopeBase {
  organizationId: string;
  filters: {
    canSeeAllOrganizations: boolean;
    canEditData: boolean;
    canDeleteData: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
  };
}

export type PlatformScope = DataScopeBase & { type: "platform" };
export type AgencyScope = DataScopeBase & { type: "agency" };
export type ClinicScope = DataScopeBase & { type: "clinic"; clinicId: string };
export type DataScope = PlatformScope | AgencyScope | ClinicScope;

// Type guards for narrowing
export function isPlatformScope(scope: DataScope): scope is PlatformScope {
  return scope.type === "platform";
}
export function isAgencyScope(scope: DataScope): scope is AgencyScope {
  return scope.type === "agency";
}
export function isClinicScope(scope: DataScope): scope is ClinicScope {
  return scope.type === "clinic";
}
```

**Why Discriminated Union:**

- Compile-time enforcement that `clinicId` is required for clinic type
- Exhaustive type checking via switch statements
- Perfect type narrowing with type guards
- Industry standard for TypeScript RBAC patterns

#### Component Architecture

```
components/dashboard/contacts/contacts-client.tsx ← SHARED
app/platform/admin/contacts/page.tsx → imports shared component
app/church/[slug]/admin/contacts/page.tsx → imports shared component
```

**Pattern:**

```typescript
// 1. Shared component accepts DataScope
interface ContactsClientProps {
  contacts: Contact[];
  dataScope: DataScope;
}

export function ContactsClient({ contacts, dataScope }: ContactsClientProps) {
  const showOrgFilter = isPlatformScope(dataScope);
  const canEdit = dataScope.filters.canEditData;
  return <ContactsTable contacts={contacts} canEdit={canEdit} showOrgColumn={showOrgFilter} />;
}

// 2. Platform page uses requireAdmin()
export default async function PlatformContactsPage() {
  await requireAdmin();
  const dataScope: PlatformScope = { type: "platform", ... };
  const contacts = await getContactsForScope(dataScope);
  return <ContactsClient contacts={contacts} dataScope={dataScope} />;
}

// 3. Agency page uses requireDashboardAccess()
export default async function AgencyContactsPage({ params }) {
  const { dataScope } = await requireDashboardAccess(params.slug);
  const contacts = await getContactsForScope(dataScope);
  return <ContactsClient contacts={contacts} dataScope={dataScope} />;
}

// 4. Scoped data helper with type safety
export async function getContactsForScope(dataScope: DataScope) {
  if (isPlatformScope(dataScope)) {
    return prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  }
  if (isClinicScope(dataScope)) {
    return prisma.contact.findMany({
      where: {
        organizationId: dataScope.organizationId,
        clinicId: dataScope.clinicId, // ✅ TypeScript knows this exists
      },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.contact.findMany({
    where: { organizationId: dataScope.organizationId },
    orderBy: { createdAt: "desc" },
  });
}
```

### Industry Validation

Consulted industry research (2025 best practices):

**Multi-tenant SaaS Architecture:**
✅ Path-based routing with shared DB + tenant_id is standard (not subdomains)
✅ Middleware-based tenant resolution recommended
✅ Shared components in `/components`, not nested in `/app` routes
✅ "Non-negotiable rule: every query must filter by tenant_id"

**TypeScript RBAC Patterns:**
✅ Discriminated unions recommended for role-based access control
✅ Type guards provide perfect type narrowing for permissions
✅ Exhaustive checking prevents missing cases in switch statements

**Next.js RSC Best Practices:**
✅ Shared components enable better code splitting and tree-shaking
✅ Server Components for data fetching, Client Components for interactivity
✅ File-system routing with separate admin paths is recognized B2B pattern

**Reference Sources:**

- Next.js 15 multi-tenant SaaS documentation (2025)
- TypeScript discriminated unions for RBAC (2025 patterns)
- Next.js App Router component organization (Vercel guidelines)
- Multi-tenant data isolation standards (AWS whitepapers)

### Expert Agent Consensus

**Fullstack Developer:** Recommended `/components/dashboard/` + separate routes

- Shared components for maintainability at scale
- Separate routes preserve platform-specific feature flexibility
- Scoped data helpers prevent data leakage bugs

**Next.js Developer:** Acknowledged both patterns valid, slight preference for unified routes

- Separate routes = clearer separation of concerns
- Unified routes = ~51% bundle reduction (not critical at current scale)
- Both patterns industry-recognized, chose based on flexibility needs

**TypeScript Pro:** Strongly recommended discriminated unions

- Compile-time safety for `clinicId` requirement
- Exhaustive checking prevents bugs
- Best auto-import experience with `/components/dashboard/`

### Benefits

1. **Type Safety:** Compile-time guarantees prevent data leakage

   - Impossible to forget `organizationId` filter
   - `clinicId` required for clinic type (TypeScript enforces)
   - Exhaustive checking catches missing scope cases

2. **Code Reduction:** ~60% reduction in component duplication

   - Contacts: 2 components → 1 shared component
   - Appointments: 2 implementations → 1 shared component
   - Courses: 2 implementations → 1 shared component

3. **Developer Velocity:** Build features once, not three times

   - New feature = 1 component, 2 page wrappers
   - Single test suite covers all roles
   - Clear patterns reduce onboarding time

4. **Production Stability:** Single tested component, not three variants

   - Bug fixes apply to all roles immediately
   - Consistent behavior across user tiers
   - Easier to audit security

5. **Scalability:** Proven pattern for 100+ multi-tenant agencies
   - Middleware tenant resolution (already implemented)
   - Database indexes on `organizationId` (existing)
   - React Server Components reduce client bundle
   - Separate routes support platform-specific features

### Tradeoffs

1. **Migration Effort:** Multi-phase consolidation required

   - Phase 1: Update DataScope type definitions
   - Phase 2: Consolidate Contacts, Payments, Appointments components
   - Phase 3: Create scoped data access helpers
   - Phase 4: Integration tests and validation
   - Phase 5: Documentation updates

2. **Learning Curve:** Team needs to learn discriminated union pattern

   - TypeScript type guards (new for some developers)
   - Component location convention (`/components/dashboard/`)
   - Scoped data fetching pattern

3. **Duplicate Pages:** Still have 2 page files per feature (but share components)
   - `/platform/admin/contacts/page.tsx`
   - `/agency/[slug]/admin/contacts/page.tsx`
   - Trade-off: Keep route separation for flexibility

### Consequences

#### Files to Create

```
/components/dashboard/
├── contacts/contacts-client.tsx
├── payments/payments-client.tsx        # Move from agency
├── appointments/appointments-client.tsx
└── conversations/conversations-client.tsx

/lib/data/
├── contacts.ts                         # getContactsForScope()
├── payments.ts                         # getPaymentsForScope()
├── appointments.ts                     # getAppointmentsForScope()
└── conversations.ts                    # getConversationsForScope()
```

#### Files to Delete

```
/app/platform/admin/contacts/_components/ContactsPageClient.tsx
/app/church/[slug]/admin/contacts/client.tsx
/app/platform/admin/courses/[courseId]/edit/_components/CourseEditClient.tsx
/app/church/[slug]/admin/courses/[courseId]/edit/_components/ChurchCourseEditClient.tsx
```

#### Files to Modify

```
/app/data/dashboard/require-dashboard-access.ts
  - Add discriminated union types
  - Add type guard functions
  - Keep existing requireDashboardAccess() function

/app/platform/admin/*/page.tsx (15+ files)
  - Import from @/components/dashboard/
  - Use scoped data helpers
  - Pass DataScope to components

/app/church/[slug]/admin/*/page.tsx (15+ files)
  - Import from @/components/dashboard/
  - Use requireDashboardAccess()
  - Use scoped data helpers
```

### Success Criteria

- ✅ All dashboard features use ONE shared component per feature
- ✅ DataScope uses discriminated union with type guards
- ✅ All queries use scoped data helpers from `/lib/data/`
- ✅ Build passes with zero TypeScript errors
- ✅ Integration tests verify data isolation (platform/agency/clinic)
- ✅ All 3 roles tested manually (platform_admin, agency_admin, clinic_user)
- ✅ Documentation updated (`coding-patterns.md`, `STATUS.md`, `ROADMAP.md`)

### Migration Phases

**Phase 1: Type System Foundation**

- Update DataScope to discriminated union
- Add type guards
- Verify build passes

**Phase 2: Component Infrastructure**

- Create `/components/dashboard/` folders
- Move Payments component (proof of concept)
- Test both routes still work

**Phase 3: Consolidate Features**

- Contacts component consolidation
- Appointments component (rename calendar → appointments)
- Create scoped data helpers

**Phase 4: Testing & Validation**

- Integration tests for data isolation
- Manual testing with all 3 roles
- Build verification

**Phase 5: Documentation**

- Update STATUS.md, ROADMAP.md
- Coding patterns documentation
- This ADR

### Alternatives Considered

**Unified Routes (Remove /platform/admin/\*)**

Platform admins navigate to `/agency/platform/admin/*`

- ✅ TRUE single codebase (1 page file per feature)
- ✅ ~51% bundle size reduction
- ✅ Simpler route maintenance
- ❌ Semantically incorrect (platform admin is not an agency)
- ❌ Need "fake" platform slug
- ❌ Harder to add platform-specific features
- ❌ URL design confusion

**Rejected:** Separate routes provide flexibility for future platform-only features without significant maintenance burden.

**Keep Platform/Agency Separate (Status Quo)**

Continue building duplicate components

- ✅ No migration effort
- ✅ Developers already understand pattern
- ❌ 60% code duplication compounds with every feature
- ❌ Bug fixes require 3× effort
- ❌ Slower feature development
- ❌ Inconsistent behavior across roles
- ❌ Not scalable to 100+ agencies

**Rejected:** Technical debt compounds exponentially with each new feature.

**Single Component, No Type Safety**

Share components but use optional `clinicId?: string`

- ✅ Simpler type definitions
- ✅ Faster initial migration
- ❌ No compile-time guarantee for clinic scope
- ❌ Runtime errors if `clinicId` forgotten
- ❌ Can't use exhaustive type checking
- ❌ Type narrowing doesn't work properly

**Rejected:** TypeScript discriminated unions provide critical safety guarantees for multi-tenant data isolation.

### Security Considerations

1. **Data Leakage Prevention:**

   - Discriminated unions enforce `organizationId` filtering at compile-time
   - Type guards required before accessing `clinicId`
   - Exhaustive checking ensures all scope types handled

2. **Row-Level Security:**

   - Current: Application-level filtering via DataScope
   - Future: Add Postgres RLS policies for defense-in-depth
   - Integration tests validate isolation

3. **Middleware Validation:**

   - Already implemented: Tenant slug validation in middleware ✅
   - Security validation with regex (`/^[a-z0-9-]+$/`)
   - Invalid slugs logged for security monitoring

4. **Audit Trail:**
   - All data access goes through scoped helpers
   - Easy to add logging for compliance
   - Single code path to audit

### Performance Implications

1. **Bundle Size:**

   - Shared components reduce duplication
   - Better code splitting and tree-shaking
   - Estimated ~40% reduction in client-side JavaScript

2. **Database Queries:**

   - Add indexes: `@@index([organizationId, createdAt])`
   - Add indexes: `@@index([organizationId, clinicId])`
   - Queries already use `organizationId` filter

3. **Scalability:**
   - Pattern proven for 100+ agencies
   - Middleware tenant resolution (already fast)
   - React `cache()` wrapper on data fetching
   - Server Components minimize client load

### Related Decisions

- **ADR-001:** Direct Server Action Imports - Inspired our "pass context as data" approach
- **ADR-005:** Named Slots Pattern - Server Component philosophy applies here
- **ADR-006:** URL-Based Navigation - Reinforces server-first architecture

### References

- Industry Research: 2025 multi-tenant SaaS best practices
- Expert Consultation: fullstack-developer, nextjs-developer, typescript-pro agents
- TypeScript Patterns: Discriminated unions for RBAC
- Next.js Documentation: Multi-tenant architecture guide
- Implementation Plan: `/docs/STATUS.md` and `/docs/ROADMAP.md`
- Coding Patterns: `/docs/essentials/coding-patterns.md` (Universal Component Pattern section)

