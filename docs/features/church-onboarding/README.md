# Agency → Church Migration Plan

**Status:** 🟡 In Progress - Interactive checklist added (PR #88)
**Priority:** HIGH (before demo)
**Last Updated:** 2026-01-01

---

## Overview

This codebase was forked from a generic SaaS/agency template. This document tracks the full migration to church-specific terminology and removal of irrelevant features.

---

## Audit Summary

### Files Requiring Changes

| Category             | File Count | Priority |
| -------------------- | ---------- | -------- |
| UI Text Changes      | 15         | HIGH     |
| File Renames         | 3          | MEDIUM   |
| Schema Changes       | 2          | HIGH     |
| Role Reference Fixes | 4          | HIGH     |
| Dead Code Removal    | 2          | LOW      |

---

## Phase 1: Critical Text Changes (HIGH)

### 1.1 Setup Forms - Agency → Church

**File: `app/setup/organization/_components/OrganizationSetupForm.tsx`**

| Line    | Current                     | Change To                   |
| ------- | --------------------------- | --------------------------- |
| 96      | "Setup Your Agency"         | "Set Up Your Church"        |
| 98      | "Tell us about your agency" | "Tell us about your church" |
| 127-147 | "Agency Name" field         | "Church Name"               |
| 139     | "Digital Marketing Pro"     | "New Life Church"           |
| 216     | "Creating your agency..."   | "Creating your church..."   |

**File: `app/setup/organization/actions.ts`**

| Line  | Current                                    | Change To                                  |
| ----- | ------------------------------------------ | ------------------------------------------ |
| 26    | "Generate slug from agency name"           | "Generate slug from church name"           |
| 39-47 | `agencyName` parameter                     | `churchName`                               |
| 118   | `generateSlug(validation.data.agencyName)` | `generateSlug(validation.data.churchName)` |
| 157   | `name: validation.data.agencyName`         | `name: validation.data.churchName`         |

**File: `app/setup/organization/page.tsx`**

| Line | Current            | Change To |
| ---- | ------------------ | --------- |
| 6-7  | Comments: "agency" | "church"  |

**File: `lib/zodSchemas.ts`**

| Line  | Current                        | Change To                                    |
| ----- | ------------------------------ | -------------------------------------------- |
| 4-14  | `organizationIndustries` array | DELETE or replace with `churchDenominations` |
| 25-28 | `agencyName` field             | `churchName`                                 |
| 57-59 | `industry` field               | DELETE or replace with `denomination`        |

---

### 1.2 Role References - agency_owner → church_owner

**File: `app/church/_components/AgencyNavbar.tsx`**

| Line  | Current                        | Change To                      |
| ----- | ------------------------------ | ------------------------------ |
| 44-45 | `agency_owner`, `agency_admin` | `church_owner`, `church_admin` |
| 79-80 | `agency_owner`, `agency_admin` | `church_owner`, `church_admin` |

**File: `hooks/use-navigation.ts`**

| Line     | Current               | Change To      |
| -------- | --------------------- | -------------- |
| Multiple | `agency_owner` checks | `church_owner` |

**File: `app/auth/callback/page.tsx`**

| Line    | Current                     | Change To                   |
| ------- | --------------------------- | --------------------------- |
| Comment | `agency_owner/agency_admin` | `church_owner/church_admin` |

---

### 1.3 UI Text Throughout App

**File: `app/church/[slug]/page.tsx`** (13 occurrences)

- Update "agency" references in homepage content

**File: `app/church/[slug]/admin/layout.tsx`** (7 occurrences)

- Update layout comments/content

**File: `app/church/[slug]/admin/conversations/page.tsx`** (5 occurrences)
**File: `app/church/[slug]/admin/payments/page.tsx`** (6 occurrences)

- These may be dead code - evaluate for removal

**File: `app/(public)/_components/Navbar.tsx`** (7 occurrences)
**File: `app/(public)/_components/PublicSidebar.tsx`** (4 occurrences)

- Public-facing navbar/sidebar text

**File: `app/providers/organization-context.tsx`** (4 occurrences)

- Context naming

**File: `components/sidebar/agency-nav-sidebar.tsx`** (7 occurrences)

- Sidebar component

---

## Phase 2: File Renames (MEDIUM)

These files should be renamed for consistency:

| Current Name                                       | New Name                    |
| -------------------------------------------------- | --------------------------- |
| `app/church/_components/AgencyNavbar.tsx`          | `ChurchNavbar.tsx`          |
| `app/church/_components/AgencyHomepageContent.tsx` | `ChurchHomepageContent.tsx` |
| `components/sidebar/agency-nav-sidebar.tsx`        | `church-nav-sidebar.tsx`    |

**After rename, update all imports:**

```bash
# Find all imports of these files
grep -r "AgencyNavbar\|AgencyHomepageContent\|agency-nav-sidebar" --include="*.tsx" --include="*.ts"
```

---

## Phase 3: Schema Simplification (HIGH)

### Remove Industry Field

The `industry` field is irrelevant for churches. Options:

**Option A: Remove entirely (Recommended)**

- Delete `organizationIndustries` from `lib/zodSchemas.ts`
- Remove `industry` field from schema
- Remove field from form
- No database migration needed (field not stored)

**Option B: Replace with Denomination**

- Replace `organizationIndustries` with `churchDenominations`
- Add `denomination` optional field to Organization model
- Requires Prisma migration

### Proposed Schema Changes

```typescript
// lib/zodSchemas.ts - BEFORE
export const organizationIndustries = [
  "SaaS",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Real Estate",
  "Consulting",
  "Other",
];

export const organizationSetupSchema = z.object({
  name: z.string().min(2).max(30),
  agencyName: z.string().min(2).max(100),
  website: z.string().optional(),
  industry: z.enum(organizationIndustries),
});

// lib/zodSchemas.ts - AFTER (Option A - Simple)
export const organizationSetupSchema = z.object({
  name: z.string().min(2).max(30),
  churchName: z.string().min(2).max(100),
  website: z.string().optional(),
});

// lib/zodSchemas.ts - AFTER (Option B - With Denomination)
export const churchDenominations = [
  "Non-denominational",
  "Baptist",
  "Methodist",
  "Presbyterian",
  "Lutheran",
  "Catholic",
  "Pentecostal",
  "Anglican/Episcopal",
  "Assembly of God",
  "Other",
] as const;

export const organizationSetupSchema = z.object({
  name: z.string().min(2).max(30),
  churchName: z.string().min(2).max(100),
  website: z.string().optional(),
  denomination: z.enum(churchDenominations).optional(),
});
```

---

## Phase 4: Dead Code Evaluation (LOW)

Evaluate these files for removal (appear to be unused SaaS features):

| File                                             | Purpose                 | Action                 |
| ------------------------------------------------ | ----------------------- | ---------------------- |
| `app/church/[slug]/admin/conversations/page.tsx` | CRM conversations       | Evaluate - likely dead |
| `app/church/[slug]/admin/payments/page.tsx`      | Payment management      | Evaluate - likely dead |
| `app/platform/admin/api/`                        | Platform API management | Keep for now           |

---

## Phase 5: Auto-Create Initial Location (MEDIUM)

Churches need at least one location. Add to `createOrganization` action:

```typescript
// After creating organization, create default location
await tx.location.create({
  data: {
    organizationId: organization.id,
    name: "Main Campus",
    slug: "main",
    isDefault: true,
  },
});
```

---

## Implementation Checklist

### Phase 1: Critical (Do Now)

- [ ] **1.1 OrganizationSetupForm.tsx** - Replace Agency → Church text
- [ ] **1.2 actions.ts** - Rename agencyName → churchName
- [ ] **1.3 zodSchemas.ts** - Update schema field names
- [ ] **1.4 zodSchemas.ts** - Remove industry field and array
- [ ] **1.5 AgencyNavbar.tsx** - Fix role checks (agency_owner → church_owner)
- [ ] **1.6 use-navigation.ts** - Fix role checks

### Phase 2: File Renames (After Phase 1)

- [ ] **2.1** Rename AgencyNavbar.tsx → ChurchNavbar.tsx
- [ ] **2.2** Rename AgencyHomepageContent.tsx → ChurchHomepageContent.tsx
- [ ] **2.3** Rename agency-nav-sidebar.tsx → church-nav-sidebar.tsx
- [ ] **2.4** Update all imports

### Phase 3: Polish (Future)

- [ ] **3.1** Auto-create "Main Campus" location on signup
- [ ] **3.2** Add optional denomination field
- [ ] **3.3** Improve welcome page with church-specific messaging
- [ ] **3.4** Remove dead code (conversations, payments if unused)

---

## Testing Plan

After migration:

1. **Fresh signup flow**

   - Clear database
   - Create new account
   - Verify all text says "Church" not "Agency"
   - Verify slug is generated from church name
   - Verify user gets `church_owner` role

2. **Existing user access**

   - Login as existing church_owner
   - Verify dashboard access works
   - Verify no console errors about roles

3. **Build verification**
   - `pnpm build` passes
   - No TypeScript errors from renamed fields

---

## Notes

- GHL token comments mention "agency-level OAuth" - this is correct GHL terminology, don't change
- The `lib/tenant-utils.ts` agency references may be in comments only - verify before changing
- Keep `Organization` model name - it's correct (churches ARE organizations)

---

## Files Quick Reference

**Must Change (15 files):**

```
app/setup/organization/_components/OrganizationSetupForm.tsx
app/setup/organization/actions.ts
app/setup/organization/page.tsx
lib/zodSchemas.ts
app/church/_components/AgencyNavbar.tsx
app/church/_components/AgencyHomepageContent.tsx
app/church/[slug]/page.tsx
app/church/[slug]/admin/layout.tsx
app/auth/callback/page.tsx
app/providers/organization-context.tsx
app/(public)/_components/Navbar.tsx
app/(public)/_components/PublicSidebar.tsx
components/sidebar/agency-nav-sidebar.tsx
hooks/use-navigation.ts
app/data/dashboard/require-dashboard-access.ts
```

**May Need Change (evaluate):**

```
app/church/[slug]/admin/conversations/page.tsx
app/church/[slug]/admin/payments/page.tsx
app/platform/admin/api/page.tsx
app/platform/admin/api/actions.ts
```
