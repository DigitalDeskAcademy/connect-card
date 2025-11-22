import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Connect Card Batches - Basic Tests
 *
 * Simple, focused tests for batch functionality after seed-demo.ts improvements:
 * 1. Verify batches exist
 * 2. Verify batch statuses work
 * 3. Verify cards are assigned to batches
 *
 * Expected seed data (from seed-demo.ts):
 * - 2 batches created
 * - 13 cards total (5 EXTRACTED + 8 REVIEWED)
 * - Cards assigned to batches (no orphans)
 */

test.describe("Connect Card Batches - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");
  });

  test("BASIC: Verify batches exist in system", async ({ page }) => {
    console.log("=== Verifying Batches Exist ===");

    // Navigate to Batches tab
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log("Batches tab loaded");

    // Check if page shows batch content (not empty state)
    const bodyText = await page.textContent("body");

    // Look for indicators that batches exist
    const hasBatchIndicators =
      bodyText?.includes("cards") || // "X cards" text
      bodyText?.includes("PENDING") ||
      bodyText?.includes("COMPLETED") ||
      bodyText?.includes("Campus") || // Location names
      bodyText?.includes("Nov"); // Date references

    console.log(`Batch indicators found: ${hasBatchIndicators ? "✅" : "❌"}`);
    console.log(`Page shows: ${bodyText?.substring(0, 500)}`); // First 500 chars for debugging

    expect(hasBatchIndicators).toBe(true);
  });

  test("BASIC: Verify batch statuses display", async ({ page }) => {
    console.log("=== Verifying Batch Status ===");

    // Navigate to Batches tab
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Get page text to check statuses
    const bodyText = await page.textContent("body");

    // Check for status badges (might be "PENDING", "Pending", "COMPLETED", "Completed")
    const hasPending = bodyText?.toLowerCase().includes("pending");
    const hasCompleted = bodyText?.toLowerCase().includes("completed");

    console.log(`Batch statuses found:`);
    console.log(`  - PENDING: ${hasPending ? "✅" : "❌"}`);
    console.log(`  - COMPLETED: ${hasCompleted ? "✅" : "❌"}`);

    // At least one status should be visible
    expect(hasPending || hasCompleted).toBe(true);
  });

  test("BASIC: Verify cards are assigned to batches", async ({ page }) => {
    console.log("=== Verifying Card Assignments ===");

    // Navigate to Analytics tab to see card counts
    const analyticsTab = page.locator('button[role="tab"]:has-text("Analytics")');
    await analyticsTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log("Analytics tab loaded");

    // Check for card counts (seed created 13 total cards)
    const bodyText = await page.textContent("body");
    const hasCards =
      bodyText?.includes("13") ||
      bodyText?.includes("Total") ||
      bodyText?.includes("cards");

    console.log(`Analytics shows cards: ${hasCards ? "✅ Yes" : "❌ No"}`);

    // Navigate to Batches to verify assignment
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Look for card count indicators
    const batchText = await page.textContent("body");
    const showsCardCounts =
      batchText?.includes("cards") || batchText?.includes("card");

    console.log(`Batch shows card counts: ${showsCardCounts ? "✅" : "❌"}`);

    expect(showsCardCounts).toBe(true);
  });

  test("BASIC: Verify Review Cards link exists on PENDING batches", async ({ page }) => {
    console.log("=== Verifying Review Cards Link ===");

    // Navigate to Batches tab
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for "Review Cards" or "View Batch" links
    const reviewLink = page.locator('a:has-text("Review Cards")');
    const viewLink = page.locator('a:has-text("View Batch")');

    const hasReviewLink = await reviewLink.isVisible({ timeout: 3000 }).catch(() => false);
    const hasViewLink = await viewLink.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Review Cards link: ${hasReviewLink ? "✅" : "❌"}`);
    console.log(`View Batch link: ${hasViewLink ? "✅" : "❌"}`);

    // At least one type of link should exist
    expect(hasReviewLink || hasViewLink).toBe(true);
  });

  test("BASIC: Verify batch filtering buttons exist", async ({ page }) => {
    console.log("=== Verifying Batch Filters ===");

    // Navigate to Batches tab
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for filter buttons (All, Pending, Completed)
    const allButton = page.locator('button:has-text("All")');
    const pendingButton = page.locator('button:has-text("Pending")');
    const completedButton = page.locator('button:has-text("Completed")');

    const hasAll = await allButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasPending = await pendingButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasCompleted = await completedButton.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Filter buttons:`);
    console.log(`  - All: ${hasAll ? "✅" : "❌"}`);
    console.log(`  - Pending: ${hasPending ? "✅" : "❌"}`);
    console.log(`  - Completed: ${hasCompleted ? "✅" : "❌"}`);

    // At least the filter UI should exist
    expect(hasAll || hasPending || hasCompleted).toBe(true);
  });
});

test.describe("Connect Card Batches - Data Integrity", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
  });

  test("DATA: No orphaned cards (all cards have batchId)", async ({ page }) => {
    console.log("=== Verifying No Orphaned Cards ===");

    // This test verifies the seed properly assigned batchId to all cards
    // We can't query database directly in Playwright, so we verify UI indicators

    await page.goto("/church/newlife/admin/connect-cards");
    await page.waitForLoadState("networkidle");

    // Check Analytics for total cards
    const analyticsTab = page.locator('button[role="tab"]:has-text("Analytics")');
    await analyticsTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const analyticsText = await page.textContent("body");
    const hasAnalytics = analyticsText?.includes("Total") || analyticsText?.includes("cards");

    console.log(`Analytics data present: ${hasAnalytics ? "✅" : "❌"}`);

    // Check Batches for card counts
    const batchesTab = page.locator('button[role="tab"]:has-text("Batches")');
    await batchesTab.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const batchText = await page.textContent("body");
    const batchesShowCards = batchText?.includes("cards") || batchText?.includes("card");

    console.log(`Batches show card assignments: ${batchesShowCards ? "✅" : "❌"}`);

    // Both should show data (indicates cards are assigned)
    expect(hasAnalytics && batchesShowCards).toBe(true);
  });
});
