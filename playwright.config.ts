import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Church Connect Card E2E Tests
 *
 * Test Strategy:
 * - Security: Multi-tenant isolation, auth bypass attempts, permission escalation
 * - Functionality: Connect cards, team management, LMS, workflows
 * - Edge Cases: Concurrent operations, data validation, file limits
 * - Performance: Load testing, batch operations
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Run sequentially to avoid OTP race conditions with parallel authentication
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start dev server before running tests
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120000,
  },
});
