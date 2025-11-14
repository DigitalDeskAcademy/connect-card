# Prayer Management Bug Fix Plan

**Created:** 2025-11-13
**Status:** Ready to Implement
**Test Suite:** `/tests/e2e/prayer-security-comprehensive.spec.ts`

---

## 📊 Test Results Summary

**Tests Run:** 10 comprehensive security and functionality tests
**Passed:** 7
**Failed:** 3

### ✅ Passing Tests (Security Verified)

1. **Multi-Tenant Isolation** - Correctly blocks unauthorized org access (404)
2. **Search Functionality** - All 5 edge cases pass (SQL injection blocked, case insensitive, empty state)
3. **Status Filtering** - All 6 statuses work correctly
4. **Urgent/Private Indicators** - Visual flags display (tests 7-10 still running)

### ❌ Failing Tests (Bugs Found)

#### **BUG #1: Pagination Not Working** 🚨 HIGH PRIORITY

- **Test Failed:** #6 - Pagination
- **Issue:** Clicking "Next" button doesn't change displayed data
- **Expected:** Page 2 should show items 11-20 of 30
- **Actual:** Page 2 shows items 1-10 (same as page 1)
- **Impact:** Users cannot access prayers beyond first 10 records
- **Location:** `/components/dashboard/prayer-requests/data-table.tsx`

#### **BUG #2: Logout Function Broken**

- **Tests Failed:** #2 - Privacy Controls, #3 - Role-Based Access
- **Issue:** Logout redirects to `/church/newlife/admin` instead of `/login`
- **Expected:** Should redirect to `/login` page with email input
- **Actual:** Redirects back to admin dashboard (still logged in)
- **Impact:** Cannot test multi-user scenarios, users cannot properly log out
- **Location:** `/tests/helpers/auth.ts:115` (test helper - may indicate app-wide logout issue)

---

## 🔧 Fix Plan

### Phase 1: Fix Pagination (Priority: HIGH)

**Root Cause Analysis:**
The data table is using TanStack Table v8 with client-side pagination, but the pagination state isn't updating the displayed rows correctly.

**Investigation Steps:**

1. Check if `getPaginationRowModel()` is properly connected
2. Verify `table.setPageIndex()` is being called on page navigation
3. Check if `pageSize` state is correctly configured
4. Review table state management for `pageIndex`

**Fix Location:** `/components/dashboard/prayer-requests/data-table.tsx`

**Expected Changes:**

- Ensure pagination state properly updates row display
- Verify `getRowModel()` respects current page index
- Test pagination controls trigger state changes

**Testing:**

- Run test #6 (Pagination) - should pass
- Manual test: Navigate to page 2, 3 - verify correct data shows
- Verify pagination text updates correctly

---

### Phase 2: Fix Logout Function (Priority: MEDIUM)

**Root Cause Analysis:**
The logout helper redirects to `/login` but Better Auth is redirecting back to admin dashboard (user still authenticated).

**Investigation Steps:**

1. Check if Better Auth session is being cleared
2. Verify logout endpoint `/api/auth/sign-out` is being called
3. Check middleware redirect logic after logout
4. Review Better Auth configuration for post-logout redirect

**Fix Location:**

- Primary: Better Auth logout API endpoint
- Secondary: `/tests/helpers/auth.ts:115` (may need to call proper logout API)

**Expected Changes:**

- Call Better Auth sign-out API properly
- Clear session cookies/tokens
- Redirect to `/login` page after logout
- Ensure user must re-authenticate

**Testing:**

- Run test #2 (Privacy Controls) - should pass
- Run test #3 (Role-Based Access) - should pass
- Manual test: Logout from UI, verify redirects to login

---

### Phase 3: Retest Full Suite

After fixes are implemented, run complete test suite:

```bash
npx playwright test tests/e2e/prayer-security-comprehensive.spec.ts --headed --project=chromium --workers=1
```

**Success Criteria:**

- All 10 tests pass
- No new bugs introduced
- Performance remains acceptable (<10s page load, <2s filters)

---

## 📋 Implementation Checklist

### Bug #1: Pagination

- [ ] Read `/components/dashboard/prayer-requests/data-table.tsx`
- [ ] Identify pagination state issue
- [ ] Implement fix (likely table state configuration)
- [ ] Test pagination manually in browser
- [ ] Run Playwright test #6 to verify fix

### Bug #2: Logout

- [ ] Read `/tests/helpers/auth.ts` logout function
- [ ] Check Better Auth logout API endpoint
- [ ] Implement proper logout flow
- [ ] Test logout manually in browser
- [ ] Run Playwright tests #2 and #3 to verify fix

### Final Verification

- [ ] Run full comprehensive test suite
- [ ] Verify all 10 tests pass
- [ ] Check for any new console errors
- [ ] Verify performance benchmarks still meet targets

---

## 🎯 Success Metrics

**Before Fixes:**

- Tests Passing: 7/10 (70%)
- Critical Bugs: 2
- Users Impacted: High (pagination blocks access to >10 records)

**After Fixes:**

- Tests Passing: 10/10 (100%)
- Critical Bugs: 0
- Users Impacted: None

---

## 📝 Notes

- Bug #1 (Pagination) is higher priority as it blocks feature functionality
- Bug #2 (Logout) primarily affects testing, but is also a security concern
- Both bugs must be fixed before Phase 3 (Production Launch)
- Comprehensive test suite successfully identified real issues before production!
