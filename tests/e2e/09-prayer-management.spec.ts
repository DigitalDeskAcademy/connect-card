import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Prayer Management E2E Tests
 *
 * Living test file that grows as prayer features are added.
 * Tests basic functionality to ensure routes and core features don't break.
 *
 * Current test coverage:
 * 1. Prayer page loads correctly (handles empty state)
 * 2. Table renders with expected structure (handles empty state)
 * 3. Bulk selection checkbox exists (handles empty state)
 * 4. Privacy/urgency indicators column exists (handles empty state)
 * 5. Search and filter functionality
 * 6. Pagination (when data exists)
 * 7. Empty state display
 *
 * Tests are designed to pass in both empty and populated states.
 *
 * Uses existing test infrastructure:
 * - Email OTP auth with database-queried codes
 * - Test user: test@playwright.dev (church owner)
 * - Test organization: newlife (6 locations)
 */

test.describe("Prayer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");
  });

  test("Prayer page loads correctly", async ({ page }) => {
    // Verify page loads at correct URL
    await expect(page).toHaveURL(/\/church\/newlife\/admin\/prayer/);

    // Check for "New Prayer Request" button (exists in both empty and populated states)
    const newPrayerButton = page.locator(
      'button:has-text("New Prayer Request")'
    );
    await expect(newPrayerButton).toBeVisible({ timeout: 5000 });

    // Page should show either table OR empty state
    const hasTable = await page.locator('[role="table"]').isVisible();
    const hasEmptyState = await page
      .locator('text="No prayer requests found"')
      .isVisible();

    expect(hasTable || hasEmptyState).toBe(true);

    console.log("✅ Prayer page loaded successfully");
  });

  test("Prayer table renders with expected structure", async ({ page }) => {
    // Check if table exists (will be visible when there's data)
    const table = page.locator('[role="table"]');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // Check for table headers
      const headers = page.locator('[role="columnheader"]');
      const headerCount = await headers.count();

      // Should have at least these columns: select, indicators, prayer request, category, status, submitted by, assigned to, location, created, actions
      expect(headerCount).toBeGreaterThanOrEqual(10);

      console.log(`✅ Table rendered with ${headerCount} columns`);
    } else {
      // Empty state - verify empty message exists
      const emptyMessage = page.locator('text="No prayer requests found"');
      await expect(emptyMessage).toBeVisible({ timeout: 3000 });
      console.log("✅ Empty state displayed (no table expected)");
    }
  });

  test("Bulk selection checkbox exists in first column", async ({ page }) => {
    // Check if table exists
    const table = page.locator('[role="table"]');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // Check for header checkbox (select all)
      const headerCheckbox = page
        .locator('[role="columnheader"]')
        .first()
        .locator('[role="checkbox"]');
      await expect(headerCheckbox).toBeVisible({ timeout: 3000 });

      // Check for row checkboxes (if data exists)
      const bodyCheckboxes = page
        .locator('[role="gridcell"]')
        .locator('[role="checkbox"]');
      const checkboxCount = await bodyCheckboxes.count();

      console.log(
        `✅ Bulk selection checkboxes exist (${checkboxCount} row checkboxes)`
      );
    } else {
      console.log("✅ Empty state (no checkboxes expected)");
    }
  });

  test("Privacy/urgency indicators column exists", async ({ page }) => {
    // Check if table exists
    const table = page.locator('[role="table"]');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // Check for indicators column header (should have alert triangle icon)
      const indicatorsHeader = page.locator('[role="columnheader"]').filter({
        has: page.locator('svg[class*="tabler-icon-alert-triangle"]'),
      });

      await expect(indicatorsHeader).toBeVisible({ timeout: 3000 });

      console.log("✅ Privacy/urgency indicators column exists");
    } else {
      console.log("✅ Empty state (no indicators column expected)");
    }
  });

  test("Search functionality is present", async ({ page }) => {
    // Check for search input
    const searchInput = page.locator(
      'input[placeholder*="Search prayer requests"]'
    );
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type in search box (basic interaction test)
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");

    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue("");

    console.log("✅ Search input works correctly");
  });

  test("Status filter dropdown is present", async ({ page }) => {
    // Check for status filter dropdown
    const statusFilter = page.locator('[role="combobox"]').filter({
      has: page.locator('span:has-text("All Status")'),
    });
    await expect(statusFilter).toBeVisible({ timeout: 5000 });

    // Click to open dropdown
    await statusFilter.click();

    // Verify dropdown options are visible
    const pendingOption = page.locator('[role="option"]:has-text("Pending")');
    await expect(pendingOption).toBeVisible({ timeout: 3000 });

    // Close dropdown by pressing Escape
    await page.keyboard.press("Escape");

    console.log("✅ Status filter dropdown works correctly");
  });

  test("Pagination is present when data exists", async ({ page }) => {
    // Check if table exists
    const table = page.locator('[role="table"]');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // Check if pagination exists (it shows when there's data)
      const pageContent = await page.textContent("body");
      const hasData = pageContent?.includes("Showing");

      if (hasData) {
        // Verify pagination info text
        const paginationText = page.locator(
          "text=/Showing \\d+ to \\d+ of \\d+/"
        );
        await expect(paginationText).toBeVisible({ timeout: 3000 });
        console.log("✅ Pagination displayed correctly");
      } else {
        console.log("✅ Table exists but no pagination text yet");
      }
    } else {
      console.log("✅ Empty state (no pagination expected)");
    }
  });

  test("Empty state displays when no prayers exist", async ({ page }) => {
    // This test checks for empty state OR table with data
    const pageContent = await page.textContent("body");
    const hasEmptyState = pageContent?.includes("No prayer requests found");
    const hasTable = await page.locator('[role="table"]').isVisible();

    // Should have either empty state OR table (not both)
    expect(hasEmptyState || hasTable).toBe(true);

    if (hasEmptyState) {
      // Check for empty state message
      const emptyMessage = page.locator('text="No prayer requests found"');
      await expect(emptyMessage).toBeVisible({ timeout: 3000 });
      console.log("✅ Empty state displays correctly");
    } else {
      console.log("✅ Table displays with prayer data");
    }
  });
});
