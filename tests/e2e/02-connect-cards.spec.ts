import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";
import path from "path";

/**
 * Connect Card System Tests
 *
 * Tests full workflow: Upload → Extract → Review → Save
 *
 * Edge cases tested:
 * - Invalid file types
 * - Oversized files
 * - Corrupted images
 * - Concurrent uploads
 * - Batch limits
 * - Duplicate detection
 * - Missing required fields
 * - XSS in extracted data
 * - SQL injection attempts
 */

test.describe("Connect Card System - Full Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/connect-cards");
  });

  test("SUCCESS: Upload and process connect cards end-to-end", async ({
    page,
  }) => {
    const testImage = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImage);

    // Wait for file to appear in preview
    await expect(page.locator('img[alt*="Connect card"]')).toBeVisible({
      timeout: 5000,
    });

    // Process the card
    await page.click('button:has-text("Process All Cards")');

    // Wait for processing to complete
    await expect(page.locator('text="All cards processed!"')).toBeVisible({
      timeout: 30000,
    });

    // Verify card was saved
    await expect(page.locator('text="Saved"')).toBeVisible();

    // Navigate to review queue
    await page.click('button:has-text("Review Cards")');

    // Verify card appears in review queue
    await expect(page.locator("text=Tanner Brandt")).toBeVisible();
  });

  test("EDGE CASE: Handle invalid file types gracefully", async ({ page }) => {
    // Try to upload a text file instead of image
    const fileInput = page.locator('input[type="file"]').first();

    // Create a temporary text file
    const textContent = "This is not an image";
    const buffer = Buffer.from(textContent);

    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer,
    });

    // EXPECTED: Should show error or reject the file
    await expect(
      page.locator("text=/invalid file|unsupported|only images/i")
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("EDGE CASE: Handle oversized files", async ({ page }) => {
    // Create a large buffer (e.g., 20MB)
    const largeBuffer = Buffer.alloc(20 * 1024 * 1024, "a");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "huge-image.png",
      mimeType: "image/png",
      buffer: largeBuffer,
    });

    // EXPECTED: Should show file size error
    await expect(
      page.locator("text=/file too large|size limit|maximum/i")
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("EDGE CASE: Handle corrupted/invalid images", async ({ page }) => {
    // Create a file with PNG extension but invalid content
    const invalidImage = Buffer.from("CORRUPTED IMAGE DATA");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "corrupted.png",
      mimeType: "image/png",
      buffer: invalidImage,
    });

    // Try to process
    await page.click('button:has-text("Process All Cards")');

    // EXPECTED: Should handle gracefully and show error
    await expect(
      page.locator("text=/failed|error|invalid image/i")
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("SECURITY: XSS prevention in extracted data", async ({ page }) => {
    // This test verifies that if AI extracts malicious content,
    // it's properly sanitized when displayed

    // Mock API response to return XSS payload
    await page.route("**/api/connect-cards/extract", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            name: '<script>alert("XSS")</script>John Doe',
            email: "test@example.com<script>alert('XSS')</script>",
            phone: "555-1234",
            prayer_request: "<img src=x onerror=alert('XSS')>Please pray",
            visit_status: "First Visit",
            interests: ["<script>alert('XSS')</script>Volunteering"],
            address: null,
            age_group: null,
            family_info: null,
            additional_notes: null,
          },
        }),
      });
    });

    // Upload any image (will be intercepted)
    const testImage = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImage);

    await page.click('button:has-text("Process All Cards")');

    // Wait for processing
    await page.waitForTimeout(3000);

    // EXPECTED: Script tags should be escaped, not executed
    // If XSS succeeded, an alert would show
    const dialogPromise = page.waitForEvent("dialog", { timeout: 2000 });
    const hasDialog = await Promise.race([
      dialogPromise.then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 2500)),
    ]);

    expect(hasDialog).toBe(false); // No alert should appear

    // Verify data is displayed as text, not executed
    const nameContent = await page.textContent("body");
    expect(nameContent).toContain("<script>"); // Should be visible as text
  });

  test("SECURITY: SQL injection prevention in search", async ({ page }) => {
    // Navigate to analytics tab where search might exist
    await page.click('tab:has-text("Analytics")');
    await page.waitForTimeout(1000);

    // Try SQL injection in search field
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("'; DROP TABLE ConnectCard; --");

      // Wait for search to execute
      await page.waitForTimeout(2000);

      // EXPECTED: Should not crash, should escape properly
      // Verify the app still works
      await page.goto("/church/newlife/admin/connect-cards");
      await expect(page.locator("text=Connect Cards")).toBeVisible();
    }
  });

  test("CONCURRENT: Multiple simultaneous uploads", async ({ page }) => {
    const testImage = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload multiple files at once
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([testImage, testImage, testImage]);

    // Process all
    await page.click('button:has-text("Process All Cards")');

    // Wait for completion
    await expect(page.locator('text="3"')).toBeVisible({ timeout: 45000 });

    // Verify all 3 were processed
    const savedCards = page.locator('text="Saved"');
    await expect(savedCards).toHaveCount(3);
  });

  test("DUPLICATE: Detect duplicate image uploads", async ({ page }) => {
    const testImage = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload same image twice
    const fileInput = page.locator('input[type="file"]');

    // First upload
    await fileInput.setInputFiles(testImage);
    await page.click('button:has-text("Process All Cards")');
    await expect(page.locator('text="Saved"')).toBeVisible({ timeout: 30000 });

    // Start new upload session
    await page.click('button:has-text("Start New Batch")');

    // Upload same image again
    await fileInput.setInputFiles(testImage);
    await page.click('button:has-text("Process All Cards")');

    // EXPECTED: Should detect duplicate
    await expect(page.locator("text=/duplicate|already scanned/i")).toBeVisible(
      {
        timeout: 30000,
      }
    );
  });

  test("BATCH: Batch workflow and navigation", async ({ page }) => {
    // Navigate to batches tab
    await page.click('tab:has-text("Batches")');
    await page.waitForLoadState("networkidle");

    // Verify batch list loads
    await expect(page.locator("text=/batch|session/i")).toBeVisible();

    // Check if any batches exist
    const batchItems = page.locator('[data-testid="batch-item"]');
    const batchCount = await batchItems.count();

    if (batchCount > 0) {
      // Click first batch
      await batchItems.first().click();

      // Should navigate to batch detail
      await expect(page).toHaveURL(/\/batches\/[^/]+$/);

      // Should show batch info
      await expect(page.locator("text=/cards|reviewed/i")).toBeVisible();
    }
  });

  test("EDGE CASE: Empty batch handling", async ({ page }) => {
    // Try to process with no files uploaded
    await page.click('button:has-text("Process All Cards")');

    // EXPECTED: Should show error or disable button
    // Button might be disabled if no files
    const processButton = page.locator('button:has-text("Process All Cards")');
    const isDisabled = await processButton.isDisabled();

    expect(isDisabled).toBe(true);
  });

  test("VALIDATION: Review queue field validation", async ({ page }) => {
    // Navigate to review queue (assuming cards exist from previous tests)
    await page.click('tab:has-text("Review Queue")' || 'text="Review"');
    await page.waitForTimeout(2000);

    // Try to save with invalid data
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      // Clear existing email
      await emailInput.clear();
      await emailInput.fill("invalid-email");

      // Try to save
      await page.click('button:has-text("Save")');

      // EXPECTED: Should show validation error
      await expect(page.locator("text=/invalid email/i")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("PERFORMANCE: Large batch processing", async ({ page }) => {
    // Test with maximum reasonable batch size
    const testImage = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload 10 files
    const files = Array(10).fill(testImage);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(files);

    // Measure processing time
    const startTime = Date.now();

    await page.click('button:has-text("Process All Cards")');

    await expect(page.locator('text="10"')).toBeVisible({ timeout: 120000 });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`Processed 10 cards in ${duration} seconds`);

    // EXPECTED: Should complete in reasonable time (< 2 minutes)
    expect(duration).toBeLessThan(120);
  });
});
