import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * CRITICAL SECURITY TESTS - Multi-Tenant Isolation
 *
 * These tests attempt to breach tenant isolation - ALL should FAIL to access other orgs
 *
 * Attack vectors tested:
 * - Direct URL manipulation (accessing other org's slugs)
 * - API endpoint enumeration
 * - Session token reuse across organizations
 * - Cookie manipulation
 * - Organization ID injection
 */

test.describe("Multi-Tenant Security - Isolation Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage to ensure clean state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test("SECURITY: Cannot access other church's admin panel via URL manipulation", async ({
    page,
  }) => {
    // Login as NewLife church owner
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Verify we're at NewLife dashboard
    await expect(page).toHaveURL(/\/church\/newlife\/admin/);

    // ATTACK: Try to access a different organization by changing slug in URL
    const response = await page.goto("/church/different-church/admin");

    // EXPECTED: Should be denied (404, redirect, or error message)
    // App returns 404 which is correct security (doesn't leak org existence)
    const is404 = response?.status() === 404;
    const hasErrorContent = await page
      .locator("text=/not found|unauthorized|access denied/i")
      .count();

    // Either 404 status OR error message should be present
    expect(is404 || hasErrorContent > 0).toBeTruthy();

    // Verify we CANNOT see the other church's admin panel
    await expect(page.locator("text=different-church")).not.toBeVisible();
  });

  test("SECURITY: Cannot access other church's connect cards", async ({
    page,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // ATTACK: Try to access connect cards for another org
    const response = await page.goto("/church/other-org/admin/connect-cards", {
      waitUntil: "networkidle",
    });

    // EXPECTED: Should get 403 Forbidden or redirect
    if (response) {
      const status = response.status();
      expect([401, 403, 404]).toContain(status);
    }

    // Verify no connect card data is visible
    await expect(page.locator('[data-testid="connect-card-item"]')).toHaveCount(
      0
    );
  });

  test("SECURITY: API endpoints respect organizationId isolation", async ({
    page,
    request,
  }) => {
    // Login to get session
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Get cookies for authenticated requests
    const cookies = await page.context().cookies();

    // ATTACK: Try to fetch data for different organization via API
    const apiResponse = await request.get(
      "/api/church/different-org/connect-cards",
      {
        headers: {
          Cookie: cookies.map(c => `${c.name}=${c.value}`).join("; "),
        },
      }
    );

    // EXPECTED: Should return 401/403
    expect([401, 403, 404]).toContain(apiResponse.status());
  });

  test("SECURITY: Cannot invite users to other organizations", async ({
    page,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Navigate to team management
    await page.goto("/church/newlife/admin/team");
    await page.waitForLoadState("networkidle");

    // Try to invite a user
    await page.click('button:has-text("Invite Staff")');

    // Fill invitation form
    await page.fill('input[type="email"]', "hacker@test.com");

    // ATTACK: Try to manipulate the organization in the request
    // This requires intercepting and modifying the request
    await page.route("**/api/*/invite", async route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Try to inject different organizationId
      const modifiedData = {
        ...postData,
        organizationId: "different-org-id",
        organizationSlug: "different-org",
      };

      await route.continue({
        postData: JSON.stringify(modifiedData),
      });
    });

    await page.click('button[type="submit"]');

    // EXPECTED: Server should reject based on session's organization
    // Look for error message or verify invite didn't go through
    await expect(
      page.locator("text=/invitation failed|unauthorized|forbidden/i")
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("SECURITY: Session tokens are org-specific and cannot be reused", async ({
    browser,
  }) => {
    // Create two separate browser contexts to simulate two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 logs in to NewLife
      await loginWithOTP(page1, TEST_USERS.churchOwner.email);
      await page1.waitForURL(/\/church\/newlife/);

      // Get User 1's cookies
      const cookies1 = await context1.cookies();

      // ATTACK: Try to use User 1's session in User 2's context
      await context2.addCookies(cookies1);

      // Try to access a different org with stolen session
      await page2.goto("/church/different-org/admin");

      // EXPECTED: Should be denied access
      await page2.waitForURL(url => {
        return (
          url.pathname.includes("/unauthorized") ||
          url.pathname.includes("/login") ||
          url.pathname === "/"
        );
      });

      // Verify we're NOT in the different org
      await expect(page2.locator("text=different-org")).not.toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("SECURITY: File uploads are scoped to organization", async ({
    page,
    request,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Navigate to connect card upload
    await page.goto("/church/newlife/admin/connect-cards");

    // Get auth cookies
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // ATTACK: Try to upload file claiming to be from different org
    const uploadResponse = await request.post("/api/s3/upload", {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      data: {
        fileName: "test.png",
        contentType: "image/png",
        size: 1024,
        isImage: true,
        fileType: "asset",
        organizationSlug: "different-org", // Try to inject different org
      },
    });

    // EXPECTED: Server should enforce session's org, not accept injected value
    // Either reject (403) or use session's org and create URL for current org
    if (uploadResponse.ok()) {
      const data = await uploadResponse.json();
      // Verify the key includes current org (newlife), not injected org
      expect(data.key).toContain("newlife");
      expect(data.key).not.toContain("different-org");
    } else {
      // Or it could reject entirely
      expect([401, 403]).toContain(uploadResponse.status());
    }
  });

  test("SECURITY: Team members cannot escalate to other orgs", async ({
    page,
  }) => {
    // Login as regular staff member (lowest permissions)
    await loginWithOTP(page, TEST_USERS.churchStaff.email);

    // Verify limited access to own org
    await page.goto("/church/newlife/admin");

    // ATTACK: Try to access platform admin (different org entirely)
    const response = await page.goto("/platform/admin");

    // EXPECTED: Should be denied (redirect or 403/404)
    const wasDenied =
      response?.status() === 403 ||
      response?.status() === 404 ||
      page.url().includes("/unauthorized") ||
      page.url().includes("/not-admin") ||
      page.url().includes("/login");

    expect(wasDenied).toBeTruthy();

    // Verify no actual platform admin controls (buttons, forms, etc.)
    // Error messages saying "requires platform admin" are OK - that's proper denial
    await expect(
      page.locator('button:has-text("Create"), button:has-text("Delete")')
    ).not.toBeVisible();
  });

  test("SECURITY: Cannot enumerate other organizations via API", async ({
    page,
    request,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // ATTACK: Try to list all organizations
    const listOrgsResponse = await request.get("/api/organizations", {
      headers: { Cookie: cookieHeader },
    });

    // EXPECTED: Either endpoint doesn't exist (404) or returns only user's org
    if (listOrgsResponse.ok()) {
      const data = await listOrgsResponse.json();
      // Should only see own organization
      expect(Array.isArray(data) ? data.length : 1).toBeLessThanOrEqual(1);
    } else {
      expect([404, 403]).toContain(listOrgsResponse.status());
    }
  });

  test("SECURITY: Database queries filter by organizationId", async ({
    page,
    request,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Navigate to any data view (connect cards, team, etc.)
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Intercept API calls and verify they include organizationId filter
    let apiCallMade = false;
    let hasOrgFilter = false;

    page.on("request", req => {
      const url = req.url();
      if (url.includes("/api/") && req.method() === "GET") {
        apiCallMade = true;
        // Check if request includes org identification
        hasOrgFilter =
          url.includes("newlife") ||
          url.includes("/church/newlife/") ||
          req.headers()["x-organization-id"] !== undefined;
      }
    });

    // Trigger a data fetch
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify API calls include organization context
    if (apiCallMade) {
      expect(hasOrgFilter).toBe(true);
    }
  });
});
