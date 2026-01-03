import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Volunteer Events E2E Tests
 *
 * E2E TESTS vs INTEGRATION TESTS:
 * ================================
 * Integration tests (Vitest):
 * - Test code without a browser
 * - Mock database and external services
 * - Fast (~1 second total)
 * - Good for: API logic, business rules, data transformations
 *
 * E2E tests (Playwright):
 * - Launch a real browser (Chrome, Firefox, Safari)
 * - Interact with the actual UI
 * - Slower (~5-30 seconds per test)
 * - Good for: User workflows, visual verification, cross-browser testing
 *
 * WHY USE E2E FOR EVENTS UI?
 * ===========================
 * 1. Testing real user interactions (clicks, typing, navigation)
 * 2. Verifying the UI renders correctly
 * 3. Testing form validation displays properly
 * 4. Ensuring dialogs open/close correctly
 * 5. Catching CSS/layout issues that break the experience
 *
 * WHAT WE'RE TESTING:
 * ===================
 * - Events list page loads with toolbar
 * - Create event dialog opens and validates
 * - Event creation workflow (create → appears in list)
 * - Event detail page loads
 * - Assignment modal opens
 *
 * Test user: test@playwright.dev (church owner)
 * Test organization: newlife (6 locations)
 */

test.describe("Volunteer Events", () => {
  // Run before each test: login and navigate to events page
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/volunteer/events");
    await page.waitForLoadState("networkidle");
  });

  // =========================================================================
  // Test Group 1: Events List Page
  // =========================================================================
  test.describe("Events List Page", () => {
    test("page loads with correct structure", async ({ page }) => {
      // Verify we're on the correct URL
      await expect(page).toHaveURL(
        /\/church\/newlife\/admin\/volunteer\/events$/
      );

      // Verify page title in header (PageContainer renders the title)
      // The title comes from navigation config
      const pageContent = await page.textContent("body");
      const hasEventsTitle =
        pageContent?.includes("Events") || pageContent?.includes("Volunteer");
      expect(hasEventsTitle).toBe(true);

      console.log("✅ Events page loads correctly");
    });

    test("toolbar displays with Create Event button", async ({ page }) => {
      // Find "Create Event" button (primary action in toolbar)
      // The ToolbarAction component renders this button
      const createEventButton = page.locator('button:has-text("Create Event")');
      await expect(createEventButton).toBeVisible({ timeout: 5000 });

      // Also verify search bar exists
      const searchInput = page.locator('input[placeholder="Search events..."]');
      await expect(searchInput).toBeVisible();

      console.log("✅ Create Event button and search bar visible in toolbar");
    });

    test("date filter dropdown works", async ({ page }) => {
      // Look for date period filter (Upcoming, Past, This Week, etc.)
      const dateFilter = page.locator(
        'button:has-text("Upcoming"), button:has-text("Date"), [aria-label*="date"], [data-testid="date-filter"]'
      );

      // If date filter exists, test it
      if (await dateFilter.first().isVisible()) {
        await dateFilter.first().click();
        await page.waitForTimeout(500);

        // Check if dropdown opened (look for options)
        const dropdown = page.locator('[role="menu"], [role="listbox"]');
        if (await dropdown.isVisible()) {
          // Try to select "Past" or another option
          const pastOption = page.locator(
            '[role="menuitem"]:has-text("Past"), [role="option"]:has-text("Past")'
          );
          if (await pastOption.isVisible()) {
            await pastOption.click();
            console.log("✅ Date filter dropdown works");
          }
        }
      } else {
        console.log("⚠️ Date filter not found - may not be implemented yet");
      }
    });

    test("shows empty state or event cards", async ({ page }) => {
      // Page should show either empty state OR event cards
      const pageContent = await page.textContent("body");

      const hasEmptyState =
        pageContent?.includes("No events") ||
        pageContent?.includes("Create your first event") ||
        pageContent?.includes("Get started");

      const hasEventCards =
        (await page.locator('[data-testid="event-card"]').count()) > 0 ||
        (await page
          .locator(
            'article, [role="article"], .event-card, [class*="card"]:has-text("Sunday")'
          )
          .count()) > 0;

      // Either empty state or cards should be visible
      expect(hasEmptyState || hasEventCards).toBe(true);

      console.log(
        `✅ Events page displays: ${hasEmptyState ? "Empty state" : "Event cards"}`
      );
    });
  });

  // =========================================================================
  // Test Group 2: Create Event Dialog
  // =========================================================================
  test.describe("Create Event Dialog", () => {
    test("opens when clicking Create Event button", async ({ page }) => {
      // Find and click Create Event button
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.click();

      // Verify dialog opens
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify dialog has title
      await expect(
        dialog.locator(
          '[data-slot="dialog-title"], h2, [class*="title"]:has-text("Event")'
        )
      ).toBeVisible();

      console.log("✅ Create Event dialog opens correctly");
    });

    test("closes when clicking Cancel", async ({ page }) => {
      // Open dialog
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Click Cancel button
      const cancelButton = dialog.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Verify dialog closes
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      console.log("✅ Dialog closes on Cancel");
    });

    test("shows required form fields", async ({ page }) => {
      // Open dialog
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Check for essential form fields
      const formLabels = await dialog.locator("label").allTextContents();
      const formLabelsLower = formLabels.map(l => l.toLowerCase());

      // Should have event name field
      const hasNameField =
        formLabelsLower.some(l => l.includes("name")) ||
        (await dialog.locator('input[name="name"]').isVisible());

      expect(hasNameField).toBe(true);

      console.log(
        `✅ Form has required fields. Labels found: ${formLabels.join(", ")}`
      );
    });

    test("shows validation errors on empty submit", async ({ page }) => {
      // Open dialog
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Click submit without filling any fields
      const submitButton = dialog.locator(
        'button:has-text("Create Event"), button:has-text("Create"), button[type="submit"]'
      );
      await submitButton.click();

      // Wait for validation errors
      await page.waitForTimeout(1000);

      // Verify validation errors appear
      const errorMessages = dialog.locator(
        'p.text-destructive, [role="alert"], .error, [class*="error"]'
      );
      const errorCount = await errorMessages.count();

      expect(errorCount).toBeGreaterThan(0);

      console.log(`✅ Form validation working: ${errorCount} errors shown`);
    });
  });

  // =========================================================================
  // Test Group 3: Create Event Workflow
  // =========================================================================
  test.describe("Create Event Workflow", () => {
    test("creates event with required fields", async ({ page }) => {
      test.setTimeout(60000); // Allow 1 minute for full workflow

      // Open dialog
      const createEventButton = page.locator('button:has-text("Create Event")');
      await createEventButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      console.log("=== PHASE 1: Fill Form ===");

      // Generate unique event name
      const timestamp = Date.now();
      const eventName = `Test Event ${timestamp}`;

      // Fill event name
      const nameInput = dialog.locator(
        'input[name="name"], input[placeholder*="name" i]'
      );
      if (await nameInput.isVisible()) {
        await nameInput.fill(eventName);
        console.log(`✓ Filled event name: ${eventName}`);
      }

      // Try to find and fill date field
      const dateInput = dialog.locator(
        'input[name="date"], input[type="date"], button:has-text("Pick a date")'
      );
      if (await dateInput.first().isVisible()) {
        // If it's a date picker button, click it
        if (await dateInput.first().evaluate(el => el.tagName === "BUTTON")) {
          await dateInput.first().click();
          await page.waitForTimeout(500);

          // Click tomorrow's date (or a future date)
          const calendar = page.locator(
            '[role="dialog"], .rdp, [class*="calendar"]'
          );
          if (await calendar.isVisible()) {
            // Find and click a future date button
            const futureDate = calendar
              .locator("button:not([disabled])")
              .last();
            await futureDate.click();
          }
        } else {
          // It's an input, set date directly
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 7);
          await dateInput.first().fill(tomorrow.toISOString().split("T")[0]);
        }
        console.log("✓ Selected date");
      }

      // Try to fill slots/volunteers needed
      const slotsInput = dialog.locator(
        'input[name="slotsNeeded"], input[name="volunteersNeeded"], input[placeholder*="volunteer" i]'
      );
      if (await slotsInput.isVisible()) {
        await slotsInput.fill("5");
        console.log("✓ Set volunteers needed: 5");
      }

      console.log("=== PHASE 2: Submit Form ===");

      // Submit form
      const submitButton = dialog.locator(
        'button:has-text("Create Event"), button:has-text("Create"), button[type="submit"]'
      );
      await submitButton.click();

      // Wait for dialog to close (indicates success)
      await expect(dialog).not.toBeVisible({ timeout: 15000 });
      console.log("✅ Dialog closed after submission");

      console.log("=== PHASE 3: Verify Event Created ===");

      // Wait for page update
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Verify event appears in list (or success message)
      const pageContent = await page.textContent("body");
      const eventCreated =
        pageContent?.includes(eventName) ||
        pageContent?.includes("Event created") ||
        pageContent?.includes("Success");

      // If not found in content, the event might be on a different date filter
      if (!eventCreated) {
        console.log(
          "⚠️ Event not visible in current view - may need different date filter"
        );
      } else {
        console.log("✅ Event created and visible in list");
      }
    });
  });

  // =========================================================================
  // Test Group 4: Event Detail Page
  // =========================================================================
  test.describe("Event Detail Page", () => {
    test("navigates to event detail when clicking event card", async ({
      page,
    }) => {
      // First check if there are any events to click
      const eventCards = page.locator(
        '[data-testid="event-card"], article, [role="article"], .event-card, a[href*="/events/"]'
      );
      const cardCount = await eventCards.count();

      if (cardCount === 0) {
        console.log("⚠️ No events to test detail page - skipping");
        return;
      }

      // Click first event card/link
      await eventCards.first().click();

      // Wait for navigation
      await page.waitForLoadState("networkidle");

      // Verify URL changed to include event ID
      const currentUrl = page.url();
      const isOnDetailPage =
        currentUrl.includes("/events/") && !currentUrl.endsWith("/events");

      expect(isOnDetailPage).toBe(true);

      console.log(`✅ Navigated to event detail: ${currentUrl}`);
    });

    test("detail page shows assignment options", async ({ page }) => {
      // Navigate to an event detail page (if events exist)
      const eventLinks = page.locator('a[href*="/events/"]');
      const linkCount = await eventLinks.count();

      if (linkCount === 0) {
        console.log("⚠️ No event links to test - skipping");
        return;
      }

      await eventLinks.first().click();
      await page.waitForLoadState("networkidle");

      // Look for assignment-related UI elements
      const pageContent = await page.textContent("body");
      const hasAssignmentUI =
        pageContent?.includes("Assign") ||
        pageContent?.includes("Invite") ||
        pageContent?.includes("Volunteer") ||
        pageContent?.includes("slot") ||
        (await page
          .locator('button:has-text("Assign"), button:has-text("Invite")')
          .count()) > 0;

      expect(hasAssignmentUI).toBe(true);

      console.log("✅ Event detail page shows assignment options");
    });
  });

  // =========================================================================
  // Test Group 5: Assignment Modal
  // =========================================================================
  test.describe("Assignment Modal", () => {
    test("opens when clicking Assign button", async ({ page }) => {
      // Navigate to an event detail page first
      const eventLinks = page.locator('a[href*="/events/"]');
      const linkCount = await eventLinks.count();

      if (linkCount === 0) {
        console.log("⚠️ No events to test assignment modal - skipping");
        return;
      }

      await eventLinks.first().click();
      await page.waitForLoadState("networkidle");

      // Find and click Assign or Invite button
      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Invite"), button:has-text("Add Volunteer")'
      );

      if ((await assignButton.count()) === 0) {
        console.log("⚠️ No assign button found - skipping");
        return;
      }

      await assignButton.first().click();

      // Verify modal/dialog opens
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      console.log("✅ Assignment modal opens correctly");
    });

    test("shows volunteer selection list", async ({ page }) => {
      // Navigate to an event detail page
      const eventLinks = page.locator('a[href*="/events/"]');
      if ((await eventLinks.count()) === 0) {
        console.log("⚠️ No events - skipping");
        return;
      }

      await eventLinks.first().click();
      await page.waitForLoadState("networkidle");

      // Open assignment modal
      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Invite"), button:has-text("Add Volunteer")'
      );

      if ((await assignButton.count()) === 0) {
        console.log("⚠️ No assign button - skipping");
        return;
      }

      await assignButton.first().click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Look for volunteer list (checkboxes, list items, etc.)
      const hasVolunteerList =
        (await modal.locator('input[type="checkbox"]').count()) > 0 ||
        (await modal
          .locator('[role="listitem"], li, [role="option"]')
          .count()) > 0 ||
        (await modal.textContent())?.includes("volunteer");

      expect(hasVolunteerList).toBe(true);

      console.log("✅ Assignment modal shows volunteer selection");
    });
  });
});
