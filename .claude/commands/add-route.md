---
description: Scaffold new route following all project patterns
argument-hint: [route-path] [route-title]
model: claude-sonnet-4-5-20250929
---

# Add New Route

Scaffold a new route following ALL established patterns from coding-patterns.md.

**Usage:** `/add-route [route-path] [route-title]`

**Examples:**

- `/add-route app/church/[slug]/admin/events "Events"`
- `/add-route app/church/[slug]/admin/volunteers "Volunteers"`
- `/add-route app/platform/admin/analytics "Analytics"`

## Your Tasks:

### 1. Parse Route Information

Extract from `$ARGUMENTS`:

- **Route path:** Full path to page.tsx
- **Route title:** Display name for navigation
- **Route type:** Determine context (church admin, platform admin, settings, etc.)
- **Route slug:** Extract organization slug if present (e.g., `[slug]`)

### 2. Determine PageContainer Variant

**Use decision tree from coding-patterns.md (lines 280-316):**

```
What type of page?
  ├─ Data table (sortable, filterable, scrollable)
  │   → variant="padded"
  │   Examples: Members, Appointments, Analytics
  │
  ├─ Standard page (dashboard, settings, forms)
  │   → variant="default" or omit variant prop
  │   Examples: Dashboard with cards, Settings pages, Profile forms
  │
  ├─ NavTabs integration (tabs at top of page)
  │   → variant="tabs"
  │   Examples: Contacts with tabs, Settings with tabs
  │
  ├─ Custom layout (component manages own spacing)
  │   → variant="none"
  │   Examples: Conversations split-pane, Course editor
  │
  ├─ Custom full-height canvas (no padding)
  │   → variant="fill"
  │   Examples: Calendar UI, Preview pages
  │
  └─ Tighter spacing needed (12px/16px gaps)
      → variant="tight"
```

**Ask user which variant to use based on page type.**

### 3. Check Existing Similar Routes

Before creating, search for similar implementations:

```bash
# Find similar routes
find app/church -name "page.tsx" -type f | grep -i "<feature-keyword>"
```

Read 1-2 similar routes to understand patterns.

### 4. Update Navigation Config (CRITICAL)

**Single source of truth:** `/lib/navigation.ts`

Add new route to appropriate navigation function:

**For Church Routes:**

```typescript
// lib/navigation.ts
export function getChurchNavigation(slug: string): NavigationConfig {
  return {
    navMain: [
      {
        title: "<Route Title>",
        url: `/church/${slug}/admin/<route-name>`,
      },
      // ... existing items
    ],
  };
}
```

**For Platform Routes:**

```typescript
// lib/navigation.ts
export function getPlatformNavigation(): NavigationConfig {
  return {
    navMain: [
      {
        title: "<Route Title>",
        url: `/platform/admin/<route-name>`,
      },
      // ... existing items
    ],
  };
}
```

**CRITICAL:** Do NOT add headers to page content. SiteHeader automatically displays titles from navigation config (coding-patterns.md lines 1088-1119).

### 5. Create Page File

**Template for Church Admin Route:**

```typescript
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * <Route Title> Page
 *
 * <Brief description of page purpose>
 *
 * @route /church/[slug]/admin/<route-name>
 * @access Church Admin, Church Owner
 */
export default async function <ComponentName>Page({ params }: PageProps) {
  const { slug } = await params;
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // TODO: Fetch data here using dataScope for multi-tenant isolation
  // Example: const data = await getDataForScope(dataScope);

  return (
    <PageContainer variant="<VARIANT>" as="main">
      {/* TODO: Add page content here */}
      {/* IMPORTANT: Do NOT add <h1> tag - SiteHeader handles title */}

      <div className="text-muted-foreground">
        This is a placeholder for the <Route Title> page.
      </div>
    </PageContainer>
  );
}
```

**Template for Platform Admin Route:**

```typescript
import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageContainer } from "@/components/layout/page-container";

/**
 * <Route Title> Page (Platform Admin)
 *
 * <Brief description of page purpose>
 *
 * @route /platform/admin/<route-name>
 * @access Platform Admin
 */
export default async function <ComponentName>Page() {
  await requireAdmin();

  // TODO: Fetch platform-wide data
  // Example: const data = await prisma.model.findMany();

  return (
    <PageContainer variant="<VARIANT>" as="main">
      {/* TODO: Add page content here */}
      {/* IMPORTANT: Do NOT add <h1> tag - SiteHeader handles title */}

      <div className="text-muted-foreground">
        This is a placeholder for the <Route Title> page.
      </div>
    </PageContainer>
  );
}
```

### 6. Verify Pattern Compliance

**Checklist:**

✅ PageContainer with correct variant
✅ No `<h1>` tag in page content (SiteHeader handles this)
✅ Route added to `/lib/navigation.ts`
✅ Proper authentication (`requireDashboardAccess` or `requireAdmin`)
✅ Multi-tenant data scoping (for church routes)
✅ Server Component (default, no "use client")
✅ JSDoc comment with route info
✅ Semantic HTML (`as="main"` for top-level page)

### 7. Next Steps Guidance

After creating the route, provide these next steps:

**For Data Table Pages:**

```
Next steps:
1. Create columns.tsx for table column definitions
2. Create data-table.tsx for reusable DataTable component
3. Create <feature>-table.tsx wrapper component
4. Follow pattern from /components/dashboard/payments/
```

**For Form Pages:**

```
Next steps:
1. Create Zod schema in /lib/zodSchemas.ts
2. Create server action in /actions/<feature>/
3. Create form component following pattern from coding-patterns.md
4. Add form validation and error handling
```

**For Standard Pages:**

```
Next steps:
1. Add content components in app/<route>/_components/
2. Check shadcn/ui for available components (shadcn.md)
3. Use shared components from /components/ when possible
4. Follow PageContainer usage from coding-patterns.md
```

## Important Rules:

- ✅ ALWAYS update `/lib/navigation.ts` first
- ✅ ALWAYS use PageContainer with correct variant
- ✅ NEVER add `<h1>` tags in page content
- ✅ ALWAYS use proper authentication helpers
- ✅ ALWAYS include multi-tenant data scoping for church routes
- ✅ ALWAYS use Server Components by default
- ✅ ALWAYS check similar routes before creating
- ❌ NEVER duplicate navigation entries
- ❌ NEVER hardcode page titles in components
- ❌ NEVER skip pattern verification checklist

## Error Prevention:

**Common Mistakes to Avoid:**

1. Forgetting to add route to navigation config → Users can't navigate to page
2. Using wrong PageContainer variant → Inconsistent spacing
3. Adding duplicate headers → Double title display (layout + page)
4. Skipping authentication → Security vulnerability
5. Missing organizationId filter → Cross-tenant data leakage
6. Using "use client" unnecessarily → Worse performance

**Verify:**

- Navigation sidebar shows new menu item
- SiteHeader displays correct page title
- Page spacing matches other pages
- Authentication works correctly
- Data scoping is multi-tenant safe
