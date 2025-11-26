# Tech-Debt - Implementation Notes

**Developer Notes:** Security fixes and code quality improvements

---

## Fixes Completed

### Phase 1: Critical Security Fixes

- [ ] **CRITICAL-001:** Multi-tenant isolation in remove-member.ts
- [ ] **CRITICAL-002:** Remove PII logging (13 files)
- [ ] **CRITICAL-003:** Volunteer organizationId from auth context
- [ ] **CRITICAL-004:** Add organizationId to volunteer queries

### Phase 2: High Severity Fixes

- [ ] **HIGH-001:** Generic validation error messages
- [ ] **HIGH-002:** Standardize permission error messages (11 files)

---

## Key Changes Made

### Multi-Tenant Isolation Pattern (CRITICAL-001)

**Before:**

```typescript
await prisma.user.update({
  where: { id: memberId }, // ❌ Missing org check
  data: { organizationId: null },
});
```

**After:**

```typescript
await prisma.user.update({
  where: {
    id: memberId,
    organizationId: organization.id, // ✅ Enforced
  },
  data: { organizationId: null },
});
```

### PII Logging Removal (CRITICAL-002)

**Files Modified:**

1. actions/connect-card/save-connect-card.ts
2. actions/connect-card/update-connect-card.ts
3. app/api/connect-cards/extract/route.ts
4. actions/team/remove-member.ts
5. actions/volunteers/volunteers.ts
6. (add others as completed)

**Pattern:**

- Removed all console.log/console.error statements
- Replaced with generic error returns

### Organization Context Pattern (CRITICAL-003)

**Before:**

```typescript
// Zod schema accepts organizationId
organizationId: z.string();

// Server action uses user input
organizationId: validatedData.organizationId;
```

**After:**

```typescript
// Zod schema does NOT accept organizationId
// (removed from schema)

// Server action uses auth context
organizationId: organization.id;
```

---

## Challenges & Solutions

### Challenge 1: Finding All Console Statements

**Problem:** 13 files with console.log/error scattered across codebase

**Solution:**

```bash
grep -r "console\\.log\|console\\.error" actions/ app/
```

### Challenge 2: Validation Error Messages

**Problem:** Some actions expose specific validation errors

**Solution:** Standardized to generic messages per coding-patterns.md

---

## Code Patterns Used

- [x] Multi-tenant organizationId filtering
- [x] Generic error messages (no data leakage)
- [x] Organization context from requireDashboardAccess()
- [x] No console.log in production code

---

## Testing Verification

- [ ] All E2E tests pass
- [ ] Build passes with no errors
- [ ] ESLint clean (no console warnings)
- [ ] Multi-tenant isolation verified

---

## Integration Notes

**Merge Strategy:**

- Direct to main (bug fixes, no feature additions)
- Small, focused commits per CRITICAL issue
- E2E tests must pass before merge
