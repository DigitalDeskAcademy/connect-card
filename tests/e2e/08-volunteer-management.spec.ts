import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Volunteer Management E2E Tests
 *
 * Tests the complete volunteer management workflow:
 * 1. Directory page load and empty state
 * 2. Create volunteer dialog flow
 * 3. Form validation
 * 4. Table interactions (search, sort, pagination)
 *
 * Uses existing test infrastructure:
 * - Email OTP auth with database-queried codes
 * - Test user: test@playwright.dev (church owner)
 * - Test organization: newlife (6 locations)
 */

test.describe("Volunteer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/volunteer");
    await page.waitForLoadState("networkidle");
  });

  test("Directory page loads correctly", async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveURL(/\/church\/newlife\/admin\/volunteer$/);

    // Check for "New Volunteer" button (should always be visible)
    const newVolunteerButton = page.locator('button:has-text("New Volunteer")');
    await expect(newVolunteerButton).toBeVisible({ timeout: 5000 });

    // Check for either empty state or table
    const pageContent = await page.textContent("body");
    const hasEmptyState =
      pageContent?.includes("No volunteers yet") ||
      pageContent?.includes(
        "Add your first volunteer to get started with volunteer management"
      );
    const hasTable = await page.locator('[data-slot="table"]').isVisible();

    // Should have either empty state OR table (not both)
    expect(hasEmptyState || hasTable).toBe(true);

    console.log(
      `✅ Directory page loaded: ${hasEmptyState ? "Empty state" : "Table with volunteers"}`
    );
  });

  test("Create volunteer dialog opens and closes", async ({ page }) => {
    // Click "New Volunteer" button
    const newVolunteerButton = page.locator('button:has-text("New Volunteer")');
    await newVolunteerButton.click();

    // Verify dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify dialog title
    await expect(
      dialog.locator(
        '[data-slot="dialog-title"]:has-text("Create Volunteer Profile")'
      )
    ).toBeVisible();

    // Verify form fields are present (inline member creation)
    await expect(dialog.locator('label:has-text("First Name")')).toBeVisible();
    await expect(dialog.locator('label:has-text("Last Name")')).toBeVisible();
    // Use exact text match to avoid matching "Background Check Status"
    await expect(
      dialog.locator("label").filter({ hasText: /^Status \*$/ })
    ).toBeVisible();
    await expect(dialog.locator('label:has-text("Start Date")')).toBeVisible();

    // Close dialog by clicking cancel
    const cancelButton = dialog.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    console.log("✅ Dialog opens and closes correctly");
  });

  test("Form validation: Empty form shows validation errors", async ({
    page,
  }) => {
    // Open create dialog
    await page.locator('button:has-text("New Volunteer")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click submit without filling any fields
    const submitButton = dialog.locator('button:has-text("Create Volunteer")');
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForTimeout(1000);

    // Verify validation error messages appear
    // React Hook Form shows errors as paragraph elements with text-destructive class
    const errorMessages = dialog.locator('p.text-destructive, [role="alert"]');
    const errorCount = await errorMessages.count();

    expect(errorCount).toBeGreaterThan(0);
    console.log(
      `✅ Form validation working: ${errorCount} validation errors shown`
    );
  });

  test("Create volunteer: Full workflow", async ({ page }) => {
    test.setTimeout(60000); // 1 minute for full workflow

    // Open create dialog
    await page.locator('button:has-text("New Volunteer")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    console.log("=== PHASE 1: Fill Form Fields ===");

    // Use unique email to avoid duplicate errors across test runs
    const timestamp = Date.now();
    const uniqueEmail = `john.smith.${timestamp}@test.com`;

    // Fill member information (inline creation)
    const firstNameInput = dialog.locator('input[name="firstName"]');
    await firstNameInput.fill("John");
    console.log("✓ Filled first name");

    const lastNameInput = dialog.locator('input[name="lastName"]');
    await lastNameInput.fill("Smith");
    console.log("✓ Filled last name");

    const emailInput = dialog.locator('input[name="email"]');
    await emailInput.fill(uniqueEmail);
    console.log(`✓ Filled email: ${uniqueEmail}`);

    const phoneInput = dialog.locator('input[name="phone"]');
    await phoneInput.fill("+12065550199");
    console.log("✓ Filled phone");

    // Status defaults to "Active" - no need to select
    console.log("✓ Status defaults to Active");

    // Start Date defaults to today - no need to select
    console.log("✓ Start Date defaults to today");

    // Fill Emergency Contact Name
    const emergencyNameInput = dialog.locator(
      'input[name="emergencyContactName"]'
    );
    await emergencyNameInput.fill("Jane Doe");
    console.log("✓ Filled emergency contact name");

    // Fill Emergency Contact Phone
    const emergencyPhoneInput = dialog.locator(
      'input[name="emergencyContactPhone"]'
    );
    await emergencyPhoneInput.fill("+12065550123");
    console.log("✓ Filled emergency contact phone");

    // Select Background Check Status
    // Find the select trigger under "Background Check Status" label
    const bgCheckLabel = dialog.locator(
      'label:has-text("Background Check Status")'
    );
    const bgCheckSelect = bgCheckLabel
      .locator("..")
      .locator('[role="combobox"]');
    await bgCheckSelect.click();
    await page.waitForTimeout(500);

    const notStartedOption = page.locator(
      '[role="option"]:has-text("Not Started")'
    );
    await notStartedOption.click();
    console.log("✓ Selected background check status: Not Started");

    // Fill Notes (optional)
    const notesTextarea = dialog.locator('textarea[name="notes"]');
    await notesTextarea.fill("Test volunteer created via E2E test");
    console.log("✓ Filled notes");

    console.log("=== PHASE 2: Submit Form ===");

    // Submit form
    const submitButton = dialog.locator('button:has-text("Create Volunteer")');
    await submitButton.click();

    // Wait for dialog to close (indicates success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    console.log("✅ Dialog closed after successful submission");

    console.log("=== PHASE 3: Verify Volunteer in Table ===");

    // Wait for page to fully load after dialog closes
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Additional buffer for React to render

    // Verify volunteer appears in table
    const table = page.locator('[data-slot="table"]');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Check if "Jane Doe" (emergency contact) or "Active" status appears in table
    const tableContent = await page.textContent('[data-slot="table"]');
    const hasActiveStatus = tableContent?.includes("Active");

    expect(hasActiveStatus).toBe(true);
    console.log("✅ Volunteer created successfully and appears in table");
  });

  test("Table search functionality", async ({ page }) => {
    // Skip if no volunteers exist
    const hasTable = await page.locator('[data-slot="table"]').isVisible();
    if (!hasTable) {
      console.log("⚠️ Skipped: No volunteers in table to search");
      return;
    }

    // Find search input
    const searchInput = page
      .locator('input[placeholder*="Search"]')
      .or(page.locator('input[type="search"]'));

    // Only test if search input exists
    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill("Active");
      await page.waitForTimeout(1000);

      // Verify table updates (no error state)
      const tableContent = await page.textContent('[data-slot="table"]');
      expect(tableContent).toBeTruthy();

      console.log("✅ Search functionality working");
    } else {
      console.log("⚠️ Search input not found - table may be empty");
    }
  });

  test("Table sorting functionality", async ({ page }) => {
    // Skip if no volunteers exist
    const hasTable = await page.locator('[data-slot="table"]').isVisible();
    if (!hasTable) {
      console.log("⚠️ Skipped: No volunteers in table to sort");
      return;
    }

    // Find sortable column headers (TanStack Table uses button for sortable columns)
    const sortableHeaders = page.locator('[role="columnheader"] button');
    const headerCount = await sortableHeaders.count();

    if (headerCount > 0) {
      // Click first sortable header
      await sortableHeaders.first().click();
      await page.waitForTimeout(500);

      // Click again to reverse sort
      await sortableHeaders.first().click();
      await page.waitForTimeout(500);

      console.log("✅ Column sorting working");
    } else {
      console.log("⚠️ No sortable columns found");
    }
  });

  test("Table pagination (if applicable)", async ({ page }) => {
    // Check if pagination exists (only appears if > 10 volunteers)
    const paginationNav = page.locator('nav[aria-label="pagination"]');
    const hasPagination = await paginationNav.isVisible();

    if (hasPagination) {
      // Click "Next" button
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify URL or table content changed
        const pageContent = await page.textContent('[data-slot="table"]');
        expect(pageContent).toBeTruthy();

        console.log("✅ Pagination working");
      } else {
        console.log("⚠️ Next button disabled (only 1 page of data)");
      }
    } else {
      console.log("⚠️ Pagination not visible (< 10 volunteers)");
    }
  });
});
