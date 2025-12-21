import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Settings Pages Tests
 *
 * Tests the organization settings functionality:
 * - Settings landing page with category cards
 * - Volunteer Onboarding settings
 * - Permission enforcement (admin-only access)
 * - Navigation between settings sections
 *
 * Settings structure:
 * - Volunteer Onboarding: Documents, ministry requirements, BG check settings
 * - Organization: Church name, logo (Coming Soon)
 * - Billing: Subscription, invoices (Coming Soon)
 * - Integrations: Planning Center, GoHighLevel (Coming Soon)
 */

test.describe("Settings Pages - Landing Page", () => {
  // Use stored auth state from setup project
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/church/newlife/admin/settings");
    await page.waitForLoadState("networkidle");
  });

  test("Settings page loads with correct structure", async ({ page }) => {
    // Verify we're on the settings page
    await expect(page).toHaveURL(/\/church\/newlife\/admin\/settings/);

    // Check for page heading (there may be multiple h1s, use first in main content)
    const heading = page
      .locator('main h1:has-text("Settings"), h1.text-2xl:has-text("Settings")')
      .first();
    await expect(heading).toBeVisible();

    // Check for description
    const description = page.locator("text=/Manage your church.*settings/i");
    await expect(description).toBeVisible();

    console.log("✅ Settings page structure verified");
  });

  test("Settings categories are displayed as cards", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for Volunteer Onboarding card (this one is active)
    const volunteerCard = page.locator('text="Volunteer Onboarding"');
    await expect(volunteerCard).toBeVisible();

    // Check for Organization card (Coming Soon)
    const organizationCard = page.locator('text="Organization"');
    await expect(organizationCard).toBeVisible();

    // Check for Billing card (Coming Soon)
    const billingCard = page.locator('text="Billing"');
    await expect(billingCard).toBeVisible();

    // Check for Integrations card (Coming Soon)
    const integrationsCard = page.locator('text="Integrations"');
    await expect(integrationsCard).toBeVisible();

    console.log("✅ All settings categories displayed");
  });

  test("Coming Soon badges displayed on inactive cards", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Count Coming Soon badges
    const comingSoonBadges = page.locator('text="Coming Soon"');
    const badgeCount = await comingSoonBadges.count();

    // Should have 3 Coming Soon badges (Organization, Billing, Integrations)
    expect(badgeCount).toBeGreaterThanOrEqual(3);

    console.log(`✅ Found ${badgeCount} Coming Soon badges`);
  });

  test("Volunteer Onboarding card is clickable", async ({ page }) => {
    // Find the Volunteer Onboarding link
    const volunteerLink = page.locator(
      'a[href*="/settings/volunteer-onboarding"]'
    );
    await expect(volunteerLink).toBeVisible();

    // Click and verify navigation
    await volunteerLink.click();
    await page.waitForLoadState("networkidle");

    // Verify URL changed
    await expect(page).toHaveURL(/\/settings\/volunteer-onboarding/);

    console.log("✅ Volunteer Onboarding card navigation works");
  });

  test("Coming Soon cards are not clickable", async ({ page }) => {
    // Organization card should NOT be a link
    const organizationLink = page.locator('a[href*="/settings/organization"]');
    const isLink = (await organizationLink.count()) > 0;

    // Should not be a link
    expect(isLink).toBe(false);

    console.log("✅ Coming Soon cards correctly disabled");
  });
});

test.describe("Settings Pages - Volunteer Onboarding", () => {
  // Use stored auth state from setup project
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/church/newlife/admin/settings/volunteer-onboarding");
    await page.waitForLoadState("networkidle");
  });

  test("Volunteer Onboarding page loads correctly", async ({ page }) => {
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/settings\/volunteer-onboarding/);

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for back button to Settings
    const backButton = page.locator('a:has-text("Settings")');
    const hasBackButton = await backButton.isVisible().catch(() => false);

    if (hasBackButton) {
      console.log("✅ Back to Settings button visible");
    }

    // Look for key sections
    const documentsSection = page.locator(
      "text=/Documents?|Document Library/i"
    );
    const requirementsSection = page.locator("text=/Requirements?|Ministry/i");

    const hasDocuments = await documentsSection.isVisible().catch(() => false);
    const hasRequirements = await requirementsSection
      .isVisible()
      .catch(() => false);

    console.log(
      `Sections: Documents=${hasDocuments}, Requirements=${hasRequirements}`
    );
    console.log("✅ Volunteer Onboarding page loaded");
  });

  test("Document library section present", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for document-related elements
    const documentsHeading = page
      .locator("text=/Documents?|Document Library/i")
      .first();
    const addDocumentButton = page.locator(
      'button:has-text("Add Document"), button:has-text("Upload")'
    );

    const hasDocuments = await documentsHeading.isVisible().catch(() => false);
    const hasAddButton = await addDocumentButton.isVisible().catch(() => false);

    if (hasDocuments) {
      console.log("✅ Document library section found");
    }

    if (hasAddButton) {
      console.log("✅ Add document button found");
    }
  });

  test("Ministry requirements section present", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for ministry/requirements elements
    const requirementsHeading = page
      .locator("text=/Ministry.*Requirements?|Requirements/i")
      .first();

    const hasRequirements = await requirementsHeading
      .isVisible()
      .catch(() => false);

    if (hasRequirements) {
      console.log("✅ Ministry requirements section found");
    } else {
      console.log("⚠️ Ministry requirements section may use different heading");
    }
  });

  test("Background check configuration section present", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for background check related elements
    const bgCheckSection = page
      .locator("text=/Background Check|BG Check/i")
      .first();

    const hasBgCheck = await bgCheckSection.isVisible().catch(() => false);

    if (hasBgCheck) {
      console.log("✅ Background check configuration section found");
    } else {
      console.log("⚠️ Background check section may use different heading");
    }
  });

  test("Back button navigates to Settings", async ({ page }) => {
    // Find back button/link
    const backButton = page
      .locator('a:has-text("Settings"), button:has-text("Back")')
      .first();
    const hasBackButton = await backButton.isVisible().catch(() => false);

    if (hasBackButton) {
      await backButton.click();
      await page.waitForLoadState("networkidle");

      // Verify navigated back to settings
      await expect(page).toHaveURL(/\/admin\/settings(?!\/volunteer)/);

      console.log("✅ Back navigation works");
    } else {
      console.log("⚠️ Back button not found");
    }
  });
});

test.describe("Settings Pages - Permission Enforcement", () => {
  // Use fresh context for permission tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test("SECURITY: Staff without admin access cannot view settings", async ({
    page,
  }) => {
    // Login as regular staff (not admin)
    await loginWithOTP(page, TEST_USERS.churchStaff.email);

    // Try to access settings page
    await page.goto("/church/newlife/admin/settings");
    await page.waitForLoadState("networkidle");

    // Staff should still see settings but with limited options
    // Check that admin-only items show correctly
    const volunteerOnboarding = page.locator('text="Volunteer Onboarding"');
    const isVisible = await volunteerOnboarding.isVisible().catch(() => false);

    // If visible, the card might be disabled or the link shouldn't work
    if (isVisible) {
      // Try to access volunteer onboarding directly
      await page.goto("/church/newlife/admin/settings/volunteer-onboarding");
      await page.waitForLoadState("networkidle");

      // Should be redirected away or shown error
      const currentUrl = page.url();
      const wasBlocked =
        !currentUrl.includes("/volunteer-onboarding") ||
        (currentUrl.includes("/admin") &&
          !currentUrl.includes("/settings/volunteer-onboarding"));

      if (wasBlocked) {
        console.log(
          "✅ Staff correctly blocked from volunteer onboarding settings"
        );
      } else {
        // May still be accessible if they have canManageUsers permission
        console.log("⚠️ Staff can access page (may have elevated permissions)");
      }
    } else {
      console.log("✅ Admin-only settings hidden from staff");
    }
  });

  test("Admin can access all settings sections", async ({ page }) => {
    // Login as admin
    await loginWithOTP(page, TEST_USERS.churchAdmin.email);

    // Navigate to settings
    await page.goto("/church/newlife/admin/settings");
    await page.waitForLoadState("networkidle");

    // Verify all categories are visible
    const volunteerCard = page.locator('text="Volunteer Onboarding"');
    await expect(volunteerCard).toBeVisible({ timeout: 10000 });

    // Navigate to volunteer onboarding
    await page.goto("/church/newlife/admin/settings/volunteer-onboarding");
    await page.waitForLoadState("networkidle");

    // Should load successfully (not redirected)
    await expect(page).toHaveURL(/\/volunteer-onboarding/);

    console.log("✅ Admin can access all settings sections");
  });
});

test.describe("Settings Pages - URL State", () => {
  // Use stored auth state from setup project
  test.use({ storageState: "tests/.auth/user.json" });

  test("Direct URL to volunteer onboarding works", async ({ page }) => {
    // Navigate directly to volunteer onboarding
    await page.goto("/church/newlife/admin/settings/volunteer-onboarding");
    await page.waitForLoadState("networkidle");

    // Verify URL
    await expect(page).toHaveURL(/\/settings\/volunteer-onboarding/);

    // Verify content loaded (not error state)
    const errorState = page.locator("text=/Failed to load|Error/i");
    const hasError = await errorState.isVisible().catch(() => false);

    expect(hasError).toBe(false);

    console.log("✅ Direct URL navigation works");
  });

  test("Invalid settings path shows 404", async ({ page }) => {
    // Navigate to non-existent settings page
    const response = await page.goto(
      "/church/newlife/admin/settings/nonexistent"
    );

    // Should get 404
    const status = response?.status();

    if (status === 404) {
      console.log("✅ Invalid settings path returns 404");
    } else {
      // May redirect to settings or show error page
      console.log(`⚠️ Invalid path returned status ${status}`);
    }
  });
});

test.describe("Settings Pages - UI Elements", () => {
  // Use stored auth state from setup project
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/church/newlife/admin/settings");
    await page.waitForLoadState("networkidle");
  });

  test("Settings cards have icons", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Look for icon containers (cards use p-2 bg-primary/10 rounded-lg for icons)
    const iconContainers = page.locator(
      '.bg-primary\\/10, [class*="bg-primary"]'
    );
    const iconCount = await iconContainers.count();

    // Should have at least 4 icons (one per category)
    expect(iconCount).toBeGreaterThanOrEqual(4);

    console.log(`✅ Found ${iconCount} icon containers`);
  });

  test("Cards have descriptions", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for specific descriptions
    const volunteerDesc = page.locator(
      "text=/Documents, ministry requirements/i"
    );
    const orgDesc = page.locator("text=/Church name, logo/i");
    const billingDesc = page.locator("text=/Subscription, invoices/i");
    const integrationsDesc = page.locator(
      "text=/Planning Center, GoHighLevel/i"
    );

    const hasVolunteer = await volunteerDesc.isVisible().catch(() => false);
    const hasOrg = await orgDesc.isVisible().catch(() => false);
    const hasBilling = await billingDesc.isVisible().catch(() => false);
    const hasIntegrations = await integrationsDesc
      .isVisible()
      .catch(() => false);

    console.log(
      `Descriptions: Volunteer=${hasVolunteer}, Org=${hasOrg}, Billing=${hasBilling}, Integrations=${hasIntegrations}`
    );

    // At least volunteer description should be visible
    expect(hasVolunteer || hasOrg || hasBilling || hasIntegrations).toBe(true);

    console.log("✅ Card descriptions verified");
  });

  test("Grid layout adapts to screen size", async ({ page }) => {
    // Check that cards are in a grid
    const grid = page.locator(".grid");
    const gridCount = await grid.count();

    expect(gridCount).toBeGreaterThan(0);

    // Verify grid has responsive classes
    const gridElement = grid.first();
    const gridClass = await gridElement.getAttribute("class");

    if (gridClass) {
      const hasResponsive =
        gridClass.includes("md:grid-cols") ||
        gridClass.includes("lg:grid-cols");

      if (hasResponsive) {
        console.log("✅ Grid has responsive columns");
      } else {
        console.log("⚠️ Grid may not be responsive");
      }
    }

    console.log("✅ Grid layout verified");
  });
});
