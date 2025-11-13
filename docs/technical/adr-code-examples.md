# ADR Code Examples

**Purpose:** Code examples for Architecture Decision Records. This file contains implementation patterns referenced by ADRs in `architecture-decisions.md`.

**Navigation:** Each section corresponds to an ADR. Use your editor's search to find specific ADR examples.

---

## ADR-001: Direct Server Action Imports vs Callback Injection

### Rejected Pattern: Callback Injection

```typescript
// Wrapper component
<NewChapterModal
  courseId={courseId}
  onSubmit={(data) => createChapter(slug, data)}  // ← Injected callback
/>

// Shared component receives callback as prop
interface NewChapterModalProps {
  courseId: string;
  onSubmit: (data: ChapterSchemaType) => Promise<ApiResponse>;
}
```

### Approved Pattern: Direct Server Action Imports

```typescript
// No wrapper needed - use component directly in page
<NewChapterModal
  courseId={courseId}
  organizationContext={{ type: 'agency', slug: params.slug }}
/>

// Component imports action directly
import { createChapter } from '@/actions/courses';

export function NewChapterModal({ courseId, organizationContext }: Props) {
  async function handleSubmit(values: ChapterSchemaType) {
    await createChapter({
      ...values,
      context: organizationContext
    });
  }
}
```

### Unified Server Actions

```typescript
// actions/courses.ts
export async function createChapter(params: {
  name: string;
  courseId: string;
  context: OrganizationContext;
}) {
  if (params.context.type === 'agency') {
    const { organization } = await requireAgencyAdmin(params.context.slug);
    // Agency-specific logic with organizationId scoping
  } else {
    await requireAdmin();
    // Platform-specific logic
  }

  // Shared creation logic
  revalidatePath(...); // Context-specific path
}
```

### Type Safety

```typescript
export type OrganizationContext =
  | { type: "platform" }
  | { type: "agency"; slug: string };
```

### Component Pattern

```typescript
// Shared components import actions directly
import {
  createChapter,
  deleteChapter,
  reorderChapters,
} from "@/actions/courses";

export function CourseStructure({
  course,
  organizationContext,
  basePath,
}: Props) {
  // Direct action calls with context
  const handleReorder = async (data: ReorderData[]) => {
    await reorderChapters({
      courseId: course.id,
      chapters: data,
      context: organizationContext,
    });
  };
}
```

### Page Simplification

```typescript
// Before: Wrapper with callback injection
export default async function CourseEditPage({ params }) {
  const course = await getCourse(params.courseId);
  return <AgencyCourseEditClient course={course} courseId={params.courseId} slug={params.slug} />;
}

// After: Direct component usage
export default async function CourseEditPage({ params }) {
  const course = await getCourse(params.courseId);
  return (
    <CourseStructure
      course={course}
      organizationContext={{ type: 'agency', slug: params.slug }}
      basePath={`/agency/${params.slug}/admin/courses`}
    />
  );
}
```

---

## ADR-006: URL-Based Navigation Tabs vs Client-Side Tabs

### PageHeader - Simplified (No Tabs)

```typescript
export function PageHeader({
  title,
  subtitle,
  actions,
  compact
}: PageHeaderProps) {
  return (
    <div className="bg-background">
      <div className="flex items-center justify-between border-b px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground">›</span>
              <h2 className="text-lg text-primary font-medium">{subtitle}</h2>
            </>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

### NavTabs Component - URL-Based Navigation

```typescript
export function NavTabs({ tabs, baseUrl, paramName = "tab" }: NavTabsProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get(paramName) || tabs[0]?.value || "";

  return (
    <div className="border-b bg-background">
      <nav className="flex gap-6 px-4 lg:px-6 py-3 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          const href = tab.value === tabs[0].value
            ? baseUrl  // Default tab doesn't need query param
            : `${baseUrl}?${paramName}=${tab.value}`;

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "border-b-2 px-1 text-sm font-medium whitespace-nowrap",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

### Page Implementation - Server Component

```typescript
type SearchParams = Promise<{ tab?: string }>;

export default async function ContactsPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "all";

  // Fetch data based on active tab (server-side)
  const contacts = await getContacts({ filter: activeTab });

  return (
    <div className="flex flex-1 flex-col gap-0">
      <NavTabs
        baseUrl="/platform/admin/contacts"
        tabs={[
          { label: "All", value: "all", count: 77 },
          { label: "Smart Lists", value: "smart-lists", count: 5 },
          { label: "Companies", value: "companies", count: 12 },
        ]}
      />

      {activeTab === "all" && <ContactsPageClient contacts={contacts} />}
      {activeTab === "smart-lists" && <SmartListsView />}
      {activeTab === "companies" && <CompaniesView />}
    </div>
  );
}
```

### Correct Usage Pattern

```typescript
// ✅ Use NavTabs in page content with URL params
<div className="flex flex-1 flex-col gap-0">
  <NavTabs
    baseUrl="/path"
    tabs={[
      { label: "Tab 1", value: "tab1" },
      { label: "Tab 2", value: "tab2" },
    ]}
  />

  {activeTab === "tab1" && <Tab1Content />}
  {activeTab === "tab2" && <Tab2Content />}
</div>
```

### Anti-Pattern to Avoid

```typescript
// ❌ Don't put tabs in PageHeader
<PageHeader
  title="Page Title"
  tabs={[...]}  // ← This prop no longer exists
/>

// ❌ Don't use client-side tab state
const [activeTab, setActiveTab] = useState("tab1");
```

---

## ADR-008: PageContainer Component for Standardized Page Spacing

### Component Implementation

```typescript
export type PageContainerVariant =
  | "default"   // p-4 md:p-6 gap-4 md:gap-6 (most common)
  | "padded"    // flex-1 p-4 md:p-6 gap-4 md:gap-6 (data tables)
  | "fill"      // flex-1 (custom layouts)
  | "tight"     // p-4 md:p-6 gap-3 md:gap-4 (contacts-style)
  | "tabs"      // p-4 md:p-6 gap-0 (NavTabs integration)
  | "none";     // No wrapper (split-pane layouts)

export function PageContainer({
  children,
  variant = "default",
  className,
  as: Component = "div", // Semantic HTML support
}: PageContainerProps) {
  // Special case: "none" renders children directly
  if (variant === "none") return <>{children}</>;

  const variantStyles: Record<PageContainerVariant, string> = {
    default: "p-4 md:p-6 gap-4 md:gap-6",
    padded: "flex-1 p-4 md:p-6 gap-4 md:gap-6",
    fill: "flex-1",
    tight: "p-4 md:p-6 gap-3 md:gap-4",
    tabs: "p-4 md:p-6 gap-0",
    none: "",
  };

  return (
    <Component
      data-component="page-container"
      data-variant={variant}
      className={cn("flex flex-col", variantStyles[variant], className)}
    >
      {children}
    </Component>
  );
}
```

### Usage Examples

```typescript
// Standard page
export default async function DashboardPage() {
  return (
    <PageContainer as="main">
      <StatsCards />
    </PageContainer>
  );
}

// Data table page
export default async function MembersPage() {
  return (
    <PageContainer variant="padded" as="main">
      <SummaryCards />
      <MembersTable />
    </PageContainer>
  );
}
```

---

## ADR-009: Dual Role System for Multi-Tenant Access Control

### Prisma Schema

```prisma
enum UserRole {
  platform_admin      // Platform employees (cross-tenant access)
  church_owner        // Primary account holder (billing admin)
  church_admin        // Church team member (can manage content/members)
  volunteer_leader    // Volunteer coordinator
  user                // Default role (end user/client)
}

model Member {
  id             String       @id @default(uuid())
  userId         String
  organizationId String
  role           String       // "owner", "admin", "member"
}
```

### Role Mapping Implementation

```typescript
// /lib/role-mapping.ts

export type UIRole = "owner" | "admin" | "member";

export function mapUIRoleToUserRole(uiRole: UIRole): UserRole {
  switch (uiRole) {
    case "owner":
      return "church_owner";
    case "admin":
      return "church_admin";
    case "member":
      return "user";
  }
}

export function mapUserRoleToUIRole(userRole: UserRole | null): UIRole {
  switch (userRole) {
    case "church_owner":
      return "owner";
    case "church_admin":
      return "admin";
    case "user":
      return "member";
    case "volunteer_leader":
      return "member"; // Treat volunteer leaders as staff
    case "platform_admin":
      throw new Error("Platform admins should not be displayed in org UI");
    case null:
      return "member"; // Default fallback
  }
}
```

### Implementation Pattern

```typescript
// Always update BOTH User.role (global) and Member.role (org-specific)

import { mapUIRoleToUserRole } from "@/lib/role-mapping";

export async function updateMember(slug: string, data: UpdateMemberInput) {
  const userRole = mapUIRoleToUserRole(role as UIRole);

  await prisma.$transaction([
    // Update User.role (global platform role)
    prisma.user.update({
      where: { id: memberId },
      data: {
        role: userRole, // Prisma enum: "church_admin" or "user"
        defaultLocationId: locationId,
      },
    }),
    // Update Member.role (organization-specific role)
    prisma.member.update({
      where: { id: member.id },
      data: {
        role, // String: "admin" or "member"
      },
    }),
  ]);
}
```

### Permission Checks

```typescript
// Example from require-dashboard-access.ts
if (member.role === "owner") {
  dataScope.filters.canManageUsers = true; // Only owners manage users
}
```

---

## ADR-010: Volunteer Management Schema

### Volunteer Profile

```prisma
model Volunteer {
  id                    String                @id @default(uuid())
  churchMemberId        String                @unique
  organizationId        String
  locationId            String?
  status                VolunteerStatus       @default(ACTIVE)
  startDate             DateTime              @default(now())
  endDate               DateTime?
  emergencyContactName  String?
  emergencyContactPhone String?
  backgroundCheckStatus BackgroundCheckStatus @default(NOT_STARTED)
  backgroundCheckDate   DateTime?
  backgroundCheckExpiry DateTime?
  notes                 String?
  customFields          Json?

  churchMember          ChurchMember          @relation(...)
  skills                VolunteerSkill[]
  availability          VolunteerAvailability[]
  shifts                VolunteerShift[]
}
```

### Serving Opportunity

```prisma
model ServingOpportunity {
  id                 String                 @id @default(uuid())
  organizationId     String
  locationId         String?
  name               String                  // "Sunday Greeter"
  description        String?
  category           String?                 // "Hospitality"
  volunteersNeeded   Int                     @default(1)
  dayOfWeek          Int?                    // 0=Sunday
  serviceTime        String?                 // "9:00 AM Service"
  durationMinutes    Int?
  isActive           Boolean                 @default(true)
  isRecurring        Boolean                 @default(true)
  recurrencePattern  RecurrencePattern?      @default(WEEKLY)

  requiredSkills     ServingOpportunitySkill[]
  shifts             VolunteerShift[]
}
```

### Volunteer Shift

```prisma
model VolunteerShift {
  id                   String             @id @default(uuid())
  organizationId       String
  locationId           String?
  volunteerId          String
  servingOpportunityId String
  shiftDate            DateTime
  startTime            String
  endTime              String
  status               ShiftStatus        @default(SCHEDULED)
  isConfirmed          Boolean            @default(false)
  checkInTime          DateTime?
  checkOutTime         DateTime?
  reminderSent         Boolean            @default(false)

  volunteer            Volunteer          @relation(...)
  servingOpportunity   ServingOpportunity @relation(...)
}
```

### Enums

```prisma
enum VolunteerStatus {
  ACTIVE
  ON_BREAK
  INACTIVE
  PENDING_APPROVAL
}

enum BackgroundCheckStatus {
  NOT_STARTED
  IN_PROGRESS
  CLEARED
  FLAGGED
  EXPIRED
}

enum AvailabilityType {
  RECURRING    // Regular weekly schedule
  BLACKOUT     // Unavailable period
  ONE_TIME     // Special event
}

enum RecurrencePattern {
  WEEKLY
  BIWEEKLY
  MONTHLY
  FIRST_OF_MONTH
  THIRD_OF_MONTH
  ONE_TIME
}

enum ShiftStatus {
  SCHEDULED
  CONFIRMED
  CHECKED_IN
  COMPLETED
  NO_SHOW
  CANCELLED
}
```

### Data Isolation

```typescript
// Every query must filter by organizationId
const volunteers = await prisma.volunteer.findMany({
  where: {
    organizationId: user.organizationId, // REQUIRED
    ...getLocationFilter(dataScope), // Location-based filtering
  },
});
```

### Database Indexes

```prisma
// Volunteer
@@index([organizationId])
@@index([organizationId, status])
@@index([organizationId, locationId])
@@index([backgroundCheckStatus])

// ServingOpportunity
@@index([organizationId])
@@index([organizationId, isActive])
@@index([organizationId, locationId])
@@index([organizationId, category])

// VolunteerShift
@@index([organizationId])
@@index([organizationId, shiftDate])
@@index([organizationId, locationId])
@@index([volunteerId])
@@index([servingOpportunityId])
@@index([shiftDate, status])
```

---

**Reference:** See `/docs/technical/architecture-decisions.md` for decision rationale and context.
