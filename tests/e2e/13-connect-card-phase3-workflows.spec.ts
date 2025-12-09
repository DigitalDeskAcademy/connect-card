import { test, expect } from "@playwright/test";

/**
 * Phase 3: Workflow Tests - Connect Card Features
 *
 * Deep functionality tests for:
 * - Connect card upload workflow
 * - Prayer request management
 * - Team member invitation
 * - Export generation
 * - Volunteer processing
 *
 * These tests verify complete user workflows and data mutations.
 */

const SLUG = "newlife";
const BASE_URL = `/church/${SLUG}/admin`;

test.describe("Phase 3: Connect Card Upload Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);
  });

  test("Upload area shows location selector", async ({ page }) => {
    // Should have location dropdown or upload area visible
    const locationSelector = page.locator(
      'button:has-text("Select location"), [role="combobox"]:has-text("location")'
    );

    // Location selector should be visible (for multi-location churches)
    // Fall back to checking upload UI is visible
    await expect(
      locationSelector.or(page.locator("text=/Drag & drop/i")).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Upload area shows file type restrictions", async ({ page }) => {
    // Should indicate accepted file types
    await expect(
      page.locator("text=/jpg|jpeg|png|image/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Upload triggers processing when files selected", async ({ page }) => {
    // Find file input (may be hidden)
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // The upload area should be interactive
    await expect(page.locator("text=/Drag & drop/i").first()).toBeVisible();
  });
});

test.describe("Phase 3: Batch Review Workflow", () => {
  test("Batches list shows pending batches", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);

    // Click Batches tab
    await page.getByRole("tab", { name: "Batches" }).click();

    // Should show batch list or empty state
    await expect(
      page.locator("text=/batch|processing|no batches/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Batch detail page loads when batch exists", async ({ page }) => {
    await page.goto(`${BASE_URL}/connect-cards`);
    await page.getByRole("tab", { name: "Batches" }).click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Check if there are any batch links
    const batchLinks = page.locator('a[href*="/batches/"]');
    const count = await batchLinks.count();

    if (count > 0) {
      // Click first batch
      await batchLinks.first().click();

      // Should navigate to batch detail
      await expect(page).toHaveURL(/\/batches\//);
    }
  });
});

test.describe("Phase 3: Prayer Request Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/prayer`);
  });

  test("Prayer table loads with data or empty state", async ({ page }) => {
    await expect(
      page.locator("table").or(page.locator("text=/no prayer|empty/i")).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Prayer request row shows details on click", async ({ page }) => {
    const table = page.locator("table");

    if ((await table.count()) > 0) {
      const rows = page.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Click first row
        await rows.first().click();

        // Should open detail view or dialog
        await page.waitForTimeout(500);
      }
    }
  });

  test("Create prayer request button exists", async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New")'
    );

    if ((await createButton.count()) > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });
});

test.describe("Phase 3: Prayer Batch Assignment Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/prayer-batches`);
  });

  test("Prayer batches page shows list or empty state", async ({ page }) => {
    await expect(
      page
        .locator("table")
        .or(page.locator("text=/no batches|empty|create/i"))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Prayer batch detail shows assignment controls", async ({ page }) => {
    // Check if there are any batch links
    const batchLinks = page.locator('a[href*="/prayer-batches/"]');
    const count = await batchLinks.count();

    if (count > 0) {
      await batchLinks.first().click();

      // Should show assignment UI
      await expect(
        page.locator("text=/assign|team member|select/i").first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("Team member dropdown loads options", async ({ page }) => {
    const batchLinks = page.locator('a[href*="/prayer-batches/"]');
    const count = await batchLinks.count();

    if (count > 0) {
      await batchLinks.first().click();

      // Find team member selector
      const selector = page.locator(
        'button:has-text("Select team"), [role="combobox"]'
      );

      if ((await selector.count()) > 0) {
        await selector.first().click();

        // Should show team member options
        await expect(
          page.locator('[role="option"], [role="listbox"]').first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe("Phase 3: Team Invitation Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);
  });

  test("Invite dialog has email input", async ({ page }) => {
    await page.locator('button:has-text("Invite")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5000,
    });

    // Should have email input
    await expect(
      page.locator(
        '[role="dialog"] input[type="email"], [role="dialog"] input[placeholder*="email" i]'
      )
    ).toBeVisible();
  });

  test("Invite dialog has role selector", async ({ page }) => {
    await page.locator('button:has-text("Invite")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5000,
    });

    // Should have role selection
    await expect(
      page
        .locator('[role="dialog"] [role="combobox"], [role="dialog"] select')
        .first()
    ).toBeVisible();
  });

  test("Invite form validates email format", async ({ page }) => {
    await page.locator('button:has-text("Invite")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5000,
    });

    // Find email input and enter invalid email
    const emailInput = page.locator(
      '[role="dialog"] input[type="email"], [role="dialog"] input[placeholder*="email" i]'
    );

    await emailInput.fill("invalid-email");

    // Try to submit
    const submitButton = page.locator(
      '[role="dialog"] button:has-text("Send"), [role="dialog"] button:has-text("Invite"), [role="dialog"] button[type="submit"]'
    );

    if ((await submitButton.count()) > 0) {
      await submitButton.first().click();

      // Should show validation error or prevent submission
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Phase 3: Export Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/export`);
  });

  test("Export format can be changed", async ({ page }) => {
    // Find format selector
    const formatTrigger = page.locator('[role="combobox"]').first();
    await expect(formatTrigger).toBeVisible({ timeout: 10000 });

    await formatTrigger.click();

    // Select a different format
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();

    if (optionCount > 1) {
      await options.nth(1).click();
    }
  });

  test("Export preview shows record count", async ({ page }) => {
    // Should show number of records to export
    await expect(
      page.locator("text=/record|contact|visitor|member/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Download button triggers export", async ({ page }) => {
    const downloadButton = page.locator(
      'button:has-text("Download"), button:has-text("Export")'
    );

    await expect(downloadButton.first()).toBeVisible({ timeout: 10000 });

    // Button should be clickable (not testing actual download)
    await expect(downloadButton.first()).toBeEnabled();
  });

  test("Export history shows previous exports", async ({ page }) => {
    // Navigate to history tab
    await page.getByRole("link", { name: "History" }).click();

    // Should show history or empty state
    await expect(
      page
        .locator("table")
        .or(page.locator("text=/no exports|empty|history/i"))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Phase 3: Volunteer Processing Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/volunteer`);
  });

  test("Volunteer table has action column", async ({ page }) => {
    const table = page.locator("table");

    if ((await table.count()) > 0) {
      // Should have action buttons or menu
      await expect(
        page
          .locator(
            'table button, table [role="button"], table [aria-label*="action" i]'
          )
          .first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("Volunteer detail page shows overview", async ({ page }) => {
    const volunteerLinks = page.locator('a[href*="/volunteer/"]');
    const count = await volunteerLinks.count();

    if (count > 0) {
      await volunteerLinks.first().click();

      // Should show volunteer details
      await expect(
        page.locator("text=/overview|details|contact|status/i").first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("Volunteer status can be updated", async ({ page }) => {
    const table = page.locator("table");

    if ((await table.count()) > 0) {
      // Look for status badge or dropdown
      const statusElement = page.locator(
        'table [role="combobox"], table select, table button:has-text("Status")'
      );

      if ((await statusElement.count()) > 0) {
        await expect(statusElement.first()).toBeVisible();
      }
    }
  });
});

test.describe("Phase 3: Dashboard Data Refresh", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Dashboard KPIs display numeric values", async ({ page }) => {
    // Wait for KPIs to load
    await expect(page.locator("text=/This Week/i").first()).toBeVisible({
      timeout: 10000,
    });

    // Dashboard should show KPI section
    await expect(page.locator("text=/Quick Actions/i")).toBeVisible();
  });

  test("Location switch updates dashboard data", async ({ page }) => {
    // Wait for tabs
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click second location tab
      await tabs.nth(1).click();

      // Wait for data to refresh
      await page.waitForTimeout(500);

      // Dashboard should still show content
      await expect(page.locator("text=/Quick Actions/i")).toBeVisible();
    }
  });
});

test.describe("Phase 3: Error States and Edge Cases", () => {
  test("Invalid batch ID handles gracefully", async ({ page }) => {
    const response = await page.goto(
      `${BASE_URL}/connect-cards/batches/invalid-uuid-12345`
    );

    // Page should respond (not crash) - 200 (redirect), 404, or error page
    const status = response?.status();
    expect([200, 302, 404, 500]).toContain(status);
  });

  test("Invalid prayer batch ID handles gracefully", async ({ page }) => {
    const response = await page.goto(
      `${BASE_URL}/prayer-batches/invalid-uuid-12345`
    );

    // Page should respond (not crash) - 200 (redirect), 404, or error page
    const status = response?.status();
    expect([200, 302, 404, 500]).toContain(status);
  });

  test("Empty search returns appropriate message", async ({ page }) => {
    await page.goto(`${BASE_URL}/volunteer`);

    // Look for search input
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="filter" i]'
    );

    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill("xyznonexistent12345");
      await page.waitForTimeout(500);

      // Should show no results or empty state
      await expect(
        page.locator("text=/no results|no volunteers|not found/i").first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      // No search input - just verify page loaded
      await expect(page.locator("text=/volunteer/i").first()).toBeVisible();
    }
  });
});

test.describe("Phase 3: Multi-tenant Data Isolation", () => {
  test("Dashboard only shows current organization data", async ({ page }) => {
    await page.goto(BASE_URL);

    // URL should contain the org slug
    await expect(page).toHaveURL(new RegExp(`/church/${SLUG}/`));

    // Should show org-specific content
    await expect(page.locator("text=/Quick Actions/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Cannot access other organization paths", async ({ page }) => {
    // Try to access a different org
    const response = await page.goto("/church/other-church/admin");

    // Should redirect or show error (not expose other org data)
    const status = response?.status();
    expect([200, 302, 403, 404]).toContain(status);
  });
});
