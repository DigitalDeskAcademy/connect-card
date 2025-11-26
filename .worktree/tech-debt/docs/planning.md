# Tech-Debt - Planning

**Worktree:** /tech-debt
**Branch:** feature/tech-debt
**Status:** Security Fixes & Code Quality
**Database:** Shared with main (no schema changes)

---

## 🚨 Critical Security Fixes (Production Blockers)

### CRITICAL-001: Multi-Tenant Data Isolation Violated

**File:** `actions/team/remove-member.ts` (Line 163)
**Issue:** Missing `organizationId` in WHERE clause for update operation
**Fix:** Add `organizationId: organization.id` to WHERE clause

### CRITICAL-002: PII Logging to Production

**Files:** 13 files with console.log/error statements
**Issue:** Logs sensitive church member data to production monitoring systems
**Fix:** Remove all console.log/error statements

### CRITICAL-003: Volunteer Creation Uses User Input for organizationId

**File:** `actions/volunteers/volunteers.ts` (Line 153)
**Issue:** Accepts organizationId from form input instead of auth context
**Fix:** Use `organization.id` from `requireDashboardAccess()`, not user input

### CRITICAL-004: Missing organizationId in Volunteer Queries

**Files:** Volunteer skills/availability actions
**Issue:** Some queries missing multi-tenant isolation filters
**Fix:** Add organizationId filtering to all queries

---

## ⚠️ High Severity Fixes

### HIGH-001: Zod Validation Errors Leaked to Client

**Files:** Multiple server actions
**Fix:** Return generic "Invalid form data" instead of specific validation messages

### HIGH-002: Error Messages Leak Permission System

**Files:** 11+ action files
**Fix:** Standardize to "You don't have permission to perform this action"

---

## Database Schema Changes

- [ ] **NONE** - This is bug-fix only, no schema changes

---

## Files to Modify

### Server Actions (13+ files)

- [ ] actions/team/remove-member.ts
- [ ] actions/team/update-member.ts
- [ ] actions/volunteers/volunteers.ts
- [ ] actions/volunteers/skills.ts
- [ ] actions/volunteers/availability.ts
- [ ] actions/volunteers/shifts.ts
- [ ] actions/volunteers/serving-opportunities.ts
- [ ] actions/connect-card/save-connect-card.ts
- [ ] actions/connect-card/update-connect-card.ts
- [ ] actions/prayer-requests/create-prayer-request.ts
- [ ] actions/prayer-requests/toggle-privacy.ts

### API Routes

- [ ] app/api/connect-cards/extract/route.ts
- [ ] app/api/test/auth/bypass/route.ts (review only)

---

## Testing Strategy

### E2E Tests to Verify

- [ ] Multi-tenant isolation (cannot access other org's data)
- [ ] Volunteer creation uses auth context
- [ ] Error messages are generic
- [ ] No PII in logs

### Manual Verification

- [ ] Build passes with no errors
- [ ] ESLint clean (no console statements)
- [ ] TypeScript strict mode passes

---

## References

- **Audit Report:** docs/technical/codebase-audit-2025-11-21.md
- **Core Patterns:** docs/essentials/coding-patterns.md
- **Multi-Tenant Security:** docs/essentials/architecture.md
- **ADRs:** docs/technical/architecture-decisions.md
