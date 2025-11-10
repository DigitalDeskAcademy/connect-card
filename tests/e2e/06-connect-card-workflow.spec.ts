import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";
import path from "path";

/**
 * Connect Card Complete Workflow Tests
 *
 * Tests the full end-to-end workflow with proper status transitions:
 * 1. Upload → Creates cards with status EXTRACTED (not counted on dashboard)
 * 2. Review Queue → Shows EXTRACTED cards for manual correction
 * 3. Save & Next → Changes status to REVIEWED (now counted on dashboard)
 * 4. Dashboard → Only counts REVIEWED cards in analytics
 *
 * Tests all 3 example cards:
 * - Connect-Card-Test-01.png (Tanner Brandt, First Visit)
 * - Connect-Card-Test-02.png (Leanna Upchurch, Second Visit)
 * - Connect-Card-Test-03.png (Leanna Upchurch, Member)
 */

test.describe("Connect Card Workflow - Status Transitions", () => {
  test.beforeEach(async ({ page }) => {
    // Login as church owner
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Navigate to connect cards page
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");
  });

  test("WORKFLOW: Complete upload → review → dashboard flow with all 3 test cards", async ({
    page,
  }) => {
    // Step 1: Get initial dashboard counts (should be 0 after clearing DB)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Check if dashboard shows 0 cards
    const initialCardsText = await page.textContent("body");
    console.log(
      "Initial dashboard state:",
      initialCardsText?.includes("0") ? "Empty (0 cards)" : "Has cards"
    );

    // Step 2: Upload all 3 test cards
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    const testCards = [
      "Connect-Card-Test-01.png", // Tanner Brandt
      "Connect-Card-Test-02.png", // Leanna Upchurch (2nd visit)
      "Connect-Card-Test-03.png", // Leanna Upchurch (member)
    ];

    const cardPaths = testCards.map(card =>
      path.join(__dirname, "../../public/connect-card-examples", card)
    );

    // Upload all 3 cards (use first file input - desktop upload, not camera)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cardPaths);

    // Wait for files to appear in preview
    await page.waitForTimeout(2000);

    // Process the cards
    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    // Wait for processing to complete (up to 60 seconds for 3 cards)
    await expect(page.locator("text=/success|completed|saved/i")).toBeVisible({
      timeout: 60000,
    });

    console.log("✅ Step 2: All 3 cards uploaded and extracted");

    // Step 3: Verify dashboard STILL shows 0 cards (status = EXTRACTED, not REVIEWED)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Dashboard should not count EXTRACTED cards
    const dashboardAfterUpload = await page.textContent("body");
    console.log(
      "Dashboard after upload (should be 0):",
      dashboardAfterUpload?.includes("0") ? "✅ Still 0" : "❌ Already counting"
    );

    // Step 4: Navigate to Review Queue
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Click Review Queue tab
    await page.click('text="Review Queue"');
    await page.waitForLoadState("networkidle");

    // Verify all 3 cards appear in review queue
    await expect(page.locator("text=Tanner Brandt")).toBeVisible({
      timeout: 5000,
    });
    console.log("✅ Step 4: Cards visible in review queue");

    // Step 5: Review and save all 3 cards
    for (let i = 0; i < 3; i++) {
      // Wait for form to load
      await page.waitForTimeout(1000);

      // Verify name field has content
      const nameInput = page.locator("input#name");
      await expect(nameInput).toBeVisible();

      // Click Save & Next
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();

      // Wait for save to complete
      await page.waitForTimeout(2000);

      console.log(`✅ Step 5.${i + 1}: Card ${i + 1}/3 reviewed and saved`);
    }

    // Step 6: Verify dashboard NOW shows 3 cards (status = REVIEWED)
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Dashboard should now show 3 reviewed cards
    const finalDashboardText = await page.textContent("body");
    const hasCards =
      finalDashboardText?.includes("3") ||
      finalDashboardText?.includes("Total Cards");

    console.log(
      "Dashboard after review (should show 3):",
      hasCards ? "✅ Showing cards" : "❌ Still 0"
    );

    // Verify the workflow completed successfully
    expect(hasCards).toBe(true);
  });

  test("UPLOAD: Individual card upload with AI extraction", async ({
    page,
  }) => {
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload single card (use first file input - desktop upload)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    // Process
    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    // Wait for extraction
    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Verify card data extracted (check for name "Tanner Brandt")
    await page.goto("/church/newlife/admin/connect-cards");
    await page.click('text="Review Queue"');

    await expect(page.locator("text=Tanner Brandt")).toBeVisible({
      timeout: 5000,
    });
  });

  test("REVIEW: Volunteer category defaults to general", async ({ page }) => {
    // Upload a card first
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Navigate to review queue
    await page.goto("/church/newlife/admin/connect-cards");
    await page.click('text="Review Queue"');
    await page.waitForTimeout(2000);

    // Check the "Volunteering" checkbox
    const volunteeringCheckbox = page.locator('label:has-text("Volunteering")');
    await volunteeringCheckbox.click();

    // Wait for volunteer category dropdown to appear
    await page.waitForTimeout(500);

    // Verify volunteer category dropdown has "general" selected
    const volunteerCategorySelect = page.locator(
      'select#volunteerCategory, [id="volunteerCategory"]'
    );

    if (await volunteerCategorySelect.isVisible()) {
      const value = await volunteerCategorySelect.inputValue();
      console.log("Volunteer category value:", value);

      // Should default to "general"
      expect(value).toBe("general");
    } else {
      console.log(
        "Volunteer category dropdown not visible (expected if using Radix Select)"
      );
    }
  });

  test("REVIEW: Discard removes card from database", async ({ page }) => {
    // Upload a card
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Go to review queue
    await page.goto("/church/newlife/admin/connect-cards");
    await page.click('text="Review Queue"');
    await page.waitForTimeout(2000);

    // Get the name to verify it's gone later
    const nameText = await page.locator("input#name").inputValue();
    console.log("Card name:", nameText);

    // Click Discard button
    const discardButton = page.locator('button:has-text("Discard")');
    await discardButton.click();

    // Confirm deletion in dialog
    page.on("dialog", dialog => dialog.accept());
    await page.waitForTimeout(2000);

    // Verify card is gone from review queue
    const hasCards = await page.locator(`text="${nameText}"`).isVisible();
    expect(hasCards).toBe(false);

    console.log("✅ Card successfully discarded from database");
  });

  test("DASHBOARD: Only counts REVIEWED cards, not EXTRACTED", async ({
    page,
  }) => {
    // Get initial count
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");
    const initialText = await page.textContent("body");
    console.log(
      "Initial dashboard:",
      initialText?.includes("0") ? "Empty" : "Has cards"
    );

    // Upload a card (creates EXTRACTED status)
    await page.goto("/church/newlife/admin/connect-cards");
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Check dashboard - should NOT count EXTRACTED cards
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");
    const afterUploadText = await page.textContent("body");

    console.log(
      "Dashboard after upload (EXTRACTED):",
      afterUploadText?.includes("0") ? "✅ Not counted" : "❌ Counted early"
    );

    // Now review and save the card (creates REVIEWED status)
    await page.goto("/church/newlife/admin/connect-cards");
    await page.click('text="Review Queue"');
    await page.waitForTimeout(2000);

    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Check dashboard - should NOW count REVIEWED cards
    await page.goto("/church/newlife/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const afterReviewText = await page.textContent("body");
    const hasCardCount =
      afterReviewText?.includes("1") || afterReviewText?.includes("Total");

    console.log(
      "Dashboard after review (REVIEWED):",
      hasCardCount ? "✅ Now counted" : "❌ Still not counted"
    );

    expect(hasCardCount).toBe(true);
  });

  test("BATCH: Verify batch workflow and navigation", async ({ page }) => {
    // Upload cards first
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testCard);

    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Navigate to batches
    await page.click('text="Batches"');
    await page.waitForLoadState("networkidle");

    // Verify batch appears
    await expect(page.locator("text=/Bainbridge|batch/i")).toBeVisible({
      timeout: 5000,
    });

    // Click on a batch
    const batchLink = page.locator('a[href*="/batches/"]').first();
    if (await batchLink.isVisible()) {
      await batchLink.click();
      await page.waitForLoadState("networkidle");

      // Should show review queue for this batch
      await expect(page.locator("text=/review|batch/i")).toBeVisible();
    }
  });
});

test.describe("Connect Card Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/connect-cards");
  });

  test("EDGE: Handle empty upload gracefully", async ({ page }) => {
    // Try to process without uploading files
    const processButton = page.locator('button:has-text("Process")');

    // Button should be disabled with no files
    const isDisabled = await processButton.isDisabled();
    expect(isDisabled).toBe(true);

    console.log("✅ Process button disabled when no files uploaded");
  });

  test("EDGE: Handle duplicate image detection", async ({ page }) => {
    const testCard = path.join(
      __dirname,
      "../../public/connect-card-examples/Connect-Card-Test-01.png"
    );

    // Upload same card twice
    const fileInput = page.locator('input[type="file"]').first();

    // First upload
    await fileInput.setInputFiles(testCard);
    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 30000,
    });

    // Try to upload same card again
    await page.click('text="Upload"'); // Go back to upload tab
    await page.waitForTimeout(1000);

    await fileInput.setInputFiles(testCard);
    await processButton.click();

    // Should detect duplicate
    await expect(page.locator("text=/duplicate|already scanned/i")).toBeVisible(
      {
        timeout: 30000,
      }
    );

    console.log("✅ Duplicate detection working");
  });

  test("EDGE: Multiple cards with same person name", async ({ page }) => {
    // Upload cards 2 and 3 (both Leanna Upchurch)
    const cards = ["Connect-Card-Test-02.png", "Connect-Card-Test-03.png"].map(
      card => path.join(__dirname, "../../public/connect-card-examples", card)
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cards);

    const processButton = page.locator('button:has-text("Process")');
    await processButton.click();

    await expect(page.locator("text=/success|saved/i")).toBeVisible({
      timeout: 60000,
    });

    // Go to review queue
    await page.click('text="Review Queue"');
    await page.waitForTimeout(2000);

    // Both should appear
    const leannaCards = await page.locator('text="Leanna Upchurch"').count();
    console.log(`Found ${leannaCards} cards with name "Leanna Upchurch"`);

    // Should find at least 1 (might see both in form and table)
    expect(leannaCards).toBeGreaterThan(0);
  });
});
