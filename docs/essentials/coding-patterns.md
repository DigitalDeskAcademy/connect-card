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

---

## 🎯 Universal Component Pattern with DataScope

### Overview

**DO NOT** build separate components for platform/agency/clinic roles. Instead, build ONE component that accepts `DataScope` and adapts behavior based on user role.

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

export type ClinicScope = DataScopeBase & {
  type: "clinic";
  clinicId: string; // ✅ REQUIRED for clinic type
};

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
/app/agency/[slug]/admin/contacts/page.tsx # Agency/clinic route

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

#### 3. Agency/Clinic Page (Server Component)

```typescript
// app/agency/[slug]/admin/contacts/page.tsx
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
  // - Agency admin: sees organizationId scoped data
  // - Clinic user: sees organizationId + clinicId scoped data
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
  isClinicScope,
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

  // Clinic: scoped to org + clinic
  if (isClinicScope(dataScope)) {
    return prisma.contact.findMany({
      where: {
        organizationId: dataScope.organizationId,
        clinicId: dataScope.clinicId, // ✅ TypeScript knows this exists
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Agency: scoped to organization only
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
- Access `clinicId` without type guard check

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

## 🎨 Page Header Pattern (Named Slots)

### Overview

**Use Named Slots (Parallel Routes) for page-level headers** across all dashboard pages. This is our standard pattern for rendering page titles, tabs, and action buttons.

**Why Named Slots?**

- True Server Components (0 client JS overhead)
- Zero layout shift (CLS = 0)
- Scales to 100 agencies × 1000s of users
- Next.js native pattern (follows framework conventions)
- See ADR-005 for full architectural decision

### File Structure

```
app/agency/[slug]/admin/
├── conversations/
│   ├── @header/
│   │   └── default.tsx          # Server Component for header
│   └── page.tsx                 # Server Component for content
├── contacts/
│   ├── @header/
│   │   └── default.tsx
│   └── page.tsx
└── layout.tsx                   # Accepts header slot parameter
```

### Implementation Pattern

#### 1. Layout Configuration

Update the layout to accept the `header` slot parameter:

```typescript
// app/agency/[slug]/admin/layout.tsx
import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function AgencyAdminLayout({
  children,
  header, // ← Add header slot parameter
  params,
}: {
  children: ReactNode;
  header?: ReactNode; // ← Add type
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organization = await getOrganization(slug);

  return (
    <OrganizationProvider organization={organization}>
      <SidebarProvider>
        <AgencyNavSidebar />
        <SidebarInset>
          <DashboardLayout
            brandName={organization.name}
            organizationHeader={<OrganizationHeader />}
          >
            {header} {/* ← Render header slot before children */}
            {children}
          </DashboardLayout>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
```

#### 2. Create Header Files

Create a `@header/default.tsx` file for each route that needs a header:

```typescript
// app/agency/[slug]/admin/conversations/@header/default.tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

export default function ConversationsHeader() {
  return (
    <PageHeader
      title="Conversations"
      subtitle="Unified inbox for all customer communications"
      tabs={[
        { label: "All", href: "?view=all", active: true },
        { label: "Unread", href: "?view=unread", active: false },
        { label: "Starred", href: "?view=starred", active: false },
      ]}
      actions={
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      }
    />
  );
}
```

#### 3. Optional Headers

Some pages (like Settings) may not need headers. Simply don't create a `@header/` directory:

```typescript
// app/agency/[slug]/admin/settings/
// No @header/ directory = no header rendered
```

#### 4. Client-Side Interactivity

For tabs or actions that need client-side behavior, create a client component:

```typescript
// app/agency/[slug]/admin/analytics/@header/default.tsx
import { AnalyticsHeaderClient } from "./_components/AnalyticsHeaderClient";

export default function AnalyticsHeader() {
  return <AnalyticsHeaderClient />;
}

// _components/AnalyticsHeaderClient.tsx
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useState } from "react";

export function AnalyticsHeaderClient() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <PageHeader
      title="Analytics"
      tabs={[
        { label: "Overview", href: "/analytics", active: true },
        { label: "Revenue", href: "/analytics/revenue", active: false },
      ]}
      actions={
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      }
    />
  );
}
```

### PageHeader Component API

The `PageHeader` component accepts these props:

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tabs?: Array<{
    label: string;
    href: string;
    active: boolean;
  }>;
  actions?: ReactNode;
}
```

### Rules and Best Practices

✅ **DO:**

- Use Server Components for headers by default
- Create `@header/default.tsx` for every route that needs a header
- Keep headers simple (title, tabs, actions only)
- Use `PageHeader` component for consistency
- Use client components only when needed (dropdowns, search, filters)

❌ **DON'T:**

- Use React Context for page headers (deprecated pattern)
- Hardcode headers inside page content components
- Pass header props through multiple component layers
- Create custom header layouts (use PageHeader component)
- Forget to add `header` slot parameter to layout

### Migration from Context Pattern

If you encounter old Context-based headers (`usePageHeader` hook), migrate them:

```typescript
// ❌ OLD: Context pattern (deprecated)
"use client";
import { usePageHeader } from "@/app/providers/page-header-context";

export default function MyPage() {
  const { setConfig } = usePageHeader();
  useEffect(() => {
    setConfig({ title: "My Page" });
  }, [setConfig]);
}

// ✅ NEW: Named Slots pattern
// Create: @header/default.tsx
import { PageHeader } from "@/components/layout/page-header";

export default function MyPageHeader() {
  return <PageHeader title="My Page" />;
}
```

### References

- Implementation Plan: `/docs/technical/NAMED-SLOTS-MIGRATION.md`
- Architectural Decision: ADR-005 in `/docs/technical/architecture-decisions.md`
- [Next.js Parallel Routes Docs](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)

---

## 🎨 Shadcn Component Usage (Component-First Approach)

### Overview

**ALWAYS check shadcn/ui components FIRST before building custom UI**. Our project uses shadcn/ui as the primary component library, and we have 100+ pre-built, accessible components available.

See `/docs/essentials/shadcn.md` for the complete component reference.

### Component-First Decision Tree

```
Need to build UI?
  ↓
1. Check shadcn/ui components first (shadcn.md)
  ↓
2. Component exists?
   → YES: Install via CLI and use it
   → NO: Check if pattern exists (e.g., data-table)
  ↓
3. Pattern exists?
   → YES: Follow pattern guide
   → NO: Build custom component
```

### Commonly Used Shadcn Components

#### Input with Icons/Prefix

```tsx
// ❌ DON'T: Manual icon positioning
<div className="relative">
  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4" />
  <Input className="pl-8" />
</div>;

// ✅ DO: Use InputGroup component
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

<InputGroup>
  <InputGroupAddon>
    <IconSearch className="h-4 w-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>;
```

#### Empty States

```tsx
// ❌ DON'T: Plain text empty states
<div className="text-center">No data found.</div>;

// ✅ DO: Use Empty component
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <IconInbox className="h-6 w-6" />
    </EmptyMedia>
    <EmptyTitle>No data found</EmptyTitle>
    <EmptyDescription>Try adjusting your filters</EmptyDescription>
  </EmptyHeader>
</Empty>;
```

#### Pagination

```tsx
// ❌ DON'T: Text-based pagination
<div className="text-sm">Showing 1-10 of 100</div>;

// ✅ DO: Use Pagination component
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>
        1
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>;
```

#### Loading States

```tsx
// ❌ DON'T: Custom spinner implementations
<div className="animate-spin">Loading...</div>;

// ✅ DO: Use Spinner component
import { Spinner } from "@/components/ui/spinner";

<Spinner />;
```

#### Alerts and Messages

```tsx
// ❌ DON'T: Plain div messages
<div className="text-red-500">Error occurred</div>;

// ✅ DO: Use Alert component
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>An error occurred</AlertDescription>
</Alert>;
```

### Installation Command

```bash
# Install any shadcn component via CLI
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add input-group
npx shadcn@latest add empty
npx shadcn@latest add pagination
npx shadcn@latest add alert
npx shadcn@latest add spinner
```

---

## 📊 DataTable Pattern (TanStack Table + Shadcn)

### Overview

**Use TanStack Table for ALL data tables** - This is the industry-standard pattern for React data tables in 2025.

**Benefits:**

- Built-in sorting, filtering, pagination
- Type-safe with TypeScript generics
- Reusable across all features (appointments, contacts, inventory, payments, etc.)
- Industry-validated 2025 best practice

### File Structure

```
components/dashboard/[feature]/
├── columns.tsx       # Column definitions (client component)
├── data-table.tsx    # Reusable DataTable component (client component)
└── [feature]-table.tsx  # Wrapper component (client component)
```

### Implementation Pattern

#### 1. Define Columns (columns.tsx)

```typescript
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react";

export const paymentColumns: ColumnDef<PaymentWithRelations>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice #
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("invoiceNumber") || "—"}</div>;
    },
  },
  // ... more columns
];
```

#### 2. Create Reusable DataTable (data-table.tsx)

```typescript
"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchColumn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      {/* Search Input */}
      {searchColumn && (
        <InputGroup>
          <InputGroupAddon>
            <IconSearch className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
          />
        </InputGroup>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No data found</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

#### 3. Wrapper Component ([feature]-table.tsx)

```typescript
"use client";

import { DataTable } from "./data-table";
import { paymentColumns } from "./columns";
import type { PaymentWithRelations } from "./payments-client";

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      title="Payment Transactions"
      searchPlaceholder="Search payments..."
      searchColumn="patientName"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Status" },
        { value: "PAID", label: "Paid" },
        { value: "PENDING", label: "Pending" },
        { value: "FAILED", label: "Failed" },
      ]}
    />
  );
}
```

**DataTable Props:**

- `columns` (required) - Column definitions from TanStack Table
- `data` (required) - Array of data to display
- `title` (required) - Table title shown in CardHeader
- `searchPlaceholder` (optional) - Placeholder text for search input
- `searchColumn` (optional) - Column to search (if omitted, no search shown)
- `statusFilterColumn` (optional) - Column to filter by status
- `statusFilterOptions` (optional) - Status filter dropdown options (if omitted, no filter shown)

### Key Rules for DataTables

✅ **DO:**

- Use TanStack Table for all data tables
- Define columns separately in columns.tsx
- Create reusable DataTable component per feature
- Use shadcn components (InputGroup, Empty, Pagination)
- Set default sorting via initialState
- Use TypeScript generics for type safety

❌ **DON'T:**

- Build manual filtering/sorting logic
- Create duplicate DataTable components per route
- Use plain text for empty states or pagination
- Skip pagination for large datasets
- Hardcode column definitions in table component

### Quick Start: Building a New Table

**Example: Creating an Appointments Table**

1. **Copy the payment table structure:**

```bash
cp -r components/dashboard/payments components/dashboard/appointments
```

2. **Update file names:**

```bash
cd components/dashboard/appointments
mv payments-client.tsx appointments-client.tsx
mv payments-table.tsx appointments-table.tsx
```

3. **Update `columns.tsx`:**

```typescript
// Define your appointment columns
export const appointmentColumns: ColumnDef<AppointmentWithRelations>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    // ... column config
  },
  {
    accessorKey: "date",
    header: "Date",
    // ... column config
  },
  // ... more columns
];
```

4. **Update `appointments-table.tsx`:**

```typescript
export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  return (
    <DataTable
      columns={appointmentColumns}
      data={appointments}
      title="Appointments"
      searchPlaceholder="Search appointments..."
      searchColumn="patientName"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Statuses" },
        { value: "SCHEDULED", label: "Scheduled" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ]}
    />
  );
}
```

**That's it!** You now have a fully functional appointments table with:

- ✅ Sorting on all columns
- ✅ Column resizing (12px wide handles)
- ✅ Search functionality
- ✅ Status filtering
- ✅ Pagination (10 items per page)
- ✅ Empty states
- ✅ Responsive design

### Reusability

The same DataTable pattern can be used for:

- **Appointments Table** - Patient scheduling and calendar integration
- **Contacts Table** - GHL contact management
- **Inventory Table** - Product and supply tracking
- **Reviews Table** - Client feedback management

### Reference Implementation

See `/components/dashboard/payments/` for the complete reference:

- `columns.tsx` - Payment column definitions with sorting, badges, formatting
- `data-table.tsx` - Reusable DataTable with search, filters, pagination, column resizing
- `payments-table.tsx` - Wrapper component showing prop configuration

---

**Remember**: When in doubt, copy an existing pattern rather than creating a new one.
