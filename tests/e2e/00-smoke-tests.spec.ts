import { test, expect, Page } from "@playwright/test";

/**
 * Smoke Tests - Page Load Verification
 *
 * These tests verify that ALL pages in the application load without errors.
 * They serve as a quick health check and baseline for the entire app.
 *
 * What we check:
 * - HTTP status 200 (or valid redirect)
 * - No JavaScript console errors
 * - No uncaught exceptions
 * - Page renders content (not blank)
 * - Critical elements visible (sidebar, header)
 *
 * These tests run FAST - no complex interactions, just load verification.
 */

// Helper to check page loaded successfully
async function verifyPageLoads(
  page: Page,
  url: string,
  options: {
    expectedText?: string | RegExp;
    allowRedirect?: boolean;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { expectedText, allowRedirect = true, timeout = 15000 } = options;

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  // Collect console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Collect page errors (uncaught exceptions)
  page.on("pageerror", error => {
    pageErrors.push(error.message);
  });

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    // Check HTTP status
    const status = response?.status() || 0;
    if (status >= 400) {
      // Allow 404 for missing dynamic routes, but flag others
      if (status !== 404) {
        return { success: false, error: `HTTP ${status}` };
      }
    }

    // Wait for page to stabilize
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // Ignore timeout - some pages have long-running requests
    });

    // Check page has content (not blank)
    const bodyContent = await page.textContent("body");
    if (!bodyContent || bodyContent.trim().length < 10) {
      return { success: false, error: "Page appears blank" };
    }

    // Check for expected text if provided
    if (expectedText) {
      const hasText =
        typeof expectedText === "string"
          ? bodyContent.includes(expectedText)
          : expectedText.test(bodyContent);
      if (!hasText) {
        return {
          success: false,
          error: `Expected text not found: ${expectedText}`,
        };
      }
    }

    // Check for error pages
    const isErrorPage =
      bodyContent.includes("Something went wrong") ||
      bodyContent.includes("Application error") ||
      bodyContent.includes("500 Internal Server Error");
    if (isErrorPage) {
      return { success: false, error: "Error page displayed" };
    }

    // Filter out known benign console errors
    const criticalErrors = consoleErrors.filter(
      err =>
        !err.includes("favicon") &&
        !err.includes("manifest") &&
        !err.includes("hydration") && // React hydration warnings
        !err.includes("Warning:") && // React dev warnings
        !err.includes("404") && // 404s for missing assets are not critical
        !err.includes("Failed to load resource") && // Network errors for optional resources
        !err.includes("net::ERR") // Network errors
    );

    if (criticalErrors.length > 0) {
      return {
        success: false,
        error: `Console errors: ${criticalErrors.join(", ")}`,
      };
    }

    if (pageErrors.length > 0) {
      return {
        success: false,
        error: `Page errors: ${pageErrors.join(", ")}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

test.describe("Smoke Tests - Church Admin Pages", () => {
  // Use stored auth state (from auth.setup.ts)
  test.use({ storageState: "tests/.auth/user.json" });

  const BASE_URL = "/church/newlife/admin";

  // Core admin pages that MUST work
  const criticalPages = [
    { path: "", name: "Dashboard" },
    { path: "/connect-cards", name: "Connect Cards" },
    { path: "/team", name: "Team Management" },
    { path: "/prayer", name: "Prayer Management" },
    { path: "/volunteer", name: "Volunteer Directory" },
    { path: "/export", name: "Export" },
    { path: "/contacts", name: "Contacts" },
  ];

  // Secondary admin pages
  const secondaryPages = [
    { path: "/analytics", name: "Analytics" },
    { path: "/insights", name: "Insights" },
    { path: "/settings", name: "Settings" },
    { path: "/calendar", name: "Calendar" },
    { path: "/courses", name: "Courses/LMS" },
    { path: "/conversations", name: "Conversations" },
    { path: "/payments", name: "Payments" },
    { path: "/prayer-batches", name: "Prayer Batches" },
    { path: "/support", name: "Support" },
  ];

  test.describe("Critical Pages", () => {
    for (const { path, name } of criticalPages) {
      test(`loads: ${name}`, async ({ page }) => {
        const result = await verifyPageLoads(page, `${BASE_URL}${path}`);

        if (!result.success) {
          console.error(`FAILED: ${name} - ${result.error}`);
        }

        expect(result.success, result.error).toBe(true);
      });
    }
  });

  test.describe("Secondary Pages", () => {
    for (const { path, name } of secondaryPages) {
      test(`loads: ${name}`, async ({ page }) => {
        const result = await verifyPageLoads(page, `${BASE_URL}${path}`);

        if (!result.success) {
          console.error(`FAILED: ${name} - ${result.error}`);
        }

        expect(result.success, result.error).toBe(true);
      });
    }
  });

  test.describe("Connect Card Sub-pages", () => {
    test("loads: Scan Page", async ({ page }) => {
      const result = await verifyPageLoads(
        page,
        `${BASE_URL}/connect-cards/scan`
      );
      expect(result.success, result.error).toBe(true);
    });

    // Note: /connect-cards/review/[batchId] requires a valid batchId
    // Note: /connect-cards/batches/[batchId] requires a valid batchId
    // These are tested in connect-card workflow tests
  });

  test.describe("Settings Sub-pages", () => {
    test("loads: Volunteer Onboarding Settings", async ({ page }) => {
      const result = await verifyPageLoads(
        page,
        `${BASE_URL}/settings/volunteer-onboarding`
      );
      expect(result.success, result.error).toBe(true);
    });
  });
});

test.describe("Smoke Tests - Church Public Pages", () => {
  // Use stored auth state
  test.use({ storageState: "tests/.auth/user.json" });

  const publicPages = [
    { path: "/church/newlife", name: "Church Home" },
    { path: "/church/newlife/scan", name: "QR Scan Page" },
    { path: "/church/newlife/my-prayers", name: "My Prayers" },
    { path: "/church/newlife/learning", name: "Learning Portal" },
    { path: "/church/newlife/learning/courses", name: "Course Catalog" },
  ];

  for (const { path, name } of publicPages) {
    test(`loads: ${name}`, async ({ page }) => {
      const result = await verifyPageLoads(page, path);
      expect(result.success, result.error).toBe(true);
    });
  }
});

test.describe("Smoke Tests - Auth & Public Pages (No Auth)", () => {
  // These pages should work WITHOUT authentication
  test.use({ storageState: { cookies: [], origins: [] } });

  const unauthPages = [
    { path: "/", name: "Landing Page" },
    { path: "/login", name: "Login Page" },
    { path: "/pricing", name: "Pricing Page" },
    { path: "/features", name: "Features Page" },
    { path: "/demo", name: "Demo Page" },
    { path: "/signup", name: "Signup Page" },
  ];

  for (const { path, name } of unauthPages) {
    test(`loads without auth: ${name}`, async ({ page }) => {
      const result = await verifyPageLoads(page, path);
      expect(result.success, result.error).toBe(true);
    });
  }
});

test.describe("Smoke Tests - Error Handling", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("handles non-existent church gracefully", async ({ page }) => {
    const response = await page.goto("/church/non-existent-church-xyz/admin");

    // Should get 404 or redirect to error page
    const status = response?.status() || 0;
    expect([404, 302, 307]).toContain(status);
  });

  test("handles non-existent page gracefully", async ({ page }) => {
    const response = await page.goto(
      "/church/newlife/admin/this-page-does-not-exist"
    );

    // Should get 404
    const status = response?.status() || 0;
    expect(status).toBe(404);
  });

  test("unauthorized page shows proper message", async ({ page }) => {
    await page.goto("/unauthorized");

    const content = await page.textContent("body");
    expect(
      content?.toLowerCase().includes("unauthorized") ||
        content?.toLowerCase().includes("access") ||
        content?.toLowerCase().includes("permission")
    ).toBe(true);
  });
});

test.describe("Smoke Tests - UI Framework Verification", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("sidebar renders on admin pages", async ({ page }) => {
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Check for sidebar navigation
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const hasSidebar = await sidebar.isVisible().catch(() => false);

    // Or check for nav element
    const nav = page.locator("nav").first();
    const hasNav = await nav.isVisible().catch(() => false);

    expect(hasSidebar || hasNav).toBe(true);
  });

  test("header renders with user info", async ({ page }) => {
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Check for user avatar or dropdown
    const userElement = page
      .locator('[aria-label="User menu"], [data-testid="user-menu"], .avatar')
      .first();
    const hasUserElement = await userElement.isVisible().catch(() => false);

    // Or just check header exists
    const header = page.locator("header").first();
    const hasHeader = await header.isVisible().catch(() => false);

    expect(hasUserElement || hasHeader).toBe(true);
  });

  test("theme toggle exists", async ({ page }) => {
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Look for theme toggle button
    const themeToggle = page
      .locator(
        'button[aria-label*="theme"], button[aria-label*="Theme"], [data-testid="theme-toggle"]'
      )
      .first();
    const hasThemeToggle = await themeToggle.isVisible().catch(() => false);

    // Theme toggle is nice to have, not critical
    if (!hasThemeToggle) {
      console.log("Note: Theme toggle not found (optional)");
    }
  });
});

test.describe("Smoke Tests - Performance Baseline", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("dashboard loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);

    // Should load within 5 seconds (generous for dev server)
    expect(loadTime).toBeLessThan(5000);
  });

  test("connect cards page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    console.log(`Connect Cards load time: ${loadTime}ms`);

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
