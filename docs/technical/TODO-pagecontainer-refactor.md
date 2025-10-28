# TODO: PageContainer Standardization

**Priority:** Medium
**Status:** Backlog (Post-Feature Branch)
**Created:** 2025-10-28
**Assigned:** TBD

---

## Overview

The `PageContainer` component was created to standardize page layout and spacing across the application. However, not all pages have been migrated to use it. This document tracks which pages need to be refactored.

## What is PageContainer?

Located at: `/components/layout/page-container.tsx`

**Purpose:**

- Consistent page spacing/padding
- Responsive layout behavior
- Semantic HTML wrapper (can be `<main>`, `<section>`, etc.)
- Single source of truth for page layout

**Usage:**

```tsx
import { PageContainer } from "@/components/layout/page-container";

export default function MyPage() {
  return (
    <PageContainer> // or <PageContainer as="section">
      {/* Your content */}
    </PageContainer>
  );
}
```

---

## Audit Results (2025-10-28)

### Admin Pages (22 total)

**✅ Pages WITH PageContainer (20/22):**

- `/admin/page.tsx` - Main dashboard
- `/admin/connect-cards/upload/page.tsx`
- `/admin/connect-cards/test/page.tsx`
- `/admin/calendar/page.tsx`
- `/admin/preview/[courseSlug]/page.tsx`
- `/admin/preview/[courseSlug]/[lessonId]/page.tsx`
- `/admin/conversations/page.tsx`
- `/admin/n2n/page.tsx`
- `/admin/payments/page.tsx`
- `/admin/prayer/page.tsx`
- `/admin/team/page.tsx`
- `/admin/courses/page.tsx`
- `/admin/courses/[courseId]/[chapterId]/[lessonId]/page.tsx`
- `/admin/courses/[courseId]/edit/page.tsx`
- `/admin/courses/[courseId]/delete/page.tsx`
- `/admin/courses/create/page.tsx`
- `/admin/insights/page.tsx`
- `/admin/analytics/page.tsx`
- `/admin/settings/page.tsx`
- `/admin/volunteer/page.tsx`

**❌ Pages MISSING PageContainer (2/22):**

1. `/admin/connect-cards/review/page.tsx`

   - **Note:** Server component passes to client component wrapper
   - PageContainer IS present in `review-queue-client.tsx`
   - **Action:** Verify client component has proper wrapper

2. `/admin/contacts/page.tsx`
   - Uses `AgencyContactsClient` component
   - **Action:** Check if client component has PageContainer

---

### Public/Support Pages

**❌ Pages MISSING PageContainer:**

1. `/church/[slug]/support/page.tsx`
   - **Action:** Add PageContainer wrapper

---

### Lower Navigation Items

From `/lib/navigation.ts` - `navSecondary`:

1. **Settings** - `/admin/settings`

   - ✅ Has PageContainer

2. **Get Help** - `/support`

   - ❌ Missing PageContainer

3. **Search** - `#` (not implemented yet)
   - N/A - No page exists

---

## Refactor Checklist

### High Priority (User-Facing Pages)

- [ ] `/church/[slug]/support/page.tsx` - Add PageContainer
- [ ] `/church/[slug]/admin/contacts/page.tsx` - Verify client component wrapper

### Medium Priority (Edge Cases)

- [ ] Verify `/admin/connect-cards/review/page.tsx` client component has proper spacing
- [ ] Audit learning/course pages (not in admin area)
- [ ] Check platform admin pages for consistency

### Documentation Tasks

- [ ] Update coding-patterns.md with PageContainer requirement
- [ ] Add PageContainer to component architecture docs
- [ ] Create migration guide for adding PageContainer to existing pages

---

## Implementation Guidelines

### When to Use PageContainer

**Always use PageContainer for:**

- Admin dashboard pages
- Public pages (support, login, etc.)
- Full-page layouts
- Pages with navigation/sidebar

**Do NOT use PageContainer for:**

- Modal/Dialog content
- Client components that are nested inside pages already using PageContainer
- Embedded components (cards, tables, etc.)

### Pattern for Server Components

```tsx
import { PageContainer } from "@/components/layout/page-container";

export default async function MyPage() {
  const data = await fetchData();

  return (
    <PageContainer>
      <h1>Page Title</h1>
      <MyClientComponent data={data} />
    </PageContainer>
  );
}
```

### Pattern for Client Components (Page-Level)

```tsx
"use client";

import { PageContainer } from "@/components/layout/page-container";

export default function MyClientPage() {
  return <PageContainer>{/* Content */}</PageContainer>;
}
```

### Pattern for Client Component Wrappers

If server component passes to client component:

**Server Component (page.tsx):**

```tsx
export default async function MyPage() {
  const data = await fetchData();
  return <MyClientWrapper data={data} />; // No PageContainer here
}
```

**Client Component (my-client-wrapper.tsx):**

```tsx
"use client";

import { PageContainer } from "@/components/layout/page-container";

export function MyClientWrapper({ data }) {
  return <PageContainer>{/* Content using data */}</PageContainer>;
}
```

---

## Testing Checklist

When adding PageContainer to a page:

- [ ] Page spacing looks consistent with other admin pages
- [ ] No double padding (check if parent already has padding)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Dark mode works correctly
- [ ] No layout shift on page load
- [ ] Semantic HTML is correct (`<main>` for primary content, `<section>` for sections)

---

## Related Issues

- None yet

---

## Notes

- Review queue client component uses PageContainer correctly
- Most pages already standardized (20/22 admin pages)
- Focus on public pages and edge cases in next refactor
- Consider adding ESLint rule to enforce PageContainer usage

---

**Status:** Ready for implementation after feature/connect-card-review-queue branch is merged.
