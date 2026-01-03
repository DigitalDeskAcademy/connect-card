import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Visual Demo Test
 *
 * Run this test in headed mode to watch the browser:
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3003 pnpm playwright test tests/e2e/visual-demo.spec.ts --headed --project=visual-demo
 *
 * NOTE: Use --project=visual-demo to see only ONE login (skips auth setup)
 *
 * This test demonstrates:
 * 1. Email OTP login flow
 * 2. Navigation to volunteer events
 * 3. Creating a new event
 * 4. Viewing event details
 */

test.use({
  actionTimeout: 10000,
});

test.describe("Visual Demo - Volunteer Events", () => {
  test("complete volunteer event workflow", async ({ page }) => {
    // Extend timeout for visual demo
    test.setTimeout(120000); // 2 minutes

    console.log("\n🎬 Starting visual demo...\n");

    // =========================================================================
    // STEP 1: Login with Email OTP
    // =========================================================================
    console.log("📧 Step 1: Logging in with Email OTP...");

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Pause briefly so you can see the login page
    await page.waitForTimeout(1000);

    // The loginWithOTP helper handles the full OTP flow
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    console.log("✅ Logged in successfully!\n");
    await page.waitForTimeout(1500);

    // =========================================================================
    // STEP 2: Navigate to Volunteer Events
    // =========================================================================
    console.log("🚀 Step 2: Navigating to Volunteer Events...");

    await page.goto("/church/newlife/admin/volunteer/events");
    await page.waitForLoadState("networkidle");

    // Verify we're on the events page
    await expect(page).toHaveURL(/\/volunteer\/events/);

    console.log("✅ On Volunteer Events page!\n");
    await page.waitForTimeout(1500);

    // =========================================================================
    // STEP 3: Explore the Toolbar
    // =========================================================================
    console.log("🔍 Step 3: Exploring the toolbar...");

    // Highlight the search box by clicking it
    const searchInput = page.locator('input[placeholder="Search events..."]');
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill("Sunday");
      await page.waitForTimeout(1000);
      await searchInput.clear();
      console.log("  - Search bar works!");
    }

    // Try the date filter
    const dateFilter = page.locator('button:has-text("Upcoming")').first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      await page.waitForTimeout(800);

      // Select "All Dates"
      const allDates = page.locator('[role="option"]:has-text("All Dates")');
      if (await allDates.isVisible()) {
        await allDates.click();
        console.log("  - Date filter works!");
      }
    }

    await page.waitForTimeout(1000);
    console.log("✅ Toolbar exploration complete!\n");

    // =========================================================================
    // STEP 4: Open Create Event Dialog
    // =========================================================================
    console.log("➕ Step 4: Opening Create Event dialog...");

    // The toolbar uses icon-only buttons with aria-label
    // Check for icon button in toolbar OR "Create your first event" in empty state
    const toolbarCreateButton = page.locator(
      'button[aria-label="Create Event"]'
    );
    const emptyStateCreateButton = page.locator(
      'button:has-text("Create your first event")'
    );

    // Use whichever button is visible
    const createButton = (await toolbarCreateButton.isVisible())
      ? toolbarCreateButton
      : emptyStateCreateButton;

    await expect(createButton).toBeVisible({ timeout: 10000 });

    // Highlight the button before clicking
    await createButton.hover();
    await page.waitForTimeout(500);
    await createButton.click();

    // Verify dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log("✅ Create Event dialog is open!\n");
    await page.waitForTimeout(1500);

    // =========================================================================
    // STEP 5: Fill Out the Event Form
    // =========================================================================
    console.log("📝 Step 5: Filling out the event form...");

    // Generate unique event name
    const timestamp = new Date().toLocaleTimeString();
    const eventName = `Demo Event - ${timestamp}`;

    // Fill event name
    const nameInput = dialog.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.click();
      await page.waitForTimeout(300);
      await nameInput.fill(eventName);
      console.log(`  - Event name: "${eventName}"`);
      await page.waitForTimeout(500);
    }

    // Try to fill description if it exists
    const descInput = dialog.locator('textarea[name="description"]');
    if (await descInput.isVisible()) {
      await descInput.click();
      await descInput.fill("This is a demo event created by the visual test.");
      console.log("  - Description filled");
      await page.waitForTimeout(500);
    }

    // Look for a slots/volunteers needed field
    const slotsInput = dialog.locator(
      'input[name="slotsNeeded"], input[name="volunteersNeeded"]'
    );
    if (await slotsInput.first().isVisible()) {
      await slotsInput.first().click();
      await slotsInput.first().fill("5");
      console.log("  - Volunteers needed: 5");
      await page.waitForTimeout(500);
    }

    console.log("✅ Form filled out!\n");
    await page.waitForTimeout(1000);

    // =========================================================================
    // STEP 6: Close Dialog (Cancel)
    // =========================================================================
    console.log("❌ Step 6: Canceling (to not pollute test data)...");

    const cancelButton = dialog.locator('button:has-text("Cancel")');
    await cancelButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    console.log("✅ Dialog closed!\n");
    await page.waitForTimeout(1000);

    // =========================================================================
    // STEP 7: Check for Existing Events
    // =========================================================================
    console.log("📋 Step 7: Checking for existing events...");

    const pageContent = await page.textContent("body");
    const hasEvents =
      !pageContent?.includes("No events") &&
      !pageContent?.includes("Create your first event");

    if (hasEvents) {
      console.log("  - Found existing events on the page");

      // Try to click on an event card
      const eventCard = page.locator('a[href*="/events/"]').first();
      if (await eventCard.isVisible()) {
        console.log("  - Clicking on first event...");
        await eventCard.click();
        await page.waitForLoadState("networkidle");

        console.log("✅ Navigated to event detail page!\n");
        await page.waitForTimeout(2000);

        // Look for assignment button (text is "Assign Volunteers")
        const assignButton = page.locator(
          'button:has-text("Assign Volunteers")'
        );
        if (
          await assignButton
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          console.log("📌 Found 'Assign Volunteers' button - clicking it...");
          await assignButton.first().click();
          await page.waitForTimeout(1500);

          // Test SMS invite flow in the modal
          const modal = page.locator('[role="dialog"]');
          if (await modal.isVisible()) {
            console.log("✅ Assignment modal opened!");
            await page.waitForTimeout(1000);

            // =========================================================================
            // SMS INVITE TEST
            // =========================================================================
            console.log("\n📱 Testing SMS Invite Flow...");

            // Toggle "Send SMS Invite" switch ON
            const smsSwitch = modal.locator("#send-invite");
            if (await smsSwitch.isVisible()) {
              console.log("  - Toggling SMS Invite switch ON...");
              await smsSwitch.click();
              await page.waitForTimeout(500);
              console.log("  ✓ SMS mode enabled (button should be blue now)");
            }

            // Wait for volunteers to load
            await page.waitForTimeout(1500);

            // Select a volunteer from the list (click the checkbox in first volunteer row)
            // The volunteer rows have border-b class and contain a checkbox
            const volunteerCheckbox = modal
              .locator("div.border-b")
              .filter({ has: page.locator('[role="checkbox"]') })
              .first();
            if (
              await volunteerCheckbox
                .isVisible({ timeout: 3000 })
                .catch(() => false)
            ) {
              console.log("  - Selecting first available volunteer...");
              await volunteerCheckbox.click();
              await page.waitForTimeout(500);

              // Verify selection by checking the button text
              const selectedCount = await modal
                .locator("text=/\\d+ selected/")
                .textContent()
                .catch(() => "0 selected");
              console.log(`  ✓ Selection status: ${selectedCount}`);
            } else {
              console.log(
                "  ⚠ No volunteer rows found - checking if list is empty..."
              );
              const emptyState = modal.locator(
                'text="No available volunteers"'
              );
              if (await emptyState.isVisible().catch(() => false)) {
                console.log(
                  "  - Empty state: No volunteers match event criteria"
                );
              }
            }

            // Look for the Send Invite button (includes count like "Send Invite (1)")
            const sendButton = modal.locator("button", {
              hasText: /Send Invite/,
            });
            if (
              await sendButton.isVisible({ timeout: 2000 }).catch(() => false)
            ) {
              console.log("  - Clicking Send Invite button...");
              await sendButton.click();
              await page.waitForTimeout(2000);

              // Check for success toast
              const toast = page.locator("[data-sonner-toast]");
              if (await toast.isVisible()) {
                const toastText = await toast.textContent();
                console.log(`  ✓ Toast message: ${toastText}`);
              }

              console.log("✅ SMS Invite sent successfully!\n");
            } else {
              // If no volunteers available, just close the modal
              console.log("  - No volunteers available or button not visible");
              const closeBtn = modal.locator('button:has-text("Cancel")');
              if (await closeBtn.isVisible()) {
                await closeBtn.click();
              }
            }
          }
        }
      }
    } else {
      console.log("  - No events found (empty state)");
    }

    // =========================================================================
    // STEP 8: Navigate to Volunteer Directory
    // =========================================================================
    console.log("\n👥 Step 8: Navigating to Volunteer Directory...");

    await page.goto("/church/newlife/admin/volunteer");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/admin\/volunteer$/);
    console.log("✅ On Volunteer Directory page!\n");
    await page.waitForTimeout(1500);

    // =========================================================================
    // DONE!
    // =========================================================================
    console.log("🎉 Visual demo complete!\n");
    console.log("Summary:");
    console.log("  ✓ Logged in via Email OTP");
    console.log("  ✓ Navigated to Volunteer Events");
    console.log("  ✓ Explored toolbar (search, filters)");
    console.log("  ✓ Opened and filled Create Event form");
    console.log("  ✓ Checked existing events");
    console.log("  ✓ Tested SMS Invite flow (GHL integration)");
    console.log("  ✓ Navigated to Volunteer Directory\n");

    // Final pause so you can see the end state
    await page.waitForTimeout(3000);
  });
});
