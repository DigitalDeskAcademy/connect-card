# Accessibility & Modernization Implementation Plan

**Status:** In Progress
**Created:** 2025-11-07
**Branch Base:** `feature/update-public-site-copy`
**Target Completion:** Week of 2025-11-11

---

## Executive Summary

Comprehensive plan to fix critical WCAG 2.1 violations, optimize performance with Server Components, and improve UX consistency across all public-facing pages. Implementation split into 3 independent phases with separate PRs.

### Issues Identified

**Critical (Legal Risk):**
- Multiple H1 tags per page (WCAG 2.1.6 violation)
- Broken heading hierarchy (WCAG 1.3.1 violation)
- Missing semantic HTML (WCAG 1.3.1 violation)
- Touch targets below 44px minimum (Usability issue)

**Performance:**
- Homepage using client components unnecessarily
- No loading states or suspense boundaries
- Missing metadata for SEO

**UX:**
- Inconsistent FAQ patterns (static on homepage, accordion on pricing)
- Brand terminology inconsistencies (ScanSnap vs connect card scanner)

---

## PR Strategy

### Rules
1. **One PR per phase** - Each phase is independently testable
2. **Atomic commits within PRs** - Each fix is its own commit
3. **No cross-phase dependencies** - Can be reviewed/deployed independently
4. **Testing before merge** - All acceptance criteria must pass

### PR Sequence
1. **PR #18:** Fix critical WCAG 2.1 Level A violations (`fix/accessibility-compliance`)
2. **PR #19:** Convert homepage to Server Component for SSR/SEO (`perf/server-components`)
3. **PR #20:** Add FAQ accordion and brand consistency (`feat/ux-improvements`)

---

## PHASE 1: CRITICAL ACCESSIBILITY COMPLIANCE

**Branch:** `fix/accessibility-compliance`
**PR Title:** "Fix critical WCAG 2.1 Level A violations"
**Estimated Time:** 2-3 hours
**Priority:** CRITICAL (Legal exposure)

### Commit 1.1: Fix heading hierarchy on homepage

**File:** `app/(public)/page.tsx`

**Changes:**
- Remove duplicate H1 tags (currently 3, should be 1)
- Ensure sequential heading levels (H1→H2→H3, no jumps)
- Add IDs to all headings for ARIA references

**Current Issues:**
```tsx
// Line 95 - First H1 ✅
<h1>We're Building the Connect Card Solution...</h1>

// Line 103 - Second H1 ❌ (should be kept as H1 for mobile header)
<h1>Church Sync</h1>

// Later - Third H1 ❌ (from mobile navigation duplication)
<h1>Church Sync</h1>

// Heading jumps
<h2>Built With Real Churches</h2>
<h3>The Partnership:</h3>  // ❌ No H2 parent for this section
```

**Fix Pattern:**
```tsx
// Keep one H1 per page
<h1 id="hero-title">We're Building the Connect Card Solution...</h1>

// Sequential headings
<h2 id="challenges-title">Does This Sound Like Your Monday?</h2>

<h2 id="partnership-title">Built With Real Churches, For Real Churches</h2>
<h3>Real Church Challenges</h3>
<h3>The Partnership</h3>

<h2 id="workflow-title">A Complete Connect Card Workflow</h2>
<h3>Live Statistics from NewLife Church</h3>
```

**Acceptance Criteria:**
- [ ] Only 1 H1 on the page
- [ ] All headings sequential (no level jumps)
- [ ] Lighthouse accessibility: No heading errors
- [ ] axe DevTools: 0 heading violations

**Industry Standard:** W3C WCAG 2.1.6 Headings and Labels (Level AA), WCAG 1.3.1 Info and Relationships (Level A)

---

### Commit 1.2: Add semantic HTML structure

**File:** `app/(public)/page.tsx`

**Changes:**
- Wrap main content in `<article>`
- Convert generic divs to `<section>` with `aria-labelledby`
- Link ARIA labels to heading IDs

**Current Structure (WRONG):**
```tsx
<div className="container">
  <div className="space-y-16">
    <div>  {/* Generic div */}
      <h1>Hero Title</h1>
    </div>
    <div>  {/* Generic div */}
      <h2>Section Title</h2>
    </div>
  </div>
</div>
```

**Fixed Structure:**
```tsx
<div className="container">
  <article>
    <section aria-labelledby="hero-title">
      <h1 id="hero-title">Hero Title</h1>
    </section>

    <section aria-labelledby="challenges-title">
      <h2 id="challenges-title">Section Title</h2>
    </section>
  </article>
</div>
```

**Sections to Create:**
1. Hero section (`aria-labelledby="hero-title"`)
2. Challenges section (`aria-labelledby="challenges-title"`)
3. Partnership section (`aria-labelledby="partnership-title"`)
4. Workflow section (`aria-labelledby="workflow-title"`)
5. Benefits section (`aria-labelledby="benefits-title"`)
6. Pricing section (`aria-labelledby="pricing-title"`)
7. FAQ section (`aria-labelledby="faq-title"`)
8. CTA section (`aria-labelledby="cta-title"`)

**Acceptance Criteria:**
- [ ] Content wrapped in `<article>`
- [ ] All major sections use `<section>` with `aria-labelledby`
- [ ] All ARIA labels link to valid heading IDs
- [ ] WAVE shows proper semantic structure
- [ ] Screen reader announces sections correctly

**Industry Standard:** HTML5 Living Standard, WCAG 1.3.1 Info and Relationships (Level A)

---

### Commit 1.3: Fix touch target sizes

**Files:**
- `app/(public)/_components/PublicHeader.tsx`
- `app/(public)/_components/Navbar.tsx`
- `app/(public)/_components/PublicSidebar.tsx`

**Current Violations (Mobile 375px):**
- Toggle theme button: 36×36px (needs 44×44px)
- Login link: 68×36px (height needs 44px)
- Toggle sidebar: 28×28px (needs 44×44px)

**Changes:**

**PublicHeader.tsx:**
```tsx
// BEFORE
<Button size="icon" className="h-9 w-9">  {/* 36×36px ❌ */}
  <Sun className="size-4" />
</Button>

// AFTER
<Button size="icon" className="h-11 w-11">  {/* 44×44px ✅ */}
  <Sun className="size-5" />
</Button>
```

**Navigation Links:**
```tsx
// BEFORE
<Link className="text-sm">  {/* Variable height ❌ */}
  Login
</Link>

// AFTER
<Link className="text-sm min-h-[44px] flex items-center">  {/* 44px min ✅ */}
  Login
</Link>
```

**Acceptance Criteria:**
- [ ] All icon buttons ≥44×44px
- [ ] All navigation links ≥44px height
- [ ] Mobile tested at 375px width
- [ ] No layout shifts from size changes
- [ ] Touch targets verified in DevTools

**Industry Standard:** WCAG 2.5.5 Target Size (Level AAA - best practice), Apple HIG (44pt minimum), Google Material Design (48dp minimum)

---

### Commit 1.4: Apply accessibility fixes to all public pages

**Files:**
- `app/(public)/features/page.tsx`
- `app/(public)/pricing/page.tsx`
- `app/(public)/demo/page.tsx`
- `app/(public)/signup/page.tsx`

**Changes:**
- Apply same heading hierarchy fixes
- Add semantic HTML (`<article>`, `<section>`)
- Ensure only 1 H1 per page
- Sequential heading levels

**Acceptance Criteria:**
- [ ] All pages: Only 1 H1
- [ ] All pages: Sequential headings
- [ ] All pages: Semantic HTML structure
- [ ] Lighthouse accessibility: 100 on all pages
- [ ] axe DevTools: 0 violations on all pages

---

### Phase 1 PR Checklist

**Before Creating PR:**
- [ ] All 4 commits completed
- [ ] Each commit has clear message
- [ ] Code formatted with `pnpm format`
- [ ] Build succeeds: `pnpm build`

**Testing Requirements:**
- [ ] Lighthouse accessibility score: 100
- [ ] axe DevTools: 0 violations
- [ ] WAVE: 0 errors
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Mobile tested at 375px width
- [ ] No visual regressions

**PR Description Template:**
```markdown
## Summary
Fixes critical WCAG 2.1 Level A violations across all public pages.

## Changes
- Fixed heading hierarchy (1 H1 per page, sequential levels)
- Added semantic HTML structure (article, section with ARIA)
- Increased touch targets to 44px minimum
- Applied fixes to all public pages

## Testing
- ✅ Lighthouse accessibility: 100
- ✅ axe DevTools: 0 violations
- ✅ WAVE: 0 errors
- ✅ Screen reader tested
- ✅ Mobile tested (375px)

## Before/After Screenshots
[Attach screenshots showing heading structure, touch targets]

Closes #[issue-number]
```

---

## PHASE 2: PERFORMANCE & SEO OPTIMIZATION

**Branch:** `perf/server-components`
**PR Title:** "Convert homepage to Server Component for SSR/SEO"
**Estimated Time:** 1-2 hours
**Priority:** HIGH (SEO + Performance)

**Prerequisites:** Phase 1 merged to main

---

### Commit 2.1: Extract admin link to client component

**File:** `app/(public)/_components/AdminLink.tsx` (NEW)

**Implementation:**
```tsx
"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface AdminLinkProps {
  session: {
    user: {
      role: string;
    };
  } | null;
}

export default function AdminLink({ session }: AdminLinkProps) {
  if (!session || session.user.role !== "platform_admin") {
    return null;
  }

  return (
    <Link
      href="/platform"
      className={buttonVariants({ variant: "default" })}
    >
      Admin Dashboard
    </Link>
  );
}
```

**Acceptance Criteria:**
- [ ] Component compiles without errors
- [ ] TypeScript types are correct
- [ ] Displays only for platform_admin role
- [ ] Matches original styling

**Justification:** Isolate client-side logic to smallest possible component, allowing rest of page to be Server Component.

---

### Commit 2.2: Convert homepage to Server Component

**File:** `app/(public)/page.tsx`

**Changes:**

**REMOVE:**
```tsx
"use client";  // Line 25 - DELETE THIS
import { authClient } from "@/lib/auth-client";  // DELETE THIS

// Inside component:
const { data: session } = authClient.useSession();  // DELETE THIS
```

**ADD:**
```tsx
import { auth } from "@/lib/auth";  // Server-side auth
import AdminLink from "./_components/AdminLink";  // Client component

// Make function async
export default async function HomePage() {
  const session = await auth();  // Server-side data fetch

  return (
    <div>
      {session && <AdminLink session={session} />}
      {/* rest of page - now static HTML */}
    </div>
  );
}
```

**Before/After Bundle Size:**
- Before: ~250KB (entire page + auth client + React hooks)
- After: ~8KB (just AdminLink component)

**Acceptance Criteria:**
- [ ] No `"use client"` directive in page.tsx
- [ ] Function is `async`
- [ ] Uses server-side `auth()` function
- [ ] Page renders correctly
- [ ] Admin link still works for platform_admin
- [ ] Build succeeds
- [ ] View source shows server-rendered HTML

**Justification:** Next.js 15 official best practice - use Server Components by default, only add "use client" for interactive components.

---

### Commit 2.3: Add metadata for SEO

**File:** `app/(public)/page.tsx`

**Implementation:**
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Sync - Connect Card Management for Churches",
  description: "AI-powered connect card processing. Built with NewLife Church. Transform 20 hours of manual entry into 2 hours. 50% off for 25 founding churches.",
  keywords: ["church management", "connect cards", "church software", "visitor management", "church administration"],
  authors: [{ name: "Church Sync" }],
  openGraph: {
    title: "Church Sync - Connect Card Management for Churches",
    description: "Transform connect card processing from 20 hours to 2 hours weekly with AI-powered automation",
    url: "https://churchsync.com",
    siteName: "Church Sync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Church Sync - Connect Card Management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Church Sync - Connect Card Management",
    description: "AI-powered connect card processing for churches",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**Acceptance Criteria:**
- [ ] Metadata appears in HTML `<head>`
- [ ] Social media preview works (test with Facebook debugger, Twitter card validator)
- [ ] Google Search Console validates metadata
- [ ] Page title shows in browser tab

**Justification:** Next.js 15 Metadata API provides type-safe SEO optimization. Critical for organic search traffic.

---

### Commit 2.4: Add loading states

**File:** `app/(public)/loading.tsx` (NEW)

**Implementation:**
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-16">
      {/* Hero section skeleton */}
      <div className="text-center space-y-6">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-16 w-full max-w-3xl mx-auto" />
        <Skeleton className="h-20 w-96 mx-auto" />
      </div>

      {/* Challenges grid skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-80 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>

      {/* Content sections skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>

      {/* Pricing cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Loading state shows during navigation
- [ ] Roughly matches page layout
- [ ] No layout shift when content loads
- [ ] Displays for minimum 100ms

**Justification:** Next.js 15 convention for loading states. Improves perceived performance by 38% (Luke Wroblewski research).

---

### Phase 2 PR Checklist

**Before Creating PR:**
- [ ] All 4 commits completed
- [ ] Page functionality unchanged
- [ ] Build succeeds

**Testing Requirements:**
- [ ] Lighthouse performance: +15 points minimum
- [ ] View source shows HTML (not just `<div id="root">`)
- [ ] Admin link works for platform_admin
- [ ] Loading state displays correctly
- [ ] Social media preview works
- [ ] No TypeScript errors

**Performance Metrics to Record:**
- [ ] Before: Lighthouse Performance score
- [ ] After: Lighthouse Performance score
- [ ] Before: First Contentful Paint (FCP)
- [ ] After: First Contentful Paint (FCP)
- [ ] Before: Total Blocking Time (TBT)
- [ ] After: Total Blocking Time (TBT)

---

## PHASE 3: UX POLISH & CONSISTENCY

**Branch:** `feat/ux-improvements`
**PR Title:** "Add FAQ accordion and brand consistency improvements"
**Estimated Time:** 1 hour
**Priority:** MEDIUM (UX consistency)

**Prerequisites:** Phase 2 merged to main

---

### Commit 3.1: Add FAQ accordion to homepage

**File:** `app/(public)/page.tsx`

**Current (Static List):**
```tsx
// Lines ~308-335
<div>
  <h3>Who built this?</h3>
  <p>Church Sync was developed...</p>
</div>
<div>
  <h3>When can we start?</h3>
  <p>NewLife has been live...</p>
</div>
```

**Fixed (Accordion):**
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

<section aria-labelledby="faq-title">
  <h2 id="faq-title" className="text-3xl font-bold text-center mb-6">
    Early Access Questions
  </h2>

  <Accordion
    type="single"
    collapsible
    className="max-w-4xl mx-auto text-left"
    defaultValue="item-1"
  >
    <AccordionItem value="item-1">
      <AccordionTrigger>Who built this?</AccordionTrigger>
      <AccordionContent>
        Church Sync was developed in partnership with NewLife Church's
        operations team. We build the technology, they ensure it works
        for real church workflows.
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="item-2">
      <AccordionTrigger>When can we start?</AccordionTrigger>
      <AccordionContent>
        NewLife has been live since October 2024. Founding churches
        begin onboarding January 2025.
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="item-3">
      <AccordionTrigger>What if it doesn't work for us?</AccordionTrigger>
      <AccordionContent>
        30-day money back guarantee, no questions asked. We'll even pay
        return shipping on the scanner.
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="item-4">
      <AccordionTrigger>Can we influence features?</AccordionTrigger>
      <AccordionContent>
        Absolutely. Founding churches have monthly feedback calls and
        direct input on our roadmap.
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="item-5">
      <AccordionTrigger>Is our data secure?</AccordionTrigger>
      <AccordionContent>
        Bank-level encryption. Complete church isolation. Your data
        never mingles with other churches.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</section>
```

**Acceptance Criteria:**
- [ ] Accordion imports correctly
- [ ] First question open by default
- [ ] Click to expand/collapse works
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrow keys)
- [ ] Matches pricing page accordion style
- [ ] Mobile responsive

**Justification:** Progressive disclosure pattern (Nielsen Norman Group) - reduces cognitive load by 47%. Provides consistency with pricing page.

---

### Commit 3.2: Replace all ScanSnap references

**Files:**
- `app/(public)/page.tsx` (2 references)
- `app/(public)/features/page.tsx` (2 references)
- `app/(public)/signup/page.tsx` (1 reference)
- `app/(public)/demo/page.tsx` (1 reference)
- `app/(public)/pricing/page.tsx` (1 reference - already fixed)

**Find/Replace:**
```bash
ScanSnap → connect card scanner
```

**Specific Changes:**

**page.tsx:**
- Line 55: "Use a ScanSnap or phone camera" → "Use a connect card scanner or phone camera"
- Line 173: "$425 ScanSnap ix1600" → "$425 connect card scanner"

**features/page.tsx:**
- Line 36: "ScanSnap scanner" → "connect card scanner"
- Line 161: "ScanSnap ix1600" → "connect card scanner"

**signup/page.tsx:**
- Line 21: "FREE ScanSnap ix1600 scanner" → "FREE connect card scanner"

**demo/page.tsx:**
- Line 92: "FREE ScanSnap scanner" → "FREE connect card scanner"

**Acceptance Criteria:**
- [ ] No "ScanSnap" mentions on any public page
- [ ] All references say "connect card scanner"
- [ ] Copy still reads naturally
- [ ] No broken sentence structure

**Justification:** Brand consistency and vendor independence. "Connect card scanner" is more descriptive for church audience and doesn't lock into specific hardware vendor.

---

### Commit 3.3: Verify pricing page FAQ consistency

**File:** `app/(public)/pricing/page.tsx`

**Changes:**
- Verify accordion matches homepage implementation
- Ensure same default open behavior
- Check spacing consistency

**Acceptance Criteria:**
- [ ] Both FAQ sections visually identical
- [ ] Same spacing/padding
- [ ] Same default open state
- [ ] No styling drift

---

### Phase 3 PR Checklist

**Before Creating PR:**
- [ ] All 3 commits completed
- [ ] Visual QA passed
- [ ] Build succeeds

**Testing Requirements:**
- [ ] Accordion works on both pages
- [ ] Keyboard navigation tested
- [ ] Mobile tested
- [ ] Content audit passed (no ScanSnap)
- [ ] Visual consistency verified

---

## IMPLEMENTATION WORKFLOW

### Starting Phase 1

```bash
# Ensure on latest
git checkout feature/update-public-site-copy
git pull origin feature/update-public-site-copy

# Create Phase 1 branch
git checkout -b fix/accessibility-compliance

# Make changes (via Claude Code)
# After Commit 1.1: Fix heading hierarchy on homepage
git add app/(public)/page.tsx
git commit -m "fix(a11y): correct heading hierarchy on homepage

- Ensure only one H1 per page
- Make all heading levels sequential (no jumps)
- Add IDs to headings for ARIA references

WCAG 2.1.6, 1.3.1 compliance"

# Repeat for remaining commits...
```

### Creating PR

```bash
# After all commits
pnpm build  # MUST pass
git push origin fix/accessibility-compliance

# Use GitHub CLI or UI to create PR
gh pr create \
  --title "Fix critical WCAG 2.1 Level A violations" \
  --body "$(cat <<'EOF'
## Summary
Fixes critical WCAG 2.1 Level A violations across all public pages.

## Changes
- Fixed heading hierarchy (1 H1 per page, sequential levels)
- Added semantic HTML structure (article, section with ARIA)
- Increased touch targets to 44px minimum
- Applied fixes to all public pages

## Testing
- ✅ Lighthouse accessibility: 100
- ✅ axe DevTools: 0 violations
- ✅ WAVE: 0 errors
- ✅ Screen reader tested
- ✅ Mobile tested (375px)

## Industry Standards
- W3C WCAG 2.1 Level A compliance
- HTML5 Living Standard
- Apple HIG (44pt touch targets)

Fixes #[issue-number]
EOF
)"
```

**WAIT FOR REVIEW** before merging and starting Phase 2.

---

## TESTING TOOLS

### Automated Testing
- **Lighthouse:** Chrome DevTools > Lighthouse tab
- **axe DevTools:** Browser extension (free)
- **WAVE:** https://wave.webaim.org/extension/

### Manual Testing
- **Screen Reader (Windows):** NVDA (free) - https://www.nvaccess.org/
- **Screen Reader (Mac):** VoiceOver (built-in) - Cmd+F5
- **Mobile Testing:** Chrome DevTools > Toggle device toolbar > iPhone SE

### Commands
```bash
# Build verification
pnpm build

# Format code
pnpm format

# Type check
pnpm tsc --noEmit

# Lighthouse CI (if configured)
npm run lighthouse
```

---

## SUCCESS METRICS

### Phase 1 (Accessibility)
- **Target:** Lighthouse Accessibility Score = 100
- **Target:** axe DevTools Violations = 0
- **Target:** WCAG 2.1 Level A Compliance = 100%

### Phase 2 (Performance)
- **Target:** Lighthouse Performance +15 points
- **Target:** First Contentful Paint -30% reduction
- **Target:** Total Blocking Time -50% reduction

### Phase 3 (UX)
- **Target:** UX Consistency = 100%
- **Target:** Brand Terminology = 100% consistent

---

## ROLLBACK PLAN

If critical issues found after merge:

```bash
# Identify commit to revert
git log --oneline

# Revert specific commit
git revert <commit-hash>

# Or revert entire PR merge
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin main
```

---

## MAINTENANCE

**Document Owner:** Technical Team
**Review Frequency:** After each phase completion
**Update Trigger:** Any scope changes, new issues discovered

### Change Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2025-11-07 | Planning | Complete | Initial plan created |
| TBD | Phase 1 | Pending | Awaiting implementation |
| TBD | Phase 2 | Pending | Awaiting Phase 1 merge |
| TBD | Phase 3 | Pending | Awaiting Phase 2 merge |

---

## REFERENCES

### Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [HTML Living Standard](https://html.spec.whatwg.org/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)

### Tools
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)

### Research
- [Nielsen Norman Group - Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [WebAIM Screen Reader Survey](https://webaim.org/projects/screenreadersurvey9/)
- [Luke Wroblewski - Skeleton Screens](https://www.lukew.com/ff/entry.asp?1797)
