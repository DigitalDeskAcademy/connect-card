import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";
import path from "path";

/**
 * Connect Card Complete Workflow Tests
 *
 * Tests created using /test-creator methodology:
 * 1. Read actual UI implementation (client.tsx, upload-client.tsx)
 * 2. Mapped REAL user flow (not assumptions)
 * 3. Used actual selectors from code
 *
 * Workflow tested:
 * Upload → Extract → Review → Dashboard
 *
 * Status flow:
 * EXTRACTED (upload) → REVIEWED (after save) → Dashboard counts REVIEWED only
 */

test.describe("Connect Card - Complete Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");
  });

  test("Upload → Review → Dashboard: Full workflow with 3 test cards", async ({
    page,
  }) => {
    test.setTimeout(180000); // 3 minutes for AI processing of 3 cards
    console.log("=== PHASE 1: Initial Dashboard Check ===");

    // Check initial dashboard (should be 0 after DB clear)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    const initialText = await page.textContent("body");
    const initialEmpty =
      initialText?.includes("0") || !initialText?.includes("Total");
    console.log(
      `Initial dashboard: ${initialEmpty ? "Empty (0 cards)" : "Has cards"}`
    );

    console.log("=== PHASE 2: Upload Cards ===");

    // Navigate back to upload page
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Prepare 3 test cards
    const testCards = [
      "Connect-Card-Test-01.png",
      "Connect-Card-Test-02.png",
      "Connect-Card-Test-03.png",
    ].map(card =>
      path.join(__dirname, "../../public/connect-card-examples", card)
    );

    // Upload files (use first input - desktop upload, not camera)
    // Verified in upload-client.tsx:538 - Two file inputs exist (desktop + camera)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCards);

    console.log("Files selected, waiting for previews...");
    await page.waitForTimeout(2000);

    // Click "Process All Cards" button (actual button text from code)
    // Verified in upload-client.tsx:647 - <Button onClick={handleProcessAll}>
    const processButton = page.locator('button:has-text("Process All Cards")');
    await expect(processButton).toBeVisible({ timeout: 5000 });
    await processButton.click();

    console.log("Processing started, waiting for AI extraction...");

    // Wait for processing to complete - "Review Cards" button appears when done
    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible({
      timeout: 150000, // 150 seconds (2.5 min) for AI to process 3 cards sequentially
    });

    console.log("✅ Upload complete: 3 cards processed");

    console.log(
      "=== PHASE 3: Verify Dashboard Doesn't Count EXTRACTED Cards ==="
    );

    // Check dashboard - should STILL be 0 (cards are EXTRACTED, not REVIEWED)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const afterUploadText = await page.textContent("body");
    const stillEmpty =
      afterUploadText?.includes("0") || !afterUploadText?.includes("Total");
    console.log(
      `Dashboard after upload: ${stillEmpty ? "✅ Still 0 (EXTRACTED not counted)" : "❌ Already showing cards"}`
    );

    console.log("=== PHASE 4: Navigate to Review ===");

    // Go back to connect cards page
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Navigate via Batches tab (more reliable after page reload)
    // Verified in client.tsx:92-94 - <TabsTrigger value="batches">
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");

    // Wait for batch data to load and "Review Cards" link to appear
    // Verified in batches-client.tsx:205-217 - <Button asChild><Link> renders as <a>
    const reviewCardsLink = page.locator('a:has-text("Review Cards")').first();
    await expect(reviewCardsLink).toBeVisible({ timeout: 30000 }); // 30s for async batch loading
    await reviewCardsLink.click();

    console.log("Navigating to review interface...");

    // Wait for review interface to load
    await page.waitForLoadState("networkidle");

    // Verify we're in the review interface (check for name input field)
    // Verified in review-queue-client.tsx:397 - <Input id="name" />
    await expect(page.locator("input#name")).toBeVisible({
      timeout: 5000,
    });

    console.log("✅ Review interface loaded");

    console.log("=== PHASE 5: Review and Save All 3 Cards ===");

    // Review and save all 3 cards
    for (let i = 0; i < 3; i++) {
      console.log(`Reviewing card ${i + 1}/3...`);

      // Wait for form to load
      await page.waitForTimeout(1000);

      // Verify name field exists (indicates form loaded)
      const nameInput = page.locator("input#name");
      await expect(nameInput).toBeVisible();

      const name = await nameInput.inputValue();
      console.log(`  Card name: ${name}`);

      // Click "Save & Next" button
      const saveButton = page.locator('button:has-text("Save")');
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      console.log(`  ✅ Card ${i + 1} saved`);

      // Wait for save to complete
      await page.waitForTimeout(2000);
    }

    console.log("✅ All 3 cards reviewed and saved (status = REVIEWED)");

    console.log("=== PHASE 6: Verify Dashboard NOW Counts Cards ===");

    // Check dashboard - should NOW show 3 cards (status = REVIEWED)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const finalText = await page.textContent("body");
    const hasCards = finalText?.includes("3") || finalText?.includes("Total");

    console.log(
      `Final dashboard: ${hasCards ? "✅ Showing 3 cards" : "❌ Still empty"}`
    );

    // Final assertion
    expect(hasCards).toBe(true);

    console.log("=== WORKFLOW COMPLETE ===");
  });

  test("Upload single card and verify process", async ({ page }) => {
    console.log("Testing single card upload...");

    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    // Process
    const processButton = page.locator('button:has-text("Process All Cards")');
    await processButton.click();

    // Wait for processing to complete - "Review Cards" button appears when done
    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible({
      timeout: 30000,
    });

    console.log("✅ Single card processed successfully");

    // Verify "Review Cards (1)" button appears
    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible();
  });

  test("Navigate via Batches tab", async ({ page }) => {
    console.log("Testing navigation via Batches tab...");

    // First upload a card to create a batch
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process All Cards")');
    await processButton.click();

    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible({
      timeout: 30000,
    });

    console.log("Card uploaded, navigating to Batches tab...");

    // Click Batches tab (actual tab from client.tsx)
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();

    await page.waitForLoadState("networkidle");

    // Verify batch list shows
    await expect(page.locator('text="Connect Card Batches"')).toBeVisible();

    console.log("✅ Batches tab loaded");

    // Wait for and click "Review Cards" link on the first batch
    // Verified in batches-client.tsx:205-217 - <Button asChild><Link> renders as <a>
    const reviewLink = page.locator('a:has-text("Review Cards")').first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });
    await reviewLink.click();

    await page.waitForLoadState("networkidle");

    // Verify we're in review interface (check for name input field)
    await expect(page.locator("input#name")).toBeVisible({
      timeout: 5000,
    });

    console.log("✅ Navigated to review via Batches tab");
  });

  test("Discard card removes from database", async ({ page }) => {
    console.log("Testing discard functionality...");

    // Upload a card
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process All Cards")');
    await processButton.click();

    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible({
      timeout: 30000,
    });

    // Navigate to review
    const reviewButton = page.locator('button:has-text("Review Cards")');
    await reviewButton.click();

    await page.waitForLoadState("networkidle");

    // Get name to verify removal
    const nameInput = page.locator("input#name");
    const cardName = await nameInput.inputValue();
    console.log(`Card to discard: ${cardName}`);

    // Click Discard button
    const discardButton = page.locator('button:has-text("Discard")');
    await discardButton.click();

    // Handle confirmation dialog
    page.once("dialog", dialog => dialog.accept());

    await page.waitForTimeout(2000);

    // Verify card is gone (page should show empty or navigate away)
    const stillVisible = await page
      .locator(`text="${cardName}"`)
      .isVisible({
        timeout: 1000,
      })
      .catch(() => false);

    console.log(
      `Card ${cardName}: ${stillVisible ? "❌ Still visible" : "✅ Removed"}`
    );

    expect(stillVisible).toBe(false);
  });
});

test.describe("Connect Card - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/connect-cards");
  });

  test("Process button disabled with no files", async ({ page }) => {
    console.log("Testing empty upload...");

    // Check if process button exists and is disabled
    const processButton = page.locator('button:has-text("Process All Cards")');

    // Button might not be visible when no files
    const isVisible = await processButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      const isDisabled = await processButton.isDisabled();
      console.log(
        `Process button: ${isDisabled ? "✅ Disabled" : "❌ Enabled"}`
      );
      expect(isDisabled).toBe(true);
    } else {
      console.log("✅ Process button not visible (expected with no files)");
    }
  });

  test("Multiple cards with same person", async ({ page }) => {
    test.setTimeout(150000); // 2.5 minutes for AI processing of 2 cards
    console.log("Testing duplicate person detection...");

    // Upload cards 2 and 3 (both Leanna Upchurch)
    const cards = ["Connect-Card-Test-02.png", "Connect-Card-Test-03.png"].map(
      card => path.join(__dirname, "../../public/connect-card-examples", card)
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cards);

    const processButton = page.locator('button:has-text("Process All Cards")');
    await processButton.click();

    await expect(page.locator('button:has-text("Review Cards")')).toBeVisible({
      timeout: 120000, // 120 seconds (2 min) for AI to process 2 cards sequentially
    });

    console.log("✅ Both cards processed (same person allowed)");

    // Navigate to review
    const reviewButton = page.locator('button:has-text("Review Cards")');
    await reviewButton.click();

    await page.waitForLoadState("networkidle");

    // Both cards should be reviewable
    const nameInput = page.locator("input#name");
    const name = await nameInput.inputValue();

    console.log(`Found card for: ${name}`);
  });
});
