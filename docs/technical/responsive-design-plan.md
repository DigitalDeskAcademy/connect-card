# Responsive Design Improvement Plan

**Status:** Planning Required
**Priority:** High - Multiple UI issues at tablet/mobile breakpoints
**Created:** 2025-12-11
**Context:** Project built desktop-first, needs systematic responsive audit

---

## Problem Summary

The application has responsive issues at smaller viewports (< 1024px):

- Headers cramping with long titles + multiple buttons
- Cards not stacking properly on mobile
- Text overflowing containers
- Buttons too wide/crowded at breakpoints

**Root Cause:** Components were built for desktop without systematic mobile/tablet consideration.

**Good News:** Our tech stack (Tailwind CSS + Next.js) is excellent for responsive design - we just need to apply the patterns consistently.

---

## Tailwind Responsive Breakpoints

```
sm:  640px   - Large phones / small tablets
md:  768px   - Tablets
lg:  1024px  - Small laptops / large tablets
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

---

## Responsive Patterns to Apply

### 1. Text Sizing

```tsx
// Bad - fixed size
<h1 className="text-2xl">Title</h1>

// Good - responsive
<h1 className="text-lg md:text-xl lg:text-2xl">Title</h1>
```

### 2. Button Text (Icon-Only on Mobile)

```tsx
// Bad - always shows text
<Button>
  <Icon /> Edit Profile
</Button>

// Good - icon-only on small screens
<Button>
  <Icon />
  <span className="hidden sm:inline">Edit Profile</span>
</Button>
```

### 3. Grid Layouts

```tsx
// Bad - fixed columns
<div className="grid grid-cols-2">

// Good - stack on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 4. Spacing

```tsx
// Bad - fixed padding
<div className="px-6">

// Good - responsive padding
<div className="px-4 md:px-6 lg:px-8">
```

### 5. Flex Wrapping

```tsx
// Bad - can overflow
<div className="flex gap-4">

// Good - wraps on small screens
<div className="flex flex-wrap gap-2 md:gap-4">
```

### 6. Truncation for Long Text

```tsx
// Bad - can wrap awkwardly
<span>{longTitle}</span>

// Good - truncates with ellipsis
<span className="truncate">{longTitle}</span>
```

### 7. Hide Non-Essential Elements

```tsx
// Show only on larger screens
<div className="hidden lg:block">
  <DetailedSidebar />
</div>

// Show simplified version on mobile
<div className="lg:hidden">
  <CompactMenu />
</div>
```

---

## Priority Areas to Audit

### High Priority (User-facing, frequently used)

1. **Review Queue** (`/connect-cards/review/[batchId]`)

   - [x] Header cramping - Fixed 2025-12-11
   - [ ] Form fields on mobile
   - [ ] Pagination controls

2. **Dashboard** (`/admin`)

   - [ ] Quick actions grid
   - [ ] Stats cards
   - [ ] Chart responsiveness

3. **Data Tables** (all TanStack tables)

   - [ ] Column visibility on mobile
   - [ ] Action buttons
   - [ ] Pagination

4. **Site Header** (`site-header.tsx`)
   - [ ] Title truncation
   - [ ] Utility buttons collapse

### Medium Priority

5. **Upload Flow** (`/connect-cards/upload`)

   - [ ] Step indicators
   - [ ] File drop zone

6. **Prayer Management** (`/prayer`)

   - [ ] Table columns
   - [ ] Dialog forms

7. **Volunteer Management** (`/volunteer`)
   - [ ] Profile cards
   - [ ] Process dialog

### Lower Priority

8. **Settings pages**
9. **Export page**
10. **Team management**

---

## Implementation Approach

### Phase 1: Audit (1 session)

1. Test each page at 640px, 768px, 1024px widths
2. Screenshot issues
3. Document in this file under "Issues Found"

### Phase 2: Core Components (1-2 sessions)

1. Fix `site-header.tsx` - affects all pages
2. Fix `page-header.tsx` - affects all pages
3. Fix `nav-tabs.tsx` - used widely
4. Create responsive card header pattern

### Phase 3: Page-by-Page Fixes (ongoing)

1. Fix high-priority pages first
2. Apply patterns consistently
3. Test after each fix

---

## Development Guidelines (Going Forward)

**Always consider these breakpoints when building new UI:**

```tsx
// Template for new components
<div className="
  // Mobile first (default)
  text-sm px-2 gap-2

  // Tablet (md: 768px+)
  md:text-base md:px-4 md:gap-3

  // Desktop (lg: 1024px+)
  lg:text-lg lg:px-6 lg:gap-4
">
```

**Checklist for new components:**

- [ ] Does text truncate gracefully?
- [ ] Do buttons have icon-only mobile variants?
- [ ] Does the grid stack on mobile?
- [ ] Is spacing responsive?
- [ ] Are non-essential elements hidden on mobile?

---

## Issues Found (To Be Filled During Audit)

| Page         | Issue          | Breakpoint | Status   |
| ------------ | -------------- | ---------- | -------- |
| Review Queue | Header cramped | < 768px    | ✅ Fixed |
|              |                |            |          |

---

## Session Handoff

**For next session, start here:**

```
# Responsive Design Audit Session

## Context
- Project has responsive issues (built desktop-first)
- Plan doc: /docs/technical/responsive-design-plan.md
- Tech stack is capable, just needs consistent patterns

## Today's Goals
1. Complete Phase 1 audit - test all pages at 640px, 768px, 1024px
2. Document issues in the plan doc
3. Start Phase 2 - fix core components (site-header, page-header)

## Commands to Test
- Use browser DevTools responsive mode
- Test at: 640px (phone), 768px (tablet), 1024px (laptop)
- Screenshot issues to /public/issue-screenshots/

## Key Files
- /docs/technical/responsive-design-plan.md (this plan)
- /components/sidebar/site-header.tsx (global header)
- /components/layout/page-header.tsx (page titles)
- /components/layout/nav-tabs.tsx (tab navigation)
```

---

_Last Updated: 2025-12-11_
