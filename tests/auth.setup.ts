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
 * @see https://playwright.dev/docs/auth
 */
setup("authenticate", async ({ page }) => {
  // Perform authentication
  await loginWithOTP(page, TEST_USERS.churchOwner.email);

  // Verify we're authenticated by checking we can access admin
  await page.goto("/church/newlife/admin");
  await expect(page.locator("text=/Quick Actions/i")).toBeVisible({
    timeout: 15000,
  });

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
});
