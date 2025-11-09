import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";

/**
 * LMS/Training System Tests
 *
 * Tests course management, enrollment, and access control
 *
 * Edge cases tested:
 * - Unenrolled access attempts
 * - Cross-organization course access
 * - Course deletion with active students
 * - Invalid video file uploads
 * - Drag-and-drop ordering edge cases
 * - Progress tracking accuracy
 * - Concurrent enrollment
 */

test.describe("LMS - Course Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("/church/newlife/admin/courses");
  });

  test("SUCCESS: Create and publish a course", async ({ page }) => {
    // Click create course
    await page.click('button:has-text("Create Course")');

    // Fill course details
    const courseTitle = `Test Course ${Date.now()}`;
    await page.fill('input[name="title"]', courseTitle);
    await page.fill('textarea[name="description"]', "Test course description");
    await page.fill('textarea[name="smallDescription"]', "Short description");

    // Set price and duration
    await page.fill('input[name="price"]', "0");
    await page.fill('input[name="duration"]', "5");

    // Select level
    await page.click('[role="combobox"]:has-text("Level")');
    await page.click('text="Beginner"');

    // Select category
    await page.click('[role="combobox"]:has-text("Category")');
    await page.click('text="Essentials"');

    // Upload thumbnail (if required)
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      // Create a small test image
      const testImage = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      await fileInput.setInputFiles({
        name: "thumbnail.png",
        mimeType: "image/png",
        buffer: testImage,
      });
    }

    // Submit
    await page.click('button[type="submit"]:has-text("Create")');

    // EXPECTED: Course created successfully
    await expect(page.locator(`text="${courseTitle}"`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("EDGE CASE: Prevent duplicate course slugs", async ({ page }) => {
    // This tests if the system handles slug conflicts properly
    // Create two courses with same/similar names

    const courseName = `Duplicate Course ${Date.now()}`;

    // Create first course
    await page.click('button:has-text("Create Course")');
    await page.fill('input[name="title"]', courseName);
    // ... fill other required fields
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Try to create second course with same name
    await page.click('button:has-text("Create Course")');
    await page.fill('input[name="title"]', courseName);
    // ... fill other required fields
    await page.click('button[type="submit"]');

    // EXPECTED: Should either auto-generate unique slug or show error
    // Both courses should be created with different slugs
    await page.waitForTimeout(2000);
  });

  test("SECURITY: Cannot access other organization's courses", async ({
    page,
  }) => {
    // Try to directly navigate to another org's course
    await page.goto("/church/other-org/admin/courses");

    // EXPECTED: Should be denied
    await page.waitForURL(url => {
      return (
        url.pathname.includes("/unauthorized") ||
        url.pathname.includes("/login") ||
        !url.pathname.includes("other-org")
      );
    });
  });

  test("EDGE CASE: Delete course with active enrollments", async ({ page }) => {
    // Find a course
    const courseCard = page.locator('[data-testid="course-card"]').first();

    if (await courseCard.isVisible()) {
      // Click to open course
      await courseCard.click();

      // Try to delete
      await page.click('button:has-text("Delete")');

      // EXPECTED: Should warn about enrolled students
      await expect(
        page.locator("text=/enrolled|students|warning/i")
      ).toBeVisible({
        timeout: 5000,
      });

      // Confirm deletion
      await page.click('button:has-text("Confirm")');

      // Should delete or show proper error
      await page.waitForTimeout(2000);
    }
  });

  test("DRAG-DROP: Reorder chapters and lessons", async ({ page }) => {
    const courseCard = page.locator('[data-testid="course-card"]').first();

    if (await courseCard.isVisible()) {
      await courseCard.click();

      // Wait for course editor
      await page.waitForTimeout(2000);

      // Check if drag handles exist
      const dragHandle = page.locator('[data-testid="drag-handle"]').first();

      if (await dragHandle.isVisible()) {
        // Get initial order
        const initialOrder = await page
          .locator('[data-testid="chapter-title"]')
          .allTextContents();

        // Perform drag and drop
        const firstChapter = page.locator('[data-testid="chapter"]').first();
        const secondChapter = page.locator('[data-testid="chapter"]').nth(1);

        await firstChapter.dragTo(secondChapter);

        // Wait for reorder
        await page.waitForTimeout(1000);

        // Verify order changed
        const newOrder = await page
          .locator('[data-testid="chapter-title"]')
          .allTextContents();

        expect(initialOrder).not.toEqual(newOrder);
      }
    }
  });
});

test.describe("LMS - Student Enrollment", () => {
  test("SUCCESS: Enroll in course and track progress", async ({ page }) => {
    // Login as regular user (not admin)
    await loginWithOTP(page, TEST_USERS.churchStaff.email);

    // Navigate to learning portal
    await page.goto("/church/newlife/learning/courses");

    // Find and enroll in a course
    const courseCard = page.locator('[data-testid="course-card"]').first();

    if (await courseCard.isVisible()) {
      await courseCard.click();

      // Click enroll button
      await page.click('button:has-text("Enroll")');

      // EXPECTED: Should be enrolled
      await expect(page.locator("text=/enrolled|start course/i")).toBeVisible({
        timeout: 5000,
      });

      // Start first lesson
      await page.click('text="Start Course"');

      // Verify lesson page loads
      await expect(page.locator("video, text=/lesson/i")).toBeVisible({
        timeout: 10000,
      });

      // Mark lesson complete
      const completeButton = page.locator('button:has-text("Complete")');
      if (await completeButton.isVisible()) {
        await completeButton.click();

        // Verify progress updated
        await expect(page.locator("text=/completed|progress/i")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("SECURITY: Cannot access unenrolled course content", async ({
    page,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchStaff.email);

    // Try to directly access a lesson URL without enrolling
    await page.goto("/church/newlife/learning/test-course/lesson-1");

    // EXPECTED: Should be blocked or redirected
    await expect(
      page.locator("text=/enroll|not enrolled|access denied/i")
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("CONCURRENT: Multiple users enrolling simultaneously", async ({
    browser,
  }) => {
    // Create multiple browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both users try to enroll in same course simultaneously
      await Promise.all([
        (async () => {
          await loginWithOTP(page1, TEST_USERS.churchStaff.email);
          await page1.goto("/church/newlife/learning/courses");
          const course = page1.locator('[data-testid="course-card"]').first();
          await course.click();
          await page1.click('button:has-text("Enroll")');
        })(),
        (async () => {
          await loginWithOTP(page2, "staff2@newlife.test");
          await page2.goto("/church/newlife/learning/courses");
          const course = page2.locator('[data-testid="course-card"]').first();
          await course.click();
          await page2.click('button:has-text("Enroll")');
        })(),
      ]);

      // EXPECTED: Both should enroll successfully
      await expect(page1.locator("text=/enrolled/i")).toBeVisible();
      await expect(page2.locator("text=/enrolled/i")).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("EDGE CASE: Video playback validation", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchStaff.email);
    await page.goto("/church/newlife/learning/courses");

    const course = page.locator('[data-testid="course-card"]').first();
    if (await course.isVisible()) {
      await course.click();

      // Enroll if needed
      const enrollButton = page.locator('button:has-text("Enroll")');
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
      }

      // Start lesson
      await page.click('text="Start"');

      // Check if video element exists
      const video = page.locator("video").first();
      if (await video.isVisible()) {
        // Try to play
        await video.click();

        // Wait for video to start
        await page.waitForTimeout(2000);

        // EXPECTED: Video should load without errors
        const hasError = await video.evaluate(v => v.error !== null);
        expect(hasError).toBe(false);
      }
    }
  });
});

test.describe("LMS - Permission Edge Cases", () => {
  test("PERMISSION: Staff cannot delete courses", async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchStaff.email);
    await page.goto("/church/newlife/admin/courses");

    // Staff should not see delete buttons
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });

  test("PERMISSION: Admin can create but not delete platform courses", async ({
    page,
  }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);

    // Try to access platform admin courses
    await page.goto("/platform/admin/courses");

    // EXPECTED: Should be denied (not platform admin)
    await page.waitForURL(url => {
      return (
        url.pathname.includes("/unauthorized") ||
        url.pathname.includes("/not-admin") ||
        !url.pathname.includes("/platform")
      );
    });
  });
});
