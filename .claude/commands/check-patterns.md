---
description: Verify code follows all documented patterns
---

# Check Patterns

Comprehensive pattern compliance verification across the entire codebase.

## Your Tasks:

### Phase 1: Identify Scope

**Step 1: Determine What to Check**

Ask user: **"Check entire codebase or just recent changes? (all/recent)"**

**If "recent":**

```bash
git diff main...HEAD --name-only
```

Only check changed files.

**If "all":**
Check entire codebase.

---

### Phase 2: Multi-Tenant Isolation Check

**Step 2: Find All Database Queries**

Search for Prisma queries:

```bash
grep -r "prisma\." --include="*.ts" --include="*.tsx" app/ actions/ lib/
```

**Step 3: Verify organizationId Filtering**

For each query, check:

- [ ] Has `where: { organizationId: ... }` filter
- [ ] OR is platform-admin query (documented reason)
- [ ] OR is public data (documented reason)

**Violations to flag:**

```typescript
// ❌ VIOLATION: Missing organizationId filter
await prisma.churchMember.findMany({
  where: { email: userEmail },
});

// ✅ CORRECT: organizationId filter present
await prisma.churchMember.findMany({
  where: {
    organizationId: organization.id,
    email: userEmail,
  },
});
```

**Step 4: Check Data Scope Usage**

For church routes, verify using `requireDashboardAccess()`:

```bash
grep -r "requireDashboardAccess" app/church/
```

Should be in every church admin page.

**Step 5: Generate Multi-Tenant Report**

```markdown
# Multi-Tenant Isolation Check

Total Queries Found: X
✅ Properly Scoped: X
❌ Missing organizationId: X

Violations:

1. File: app/church/[slug]/admin/members/page.tsx:23
   Query: prisma.churchMember.findMany
   Issue: No organizationId filter
   Risk: CRITICAL - Cross-tenant data leakage

2. File: actions/church/members/actions.ts:45
   Query: prisma.connectCard.update
   Issue: No organizationId in where clause
   Risk: CRITICAL - Can update other org's data
```

---

### Phase 3: Server Action Security Check

**Step 6: Find All Server Actions**

```bash
find actions -name "*.ts" -type f
grep -l '"use server"' actions/**/*.ts
```

**Step 7: Verify Security Patterns**

For each server action, check:

**Rate Limiting:**

```bash
grep -A 20 "export async function" <file> | grep "arcjet"
```

- [ ] Has arcjet import
- [ ] Has rate limiting configuration
- [ ] Uses `aj.protect()` before business logic

**Authentication:**

```bash
grep -A 5 "export async function" <file> | grep -E "requireUser|requireAdmin|requireDashboardAccess"
```

- [ ] Has auth check at start of function
- [ ] Uses proper helper (not manual checks)

**Input Validation:**

```bash
grep -A 10 "export async function" <file> | grep "safeParse"
```

- [ ] Has Zod schema validation
- [ ] Uses `.safeParse()` not `.parse()`
- [ ] Returns generic error on validation failure

**Return Type:**

```bash
grep -A 2 "export async function" <file> | grep "ApiResponse"
```

- [ ] Returns `ApiResponse` or `ApiResponse<T>`
- [ ] Not custom return types

**Error Handling:**

```bash
grep -A 30 "export async function" <file> | grep "catch"
```

- [ ] Has try/catch block
- [ ] Returns generic error message
- [ ] No `console.error()` calls

**Step 8: Generate Server Action Report**

```markdown
# Server Action Security Check

Total Actions Found: X
✅ Fully Compliant: X
⚠️ Missing Patterns: X

Violations:

1. File: actions/church/members/actions.ts
   Function: createChurchMember
   Missing:

   - ❌ Rate limiting
   - ✅ Authentication present
   - ✅ Validation present
   - ✅ ApiResponse type
     Risk: HIGH - No rate limiting, vulnerable to abuse

2. File: actions/church/volunteers/actions.ts
   Function: updateVolunteer
   Missing:
   - ✅ Rate limiting present
   - ❌ Input validation
   - ✅ Authentication present
   - ✅ ApiResponse type
     Risk: MEDIUM - Missing input validation
```

---

### Phase 4: PageContainer Usage Check

**Step 9: Find All Pages**

```bash
find app -name "page.tsx" -type f
```

**Step 10: Verify PageContainer Usage**

For each page, check:

**Has PageContainer:**

```bash
grep -l "PageContainer" <file>
```

- [ ] Imports PageContainer
- [ ] Wraps content in PageContainer

**Correct Variant:**
Read the file and check if variant matches page type:

- Data tables → `variant="padded"`
- Standard pages → `variant="default"` or omit
- NavTabs pages → `variant="tabs"`
- Custom layouts → `variant="none"`
- Full-height → `variant="fill"`

**No Duplicate Headers:**

```bash
grep -E "<h1" <file>
```

- [ ] Should have NO `<h1>` tags in page content
- [ ] SiteHeader handles page titles

**Semantic HTML:**

```bash
grep "PageContainer" <file> | grep "as="
```

- [ ] Top-level pages use `as="main"`

**Step 11: Generate PageContainer Report**

```markdown
# PageContainer Usage Check

Total Pages Found: X
✅ Correct Usage: X
❌ Violations: X

Issues:

1. File: app/church/[slug]/admin/events/page.tsx
   Issue: Missing PageContainer entirely
   Fix: Wrap content in <PageContainer as="main">

2. File: app/church/[slug]/admin/volunteers/page.tsx
   Issue: Has <h1> tag in page content
   Line: 15
   Fix: Remove <h1>, SiteHeader handles title

3. File: app/church/[slug]/admin/analytics/page.tsx
   Issue: Wrong variant (using 'fill' for standard page)
   Line: 12
   Fix: Use variant="default" or omit for standard pages
```

---

### Phase 5: Navigation Config Check

**Step 12: Check Navigation Updates**

For pages that were added/modified:

```bash
grep -A 50 "export function getChurchNavigation" lib/navigation.ts
grep -A 50 "export function getPlatformNavigation" lib/navigation.ts
```

**Step 13: Verify Routes in Config**

For each page found, check:

- [ ] Route exists in navigation config
- [ ] Title matches between config and purpose
- [ ] URL path is correct

**Find pages missing from navigation:**

```bash
# Get all page routes
find app/church -name "page.tsx" | sed 's|app/||; s|/page.tsx||'

# Compare with routes in navigation.ts
```

**Step 14: Generate Navigation Report**

```markdown
# Navigation Configuration Check

Total Pages: X
✅ In Navigation: X
❌ Missing from Navigation: X

Missing Routes:

1. Page: app/church/[slug]/admin/events/page.tsx
   Issue: Not found in getChurchNavigation()
   Impact: Users cannot navigate to this page
   Fix: Add to lib/navigation.ts navMain array

2. Page: app/church/[slug]/admin/volunteers/page.tsx
   Issue: Title mismatch
   Config: "Volunteer Management"
   Expected: "Volunteers" (shorter)
   Fix: Update navigation.ts title
```

---

### Phase 6: Component Patterns Check

**Step 15: Check Shadcn Usage**

Find custom UI components that should use shadcn:

```bash
# Find custom input components
grep -r "className.*relative" --include="*.tsx" components/ app/ | grep -i input

# Find custom empty states
grep -r "No.*found" --include="*.tsx" components/ app/ | grep -v "Empty"

# Find custom pagination
grep -r "Showing.*of" --include="*.tsx" components/ app/
```

**Step 16: Verify Shadcn Components**

Check if these patterns use shadcn components:

- [ ] InputGroup for inputs with icons (not manual positioning)
- [ ] Empty component for empty states (not plain text)
- [ ] Pagination component (not text counters)
- [ ] Alert component for messages (not plain divs)
- [ ] Spinner for loading (not custom spinners)

**Step 17: Generate Component Report**

```markdown
# Component Pattern Check

Custom UI Found: X
✅ Using Shadcn: X
❌ Should Use Shadcn: X

Recommendations:

1. File: app/church/[slug]/admin/members/page.tsx:45
   Current: Manual icon positioning with relative/absolute
   Should Use: InputGroup component
   Fix: npx shadcn@latest add input-group

2. File: components/dashboard/events/events-list.tsx:78
   Current: <div>No events found</div>
   Should Use: Empty component
   Fix: npx shadcn@latest add empty
```

---

### Phase 7: TypeScript & Imports Check

**Step 18: Check for Strict Mode Compliance**

```bash
# Find 'any' types
grep -r ": any" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Find @ts-ignore comments
grep -r "@ts-ignore" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Find @ts-expect-error comments
grep -r "@ts-expect-error" --include="*.ts" --include="*.tsx" app/ actions/ lib/
```

**Step 19: Check Import Patterns**

Verify proper imports:

```bash
# Server actions should be imported directly
grep -r "import.*actions" --include="*.tsx" app/ | grep -v "from '@/actions"

# Check for relative imports (should use @/ alias)
grep -r "from '\\.\\." --include="*.ts" --include="*.tsx" app/ actions/ lib/
```

**Step 20: Generate TypeScript Report**

```markdown
# TypeScript & Imports Check

Type Safety Issues: X
✅ Strict Mode Compliant: X
⚠️ Needs Attention: X

Issues:

1. File: app/church/[slug]/admin/members/actions.ts:23
   Issue: Using 'any' type
   Line: const data: any = req.body
   Fix: Define proper type or use unknown

2. File: components/dashboard/events/event-card.tsx:12
   Issue: Relative import '../../../lib/utils'
   Fix: Use '@/lib/utils' instead
```

---

### Phase 8: Generate Final Report

**Step 21: Consolidate All Findings**

Create comprehensive pattern compliance report:

```markdown
# Pattern Compliance Report

Generated: <timestamp>
Scope: <all/recent>
Files Checked: X

## Summary

✅ PASSING:

- Multi-tenant isolation: X/X queries compliant
- Server action security: X/X actions compliant
- PageContainer usage: X/X pages compliant
- Navigation config: X/X routes in navigation
- Component patterns: X/X using shadcn
- TypeScript strict: X/X files compliant

❌ VIOLATIONS:

- Multi-tenant: X critical issues
- Server actions: X security issues
- PageContainer: X pattern violations
- Navigation: X missing routes
- Components: X should use shadcn
- TypeScript: X type safety issues

## Priority Fixes (by Risk Level)

### CRITICAL (Fix Immediately)

1. Multi-Tenant Data Leakage

   - File: app/church/[slug]/admin/members/page.tsx:23
   - Issue: No organizationId filter
   - Impact: Can access other church's member data
   - Fix: Add where: { organizationId: organization.id }

2. Missing Rate Limiting
   - File: actions/church/members/actions.ts:15
   - Issue: No arcjet rate limiting
   - Impact: Vulnerable to abuse/DoS
   - Fix: Add arcjet.withRule(fixedWindow(...))

### HIGH (Fix Soon)

<list high priority issues>

### MEDIUM (Fix When Convenient)

<list medium priority issues>

### LOW (Nice to Have)

<list low priority issues>

## Detailed Findings

### Multi-Tenant Isolation

<detailed multi-tenant report from Phase 2>

### Server Action Security

<detailed server action report from Phase 3>

### PageContainer Usage

<detailed PageContainer report from Phase 4>

### Navigation Configuration

<detailed navigation report from Phase 5>

### Component Patterns

<detailed component report from Phase 6>

### TypeScript & Imports

<detailed TypeScript report from Phase 7>

## Next Steps

1. Fix all CRITICAL issues immediately
2. Review HIGH priority issues with team
3. Create tickets for MEDIUM/LOW issues
4. Run /check-patterns again after fixes
5. Consider adding pre-commit hook to enforce patterns

## Pattern Documentation

All patterns documented in:

- /docs/essentials/coding-patterns.md
- /docs/essentials/architecture.md
- CLAUDE.md

For questions on any pattern, refer to documentation.
```

**Step 22: Ask About Fixes**

Ask user: **"Found X violations (X critical). Would you like me to help fix them? (yes/no)"**

If yes:

1. Start with CRITICAL issues
2. Offer to fix each one
3. Explain the fix
4. Apply the fix
5. Re-run check to verify

---

### Phase 9: Create Fix Plan

**Step 23: Generate Fix Commands**

For common violations, provide fix commands:

```bash
# Fix missing organizationId in queries
# Edit: app/church/[slug]/admin/members/page.tsx:23
# Add: where: { organizationId: organization.id }

# Add rate limiting to server action
# Edit: actions/church/members/actions.ts
# Add arcjet configuration and protect call

# Install missing shadcn component
npx shadcn@latest add input-group

# Fix relative imports
# Find and replace '../../../' with '@/'
```

---

## What Gets Checked:

**Multi-Tenant Isolation:**

- [ ] All queries filter by organizationId
- [ ] Using requireDashboardAccess() in church routes
- [ ] No cross-tenant data access possible
- [ ] Rate limiting uses multi-tenant fingerprinting

**Server Action Security:**

- [ ] Rate limiting (Arcjet) present
- [ ] Authentication checks (requireUser/requireAdmin)
- [ ] Input validation (Zod safeParse)
- [ ] ApiResponse return type
- [ ] Generic error messages
- [ ] Try/catch error handling
- [ ] No console.error()

**PageContainer Usage:**

- [ ] All pages use PageContainer
- [ ] Correct variant for page type
- [ ] No duplicate <h1> headers
- [ ] Semantic HTML (as="main")

**Navigation Configuration:**

- [ ] All routes exist in navigation config
- [ ] Titles match page purpose
- [ ] URLs are correct

**Component Patterns:**

- [ ] Using shadcn components (not custom)
- [ ] InputGroup for inputs with icons
- [ ] Empty component for empty states
- [ ] Pagination component
- [ ] Alert component for messages

**TypeScript & Imports:**

- [ ] No 'any' types
- [ ] No @ts-ignore comments
- [ ] Using @/ import alias (not relative)
- [ ] Proper type definitions

---

## When to Use:

✅ **Before committing code**
✅ **After adding new features**
✅ **Before creating PR**
✅ **Weekly code quality check**
✅ **After onboarding new developers**
✅ **Before production deployment**

This command catches pattern violations early, preventing technical debt and security vulnerabilities.

---

## Integration with Other Commands:

**Automatically called by:**

- `/feature-wrap-up` (as part of quality checks)

**Works well with:**

- `/review-code` - Similar but uses AI agent
- `/check-security` - Focused security audit
- `/check-multi-tenant` - Deep tenant isolation audit

**Run after:**

- Making code changes
- Adding new features
- Refactoring

**Run before:**

- `/commit`
- `/feature-wrap-up`
- Creating PR
