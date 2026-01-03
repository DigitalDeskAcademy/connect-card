import { test, expect } from "@playwright/test";

/**
 * Resources Feature Demo Test
 *
 * Uses stored auth state from setup project (no login needed).
 * Run with: PLAYWRIGHT_BASE_URL=http://localhost:3003 pnpm playwright test tests/e2e/resources-demo.spec.ts --headed
 */

test.describe("Event Resources Demo", () => {
  test("test resources feature on event detail page", async ({ page }) => {
    // Navigate directly - auth is already handled via storageState
    await page.goto("/church/newlife/admin/volunteer/events");
    await page.waitForLoadState("networkidle");

    // Take screenshot of events list
    console.log("📸 Events list page loaded");

    // Look for "View Details" or "Fill Volunteer Slots" links on event cards
    const detailLinks = page.getByRole("link", {
      name: /view details|fill volunteer slots/i,
    });
    const linkCount = await detailLinks.count();
    console.log(`Found ${linkCount} event detail links`);

    if (linkCount > 0) {
      // Click first event's link to detail page
      const linkHref = await detailLinks.first().getAttribute("href");
      console.log("Clicking link with href:", linkHref);

      await Promise.all([
        page.waitForURL(/\/volunteer\/events\/[^/]+$/),
        detailLinks.first().click(),
      ]);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      console.log("📸 Event detail page loaded");
      console.log("Current URL:", page.url());

      // Take screenshot of the event detail page
      await page.screenshot({
        path: "test-results/event-detail-page.png",
        fullPage: true,
      });
      console.log("📸 Screenshot saved to test-results/event-detail-page.png");

      // Log the page content for debugging
      const pageContent = await page.content();
      const hasResourcesInHTML = pageContent.includes("Resources & Equipment");
      console.log("Resources text in HTML:", hasResourcesInHTML);

      // Look for Resources section
      const resourcesSection = page.getByText("Resources & Equipment");
      const hasResources = (await resourcesSection.count()) > 0;

      if (hasResources) {
        console.log("✅ Resources section found!");

        // Scroll to resources section
        await resourcesSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        // Try to click Add Resource button
        const addResourceBtn = page.getByRole("button", {
          name: /add resource/i,
        });
        if ((await addResourceBtn.count()) > 0) {
          await addResourceBtn.click();
          await page.waitForTimeout(500);

          console.log("📸 Add resource dialog opened");

          // Check for common resources list
          const commonResources = page.getByText("Folding Chairs");
          if ((await commonResources.count()) > 0) {
            console.log("✅ Common resources presets visible!");

            // Select a few resources (using exact: true to avoid partial matches)
            await page.getByText("Folding Chairs", { exact: true }).click();
            await page.waitForTimeout(200);
            await page.getByText("Projector", { exact: true }).click();
            await page.waitForTimeout(200);
            await page.getByText("Sound System", { exact: true }).click();
            await page.waitForTimeout(300);

            console.log("📸 Resources selected");

            // Click add button
            const addBtn = page.getByRole("button", {
              name: /add.*resources/i,
            });
            if ((await addBtn.count()) > 0) {
              await addBtn.click();
              await page.waitForTimeout(1000);

              console.log("✅ Resources added successfully!");
            }
          }

          // Close dialog if still open
          await page.keyboard.press("Escape");
        } else {
          console.log(
            "⚠️ Add Resource button not found (event may not be editable)"
          );
        }
      } else {
        console.log("❌ Resources section NOT found on event detail page");
      }
    } else {
      console.log("⚠️ No event cards with detail links found.");

      // Click Create Event button
      const createBtn = page.getByRole("button", { name: /create event/i });
      if ((await createBtn.count()) > 0) {
        await createBtn.click();
        await page.waitForTimeout(500);
        console.log("📸 Create event dialog opened");
      }
    }

    // Final pause for visual inspection
    console.log("\n🔍 Pausing for 10 seconds for visual inspection...");
    await page.waitForTimeout(10000);

    console.log("\n✅ Demo complete!");
  });
});
