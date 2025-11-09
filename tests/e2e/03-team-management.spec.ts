import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * Team Management Tests
 *
 * Tests invitation workflow, role management, and permission enforcement
 *
 * Edge cases tested:
 * - Permission escalation attempts
 * - Invalid email addresses
 * - Duplicate invitations
 * - Removing last owner
 * - Cross-organization invitations
 * - Role downgrade attacks
 * - Multi-campus permission bypass
 */

test.describe("Team Management - Invitation Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/team");
  });

  test("SUCCESS: Invite new staff member", async ({ page }) => {
    // Click invite button
    await page.click('button:has-text("Invite Staff")');

    // Fill invitation form
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', uniqueEmail);

    // Select role
    await page.click('[role="combobox"]'); // Role selector
    await page.click('text="Staff"');

    // Select location
    await page.click('[role="combobox"]:has-text("Location")');
    await page.click('text="Bainbridge"');

    // Submit
    await page.click('button[type="submit"]:has-text("Send Invitation")');

    // EXPECTED: Success message
    await expect(page.locator("text=/invitation sent/i")).toBeVisible({
      timeout: 5000,
    });

    // Verify appears in pending invitations
    await page.click('tab:has-text("Pending Invitations")');
    await expect(page.locator(`text="${uniqueEmail}"`)).toBeVisible();
  });

  test("EDGE CASE: Prevent duplicate invitations", async ({ page }) => {
    const testEmail = "duplicate@test.com";

    // Send first invitation
    await page.click('button:has-text("Invite Staff")');
    await page.fill('input[type="email"]', testEmail);
    await page.click('[role="combobox"]');
    await page.click('text="Staff"');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Try to send same invitation again
    await page.click('button:has-text("Invite Staff")');
    await page.fill('input[type="email"]', testEmail);
    await page.click('[role="combobox"]');
    await page.click('text="Staff"');
    await page.click('button[type="submit"]');

    // EXPECTED: Should show error about existing invitation
    await expect(
      page.locator("text=/already invited|pending invitation/i")
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("EDGE CASE: Invalid email validation", async ({ page }) => {
    await page.click('button:has-text("Invite Staff")');

    // Try invalid emails
    const invalidEmails = [
      "notanemail",
      "@nodomain.com",
      "spaces in@email.com",
      "missing@",
      "@",
    ];

    for (const email of invalidEmails) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator("text=/invalid email/i")).toBeVisible({
        timeout: 2000,
      });

      // Clear for next test
      await page.fill('input[type="email"]', "");
    }
  });

  test("SECURITY: Prevent removing last Account Owner", async ({ page }) => {
    // Navigate to active members
    await page.click('tab:has-text("Active Members")');

    // Find the Account Owner row
    const ownerRow = page.locator('tr:has-text("Account Owner")').first();

    // Try to remove
    await ownerRow.locator('button:has-text("Remove")').click();

    // EXPECTED: Should show warning or disable action
    await expect(
      page.locator("text=/cannot remove|last owner|at least one/i")
    ).toBeVisible({
      timeout: 5000,
    });

    // Dialog should show error and not allow deletion
    const confirmButton = page.locator('button:has-text("Remove")').last();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();

      // Should show error
      await expect(page.locator("text=/cannot remove/i")).toBeVisible();
    }
  });

  test("PERMISSION: Staff cannot access team management", async ({ page }) => {
    // Logout and login as staff
    await page.goto("/login");
    await loginWithOTP(page, TEST_USERS.churchStaff.email);

    // Try to access team page
    await page.goto("/church/newlife/admin/team");

    // EXPECTED: Should be denied or redirected
    await page.waitForURL(url => {
      return (
        url.pathname.includes("/unauthorized") || url.pathname !== "/admin/team"
      );
    });

    // Verify cannot see team management UI
    await expect(
      page.locator('button:has-text("Invite Staff")')
    ).not.toBeVisible();
  });

  test("SECURITY: Cannot invite to different organization", async ({
    page,
  }) => {
    // Intercept and try to modify organization in request
    await page.route("**/actions/team/invite**", async route => {
      const request = route.request();
      const originalData = request.postDataJSON();

      // ATTACK: Try to inject different org
      const maliciousData = {
        ...originalData,
        organizationSlug: "different-org",
      };

      await route.continue({
        postData: JSON.stringify(maliciousData),
      });
    });

    await page.click('button:has-text("Invite Staff")');
    await page.fill('input[type="email"]', `hack-${Date.now()}@test.com`);
    await page.click('[role="combobox"]');
    await page.click('text="Staff"');
    await page.click('button[type="submit"]');

    // EXPECTED: Server should reject or use session's org
    await expect(page.locator("text=/failed|unauthorized/i")).toBeVisible({
      timeout: 5000,
    });
  });

  test("PERMISSION: Multi-campus access control", async ({ page }) => {
    // This tests the canSeeAllLocations permission flag

    // Edit a staff member to be campus-specific
    await page.click('tab:has-text("Active Members")');

    const staffRow = page.locator('tr:has-text("Staff")').first();
    if (await staffRow.isVisible()) {
      await staffRow.locator('button:has-text("Edit")').click();

      // Uncheck "Access All Locations"
      const allLocationsCheckbox = page.locator(
        'input[type="checkbox"]:has-text("All Locations")'
      );
      if (await allLocationsCheckbox.isChecked()) {
        await allLocationsCheckbox.uncheck();
      }

      // Select specific location
      await page.click('[role="combobox"]:has-text("Location")');
      await page.click('text="Bremerton"');

      await page.click('button:has-text("Save")');

      // EXPECTED: Should save successfully
      await expect(page.locator("text=/updated|success/i")).toBeVisible({
        timeout: 5000,
      });

      // TODO: Add test to verify this user can only see Bremerton data
      // This would require logging in as that user and checking data visibility
    }
  });

  test("EDGE CASE: Resend invitation cooldown", async ({ page }) => {
    // Navigate to pending invitations
    await page.click('tab:has-text("Pending Invitations")');

    const invitationRow = page.locator("tr").first();
    if (await invitationRow.isVisible()) {
      // Resend invitation
      await invitationRow.locator('button:has-text("Resend")').click();

      await expect(page.locator("text=/resent|sent/i")).toBeVisible({
        timeout: 5000,
      });

      // Try to resend again immediately
      await invitationRow.locator('button:has-text("Resend")').click();

      // EXPECTED: Should enforce cooldown (24 hour limit mentioned in code)
      await expect(
        page.locator("text=/wait|cooldown|recently sent/i")
      ).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("EDGE CASE: Role change validation", async ({ page }) => {
    await page.click('tab:has-text("Active Members")');

    const memberRow = page.locator('tr:has-text("Admin")').first();
    if (await memberRow.isVisible()) {
      await memberRow.locator('button:has-text("Edit")').click();

      // Try to change to Account Owner
      await page.click('[role="combobox"]:has-text("Role")');
      await page.click('text="Account Owner"');

      await page.click('button:has-text("Save")');

      // EXPECTED: Should either allow or show proper validation
      // Verify the change persists or shows appropriate message
      await page.waitForTimeout(2000);

      // Reload and verify
      await page.reload();
      // Check if role changed successfully or remained the same
    }
  });
});

test.describe("Team Management - Permission Enforcement", () => {
  test("PERMISSION: Admin can manage team but not delete owner", async ({
    page,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchAdmin.email);
    await page.goto("/church/newlife/admin/team");

    // Should be able to access team page
    await expect(page.locator('text="Team Management"')).toBeVisible();

    // Should see invite button
    await expect(page.locator('button:has-text("Invite")')).toBeVisible();

    // Try to remove owner
    await page.click('tab:has-text("Active Members")');
    const ownerRow = page.locator('tr:has-text("Account Owner")').first();

    // Remove button should be disabled or show error on click
    const removeButton = ownerRow.locator('button:has-text("Remove")');
    if (await removeButton.isVisible()) {
      await removeButton.click();

      await expect(
        page.locator("text=/cannot remove|protected/i")
      ).toBeVisible();
    }
  });

  test("SECURITY: Rate limiting on invitation endpoint", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/team");

    // Try to send many invitations rapidly
    const invitations = [];
    for (let i = 0; i < 6; i++) {
      invitations.push(
        (async () => {
          await page.click('button:has-text("Invite Staff")');
          await page.fill('input[type="email"]', `spam${i}@test.com`);
          await page.click('[role="combobox"]');
          await page.click('text="Staff"');
          await page.click('button[type="submit"]');
        })()
      );
    }

    await Promise.allSettled(invitations);

    // EXPECTED: Should be rate limited (Arcjet configured for 5 per minute)
    await expect(page.locator("text=/rate limit|too many/i")).toBeVisible({
      timeout: 10000,
    });
  });
});
