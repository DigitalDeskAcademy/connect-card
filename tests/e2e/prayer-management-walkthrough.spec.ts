import { test, expect } from "@playwright/test";
import { loginAsTestUser, TEST_USERS } from "../helpers/auth";

test.describe("Prayer Management Feature Walkthrough", () => {
  test("should display prayer requests table with seed data", async ({
    page,
  }) => {
    // Login as church owner
    console.log("🔐 Logging in as church owner...");
    await loginAsTestUser(page, TEST_USERS.churchOwner);

    // Navigate to prayer page
    console.log("📍 Navigating to prayer management page...");
    await page.goto("/church/newlife/admin/prayer");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    console.log("✅ Page loaded successfully");

    // Check if Prayer Requests title is visible (be specific to avoid strict mode)
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: "Prayer Requests" })
    ).toBeVisible();
    console.log("✅ Prayer Requests title found");

    // Check if table has data (should have 30 seed records, displaying 10 per page)
    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();
    console.log(`📊 Found ${rowCount} prayer requests visible on page 1`);
    expect(rowCount).toBeGreaterThan(0);

    // Verify the results counter shows total of 30
    await expect(page.getByText(/Showing 1 to 10 of 30/)).toBeVisible();
    console.log("✅ Pagination shows 30 total prayer requests");

    // Verify search input is present
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    console.log("✅ Search input found");

    // Verify status filter dropdown is present
    await expect(
      page.locator("button", { hasText: /All Status|Pending/ }).first()
    ).toBeVisible();
    console.log("✅ Status filter found");

    // Test search functionality
    console.log('🔍 Testing search for "health"...');
    await page.fill('input[placeholder*="Search"]', "health");
    // Wait for table to update after search
    await page.waitForTimeout(500);
    const searchResults = await page.locator("table tbody tr").count();
    console.log(`📊 Search filtered to ${searchResults} results`);

    // Clear search
    await page.fill('input[placeholder*="Search"]', "");
    await page.waitForTimeout(500);

    // Test status filter
    console.log('🔍 Testing status filter for "Pending"...');
    const statusButton = page
      .locator("button")
      .filter({ hasText: /All Status|Pending/ })
      .first();
    await statusButton.click();

    // Wait for dropdown to appear and click Pending option
    const pendingOption = page
      .locator('[role="option"]')
      .filter({ hasText: "Pending" })
      .first();
    await pendingOption.waitFor({ state: "visible", timeout: 5000 });
    await pendingOption.click();

    // Wait for table to update
    await page.waitForTimeout(500);
    const filteredResults = await page.locator("table tbody tr").count();
    console.log(`📊 Status filter showing ${filteredResults} pending requests`);

    // Take final screenshot
    await page.screenshot({
      path: "prayer-requests-final.png",
      fullPage: true,
    });

    console.log("✅ Prayer Management walkthrough completed successfully!");
  });
});
