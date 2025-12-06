import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Phase 1: Basic Smoke Tests - Connect Card Features
 *
 * Simple tests to verify:
 * - Pages load without errors
 * - Key elements are visible
 * - Navigation works correctly
 * - Buttons are present and clickable
 *
 * NO functional testing - just verify the UI renders correctly.
 */

const SLUG = "newlife";
const BASE_URL = `/church/${SLUG}/admin`;

test.describe("Phase 1: Dashboard Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Dashboard page loads successfully", async ({ page }) => {
    const response = await page.goto(BASE_URL);

    // Page should load with 200 status
    expect(response?.status()).toBe(200);

    // Should have page title or heading
    await expect(
      page.locator("h1, h2, [data-testid='page-title']").first()
    ).toBeVisible();
  });

  test("Dashboard shows location tabs", async ({ page }) => {
    await page.goto(BASE_URL);

    // Should have tabs for locations (All Locations or specific location)
    await expect(
      page.locator('[role="tablist"], [data-radix-tabs-list]')
    ).toBeVisible({ timeout: 10000 });
  });

  test("Dashboard shows Quick Actions section", async ({ page }) => {
    await page.goto(BASE_URL);

    // Should have quick actions
    await expect(page.locator('text="Quick Actions"')).toBeVisible({
      timeout: 10000,
    });
  });

  test("Dashboard shows KPI cards", async ({ page }) => {
    await page.goto(BASE_URL);

    // Should show metrics like "This Week", "First-Time Visitors", etc.
    await expect(
      page.locator("text=/This Week|First-Time|Prayer Requests/i").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Phase 1: Connect Cards Page Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Connect Cards main page loads", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/connect-cards`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("text=/Connect Card/i").first()).toBeVisible();
  });

  test("Connect Cards page has navigation tabs", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);

    // Should have tabs for Upload, Batches, Analytics (use first() for Upload since nested tabs exist)
    await expect(
      page.getByRole("tab", { name: "Upload", exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: "Batches" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("tab", { name: "Analytics" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Connect Cards Upload tab is default", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);

    // Upload tab should be active by default and show upload UI
    await expect(
      page.locator("text=/drag|drop|upload|select files/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Connect Cards Batches tab shows batches list", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);

    // Click Batches tab
    await page.click('button:has-text("Batches")');

    // Should show batches content
    await expect(
      page.locator("text=/batch|no batches|processing/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Connect Cards Analytics tab shows coming soon", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);

    // Click Analytics tab
    await page.click('button:has-text("Analytics")');

    // Should show coming soon message
    await expect(page.locator('text="Coming Soon"')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Phase 1: Export Page Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Export page loads successfully", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/export`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("text=/Export/i").first()).toBeVisible();
  });

  test("Export page has format selector", async ({ page }) => {
    await page.goto(`${BASE_URL}/export`);

    // Should have format dropdown (Planning Center, Breeze, Generic)
    await expect(
      page.locator("text=/Planning Center|Breeze|Format/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Export page has download button", async ({ page }) => {
    await page.goto(`${BASE_URL}/export`);

    // Should have download/export button
    await expect(
      page
        .locator('button:has-text("Download")')
        .or(page.locator('button:has-text("Export")'))
    ).toBeVisible({ timeout: 10000 });
  });

  test("Export page has History tab", async ({ page }) => {
    await page.goto(`${BASE_URL}/export`);

    // Should have History tab
    await expect(page.locator('text="History"')).toBeVisible({
      timeout: 10000,
    });
  });

  test("Export History tab loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/export?tab=history`);

    // Should show history or empty state
    await expect(
      page.locator("text=/Export History|No exports/i").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Phase 1: Prayer Page Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Prayer page loads successfully", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/prayer`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("text=/Prayer/i").first()).toBeVisible();
  });

  test("Prayer page has data table or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/prayer`);

    // Should show table or empty state
    await expect(
      page.locator("table").or(page.locator("text=/no prayer requests|empty/i"))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Phase 1: Volunteer Page Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Volunteer page loads successfully", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/volunteer`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("text=/Volunteer/i").first()).toBeVisible();
  });

  test("Volunteer page has data table or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/volunteer`);

    // Should show volunteer list or empty state
    await expect(
      page.locator("table").or(page.locator("text=/no volunteers|empty/i"))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Phase 1: Team Page Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Team page loads successfully", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/team`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("text=/Team/i").first()).toBeVisible();
  });

  test("Team page has Invite Staff button", async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);

    // Should have invite button
    await expect(page.locator('button:has-text("Invite")')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Phase 1: Navigation Sidebar Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto(BASE_URL);
  });

  test("Sidebar shows main navigation items", async ({ page }) => {
    // Check for main nav items using exact match (Quick Actions have similar names)
    const navItems = [
      "Dashboard",
      "Connect Cards",
      "Volunteer",
      "Prayer",
      "Team",
    ];

    for (const item of navItems) {
      await expect(
        page.getByRole("link", { name: item, exact: true })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Clicking Dashboard nav item navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}$`));
  });

  test("Clicking Connect Cards nav item navigates correctly", async ({
    page,
  }) => {
    await page
      .getByRole("link", { name: "Connect Cards", exact: true })
      .click();
    await expect(page).toHaveURL(/\/connect-cards/);
  });

  test("Clicking Prayer nav item navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Prayer", exact: true }).click();
    await expect(page).toHaveURL(/\/prayer/);
  });

  test("Clicking Volunteer nav item navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Volunteer", exact: true }).click();
    await expect(page).toHaveURL(/\/volunteer/);
  });

  test("Clicking Team nav item navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Team", exact: true }).click();
    await expect(page).toHaveURL(/\/team/);
  });
});

test.describe("Phase 1: Responsive/Mobile Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Dashboard loads on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);

    // Content should still be visible
    await expect(
      page.locator("text=/Quick Actions|This Week/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Connect Cards page loads on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const response = await page.goto(`${BASE_URL}/connect-cards`);
    expect(response?.status()).toBe(200);

    // Page should render
    await expect(page.locator("text=/Connect Card/i").first()).toBeVisible();
  });
});

test.describe("Phase 1: Error Handling Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("Invalid route shows 404 or redirect", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/nonexistent-page`);

    // Should either 404 or redirect to a valid page
    const status = response?.status();
    expect([200, 404]).toContain(status);

    // If 200, should be redirected somewhere valid
    if (status === 200) {
      await expect(page.locator("body")).not.toContainText("Error");
    }
  });

  test("Invalid batch ID shows appropriate error", async ({ page }) => {
    const response = await page.goto(
      `${BASE_URL}/connect-cards/batches/invalid-id-12345`
    );

    // Should handle gracefully (404 or error message)
    const status = response?.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      // Should show error message or not found state
      await expect(page.locator("text=/not found|error|invalid/i")).toBeVisible(
        { timeout: 5000 }
      );
    }
  });
});
