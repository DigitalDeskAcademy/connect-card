import { test as setup, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "./helpers/auth";

const authFile = "tests/.auth/user.json";

/**
 * Authentication Setup - Playwright Best Practice
 *
 * This setup project runs ONCE before all test projects.
 * It authenticates and saves the session state to a file.
 * All subsequent tests reuse this state, avoiding repeated logins.
 *
 * Benefits:
 * - Faster test runs (auth once vs. auth per test)
 * - Fail fast if auth is broken (setup fails, all tests skip)
 * - Industry standard pattern recommended by Playwright
 *
 * IMPORTANT: If this setup fails, ALL tests will be skipped.
 * Check the error message carefully - common issues:
 * - Database not seeded (run: pnpm seed:all)
 * - Test user doesn't exist
 * - Organization membership not set up
 *
 * @see https://playwright.dev/docs/auth
 */
setup("authenticate", async ({ page }) => {
  console.log("🔐 Starting authentication setup...");

  // Perform authentication
  await loginWithOTP(page, TEST_USERS.churchOwner.email);
  console.log("✅ OTP login completed");

  // Check where we landed after login
  const currentUrl = page.url();
  console.log(`📍 Post-login URL: ${currentUrl}`);

  // Handle onboarding/setup flow if we land there
  if (currentUrl.includes("/setup/welcome")) {
    console.log("⚠️  Landed on setup/welcome - user may need onboarding");
    // Try to navigate directly to admin - if user has access, it should work
    await page.goto("/church/newlife/admin");
  } else if (!currentUrl.includes("/church/newlife/admin")) {
    // If not already at admin, navigate there
    await page.goto("/church/newlife/admin");
  }

  // Wait for page to load
  await page.waitForLoadState("networkidle");
  const finalUrl = page.url();
  console.log(`📍 Final URL: ${finalUrl}`);

  // Check for unauthorized redirect
  if (finalUrl.includes("/unauthorized")) {
    throw new Error(
      `❌ AUTH SETUP FAILED: User ${TEST_USERS.churchOwner.email} does not have access to 'newlife' organization.\n` +
        `   FIX: Run 'pnpm seed:all' to create test users with proper permissions.`
    );
  }

  // Check for login redirect (session expired or invalid)
  if (finalUrl.includes("/login")) {
    throw new Error(
      `❌ AUTH SETUP FAILED: Session not persisted - redirected back to login.\n` +
        `   Check Better Auth configuration and database connection.`
    );
  }

  // Verify we're on the admin dashboard
  // Look for common dashboard elements (sidebar, header, or content)
  const dashboardIndicators = [
    "text=/Quick Actions/i",
    "text=/Dashboard/i",
    '[data-sidebar="sidebar"]',
    "text=/Connect Cards/i",
  ];

  let foundIndicator = false;
  for (const selector of dashboardIndicators) {
    try {
      await expect(page.locator(selector).first()).toBeVisible({
        timeout: 5000,
      });
      foundIndicator = true;
      console.log(`✅ Dashboard verified via: ${selector}`);
      break;
    } catch {
      // Try next indicator
    }
  }

  if (!foundIndicator) {
    const bodyText = await page.textContent("body");
    throw new Error(
      `❌ AUTH SETUP FAILED: Could not verify dashboard loaded.\n` +
        `   Current URL: ${finalUrl}\n` +
        `   Page content preview: ${bodyText?.substring(0, 200)}...`
    );
  }

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
  console.log("✅ Auth state saved to:", authFile);
});
