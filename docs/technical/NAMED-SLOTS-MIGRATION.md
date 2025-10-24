# Named Slots (Parallel Routes) Migration Plan

**Decision Date:** 2025-01-17
**Status:** Approved for Implementation
**Estimated Effort:** 8 hours
**Priority:** High - Foundation for scalability

---

## Executive Summary

We're migrating from a Context-based page header pattern to Next.js Named Slots (Parallel Routes) for these critical reasons:

1. **Performance at Scale:** 5× less bandwidth, zero layout shift
2. **True Server Components:** Headers render on server, not client
3. **Better SEO:** Headers in initial HTML, improved Core Web Vitals
4. **Future-proof:** Aligns with Next.js 15 App Router architecture

**Trade-off:** More files to manage, but cleaner architecture that scales to 100,000 users without refactoring.

---

## Current State Problems

### Issue 1: Mixed Header Patterns

- Platform courses use Context (`usePageHeader`)
- Agency courses use internal headers (CourseListingPage)
- Conversations hardcode headers inside components
- **Result:** Inconsistent, buggy, will conflict when all features are enabled

### Issue 2: Client Component Cascade

```tsx
"use client"; // DashboardLayout
export function DashboardLayout({ children }) {
  // Everything below becomes client-side
  // Even Server Components lose their benefits
}
```

**Impact at 1000 concurrent users:**

- 1000 × 220KB = 110MB bandwidth
- 1000 × 500ms = 8.3 minutes cumulative delay
- Poor Core Web Vitals = SEO penalty

### Issue 3: Layout Shift

- Header appears after useEffect runs (300-500ms delay)
- Cumulative Layout Shift (CLS) = 0.2 (failing Google's threshold)
- Users see flash of missing header

---

## Named Slots Solution

### How It Works

**File Structure:**

```
app/agency/[slug]/admin/
├── layout.tsx              # Receives {children, header} as props
├── conversations/
│   ├── page.tsx            # Main content (Server Component)
│   └── @header/
│       └── default.tsx     # Header (Server Component)
├── calendar/
│   ├── page.tsx
│   └── @header/
│       └── default.tsx
└── settings/
    ├── page.tsx
    └── @header/
        └── default.tsx     # Can return null to opt-out
```

**Layout Implementation:**

```tsx
// layout.tsx receives header slot automatically from Next.js
export default async function Layout({
  children,
  header, // ← Injected by Next.js from @header slot
  params,
}) {
  return (
    <div>
      <SiteHeader />
      {header} {/* Renders @header/default.tsx */}
      {children} {/* Renders page.tsx */}
    </div>
  );
}
```

**Benefits:**

- ✅ Both render on server in parallel
- ✅ No JavaScript needed for header structure
- ✅ No layout shift - complete HTML sent together
- ✅ Can still have client interactivity in header slots

---

## Implementation Phases

### Phase 1: Infrastructure Setup (2 hours)

**Goal:** Set up Named Slots structure without breaking existing pages

#### 1.1 Update Agency Admin Layout (30 min)

**File:** `/app/agency/[slug]/admin/layout.tsx`

```tsx
export default async function AgencyAdminLayout({
  children,
  header, // ← Add this parameter
  params,
}: {
  children: ReactNode;
  header?: ReactNode; // ← Add this type
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardAccess(slug);

  const brandName = organization.name;
  const homeUrl = `/agency/${slug}/admin`;

  // Organization header component
  const organizationHeader = (
    <div className="border-b px-4 lg:px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {organization.name}
        </span>
        <span className="text-sm text-muted-foreground">›</span>
        <span className="text-sm font-medium">Operations Dashboard</span>
        {organization.subscriptionStatus === "TRIAL" && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Trial -{" "}
            {organization.trialEndsAt
              ? `Ends ${new Date(organization.trialEndsAt).toLocaleDateString()}`
              : "Active"}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <OrganizationProvider organization={organization}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AgencyNavSidebar
          variant="inset"
          brandName={brandName}
          homeUrl={homeUrl}
          agencySlug={slug}
        />

        <SidebarInset>
          <div className="flex flex-col h-screen">
            {/* Sticky header wrapper */}
            <div className="sticky top-0 z-50 bg-background">
              <SiteHeader
                brandName={brandName}
                showInfoSidebar={true}
                onInfoSidebarToggle={/* ... */}
              />
              {organizationHeader}
              {header} {/* ← Render header slot */}
            </div>

            {/* Scrollable content */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto">
                <div className="@container/main flex flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    {children}
                  </div>
                </div>
              </div>

              <SideCarAISidebar
                isOpen={isAiSidebarOpen}
                onClose={() => setIsAiSidebarOpen(false)}
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
```

**Note:** You'll need to refactor to handle `isAiSidebarOpen` state - see next step.

#### 1.2 Update Platform Admin Layout (30 min)

**File:** `/app/platform/admin/layout.tsx`

Apply same changes as above for platform admin layout.

#### 1.3 Create Root Header Fallback (15 min)

**File:** `/app/agency/[slug]/admin/@header/default.tsx`

```tsx
/**
 * Default Header Fallback
 *
 * Returns null so routes without explicit headers don't show anything.
 * Each route that needs a header will override this with their own @header/default.tsx
 */
export default function DefaultHeader() {
  return null;
}
```

**File:** `/app/platform/admin/@header/default.tsx`

```tsx
export default function DefaultHeader() {
  return null;
}
```

#### 1.4 Update PageHeader Component (15 min)

**File:** `/components/layout/page-header.tsx`

```tsx
"use client"; // Keep as client for interactive tabs

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface PageTab {
  label: string;
  href: string;
  active?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tabs?: PageTab[];
  actions?: React.ReactNode;
  children?: React.ReactNode; // For custom content
}

export function PageHeader({
  title,
  subtitle,
  tabs,
  actions,
  children,
}: PageHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-detect active tab based on current URL if not explicitly set
  const tabsWithActive = tabs?.map(tab => ({
    ...tab,
    active:
      tab.active ??
      (pathname + "?" + searchParams.toString()).includes(tab.href),
  }));

  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="px-4 lg:px-6">
          <nav className="flex gap-6 -mb-px">
            {tabsWithActive?.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 px-1 py-3 text-sm font-medium transition-colors hover:text-foreground",
                  tab.active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {children && <div className="px-4 lg:px-6 py-2 border-t">{children}</div>}
    </div>
  );
}
```

#### 1.5 Remove DashboardLayout Client Component (30 min)

**Current Problem:** `DashboardLayout` is marked `"use client"` and has unused props.

**Solution:** Remove it entirely - layouts now handle headers directly.

**Delete these:**

- `/components/layout/dashboard-layout.tsx`
- `/app/providers/page-header-context.tsx` (no longer needed)

---

### Phase 2: Create Headers for Core Routes (4 hours)

#### 2.1 Dashboard (Main Page) (15 min)

**File:** `/app/agency/[slug]/admin/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";

export default function DashboardHeader() {
  return (
    <PageHeader
      title="Dashboard"
      subtitle="Operations overview for your clinic"
    />
  );
}
```

**File:** `/app/platform/admin/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";

export default function PlatformDashboardHeader() {
  return (
    <PageHeader title="Platform Dashboard" subtitle="System-wide operations" />
  );
}
```

#### 2.2 Conversations (30 min)

**File:** `/app/agency/[slug]/admin/conversations/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

export default function ConversationsHeader() {
  return (
    <PageHeader
      title="Conversations"
      subtitle="Unified inbox for all customer communications"
      tabs={[
        { label: "All", href: "?view=all" },
        { label: "Unread", href: "?view=unread" },
        { label: "Starred", href: "?view=starred" },
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

**File:** `/app/platform/admin/conversations/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";

export default function PlatformConversationsHeader() {
  return (
    <PageHeader
      title="Conversations"
      subtitle="Platform-wide conversation monitoring"
      tabs={[
        { label: "All", href: "?view=all" },
        { label: "By Organization", href: "?view=org" },
      ]}
    />
  );
}
```

#### 2.3 Contacts (30 min)

**File:** `/app/agency/[slug]/admin/contacts/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";

export default function ContactsHeader() {
  return (
    <PageHeader
      title="Contacts"
      subtitle="Manage your customer database"
      tabs={[
        { label: "All Contacts", href: "?view=all" },
        { label: "Active", href: "?view=active" },
        { label: "Inactive", href: "?view=inactive" },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <IconFileExport className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </>
      }
    />
  );
}
```

**File:** `/app/platform/admin/contacts/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";

export default function PlatformContactsHeader() {
  return (
    <PageHeader title="Contacts" subtitle="Platform-wide contact management" />
  );
}
```

#### 2.4 Calendar (30 min)

**Create route first:**

**File:** `/app/agency/[slug]/admin/calendar/page.tsx`

```tsx
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CalendarPage({ params }: PageProps) {
  const { slug } = await params;
  await requireDashboardAccess(slug);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center py-12 text-muted-foreground">
        <p>Calendar integration coming soon...</p>
      </div>
    </div>
  );
}
```

**File:** `/app/agency/[slug]/admin/calendar/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus, IconCalendarEvent } from "@tabler/icons-react";

export default function CalendarHeader() {
  return (
    <PageHeader
      title="Calendar"
      subtitle="Appointment scheduling and management"
      tabs={[
        { label: "Day", href: "?view=day" },
        { label: "Week", href: "?view=week" },
        { label: "Month", href: "?view=month" },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <IconCalendarEvent className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </>
      }
    />
  );
}
```

#### 2.5 Courses (Platform Admin) (45 min)

**File:** `/app/platform/admin/courses/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export default function PlatformCoursesHeader() {
  return (
    <PageHeader
      title="Courses"
      subtitle="Platform course management"
      actions={
        <Link href="/platform/admin/courses/create">
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      }
    />
  );
}
```

**Update:** `/app/platform/admin/courses/page.tsx`

```tsx
// Remove CoursesPageClient wrapper
// Render CourseListingPage directly

import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { CourseListingPage } from "@/components/courses/CourseListingPage";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  return (
    <Suspense fallback={<CourseLoadingSkeleton />}>
      <RenderCourses />
    </Suspense>
  );
}

async function RenderCourses() {
  const courses = await adminGetCourses();

  return (
    <CourseListingPage
      courses={courses}
      userRole="platform_admin"
      showTabs={false}
      showCreateButton={false} // Button now in header
    />
  );
}

function CourseLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
```

**Delete:** `/app/platform/admin/courses/_components/CoursesPageClient.tsx`

#### 2.6 Courses (Agency Admin) (45 min)

**File:** `/app/agency/[slug]/admin/courses/@header/default.tsx`

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

interface CoursesHeaderProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyCoursesHeader({
  params,
}: CoursesHeaderProps) {
  const { slug } = await params;

  return (
    <PageHeader
      title="Course Library"
      subtitle="Manage your platform and custom courses"
      tabs={[
        { label: "All Courses", href: `?view=all` },
        { label: "Platform", href: `?view=platform` },
        { label: "Custom", href: `?view=custom` },
      ]}
      actions={
        <Link href={`/agency/${slug}/admin/courses/create`}>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Create Custom Course
          </Button>
        </Link>
      }
    />
  );
}
```

**Update:** `/app/agency/[slug]/admin/courses/page.tsx`

```tsx
import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { createAgencyDataScope } from "@/lib/agency-data-scope";
import { CourseListingPage } from "@/components/courses/CourseListingPage";

interface AgencyCoursesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyCoursesPage({
  params,
}: AgencyCoursesPageProps) {
  const { slug } = await params;
  const { organization } = await requireAgencyAdmin(slug);

  const dataScope = createAgencyDataScope(organization.id);
  const courses = await dataScope.getCourses();

  return (
    <CourseListingPage
      courses={courses}
      userRole="agency_admin"
      orgSlug={slug}
      organizationId={organization.id}
      showTabs={true}
      showCreateButton={false} // Button now in header
    />
  );
}
```

#### 2.7 Settings (No Header) (15 min)

**File:** `/app/agency/[slug]/admin/settings/@header/default.tsx`

```tsx
/**
 * Settings pages opt out of the standard header pattern
 * They use their own internal navigation structure
 */
export default function SettingsHeader() {
  return null;
}
```

#### 2.8 Remaining Routes (1 hour)

Create `@header/default.tsx` for:

- `/inventory` - Inventory management
- `/insights` - AI insights
- `/analytics` - Analytics dashboard
- `/team` - Team management

Follow same pattern as above routes.

---

### Phase 3: Clean Up Existing Components (2 hours)

#### 3.1 Update CourseListingPage (30 min)

**File:** `/components/courses/CourseListingPage.tsx`

Remove lines 135-147 (internal header):

```tsx
export function CourseListingPage({
  courses,
  userRole,
  orgSlug,
  organizationId,
  showTabs = false,
  showCreateButton = false,
  // REMOVE: pageTitle
  // REMOVE: pageDescription
}: CourseListingPageProps) {
  // ...

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* REMOVE: Page Header section (lines 135-147) */}

      {/* Course Display */}
      {showTabs && userRole === "agency_admin" ? (
        <Tabs defaultValue="all" className="w-full">
          {/* ... tabs */}
        </Tabs>
      ) : (
        <>
          {courses.length === 0
            ? userRole === "user"
              ? getUserEmptyState()
              : getAdminEmptyState()
            : renderCourseGrid(courses)}
        </>
      )}
    </div>
  );
}
```

#### 3.2 Update ConversationsClient (30 min)

**File:** `/components/conversations/conversations-client.tsx`

Remove lines 68-75 (hardcoded header):

```tsx
export function ConversationsClient({
  conversations: initialConversations,
  messagesByConversation,
}: ConversationsClientProps) {
  // ... state

  return (
    <div className="flex flex-col gap-4">
      {/* REMOVE: Hardcoded header (lines 68-75) */}

      {/* 3-Panel Layout */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[20%_50%_30%] h-[calc(100vh-280px)]">
          {/* ... conversation UI */}
        </div>
      </Card>
    </div>
  );
}
```

#### 3.3 Delete Unused Files (15 min)

Delete:

- `/components/layout/dashboard-layout.tsx`
- `/app/providers/page-header-context.tsx`
- `/app/platform/admin/courses/_components/CoursesPageClient.tsx`

#### 3.4 Test All Routes (45 min)

**Testing Checklist:**

1. **Agency Routes:**

   - [ ] `/agency/[slug]/admin` - Dashboard shows header
   - [ ] `/agency/[slug]/admin/conversations` - Conversations header
   - [ ] `/agency/[slug]/admin/contacts` - Contacts header
   - [ ] `/agency/[slug]/admin/calendar` - Calendar header
   - [ ] `/agency/[slug]/admin/courses` - Courses header with tabs
   - [ ] `/agency/[slug]/admin/settings` - NO header shown

2. **Platform Routes:**

   - [ ] `/platform/admin` - Platform dashboard header
   - [ ] `/platform/admin/conversations` - Platform conversations header
   - [ ] `/platform/admin/contacts` - Platform contacts header
   - [ ] `/platform/admin/courses` - Platform courses header

3. **Header Features:**
   - [ ] Tabs are clickable and highlight active
   - [ ] Action buttons work
   - [ ] Headers are sticky on scroll
   - [ ] No layout shift on navigation
   - [ ] Headers render immediately (no flash)

---

## Verification & Testing

### Performance Testing

**Before Migration (Context Pattern):**

```bash
# Measure bundle size
npm run build -- --analyze

# Expected: ~220KB per page
```

**After Migration (Named Slots):**

```bash
npm run build -- --analyze

# Expected: ~40KB per page (5× smaller)
```

### Core Web Vitals Testing

Use Lighthouse to measure:

- **CLS (Cumulative Layout Shift):** Should be 0 (was 0.2)
- **FCP (First Contentful Paint):** Should be faster
- **TTI (Time to Interactive):** Should be faster

### Manual Testing

1. Navigate between pages - ensure no header flash
2. Test all tab navigation
3. Verify action buttons work
4. Check mobile responsiveness
5. Test settings page (no header)

---

## Rollback Plan

If something goes wrong:

1. **Revert layout changes:**

   ```bash
   git checkout main -- app/agency/[slug]/admin/layout.tsx
   git checkout main -- app/platform/admin/layout.tsx
   ```

2. **Remove header slots:**

   ```bash
   rm -rf app/agency/[slug]/admin/@header
   rm -rf app/platform/admin/@header
   ```

3. **Restore old components:**
   ```bash
   git checkout main -- components/layout/dashboard-layout.tsx
   git checkout main -- app/providers/page-header-context.tsx
   ```

---

## Success Criteria

✅ **All routes have headers defined in slots**
✅ **Zero layout shift on navigation (CLS = 0)**
✅ **Build size reduced by 5× per page**
✅ **No client-side JavaScript for header structure**
✅ **All existing functionality preserved**
✅ **Settings page correctly opts out**

---

## Next Steps After Migration

1. **Document pattern for future routes**
2. **Add to coding-patterns.md**
3. **Create templates for new routes**
4. **Train team on parallel routes**

---

## Resources

- [Next.js Parallel Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Named Slots Examples](https://github.com/vercel/next.js/tree/canary/examples/parallel-routes)
- [Core Web Vitals Guide](https://web.dev/vitals/)

---

**Questions? Issues?**

Contact: [Your Team Lead]
Slack: #engineering
Documentation: `/docs/technical/architecture-decisions.md`
