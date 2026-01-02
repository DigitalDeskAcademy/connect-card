# E2E Testing Suite - Product Vision

**Status:** 🟢 **Phase 1 Complete** - 108 tests passing, CI/CD integration added (PR #85)
**Worktree:** `e2e`
**Last Updated:** 2026-01-01
**Focus:** Enterprise-grade E2E testing with industry-standard coverage

---

## Recent Completions (Dec 2025)

- ✅ **PR #82** - Comprehensive E2E test suite with 108 passing tests
  - Full test infrastructure with shared auth setup
  - 19 test files covering all major features
  - Smoke tests for all admin routes
  - Export, contacts, settings page coverage

---

## Overview

This worktree is dedicated to building a comprehensive, enterprise-grade E2E test suite using Playwright. The goal is to ensure Church Connect Hub is production-ready with automated verification of all critical user journeys.

### Testing Philosophy

We follow the **Testing Pyramid** approach:

- **E2E Tests (10%)** - Critical user journeys only
- **Integration Tests (20%)** - API + DB together
- **Unit Tests (70%)** - Pure functions, business logic

E2E tests focus on **what users actually do**, not implementation details.

---

## Current State

### Test Infrastructure (Complete)

| Component         | Status       | Notes                               |
| ----------------- | ------------ | ----------------------------------- |
| Playwright config | ✅ Excellent | Auth setup project, proper timeouts |
| Auth helper       | ✅ Excellent | DB-based OTP, reusable helpers      |
| Vitest config     | ✅ Good      | Unit + integration structure        |
| Test directory    | ✅ Good      | Follows testing pyramid             |

### Existing E2E Test Files

| File                                          | Coverage Area            | Tests |
| --------------------------------------------- | ------------------------ | ----- |
| `01-security-multi-tenant.spec.ts`            | Multi-tenant isolation   | 10    |
| `02-connect-cards.spec.ts`                    | Connect card workflow    | 12    |
| `03-team-management.spec.ts`                  | Invitations, permissions | 11    |
| `04-lms-training.spec.ts`                     | Course management        | 9     |
| `05-role-based-navigation.spec.ts`            | Permission enforcement   | -     |
| `06-connect-card-workflow.spec.ts`            | Card processing          | -     |
| `07-connect-card-complete-workflow.spec.ts`   | Full upload→review flow  | 5     |
| `08-volunteer-management.spec.ts`             | Volunteer CRUD           | 8     |
| `09-prayer-management.spec.ts`                | Prayer features          | 8     |
| `10-connect-card-batches-basic.spec.ts`       | Batch operations         | -     |
| `11-connect-card-phase1-basic.spec.ts`        | Phase 1 features         | -     |
| `12-connect-card-phase2-interactions.spec.ts` | Phase 2 features         | -     |
| `13-connect-card-phase3-workflows.spec.ts`    | Phase 3 features         | -     |
| `prayer-management-walkthrough.spec.ts`       | Prayer walkthrough       | -     |
| `prayer-security-comprehensive.spec.ts`       | Prayer security          | -     |

---

## Coverage Analysis

### App Routes (76 total pages)

#### Church Admin Routes (41 routes)

| Route                                                  | Test Coverage    | Priority |
| ------------------------------------------------------ | ---------------- | -------- |
| `/church/[slug]/admin`                                 | ✅ Partial       | -        |
| `/church/[slug]/admin/connect-cards`                   | ✅ Extensive     | -        |
| `/church/[slug]/admin/connect-cards/review/[batchId]`  | ✅ Covered       | -        |
| `/church/[slug]/admin/connect-cards/batches/[batchId]` | ✅ Covered       | -        |
| `/church/[slug]/admin/connect-cards/scan`              | ❌ Missing       | Medium   |
| `/church/[slug]/admin/team`                            | ✅ Covered       | -        |
| `/church/[slug]/admin/prayer`                          | ✅ Covered       | -        |
| `/church/[slug]/admin/prayer-batches`                  | ❌ Missing       | Medium   |
| `/church/[slug]/admin/prayer-batches/[batchId]`        | ❌ Missing       | Medium   |
| `/church/[slug]/admin/volunteer`                       | ✅ Covered       | -        |
| `/church/[slug]/admin/volunteer/[id]`                  | ❌ Missing       | Medium   |
| `/church/[slug]/admin/courses`                         | ✅ Partial (LMS) | -        |
| `/church/[slug]/admin/export`                          | ❌ **Missing**   | **HIGH** |
| `/church/[slug]/admin/contacts`                        | ❌ **Missing**   | **HIGH** |
| `/church/[slug]/admin/analytics`                       | ❌ **Missing**   | **HIGH** |
| `/church/[slug]/admin/insights`                        | ❌ Missing       | Medium   |
| `/church/[slug]/admin/settings`                        | ❌ **Missing**   | **HIGH** |
| `/church/[slug]/admin/settings/volunteer-onboarding`   | ❌ Missing       | Medium   |
| `/church/[slug]/admin/calendar`                        | ❌ Missing       | Low      |
| `/church/[slug]/admin/payments`                        | ❌ Missing       | Low      |
| `/church/[slug]/admin/conversations`                   | ❌ Missing       | Low      |
| `/church/[slug]/admin/support`                         | ❌ Missing       | Low      |
| `/church/[slug]/admin/n2n`                             | ❌ Missing       | Low      |

#### Public Routes

| Route                        | Test Coverage  | Priority |
| ---------------------------- | -------------- | -------- |
| `/church/[slug]/scan`        | ❌ **Missing** | **HIGH** |
| `/church/[slug]/my-prayers`  | ❌ Missing     | Medium   |
| `/church/[slug]/learning/*`  | ✅ Partial     | -        |
| `/volunteer/confirm/[token]` | ❌ Missing     | Medium   |

#### Platform Admin Routes (14 routes)

| Route               | Test Coverage | Priority          |
| ------------------- | ------------- | ----------------- |
| `/platform/admin/*` | ❌ Missing    | Low (post-launch) |

---

## Implementation Plan

### Phase 1: Smoke Tests + High Priority Coverage (PR #82) ✅ COMPLETE

**Goal:** Ensure all pages load without errors + cover high-priority gaps

| #   | Task                                          | Status |
| --- | --------------------------------------------- | ------ |
| 1   | Create smoke test suite (all 41 admin routes) | [x]    |
| 2   | Export functionality tests                    | [x]    |
| 3   | Contacts module tests                         | [x]    |
| 4   | Settings pages tests                          | [x]    |
| 5   | Analytics/insights smoke tests                | [x]    |
| 6   | Keyword detection tests                       | [x]    |

**Deliverables:**

- `tests/e2e/00-smoke-tests.spec.ts` ✅
- `tests/e2e/14-export-functionality.spec.ts` ✅
- `tests/e2e/14-keyword-vision-test.spec.ts` ✅
- `tests/e2e/15-contacts-module.spec.ts` ✅
- `tests/e2e/16-settings-pages.spec.ts` ✅

### Phase 2: Medium Priority + Edge Cases (PR #2)

**Goal:** Fill remaining coverage gaps with edge case testing

| #   | Task                              | Status |
| --- | --------------------------------- | ------ |
| 1   | Prayer batches tests              | [ ]    |
| 2   | Volunteer detail page tests       | [ ]    |
| 3   | My Prayers page tests             | [ ]    |
| 4   | Volunteer confirmation flow tests | [ ]    |
| 5   | Calendar functionality tests      | [ ]    |

### Phase 3: Advanced Testing (PR #3)

**Goal:** Add accessibility, performance, and visual regression testing

| #   | Task                                | Status |
| --- | ----------------------------------- | ------ |
| 1   | Accessibility testing with axe-core | [ ]    |
| 2   | Performance assertions (load times) | [ ]    |
| 3   | Visual regression baseline          | [ ]    |
| 4   | Mobile viewport testing             | [ ]    |

### Phase 4: CI/CD Integration (PR #4)

**Goal:** Automated testing in GitHub Actions

| #   | Task                        | Status |
| --- | --------------------------- | ------ |
| 1   | GitHub Actions workflow     | [ ]    |
| 2   | Parallel test execution     | [ ]    |
| 3   | Test reporting & artifacts  | [ ]    |
| 4   | Slack/Discord notifications | [ ]    |
| 5   | PR blocking on test failure | [ ]    |

---

## Test Patterns & Guidelines

### File Naming Convention

```
XX-feature-name.spec.ts
```

Where `XX` is a two-digit number for ordering:

- `00-09` - Infrastructure (smoke, setup)
- `01` - Security (multi-tenant)
- `02-09` - Core features (connect cards, team, etc.)
- `10-19` - Secondary features
- `20+` - Edge cases and advanced tests

### Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

test.describe("Feature Name - Category", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/feature");
    await page.waitForLoadState("networkidle");
  });

  test("SUCCESS: Happy path description", async ({ page }) => {
    // Test implementation
  });

  test("EDGE CASE: Description", async ({ page }) => {
    // Edge case test
  });

  test("SECURITY: Description", async ({ page }) => {
    // Security test
  });
});
```

### Test Categories

Prefix tests with category for clarity:

- `SUCCESS:` - Happy path tests
- `EDGE CASE:` - Boundary conditions
- `SECURITY:` - Security/permission tests
- `CONCURRENT:` - Race condition tests
- `PERFORMANCE:` - Load time tests
- `VALIDATION:` - Form validation tests

### Authentication

All tests use the shared auth setup:

```typescript
// tests/auth.setup.ts runs ONCE before all tests
// Saves session to tests/.auth/user.json
// Individual tests reuse this session (no repeated logins)
```

### Test Users

```typescript
export const TEST_USERS = {
  platformAdmin: { email: "platform@test.com", ... },
  churchOwner: { email: "test@playwright.dev", ... },    // Primary test user
  churchAdmin: { email: "admin@newlife.test", ... },
  churchStaff: { email: "staff@newlife.test", ... },
};
```

---

## Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/e2e/01-security-multi-tenant.spec.ts

# Run with UI (debugging)
pnpm test:e2e:ui

# Run headed (see browser)
pnpm test:e2e:headed

# Run with debug mode
pnpm test:e2e:debug

# Run specific category
pnpm test:e2e:security
pnpm test:e2e:connect-cards
```

---

## Success Metrics

### Coverage Targets

| Metric                 | Current | Target    | Notes               |
| ---------------------- | ------- | --------- | ------------------- |
| Admin route coverage   | ~85%    | 90%       | All pages load      |
| Critical path coverage | ~90%    | 100%      | Core workflows      |
| Security test coverage | Good    | Excellent | Multi-tenant        |
| Edge case coverage     | Good    | Good      | Form validation     |
| Total tests            | 108     | 120+      | Comprehensive suite |

### Performance Targets

| Metric             | Target  | Notes              |
| ------------------ | ------- | ------------------ |
| Test suite runtime | < 5 min | Full suite         |
| Individual test    | < 30s   | Except AI tests    |
| Flaky test rate    | < 2%    | No random failures |

### Quality Gates (for CI/CD)

- [ ] All tests pass
- [ ] No accessibility violations (critical)
- [ ] Page load time < 3s
- [ ] No console errors

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Strategy](/docs/technical/testing-strategy.md)
- [PLAYBOOK.md](/docs/PLAYBOOK.md)

---

## Changelog

### 2025-12-16

- Initial vision document created
- Audit of existing test coverage
- Phase 1 plan defined
