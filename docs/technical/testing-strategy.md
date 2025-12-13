# Testing Strategy

> Industry-standard testing approach for Church Connect Hub

## Overview

We follow the **Testing Pyramid** approach used by companies like Google, Stripe, and Vercel:

```
           /\
          /  \        E2E Tests (10%)
         /    \       Critical user journeys only
        /------\
       /        \
      /  Integ.  \    Integration Tests (20%)
     /   Tests    \   API + DB together
    /--------------\
   /                \
  /    Unit Tests    \ Unit Tests (70%)
 /                    \ Pure functions, business logic
/______________________\
```

## Decision Framework

### How to Choose Test Type

Ask these questions in order:

1. **"Does this code have dependencies (DB, API, file system)?"**

   - NO → **Unit Test**
   - YES → Continue...

2. **"Do I need to test the UI/user interaction?"**

   - NO → **Integration Test**
   - YES → Continue...

3. **"Is this a critical user journey?"**
   - YES → **E2E Test**
   - NO → Integration test is enough

### Quick Reference

| Code Type         | Example                   | Test Type   |
| ----------------- | ------------------------- | ----------- |
| Pure function     | `formatCategory()`        | Unit        |
| Utility/helper    | `formatPhoneNumber()`     | Unit        |
| Zod schema        | `volunteerSchema.parse()` | Unit        |
| Server action     | `processVolunteer()`      | Integration |
| API route         | `POST /api/connect-cards` | Integration |
| DB query helper   | `getVolunteersByOrg()`    | Integration |
| Login → Dashboard | Critical path             | E2E         |
| Checkout flow     | Critical path             | E2E         |
| Table sorting     | Not critical              | Skip E2E    |

## Technology Stack

| Layer              | Tool                 | Why                                            |
| ------------------ | -------------------- | ---------------------------------------------- |
| Unit & Integration | **Vitest**           | Fast, ESM-native, great DX, works with Next.js |
| E2E                | **Playwright**       | Best browser automation, already using it      |
| Mocking            | **vitest mocks**     | Built-in, no extra deps                        |
| DB Testing         | **Prisma + test DB** | Real queries, isolated data                    |

## Directory Structure

```
tests/
├── unit/                      # Vitest - pure functions (~1ms per test)
│   ├── lib/
│   │   ├── email/
│   │   │   └── service.test.ts
│   │   └── utils/
│   │       └── formatters.test.ts
│   └── schemas/
│       └── volunteer.test.ts
│
├── integration/               # Vitest - server actions + DB (~100ms per test)
│   ├── actions/
│   │   ├── volunteers/
│   │   │   └── processVolunteer.test.ts
│   │   └── connect-card/
│   │       └── updateConnectCard.test.ts
│   └── setup.ts              # DB connection, cleanup helpers
│
└── e2e/                       # Playwright - browser tests (~5-30s per test)
    ├── critical-paths.spec.ts # Happy paths: login, create, process
    ├── security.spec.ts       # Multi-tenant isolation (KEEP)
    └── helpers/
        └── auth.ts
```

## Test Naming Convention

```typescript
// Pattern: describe('FunctionName', () => { it('should X when Y', () => {}) })

describe("processVolunteer", () => {
  it("should activate volunteer and send welcome email", async () => {});
  it("should skip email when volunteer has no email address", async () => {});
  it("should return error when volunteer not found", async () => {});
});
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths
```

### 2. Create Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    setupFiles: ["tests/setup.ts"],
    globals: true,
  },
});
```

### 3. Add Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4. Create Test Setup File

```typescript
// tests/setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { prisma } from "@/lib/db";

// Ensure we're using test database
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes("test")) {
    throw new Error("Tests must run against test database!");
  }
});

// Clean up after each test
afterEach(async () => {
  // Reset specific tables as needed
});

// Disconnect on finish
afterAll(async () => {
  await prisma.$disconnect();
});
```

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/lib/email/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatCategory } from "@/lib/email/templates/volunteer-documents";

describe("formatCategory", () => {
  it("should convert KIDS_MINISTRY to Kids Ministry", () => {
    expect(formatCategory("KIDS_MINISTRY")).toBe("Kids Ministry");
  });

  it("should handle single word categories", () => {
    expect(formatCategory("WORSHIP")).toBe("Worship");
  });

  it("should handle empty string", () => {
    expect(formatCategory("")).toBe("");
  });
});
```

### Integration Test Example

```typescript
// tests/integration/actions/volunteers/processVolunteer.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import { processVolunteer } from "@/actions/volunteers/volunteers";

// Mock auth to bypass session checks
vi.mock("@/app/data/dashboard/require-dashboard-access", () => ({
  requireDashboardAccess: vi.fn().mockResolvedValue({
    session: { user: { id: "test-user" } },
    organization: { id: "test-org", name: "Test Church" },
    dataScope: { filters: { canManageUsers: true } },
  }),
}));

describe("processVolunteer", () => {
  const testOrgId = "test-org-id";
  let testVolunteerId: string;

  beforeEach(async () => {
    // Create test data
    const member = await prisma.churchMember.create({
      data: {
        organizationId: testOrgId,
        name: "Test Volunteer",
        email: "volunteer@test.com",
      },
    });

    const volunteer = await prisma.volunteer.create({
      data: {
        organizationId: testOrgId,
        churchMemberId: member.id,
        status: "PENDING_APPROVAL",
      },
    });

    testVolunteerId = volunteer.id;
  });

  it("should activate volunteer and log email", async () => {
    const result = await processVolunteer("test-slug", testVolunteerId, [
      "KIDS_MINISTRY",
    ]);

    expect(result.status).toBe("success");

    // Verify volunteer was activated
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: testVolunteerId },
    });
    expect(volunteer?.status).toBe("ACTIVE");

    // Verify email was logged
    const emailLog = await prisma.emailLog.findFirst({
      where: {
        metadata: {
          path: ["volunteerId"],
          equals: testVolunteerId,
        },
      },
    });
    expect(emailLog).not.toBeNull();
    expect(emailLog?.status).toBe("SKIPPED"); // Dev mode
  });
});
```

### E2E Test Example (Critical Path Only)

```typescript
// tests/e2e/critical-paths.spec.ts
import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "./helpers/auth";

test.describe("Critical User Journeys", () => {
  test("Church owner can process pending volunteer", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/volunteers");

    // Find pending volunteer tab
    await page.getByRole("tab", { name: /pending/i }).click();

    // Process first pending volunteer
    await page.getByRole("button", { name: "Process" }).first().click();

    // Select ministry category
    await page.getByRole("combobox", { name: /ministry/i }).click();
    await page.getByRole("option", { name: /kids/i }).click();

    // Submit
    await page.getByRole("button", { name: "Process Volunteer" }).click();

    // Verify success
    await expect(page.getByText(/activated/i)).toBeVisible();
  });
});
```

## What NOT to Test

1. **Third-party libraries** - Don't test that Prisma works
2. **Framework behavior** - Don't test that Next.js routes correctly
3. **TypeScript types** - The compiler does this
4. **Trivial code** - Don't test getters/setters with no logic

## Test Database Strategy

### Option 1: Separate Test Database (Recommended for CI)

```bash
# .env.test
DATABASE_URL="postgresql://...test_db"
```

### Option 2: Transaction Rollback (Faster for local)

```typescript
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

## Migration Plan: Current → New

### Phase 1: Setup ✅ COMPLETE

- [x] Document testing strategy
- [x] Install Vitest
- [x] Configure vitest.config.ts
- [x] Create directory structure
- [x] Add npm scripts

### Phase 2: Write New Tests ✅ COMPLETE

- [x] Unit tests for email service (`tests/unit/lib/email/service.test.ts`)
- [x] Integration tests for processVolunteer (`tests/integration/actions/volunteers/processVolunteer.test.ts` - 322 lines, comprehensive)
- [ ] Integration tests for email logging (in progress)

### Phase 3: Refactor E2E 🔄 IN PROGRESS

- [x] Keep: security.spec.ts (multi-tenant tests)
- [ ] Consolidate: Create critical-paths.spec.ts
- [ ] Remove: Redundant UI tests (table sort, pagination)

### Phase 4: CI Integration ⏳ PENDING

- [ ] Add GitHub Actions workflow
- [ ] Set up test database for CI
- [ ] Add coverage reporting

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Trophy (Kent C. Dodds)](https://kentcdodds.com/blog/write-tests)
- [Google Testing Blog](https://testing.googleblog.com/)
