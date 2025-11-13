# Coding Patterns & Standards

This document defines the coding patterns and standards for the LMS Project to ensure consistency across all code contributions.

## 🎯 Core Principles

1. **Security First** - Always include rate limiting and proper authentication
2. **Consistency** - Follow established patterns, don't introduce new ones without discussion
3. **Simplicity** - Keep error handling and responses simple and generic
4. **Type Safety** - Use TypeScript types consistently (ApiResponse, defined schemas)

## 📁 Before Writing New Code

### Checklist for Claude and Developers

1. **Check existing similar files first** - Find 2-3 similar implementations
2. **Match patterns exactly** - Don't deviate from established patterns
3. **Use existing types** - ApiResponse, schemas, etc.
4. **Include security measures** - Rate limiting, authentication checks
5. **Follow file naming conventions** - actions.ts, page.tsx, etc.

## 🔒 Server Actions Pattern

### Standard Template

```typescript
"use server";

import { requireUser } from "@/app/data/require-user"; // or requireAdmin
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { [schema], [SchemaType] } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// Rate limiting configuration
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function actionName(
  data: SchemaType
): Promise<ApiResponse> {
  // 1. Authentication check
  const session = await requireUser(); // or requireAdmin()

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data", // Generic message
    };
  }

  try {
    // 4. Business logic
    await prisma.model.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    });

    // 5. Revalidate paths if needed
    revalidatePath("/relevant/path");

    return {
      status: "success",
      message: "Action completed successfully",
    };
  } catch {
    // 6. Generic error handling - no console.error, no specific messages
    return {
      status: "error",
      message: "Failed to complete action",
    };
  }
}
```

### Key Rules for Server Actions

1. **Always return `ApiResponse` type** - Never create custom return types
   - The `ApiResponse` type supports optional generic data: `ApiResponse<T>`
   - Use `data` field to return created entities or operation results when needed
   - **CRITICAL:** Modifying the `ApiResponse` type definition itself requires:
     - Comprehensive written justification documenting the UX benefit
     - User sign-off approval before implementation
     - Documentation of backward compatibility impact
2. **Include rate limiting** - 5 requests per minute is standard
3. **Use auth helpers** - `requireUser()` or `requireAdmin()`, not manual checks
4. **Generic error messages** - Don't expose validation details or system errors
5. **No console.error** - Keep error handling simple
6. **Use transactions** - When updating multiple tables

## 🎨 Component Patterns

### Form Components

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ComponentName() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Set defaults
    },
  });

  function onSubmit(values: SchemaType) {
    startTransition(async () => {
      const result = await serverAction(values);

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/redirect/path");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### Page Layout Components

#### PageContainer (Standard Spacing Wrapper)

**Location:** `/components/layout/page-container.tsx`

**Purpose:** Enforces consistent page spacing across all admin pages with full coverage for all layout patterns. Eliminates manual decisions about `p-6`, `gap-6`, and `flex-1`.

⚠️ **CRITICAL:** ALL admin pages in `/app/church/[slug]/admin/**/page.tsx` MUST use `<PageContainer>`. Default: `<PageContainer as="main">`. Only use `variant="none"` for split-pane layouts.

**All 6 Variants:**

```typescript
import { PageContainer } from "@/components/layout/page-container";

// 1. DEFAULT - Standard pages (dashboard, settings, forms)
export default async function DashboardPage() {
  return (
    <PageContainer as="main">
      <h1>Dashboard</h1>
      <StatsCards />
      <RecentActivity />
    </PageContainer>
  );
}

// 2. PADDED - Data tables with full-height scrollable content
export default async function MembersPage() {
  return (
    <PageContainer variant="padded" as="main">
      <SummaryCards />
      <MembersTable />
    </PageContainer>
  );
}

// 3. FILL - Custom layouts with internal spacing
export default async function CustomPage() {
  return (
    <PageContainer variant="fill">
      <CustomLayoutWithOwnSpacing />
    </PageContainer>
  );
}

// 4. TIGHT - Tighter gap spacing (contacts-style pages)
export default async function ContactsPage() {
  return (
    <PageContainer variant="tight" as="main">
      <ContactsHeader />
      <ContactsList />
    </PageContainer>
  );
}

// 5. TABS - NavTabs integration (prevents double-spacing)
export default async function TabsPage() {
  return (
    <PageContainer variant="tabs">
      <NavTabs items={tabs} />
      <TabContent />
    </PageContainer>
  );
}

// 6. NONE - Split-pane layouts (no wrapper at all)
export default async function ConversationsPage() {
  return (
    <PageContainer variant="none">
      <SplitPaneLayout /> {/* Renders directly with no wrapper */}
    </PageContainer>
  );
}
```

**Variant Reference:**

| Variant   | Classes                            | Use Case        | Example Pages                |
| --------- | ---------------------------------- | --------------- | ---------------------------- |
| `default` | `p-4 md:p-6 gap-4 md:gap-6`        | Standard pages  | Dashboard, Settings, Profile |
| `padded`  | `flex-1 p-4 md:p-6 gap-4 md:gap-6` | Data tables     | Payments, Members            |
| `fill`    | `flex-1`                           | Custom layouts  | Calendar, Custom views       |
| `tight`   | `p-4 md:p-6 gap-3 md:gap-4`        | Tighter spacing | Contacts-style               |
| `tabs`    | `p-4 md:p-6 gap-0`                 | NavTabs pages   | Contact tabs, Settings tabs  |
| `none`    | No wrapper                         | Split layouts   | Conversations, Multi-pane    |

**Variant Selection Guide:**

Use this decision tree to choose the correct variant:

```
Need PageContainer?
  ↓
What type of page?
  ├─ Data table (sortable, filterable, scrollable)
  │   → variant="padded"
  │   Examples: PaymentsTable, Members, Appointments, Analytics
  │   Why: flex-1 makes table fill available height for scrolling
  │
  ├─ Standard page (dashboard, settings, forms)
  │   → variant="default" or omit variant prop (uses default)
  │   Examples: Dashboard with cards, Settings pages, Profile forms
  │   Why: Standard padding and gap spacing for regular content
  │
  ├─ NavTabs integration (tabs at top of page)
  │   → variant="tabs"
  │   Examples: Contacts with tabs, Settings with tabs
  │   Why: gap-0 prevents double spacing (NavTabs has built-in spacing)
  │
  ├─ Custom layout (component manages own spacing)
  │   → variant="none"
  │   Examples: Conversations split-pane, Team management, Course editor
  │   Why: Complex UIs need full control over their own layout
  │
  ├─ Custom full-height canvas (no padding at all)
  │   → variant="fill"
  │   Examples: Calendar UI, Preview pages, Empty states
  │   Why: flex-1 for full height, but no padding for custom layouts
  │
  └─ Tighter spacing needed (12px/16px gaps)
      → variant="tight"
      Examples: Reserved for future use
      Why: When default gaps feel too spacious
```

**Common Mistakes:**

❌ **DON'T** use `variant="padded"` for placeholder cards or dashboards

```typescript
// WRONG - Dashboard with stat cards
<PageContainer variant="padded" as="main">
  <Card>Welcome</Card>
  <div className="grid grid-cols-4 gap-4">
    <StatCard />
    <StatCard />
  </div>
</PageContainer>
```

✅ **DO** use default variant (or omit) for standard content

```typescript
// CORRECT - Dashboard with stat cards
<PageContainer as="main">
  <Card>Welcome</Card>
  <div className="grid grid-cols-4 gap-4">
    <StatCard />
    <StatCard />
  </div>
</PageContainer>
```

❌ **DON'T** manually create spacing wrappers

```typescript
// WRONG - Manual div wrapper
<div className="flex flex-1 flex-col gap-0">
  <NavTabs tabs={[...]} />
  <Content />
</div>
```

✅ **DO** use tabs variant with NavTabs

```typescript
// CORRECT - Use tabs variant
<PageContainer variant="tabs">
  <NavTabs tabs={[...]} />
  <Content />
</PageContainer>
```

**Responsive Spacing:**

- **Mobile:** `p-4` (16px), `gap-4` (16px) or `gap-3` (12px)
- **Desktop:** `p-6` (24px), `gap-6` (24px) or `gap-4` (16px)

**Semantic HTML:**

```typescript
// Use <main> for top-level page content (accessibility best practice)
<PageContainer as="main">

// Use <section> for sub-sections
<PageContainer as="section">

// Use <div> (default) for generic containers
<PageContainer> {/* defaults to div */}
```

**Key Rules:**

✅ **DO:**

- Use `<PageContainer>` for all admin pages (28+ pages)
- Choose the variant that matches your page type (see table above)
- Use `as="main"` for top-level page content (SEO + accessibility)
- Let the component handle spacing - don't add extra wrapper divs

❌ **DON'T:**

- Manually add `p-6`, `gap-6`, or `flex-1` to page content
- Wrap `<PageContainer>` in additional layout divs
- Mix variants across similar page types
- Override spacing with `className` unless absolutely necessary

**Why This Exists:**

Before PageContainer, every page manually chose spacing classes, causing inconsistencies across 28+ admin pages. This component makes "correct spacing" the default and eliminates future spacing conversations.

**Industry References:**

- **Vercel Dashboard:** Consistent page padding with responsive variants
- **Stripe Dashboard:** Standard spacing for all admin pages
- **Supabase Studio:** Unified page container with semantic HTML

**Migration Guide:**

```typescript
// BEFORE: Manual spacing
export default async function Page() {
  return (
    <div className="flex flex-col p-6 gap-6">
      <PageHeader />
      <Content />
    </div>
  );
}

// AFTER: PageContainer
export default async function Page() {
  return (
    <PageContainer as="main">
      <PageHeader />
      <Content />
    </PageContainer>
  );
}
```

**Coverage:** 100% of admin page patterns (all 28+ pages can migrate)

**See Also:**

- Component implementation: `/components/layout/page-container.tsx`
- Architecture decision: `/docs/technical/architecture-decisions.md` (ADR-008)

## 📝 Zod Schemas

### Location

All schemas go in `/lib/zodSchemas.ts`

### Pattern

```typescript
export const schemaName = z.object({
  field: z.string().min(3, { message: "Generic message" }),
  // Use generic messages, not specific field names
});

export type SchemaNameType = z.infer<typeof schemaName>;
```

## 🗂️ File Structure

### Pages

- `app/[route]/page.tsx` - Server components by default
- Include comprehensive JSDoc comments
- Handle authentication at page level

### Actions

- `app/[route]/actions.ts` - All server actions for that route
- Group related actions in same file
- Use "use server" directive

### Components

- `app/[route]/_components/ComponentName.tsx` - Route-specific components
- `components/ui/` - Shared shadcn components only

## ✅ Type Safety

### Always Use Existing Types

```typescript
import { ApiResponse } from "@/lib/types";
import { CourseSchemaType } from "@/lib/zodSchemas";
```

### ApiResponse Type

```typescript
export type ApiResponse<T = never> = {
  status: "success" | "error";
  message: string;
  shouldRefresh?: boolean; // Optional flag to refresh page after success
  data?: T; // Optional data returned from successful operations
};
```

**Usage Examples:**

```typescript
// Simple action without data
export async function deleteItem(id: string): Promise<ApiResponse> {
  // ...
  return { status: "success", message: "Item deleted" };
}

// Action returning created entity
export async function createItem(
  data: ItemData
): Promise<ApiResponse<{ itemId: string; title: string }>> {
  const item = await prisma.item.create({ data });
  return {
    status: "success",
    message: "Item created",
    data: { itemId: item.id, title: item.title },
  };
}
```

**CRITICAL:** Modifying the `ApiResponse` type definition requires comprehensive justification and user sign-off.

## 🔐 Authentication Patterns

### For Admin Actions

```typescript
const session = await requireAdmin();
// Throws if not admin - no need for additional checks
```

### For User Actions

```typescript
const session = await requireUser();
// Throws if not authenticated - no need for additional checks
```

### Never Do This

```typescript
// ❌ Don't do manual checks
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return { status: "error", message: "Unauthorized" };
}
```

## 📊 Database Patterns

### Simple Operations

```typescript
await prisma.model.create({
  data: { ...validation.data },
});
```

### Multi-Table Updates

```typescript
await prisma.$transaction(async (tx) => {
  await tx.model1.create({ ... });
  await tx.model2.update({ ... });
});
```

## 🚫 What NOT to Do

1. **Don't create new return types** - Use ApiResponse
2. **Don't skip rate limiting** - Always include it
3. **Don't expose specific errors** - Keep messages generic
4. **Don't use console.log/error** - Remove before committing
5. **Don't create new patterns** - Follow existing ones

## 📋 Quick Reference for Claude

When asked to create code:

1. First say: "Let me check existing patterns in similar files"
2. Review 2-3 similar implementations
3. Follow the template exactly
4. Use ApiResponse type
5. Include rate limiting
6. Generic error messages
7. No console logging

## 🔄 Common Patterns to Copy From

- **Server Actions**: `/app/admin/courses/create/actions.ts`
- **Form Components**: `/app/(auth)/login/_components/LoginForm.tsx`
- **Page Structure**: `/app/admin/courses/create/page.tsx`
- **Schemas**: `/lib/zodSchemas.ts`

## 🔐 Multi-Tenant Data Scoping Pattern

### Hybrid Approach (Adopted Decision)

We use a hybrid approach for multi-tenant data isolation to balance security, clarity, and maintainability.

#### READ Operations - Use Data Scope Abstraction

For complex queries and reads, use the data scope factory for automatic organization filtering:

```typescript
// Pages and components use createAgencyDataScope
const dataScope = createAgencyDataScope(organization.id);
const courses = await dataScope.getCourses(); // Automatically filtered
const users = await dataScope.getUsers(); // Always scoped to org
```

Benefits:

- Impossible to forget organizationId filter
- Complex business logic centralized (e.g., platform + agency courses)
- Consistent data access patterns

#### WRITE Operations - Direct Prisma with Explicit Scoping

For mutations (create/update/delete), use direct Prisma calls with explicit organizationId:

```typescript
export async function createAgencyCourse(
  slug: string,
  data: CourseSchemaType
): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  await prisma.course.create({
    data: {
      ...data,
      organizationId: organization.id, // REQUIRED: Always explicit
      stripePriceId: null, // Agency courses use subscription
    },
  });
}
```

Benefits:

- Clear and explicit data ownership
- Easier to debug and trace
- Follows existing platform patterns

### Critical Multi-Tenant Rules

1. **NEVER** create/update agency data without organizationId
2. **ALWAYS** use requireAgencyAdmin() for agency operations
3. **Platform courses** have organizationId = null (visible to all)
4. **Agency courses** must have valid organizationId (scoped to org)
5. **Use fingerprinting** in rate limiting: `${userId}_${organizationId}`

### Data Access Patterns

```typescript
// ❌ WRONG - Missing organization scope
await prisma.course.create({ data: { title: "..." } });

// ✅ CORRECT - Explicit organization scope
await prisma.course.create({
  data: {
    title: "...",
    organizationId: organization.id,
  },
});

// ✅ CORRECT - Using data scope for reads
const scope = createAgencyDataScope(orgId);
const courses = await scope.getCourses();
```

This hybrid pattern ensures data isolation while maintaining code clarity and follows industry best practices for B2B SaaS multi-tenancy.

### Location-Based Filtering (Multi-Campus Support)

**Overview**: Churches can have multiple campuses (locations). Data access is role-based:

**Permission Model:**

- **Account Owner** (`church_owner`) → Always sees ALL locations (non-negotiable)
- **Multi-Campus Admin** (`church_admin` + `canSeeAllLocations = true`) → Sees ALL locations
- **Campus Admin** (`church_admin` + `canSeeAllLocations = false`) → Sees ONLY their assigned location
- **Staff** (`user`) → Sees ONLY their assigned location

Churches can selectively grant multi-campus access to specific admins (typically 1-2 people) via the `canSeeAllLocations` flag, while keeping most admins campus-specific.

**Implementation Pattern:**

```typescript
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getLocationFilter } from "@/lib/data/location-filter";

export async function getConnectCards(slug: string) {
  const { dataScope } = await requireDashboardAccess(slug);

  const cards = await prisma.connectCard.findMany({
    where: {
      organizationId: dataScope.organizationId, // Multi-tenant isolation
      ...getLocationFilter(dataScope), // Location-based filtering
    },
  });

  return cards;
}
```

**How it works:**

```typescript
// Account Owner or Multi-Campus Admin (canSeeAllLocations = true)
getLocationFilter(dataScope); // Returns {} (no filter)

// Campus Admin or Staff (canSeeAllLocations = false, locationId = "xyz")
getLocationFilter(dataScope); // Returns { locationId: "xyz" }
```

**Helper Functions:**

```typescript
// Check if user can access a location
if (!canAccessLocation(dataScope, card.locationId)) {
  return { status: "error", message: "Access denied" };
}

// Get default location for new records
const defaultLocationId = getDefaultLocationForNewRecords(dataScope);
// Staff: returns their locationId
// Admin/Owner: returns null (must choose location)
```

**Critical Rules:**

1. **ALWAYS** use `getLocationFilter(dataScope)` when querying location-based data
2. **NEVER** assume a user can see all locations - check `dataScope.filters.canSeeAllLocations`
3. **Staff** must have a `defaultLocationId` assigned
4. **Account Owners** always see all locations (via logic, not the flag)
5. **Admins** may be multi-campus or campus-specific based on `user.canSeeAllLocations` flag
6. **Default behavior**: New admins are campus-specific (`canSeeAllLocations = false`)

**See**: `/lib/data/location-filter.ts` for implementation details

---

## 🎯 Universal Component Pattern with DataScope

### Overview

**DO NOT** build separate components for platform/church roles. Instead, build ONE component that accepts `DataScope` and adapts behavior based on user role.

**Why This Pattern:**

- Eliminates 60%+ code duplication
- Type-safe with compile-time guarantees
- Faster feature development (build once, works for all roles)
- Industry-validated 2025 multi-tenant SaaS pattern

### Pattern: Discriminated Union DataScope

```typescript
// Type definition with compile-time safety
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

export type PlatformScope = DataScopeBase & {
  type: "platform";
};

export type AgencyScope = DataScopeBase & {
  type: "agency";
};

export type DataScope = PlatformScope | AgencyScope;

// Type guards for narrowing
export function isPlatformScope(scope: DataScope): scope is PlatformScope {
  return scope.type === "platform";
}

export function isAgencyScope(scope: DataScope): scope is AgencyScope {
  return scope.type === "agency";
}
```

### Component Location Convention

**Shared Dashboard Components:**

```
/components/dashboard/
├── contacts/
│   └── contacts-client.tsx       # Shared across all roles
├── payments/
│   └── payments-client.tsx       # Shared across all roles
└── appointments/
    └── appointments-client.tsx   # Shared across all roles
```

**Route-Specific Pages:**

```
/app/platform/admin/contacts/page.tsx      # Platform admin route
/app/church/[slug]/admin/contacts/page.tsx # Church route

Both import from: @/components/dashboard/contacts/contacts-client
```

### Implementation Pattern

#### 1. Shared Component (Client Component)

```typescript
// components/dashboard/contacts/contacts-client.tsx
"use client";

import { DataScope, isPlatformScope } from "@/app/data/dashboard/require-dashboard-access";
import { ContactsTable } from "@/components/contacts/ContactsTable";

interface ContactsClientProps {
  contacts: Contact[];
  dataScope: DataScope;
  organizationId: string;
}

export function ContactsClient({ contacts, dataScope, organizationId }: ContactsClientProps) {
  // Derive UI behavior from dataScope
  const showOrgFilter = isPlatformScope(dataScope);
  const canEdit = dataScope.filters.canEditData;
  const canDelete = dataScope.filters.canDeleteData;

  return (
    <ContactsTable
      contacts={contacts}
      canEdit={canEdit}
      canDelete={canDelete}
      showOrgColumn={showOrgFilter}
    />
  );
}
```

#### 2. Platform Admin Page (Server Component)

```typescript
// app/platform/admin/contacts/page.tsx
import { requireAdmin } from "@/app/data/admin/require-admin";
import { getContactsForScope } from "@/lib/data/contacts";
import { ContactsClient } from "@/components/dashboard/contacts/contacts-client";

export default async function PlatformContactsPage() {
  await requireAdmin(); // Platform admin only

  // Platform scope sees all organizations
  const dataScope: PlatformScope = {
    type: "platform",
    organizationId: "platform",
    filters: {
      canSeeAllOrganizations: true,
      canEditData: true,
      canDeleteData: true,
      canExportData: true,
      canManageUsers: true,
    },
  };

  const contacts = await getContactsForScope(dataScope);

  return <ContactsClient contacts={contacts} dataScope={dataScope} organizationId="platform" />;
}
```

#### 3. Church Page (Server Component)

```typescript
// app/church/[slug]/admin/contacts/page.tsx
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getContactsForScope } from "@/lib/data/contacts";
import { ContactsClient } from "@/components/dashboard/contacts/contacts-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyContactsPage({ params }: PageProps) {
  const { slug } = await params;
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // DataScope determines filtering automatically
  // - Church owner/admin: sees organizationId scoped data (all locations)
  // - Church staff: sees organizationId scoped data (filtered by user.defaultLocationId in queries)
  const contacts = await getContactsForScope(dataScope);

  return <ContactsClient contacts={contacts} dataScope={dataScope} organizationId={organization.id} />;
}
```

#### 4. Scoped Data Fetching Helper

```typescript
// lib/data/contacts.ts
import { prisma } from "@/lib/db";
import {
  DataScope,
  isPlatformScope,
} from "@/app/data/dashboard/require-dashboard-access";

/**
 * Fetch contacts with automatic data scoping based on user role
 *
 * Type-safe: Compiler ensures all scope types are handled
 */
export async function getContactsForScope(dataScope: DataScope) {
  // Platform: all contacts across all organizations
  if (isPlatformScope(dataScope)) {
    return prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Church (Agency): scoped to organization
  // Location filtering happens via user.defaultLocationId, not DataScope
  return prisma.contact.findMany({
    where: {
      organizationId: dataScope.organizationId,
    },
    orderBy: { createdAt: "desc" },
  });
}
```

### Rules

✅ **DO:**

- Use discriminated union for DataScope type
- Place shared components in `/components/dashboard/`
- Pass full DataScope to components
- Use type guards for type narrowing
- Create scoped data fetching helpers in `/lib/data/`

❌ **DON'T:**

- Create separate components per role (ContactsPageClient vs AgencyContactsClient)
- Place shared components in `/app` routes
- Pass individual permission flags instead of DataScope
- Duplicate query logic across routes
- Filter by location in DataScope (use user.defaultLocationId instead)

### Benefits

1. **Type Safety:** Compile-time guarantees prevent data leakage
2. **Code Reduction:** Build once, use for all roles (~60% less code)
3. **Maintainability:** Single source of truth for features
4. **Performance:** Shared component bundles, better code splitting
5. **Developer Experience:** Clear patterns, predictable structure
6. **Industry Standard:** Matches 2025 multi-tenant SaaS best practices

### Reference

- **ADR-007:** Role Framework Consolidation decision record
- **Industry Validation:** 2025 multi-tenant SaaS patterns research
- **Expert Consensus:** Fullstack, Next.js, and TypeScript experts unanimous

---

## 🧭 Navigation Configuration Pattern (Single Source of Truth)

### Overview

**All navigation structure is defined in `/lib/navigation.ts`** - this is the **single source of truth** for:

- Sidebar menu items
- Page titles in navbar
- Navigation URLs
- Menu hierarchy

**Why Centralized Navigation?**

- ✅ Single source of truth (sidebar defines titles, header uses them)
- ✅ Update once, reflects everywhere (sidebar + header automatically sync)
- ✅ Type-safe with TypeScript
- ✅ Easy to maintain and test
- ✅ Industry standard pattern (used by Vercel, Linear, GitHub)

**Key Rule:** When changing navigation structure, **ONLY update `/lib/navigation.ts`** - both sidebars and headers automatically update.

### File Structure

```
lib/
└── navigation.ts                    # Single source of truth for all navigation

components/sidebar/
├── agency-nav-sidebar.tsx          # Imports getChurchNavigation()
├── platform-nav-sidebar.tsx        # Imports getPlatformNavigation()
└── site-header.tsx                 # Imports getPageTitle() to show current page title
```

### Navigation Config Structure

```typescript
// lib/navigation.ts
export interface NavigationItem {
  title: string;
  url: string;
  icon?: any;
  className?: string;
  isActive?: boolean;
  items?: Omit<NavigationItem, "items">[]; // One level of nesting
}

export interface NavigationConfig {
  navMain: NavigationItem[];
  navAdmin?: NavigationItem[];
  navSecondary: NavigationItem[];
}
```

### Implementation Pattern

#### 1. Define Navigation in Config

```typescript
// lib/navigation.ts
export function getChurchNavigation(slug: string): NavigationConfig {
  return {
    navMain: [
      {
        title: "Dashboard",
        url: `/church/${slug}/admin`,
      },
      {
        title: "Connect Cards",
        url: `/church/${slug}/admin/n2n`,
      },
      {
        title: "More",
        url: "#",
        items: [
          {
            title: "Calendar",
            url: `/church/${slug}/admin/calendar`,
          },
          {
            title: "Contacts",
            url: `/church/${slug}/admin/contacts`,
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: `/church/${slug}/admin/settings`,
      },
    ],
  };
}
```

#### 2. Sidebars Import and Use Config

```typescript
// components/sidebar/agency-nav-sidebar.tsx
import { getChurchNavigation } from "@/lib/navigation";

export function AgencyNavSidebar({ agencySlug }) {
  // Get navigation structure from shared config
  const navigation = getChurchNavigation(agencySlug);

  // Add icons (config is icon-agnostic for flexibility)
  const navMain = navigation.navMain.map((item, index) => ({
    ...item,
    icon: [IconHome, IconUserPlus, IconDots][index],
  }));

  return <NavMain items={navMain} />;
}
```

#### 3. Header Automatically Shows Correct Title

```typescript
// components/sidebar/site-header.tsx
import { getPageTitle, getChurchNavigation } from "@/lib/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  // Determine navigation config based on current path
  const getNavigationConfig = () => {
    if (pathname.startsWith("/platform/admin")) {
      return getPlatformNavigation();
    }
    const churchMatch = pathname.match(/^\/church\/([^/]+)\//);
    if (churchMatch) {
      return getChurchNavigation(churchMatch[1]);
    }
    return null;
  };

  const navigationConfig = getNavigationConfig();
  const pageTitle = navigationConfig
    ? getPageTitle(pathname, navigationConfig)
    : "Dashboard";

  return <h1>{pageTitle}</h1>;
}
```

### Adding New Navigation Items

**To add a new page:**

1. **ONLY update `/lib/navigation.ts`**:

```typescript
navMain: [
  {
    title: "Dashboard",
    url: `/church/${slug}/admin`,
  },
  // ✅ Add new item here
  {
    title: "Events", // ← This will automatically appear in sidebar AND header
    url: `/church/${slug}/admin/events`,
  },
];
```

2. **That's it!** Both sidebar and header update automatically.

### Rules and Best Practices

✅ **DO:**

- Update navigation structure **ONLY** in `/lib/navigation.ts`
- Trust that sidebars and headers will automatically sync
- Keep URLs and titles consistent
- Use nested `items` for collapsible menu sections

❌ **DON'T:**

- Hardcode navigation items directly in sidebar components
- Duplicate navigation structure in multiple files
- Create custom title logic in page components
- Pass navigation as props (use the config instead)

### Page Content Pattern

**CRITICAL: Pages should NOT include their own headers**

The SiteHeader component (rendered in the layout) automatically displays page titles from `lib/navigation.ts`. Adding duplicate headers in page content creates visual inconsistency.

❌ **DON'T add h1 tags in page content:**

```tsx
export default function MyPage() {
  return (
    <div>
      <h1>My Page Title</h1> {/* ← WRONG! Duplicate header */}
      <p>Description text</p>
      {/* page content */}
    </div>
  );
}
```

✅ **DO start directly with content:**

```tsx
export default function MyPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Start directly with content - SiteHeader shows title */}
      <div className="grid grid-cols-2 gap-6">{/* page content */}</div>
    </div>
  );
}
```

**Why this matters:**

- SiteHeader automatically renders page title from navigation config
- Adding h1 in page creates duplicate headers (one from layout, one from page)
- Centralized navigation keeps titles consistent across sidebar and header
- Industry standard pattern (Next.js App Router best practices)

**To create a new page:**

1. Create page file at route path (e.g., `app/church/[slug]/admin/events/page.tsx`)
2. Add navigation entry to `lib/navigation.ts` with title and URL
3. Page content starts with layout wrapper (NO h1 tag needed)
4. SiteHeader automatically displays the title from navigation config

### Example: Renaming a Page

**Old Way (BAD - required 3 changes):**

1. Update sidebar component
2. Update header component
3. Update page title logic

**New Way (GOOD - requires 1 change):**

```typescript
// lib/navigation.ts
{
  title: "Connect Cards",  // ← Change title here only
  url: `/church/${slug}/admin/n2n`,
}
// Sidebar and header automatically update ✅
```

### Page Title Lookup Logic

The `getPageTitle()` function searches through navigation config:

1. Checks all top-level items
2. Checks all nested items (one level deep)
3. Falls back to URL-based title generation

This means **the page title shown in the header always matches the sidebar title**.

### Migration Notes

**Previous Pattern (Deprecated):** Used Named Slots (`@header/` directories) for page titles.

**Current Pattern:** Navigation config in `/lib/navigation.ts` with dynamic title lookup in header.

---

## 🎨 Shadcn Component Usage

**ALWAYS check shadcn/ui components FIRST before building custom UI.**

- **Component Reference**: `/docs/essentials/shadcn.md` - Complete list of 100+ available components
- **Usage Patterns**: `/docs/essentials/shadcn-usage-patterns.md` - Common implementation patterns

**Quick Install:**

```bash
npx shadcn@latest add <component-name>
```

---

## 📊 DataTable Pattern

**Use TanStack Table for ALL data tables** - Industry-standard pattern for React data tables in 2025.

- **Full Implementation Guide**: `/docs/essentials/data-table-pattern.md`
- **Reference Implementation**: `/components/dashboard/payments/` (columns, data-table, wrapper)

**Quick Start:**

```bash
# Copy reference implementation
cp -r components/dashboard/payments components/dashboard/[feature]

# Update file names and column definitions
# See data-table-pattern.md for complete guide
```

---

**Remember**: When in doubt, copy an existing pattern rather than creating a new one.
