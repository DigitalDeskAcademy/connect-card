import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Role-Based Navigation & Functionality Tests
 *
 * Tests that each user role can access appropriate pages,
 * see correct UI elements, and perform allowed actions.
 *
 * Roles tested:
 * 1. Platform Admin - Full system access
 * 2. Church Owner - Full church organization access
 * 3. Church Admin - Church management (no billing/team)
 * 4. Church Staff - Limited read-only access
 */

test.describe("Platform Admin Role", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.platformAdmin.email);
  });

  test("Can access platform admin dashboard", async ({ page }) => {
    await page.goto("/platform/admin");

    // Should see platform admin dashboard
    await expect(page).toHaveURL(/\/platform\/admin/);

    // Should see admin controls
    const hasAdminUI =
      (await page.locator("text=/platform|admin/i").count()) > 0 ||
      (await page.locator('[href*="/platform/admin"]').count()) > 0;

    expect(hasAdminUI).toBeTruthy();
  });

  test("Can manage all organizations", async ({ page }) => {
    await page.goto("/platform/admin");

    // Should see organizations or ability to view them
    // (Implementation depends on your admin UI)
    await expect(page).toHaveURL(/\/platform/);
  });
});

test.describe("Church Owner Role", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Can access church admin dashboard", async ({ page }) => {
    await page.goto("/church/newlife/admin");

    await expect(page).toHaveURL(/\/church\/newlife\/admin/);

    // Should see dashboard content
    await page.waitForLoadState("networkidle");
  });

  test("Can access connect cards", async ({ page }) => {
    await page.goto("/church/newlife/admin/connect-cards");

    await expect(page).toHaveURL(/\/admin\/connect-cards/);

    // Should see connect cards UI
    await page.waitForLoadState("networkidle");

    // Check for page-specific elements
    const hasConnectCardsUI =
      (await page.locator("text=/connect card/i").count()) > 0 ||
      (await page.locator('[data-testid*="connect"]').count()) > 0;

    expect(hasConnectCardsUI).toBeTruthy();
  });

  test("Can access team management", async ({ page }) => {
    await page.goto("/church/newlife/admin/team");

    await expect(page).toHaveURL(/\/admin\/team/);
    await page.waitForLoadState("networkidle");

    // Should see team management UI
    const hasTeamUI =
      (await page.locator("text=/team|staff|member/i").count()) > 0;

    expect(hasTeamUI).toBeTruthy();
  });

  test("Can access courses", async ({ page }) => {
    await page.goto("/church/newlife/admin/courses");

    await expect(page).toHaveURL(/\/admin\/courses/);
    await page.waitForLoadState("networkidle");
  });

  test("Can navigate using sidebar", async ({ page }) => {
    await page.goto("/church/newlife/admin");

    // Look for navigation links inside sidebar (uses shadcn/ui Sidebar component)
    const navLinks = await page.locator('[data-sidebar="sidebar"] a').count();

    // Should have navigation menu
    expect(navLinks).toBeGreaterThan(0);
  });
});

test.describe("Church Admin Role", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchAdmin.email);
  });

  test("Can access church admin dashboard", async ({ page }) => {
    await page.goto("/church/newlife/admin");

    await expect(page).toHaveURL(/\/church\/newlife\/admin/);
    await page.waitForLoadState("networkidle");
  });

  test("Can access connect cards", async ({ page }) => {
    await page.goto("/church/newlife/admin/connect-cards");

    await expect(page).toHaveURL(/\/admin\/connect-cards/);
    await page.waitForLoadState("networkidle");
  });

  test("Can access courses", async ({ page }) => {
    await page.goto("/church/newlife/admin/courses");

    await expect(page).toHaveURL(/\/admin\/courses/);
    await page.waitForLoadState("networkidle");
  });

  test("Can access team management (limited)", async ({ page }) => {
    await page.goto("/church/newlife/admin/team");

    // Admin can see team but may have limited actions
    await expect(page).toHaveURL(/\/admin\/team/);
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Church Staff Role", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchStaff.email);
  });

  test("Gets redirected from admin pages", async ({ page }) => {
    await page.goto("/church/newlife/admin");

    // Staff should be redirected away from admin or shown unauthorized
    await page.waitForLoadState("networkidle");

    const currentURL = page.url();
    const isAllowed =
      currentURL.includes("/unauthorized") ||
      currentURL.includes("/login") ||
      currentURL.includes("/setup") ||
      !currentURL.includes("/admin");

    expect(isAllowed).toBeTruthy();
  });

  test("Cannot access team management", async ({ page }) => {
    await page.goto("/church/newlife/admin/team");

    // Should be denied
    await page.waitForLoadState("networkidle");

    const currentURL = page.url();
    const isDenied =
      currentURL.includes("/unauthorized") || !currentURL.includes("/team");

    expect(isDenied).toBeTruthy();
  });

  test("Cannot access connect cards admin", async ({ page }) => {
    await page.goto("/church/newlife/admin/connect-cards");

    // Should be denied or redirected
    await page.waitForLoadState("networkidle");

    const currentURL = page.url();
    const isDenied =
      currentURL.includes("/unauthorized") ||
      !currentURL.includes("/connect-cards");

    expect(isDenied).toBeTruthy();
  });

  test("Can access learning portal (student view)", async ({ page }) => {
    await page.goto("/church/newlife/learning/courses");

    // Staff should be able to view courses as students
    await page.waitForLoadState("networkidle");

    // Should see learning content (not admin controls)
    const hasLearningUI =
      (await page.locator("text=/course|learn/i").count()) > 0;

    expect(hasLearningUI).toBeTruthy();
  });
});

test.describe("Navigation Functionality Tests", () => {
  test("Church Owner can use all nav links", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin");

    // Get all navigation links
    const navLinks = page.locator(
      'nav a[href^="/church/newlife/admin"], [role="navigation"] a[href^="/church/newlife/admin"]'
    );
    const linkCount = await navLinks.count();

    // Click through each link and verify it navigates
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute("href");

      if (href && !href.includes("#")) {
        await link.click({ force: true });
        await page.waitForLoadState("networkidle");

        // Should navigate successfully
        expect(page.url()).toContain("/church/newlife");

        // Go back to admin for next link
        await page.goto("/church/newlife/admin");
      }
    }
  });

  test("Form buttons are accessible for Church Owner", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Test connect cards page has functional buttons
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Look for action buttons
    const buttons = await page.locator("button:not([disabled])").count();

    // Should have interactive buttons
    expect(buttons).toBeGreaterThan(0);
  });

  test("Staff sees limited UI elements", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchStaff.email);
    await page.goto("/church/newlife/learning/courses");

    await page.waitForLoadState("networkidle");

    // Should NOT see admin-only buttons
    const hasAdminButtons =
      (await page
        .locator('button:has-text("Delete"), button:has-text("Create")')
        .count()) > 0;

    // Staff should not see create/delete buttons in learning view
    expect(hasAdminButtons).toBeFalsy();
  });
});

test.describe("Breadcrumb & Page Title Tests", () => {
  test("Page titles are correct for each route", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    const routes = [
      { path: "/church/newlife/admin", expectedText: /admin|dashboard/i },
      {
        path: "/church/newlife/admin/connect-cards",
        expectedText: /connect card/i,
      },
      { path: "/church/newlife/admin/courses", expectedText: /course/i },
      { path: "/church/newlife/admin/team", expectedText: /team/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // Check page has relevant text
      const hasExpectedContent =
        (await page.locator(`text=${route.expectedText}`).count()) > 0;

      expect(hasExpectedContent).toBeTruthy();
    }
  });
});
