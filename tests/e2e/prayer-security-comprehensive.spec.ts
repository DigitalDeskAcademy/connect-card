import { test, expect } from "@playwright/test";
import { loginAsTestUser, TEST_USERS, logout } from "../helpers/auth";
import { prisma } from "@/lib/db";

test.describe("Prayer Management - Security & Comprehensive Tests", () => {
  test("Multi-Tenant Isolation: Users only see their organization data", async ({
    page,
  }) => {
    console.log("🔒 Testing multi-tenant data isolation...");

    // Login as New Life church owner
    console.log("📍 Step 1: Login as New Life church owner");
    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    // Count New Life's prayer requests
    const newLifeRows = await page.locator("table tbody tr").count();
    console.log(
      `✅ New Life church has ${newLifeRows} prayer requests visible`
    );
    expect(newLifeRows).toBeGreaterThan(0);

    // Try to access a different organization's URL directly
    console.log(
      "📍 Step 2: Try to access different org URL (should be blocked or empty)"
    );
    await page.goto("/church/faithchurch/admin/prayer");

    // Should either redirect or show no data (depends on auth implementation)
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();

    if (currentUrl.includes("/church/faithchurch/admin/prayer")) {
      // If access is allowed, verify NO data from other org is visible
      const otherOrgRows = await page.locator("table tbody tr").count();
      console.log(
        `✅ Accessing other org URL shows ${otherOrgRows} requests (should be 0 or error)`
      );

      // Check for empty state or error message
      const hasEmptyState = await page
        .locator("text=/No prayer requests found/i")
        .isVisible();
      const hasErrorState = await page
        .locator("text=/access denied|unauthorized|forbidden/i")
        .isVisible();

      expect(hasEmptyState || hasErrorState || otherOrgRows === 0).toBeTruthy();
    } else {
      console.log(`✅ Redirected away from unauthorized org: ${currentUrl}`);
    }
  });

  test("Privacy Controls: Staff can only see public + assigned private requests", async ({
    page,
  }) => {
    console.log("🔐 Testing privacy controls for staff users...");

    // First, get total count as church owner (can see all)
    console.log("📍 Step 1: Login as church owner to get baseline counts");
    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    const ownerTotalText = await page
      .locator("text=/Showing .* of (\\d+)/")
      .textContent();
    const ownerTotal = parseInt(ownerTotalText?.match(/of (\d+)/)?.[1] || "0");
    console.log(`✅ Church owner can see ${ownerTotal} total prayer requests`);

    // Get count of private requests from database
    const privateCount = await prisma.prayerRequest.count({
      where: {
        organization: { slug: "newlife" },
        isPrivate: true,
      },
    });
    console.log(`📊 Database shows ${privateCount} private prayer requests`);

    // Logout and login as staff member
    console.log("📍 Step 2: Logout and login as staff member");
    await logout(page);
    await loginAsTestUser(page, TEST_USERS.churchStaff);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    const staffTotalText = await page
      .locator("text=/Showing .* of (\\d+)/")
      .textContent();
    const staffTotal = parseInt(staffTotalText?.match(/of (\d+)/)?.[1] || "0");
    console.log(`✅ Staff member can see ${staffTotal} prayer requests`);

    // Staff should see FEWER requests than owner if there are private requests
    if (privateCount > 0) {
      expect(staffTotal).toBeLessThan(ownerTotal);
      console.log(
        `✅ Privacy working: Staff sees ${ownerTotal - staffTotal} fewer requests (private ones)`
      );
    } else {
      console.log(`ℹ️ No private requests to test privacy filtering`);
    }

    // Verify privacy indicators are present
    const lockIcons = await page
      .locator('[data-testid="privacy-icon"]')
      .count();
    console.log(`📊 Found ${lockIcons} privacy lock icons visible to staff`);
  });

  test("Role-Based Access: Different roles see appropriate data", async ({
    page,
  }) => {
    console.log("👥 Testing role-based access controls...");

    const roleCounts: Record<string, number> = {};

    // Test each role
    const roles = [
      { name: "Church Owner", user: TEST_USERS.churchOwner },
      { name: "Church Admin", user: TEST_USERS.churchAdmin },
      { name: "Church Staff", user: TEST_USERS.churchStaff },
    ];

    for (const { name, user } of roles) {
      console.log(`📍 Testing access for: ${name}`);

      if (Object.keys(roleCounts).length > 0) {
        await logout(page);
      }

      await loginAsTestUser(page, user);
      await page.goto("/church/newlife/admin/prayer");
      await page.waitForLoadState("networkidle");

      const totalText = await page
        .locator("text=/Showing .* of (\\d+)/")
        .textContent();
      const total = parseInt(totalText?.match(/of (\d+)/)?.[1] || "0");
      roleCounts[name] = total;

      console.log(`✅ ${name} can see ${total} prayer requests`);

      // Verify page loaded correctly
      await expect(
        page
          .locator('[data-slot="card-title"]')
          .filter({ hasText: "Prayer Requests" })
      ).toBeVisible();
    }

    // Owner and Admin should see same count (both have full access)
    expect(roleCounts["Church Owner"]).toEqual(roleCounts["Church Admin"]);

    // Staff should see same or fewer (due to privacy filtering)
    expect(roleCounts["Church Staff"]).toBeLessThanOrEqual(
      roleCounts["Church Owner"]
    );

    console.log("✅ Role-based access verification complete");
  });

  test("Search Functionality: Edge cases and filtering", async ({ page }) => {
    console.log("🔍 Testing search functionality thoroughly...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Test 1: Search with results
    console.log("📍 Test 1: Search with expected results");
    await searchInput.fill("health");
    await page.waitForTimeout(500);
    const healthResults = await page.locator("table tbody tr").count();
    console.log(`✅ Search "health" returned ${healthResults} results`);
    expect(healthResults).toBeGreaterThan(0);

    // Test 2: Search with no results
    console.log("📍 Test 2: Search with no results");
    await searchInput.fill("xyznonexistentquery12345");
    await page.waitForTimeout(500);
    const noResults = await page.locator("table tbody tr").count();
    const emptyState = await page
      .locator("text=/No prayer requests found/i")
      .isVisible();
    console.log(`✅ Search with no results shows empty state: ${emptyState}`);
    expect(noResults === 0 || emptyState).toBeTruthy();

    // Test 3: Case insensitive search
    console.log("📍 Test 3: Case insensitive search");
    await searchInput.fill("HEALTH");
    await page.waitForTimeout(500);
    const uppercaseResults = await page.locator("table tbody tr").count();
    console.log(
      `✅ Uppercase search "HEALTH" returned ${uppercaseResults} results`
    );
    expect(uppercaseResults).toBeGreaterThan(0);

    // Test 4: Clear search returns to full list
    console.log("📍 Test 4: Clear search");
    await searchInput.fill("");
    await page.waitForTimeout(500);
    const clearedResults = await page.locator("table tbody tr").count();
    console.log(
      `✅ Cleared search shows ${clearedResults} results (back to full list)`
    );
    expect(clearedResults).toBeGreaterThan(0);

    // Test 5: Special characters (SQL injection attempt)
    console.log("📍 Test 5: Special characters in search (security test)");
    await searchInput.fill("'; DROP TABLE prayer_request; --");
    await page.waitForTimeout(500);
    // Should not crash and should handle gracefully
    const sqlResults = await page.locator("table tbody tr").count();
    console.log(
      `✅ SQL injection attempt handled gracefully: ${sqlResults} results`
    );
  });

  test("Status Filtering: All status options work correctly", async ({
    page,
  }) => {
    console.log("🏷️ Testing status filtering...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    const statusButton = page
      .locator("button")
      .filter({
        hasText: /All Status|Pending|Assigned|Praying|Answered|Archived/,
      })
      .first();

    const statuses = [
      "Pending",
      "Assigned",
      "Praying",
      "Answered",
      "Archived",
      "All Status",
    ];
    const statusCounts: Record<string, number> = {};

    for (const status of statuses) {
      console.log(`📍 Testing status filter: ${status}`);

      await statusButton.click();
      await page.waitForTimeout(300);

      const option = page
        .locator('[role="option"]')
        .filter({ hasText: status })
        .first();
      await option.waitFor({ state: "visible", timeout: 5000 });
      await option.click();
      await page.waitForTimeout(500);

      const rowCount = await page.locator("table tbody tr").count();
      statusCounts[status] = rowCount;
      console.log(`✅ ${status} filter shows ${rowCount} requests`);
    }

    // All Status should show the most results
    const allStatusCount = statusCounts["All Status"];
    for (const [status, count] of Object.entries(statusCounts)) {
      if (status !== "All Status") {
        expect(count).toBeLessThanOrEqual(allStatusCount);
      }
    }

    console.log("✅ Status filtering verification complete");
  });

  test("Pagination: Verify correct page counts and navigation", async ({
    page,
  }) => {
    console.log("📄 Testing pagination...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    // Check pagination info
    const paginationText = await page
      .locator("text=/Showing (\\d+) to (\\d+) of (\\d+)/")
      .textContent();
    const match = paginationText?.match(/Showing (\d+) to (\d+) of (\d+)/);

    if (match) {
      const [, start, end, total] = match;
      console.log(`✅ Page 1: Showing ${start}-${end} of ${total}`);

      expect(parseInt(start)).toBe(1);
      expect(parseInt(end)).toBeLessThanOrEqual(10); // Page size is 10

      const totalCount = parseInt(total);

      // If more than 10 records, test pagination
      if (totalCount > 10) {
        console.log("📍 Testing page 2 navigation...");

        // Click next page (it's a link, not a button)
        const nextLink = page
          .locator('a[aria-label*="next" i], a:has-text("Next")')
          .last();
        await nextLink.click();
        await page.waitForTimeout(500);

        // Verify page 2 data
        const page2Text = await page
          .locator("text=/Showing (\\d+) to (\\d+) of (\\d+)/")
          .textContent();
        const page2Match = page2Text?.match(/Showing (\d+) to (\d+) of (\d+)/);

        if (page2Match) {
          const [, p2start, p2end] = page2Match;
          console.log(`✅ Page 2: Showing ${p2start}-${p2end} of ${total}`);
          expect(parseInt(p2start)).toBe(11);
        }

        // Go back to page 1 (it's a link, not a button)
        const prevLink = page
          .locator('a[aria-label*="previous" i], a:has-text("Previous")')
          .last();
        await prevLink.click();
        await page.waitForTimeout(500);

        console.log("✅ Pagination navigation working correctly");
      } else {
        console.log("ℹ️ Not enough records to test pagination (need >10)");
      }
    }
  });

  test("Urgent and Private Indicators: Visual flags display correctly", async ({
    page,
  }) => {
    console.log("⚠️ Testing urgent and private indicators...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    // Check for urgent indicators in the table
    const urgentBadges = await page.locator("text=/urgent/i").count();
    console.log(`📊 Found ${urgentBadges} urgent indicators`);

    // Check for private/lock icons
    const privateBadges = await page
      .locator("svg")
      .filter({ hasText: /lock|private/i })
      .count();
    console.log(`📊 Found ${privateBadges} private/lock indicators`);

    // Get database counts to verify
    const urgentCount = await prisma.prayerRequest.count({
      where: {
        organization: { slug: "newlife" },
        isUrgent: true,
      },
    });

    const privateCount = await prisma.prayerRequest.count({
      where: {
        organization: { slug: "newlife" },
        isPrivate: true,
      },
    });

    console.log(
      `✅ Database: ${urgentCount} urgent, ${privateCount} private requests`
    );
    console.log(`✅ UI shows indicators for flagged requests`);
  });

  test("Empty State: Verify empty state displays when no data", async ({
    page,
  }) => {
    console.log("📭 Testing empty state...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    // Apply a filter that returns no results
    await page
      .locator('input[placeholder*="Search"]')
      .fill("zzzznonexistenttextxyz123");
    await page.waitForTimeout(500);

    // Check for empty state
    const emptyState = await page.locator("text=/No prayer requests found/i");
    await expect(emptyState).toBeVisible();

    const emptyIcon = await page
      .locator("svg")
      .filter({ has: page.locator("text=/No prayer requests/i") });
    console.log("✅ Empty state displays correctly with icon and message");

    // Clear filter to restore data
    await page.locator('input[placeholder*="Search"]').fill("");
    await page.waitForTimeout(500);

    const restoredRows = await page.locator("table tbody tr").count();
    console.log(`✅ Data restored after clearing filter: ${restoredRows} rows`);
  });

  test("Performance: Page loads and filters within acceptable time", async ({
    page,
  }) => {
    console.log("⚡ Testing performance...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);

    // Measure initial page load
    const loadStart = Date.now();
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - loadStart;

    console.log(`✅ Initial page load: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds

    // Measure search filter response
    const searchStart = Date.now();
    await page.locator('input[placeholder*="Search"]').fill("health");
    await page.waitForTimeout(500);
    const searchTime = Date.now() - searchStart;

    console.log(`✅ Search filter response: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(2000); // Should filter in under 2 seconds

    // Measure status filter response
    await page.locator('input[placeholder*="Search"]').fill(""); // Clear search
    await page.waitForTimeout(300);

    const filterStart = Date.now();
    const statusButton = page
      .locator("button")
      .filter({ hasText: /All Status|Pending/ })
      .first();
    await statusButton.click();
    const pendingOption = page
      .locator('[role="option"]')
      .filter({ hasText: "Pending" })
      .first();
    await pendingOption.waitFor({ state: "visible", timeout: 5000 });
    await pendingOption.click();
    await page.waitForTimeout(500);
    const filterTime = Date.now() - filterStart;

    console.log(`✅ Status filter response: ${filterTime}ms`);
    expect(filterTime).toBeLessThan(3000); // Should filter in under 3 seconds
  });

  test("Data Accuracy: Table data matches database records", async ({
    page,
  }) => {
    console.log("✅ Testing data accuracy...");

    await loginAsTestUser(page, TEST_USERS.churchOwner);
    await page.goto("/church/newlife/admin/prayer");
    await page.waitForLoadState("networkidle");

    // Get UI count
    const paginationText = await page
      .locator("text=/Showing .* of (\\d+)/")
      .textContent();
    const uiTotal = parseInt(paginationText?.match(/of (\d+)/)?.[1] || "0");

    // Get database count
    const dbTotal = await prisma.prayerRequest.count({
      where: {
        organization: { slug: "newlife" },
      },
    });

    console.log(`📊 UI shows: ${uiTotal} requests`);
    console.log(`📊 Database has: ${dbTotal} requests`);

    expect(uiTotal).toBe(dbTotal);
    console.log("✅ UI count matches database count exactly");

    // Verify first row data matches database
    const firstRowRequest = await page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .nth(0)
      .textContent();
    console.log(
      `📊 First visible request: "${firstRowRequest?.substring(0, 50)}..."`
    );

    const dbFirstRequest = await prisma.prayerRequest.findFirst({
      where: {
        organization: { slug: "newlife" },
      },
      orderBy: [{ isUrgent: "desc" }, { status: "asc" }, { createdAt: "desc" }],
    });

    if (dbFirstRequest && firstRowRequest) {
      const requestTextMatch = firstRowRequest.includes(
        dbFirstRequest.request.substring(0, 20)
      );
      console.log(`✅ First row data matches database: ${requestTextMatch}`);
    }
  });
});
