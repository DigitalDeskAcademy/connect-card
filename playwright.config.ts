import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Church Connect Card E2E Tests
 *
 * Architecture:
 * - "setup" project authenticates ONCE and saves session state
 * - "chromium" project runs tests using saved auth state
 * - Tests don't need to login individually (faster, fail-fast on auth issues)
 *
 * This follows Playwright's official authentication pattern:
 * @see https://playwright.dev/docs/auth
 *
 * Test Categories:
 * - Security: Multi-tenant isolation, auth bypass attempts, permission escalation
 * - Functionality: Connect cards, team management, LMS, workflows
 * - Edge Cases: Concurrent operations, data validation, file limits
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Stop after failures to avoid wasting time on systemic issues
  maxFailures: process.env.CI ? 10 : 3,
  // Run sequentially to avoid race conditions
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Bypass Arcjet bot detection
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },

  projects: [
    // Setup project - authenticates once and saves state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      testDir: "./tests",
    },

    // Main test project - uses saved auth state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use saved authentication state from setup
        storageState: "tests/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Start dev server before running tests
  webServer: {
    command: "pnpm dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120000,
  },
});
