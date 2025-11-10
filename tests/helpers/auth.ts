import "dotenv/config";
import { Page } from "@playwright/test";
import { prisma } from "@/lib/db";

/**
 * Authentication Helper for E2E Tests
 *
 * Uses Email OTP flow with database-queried codes (dev mode only)
 */

export interface TestUser {
  email: string;
  organizationSlug: string;
  role: "platform_admin" | "church_owner" | "church_admin" | "user";
}

export const TEST_USERS = {
  platformAdmin: {
    email: "platform@test.com",
    organizationSlug: "platform",
    role: "platform_admin" as const,
  },
  churchOwner: {
    email: "test@playwright.dev",
    organizationSlug: "newlife",
    role: "church_owner" as const,
  },
  churchAdmin: {
    email: "admin@newlife.test",
    organizationSlug: "newlife",
    role: "church_admin" as const,
  },
  churchStaff: {
    email: "staff@newlife.test",
    organizationSlug: "newlife",
    role: "user" as const,
  },
} as const;

/**
 * Login via Email OTP (queries database for code in dev mode)
 */
export async function loginWithOTP(
  page: Page,
  email: string
): Promise<string | null> {
  // Navigate to login
  await page.goto("/login");

  // Enter email
  await page.fill('input[type="email"]', email);

  // Click "Continue with email" button
  await page.click('button:has-text("Continue with email")');

  // Wait for redirect to verify-request page
  await page.waitForURL(url => url.pathname.includes("/verify-request"), {
    timeout: 10000,
  });

  // Wait for the OTP to be generated and stored in database
  await page.waitForTimeout(3000);

  // Query database for the most recent OTP code for this email
  // Better Auth stores it with prefix: "sign-in-otp-{email}"
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `sign-in-otp-${email}`,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    throw new Error(`No OTP found in database for ${email}`);
  }

  // Extract OTP from value (format is "123456:0" where :0 is the attempt counter)
  const otpCode = verification.value.split(":")[0];
  console.log(`[Test] Retrieved OTP from database: ${otpCode} for ${email}`);

  // Enter OTP code in the 6-digit input
  // Shadcn InputOTP component uses a single input that accepts the full code
  await page.waitForSelector('input[inputmode="numeric"]', {
    state: "visible",
  });

  // Type the entire OTP code at once (the component handles splitting into slots)
  const otpInput = page.locator('input[inputmode="numeric"]').first();
  await otpInput.fill(otpCode);

  // Wait a moment for the form to recognize the input
  await page.waitForTimeout(500);

  // Click verify button
  await page.click('button:has-text("Verify Account")');

  // Wait for redirect after successful verification (goes to /auth/callback first)
  await page.waitForURL(url => !url.pathname.includes("/verify-request"), {
    timeout: 10000,
  });

  // Wait for the callback redirect to complete (goes to final destination)
  await page.waitForURL(url => !url.pathname.includes("/auth/callback"), {
    timeout: 10000,
  });

  return otpCode;
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  const userMenu = page.locator('[aria-label="User menu"]').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click('text="Sign out"');
    await page.waitForURL("/login");
  }
}

/**
 * Quick login helper with test user
 */
export async function loginAsTestUser(
  page: Page,
  user: (typeof TEST_USERS)[keyof typeof TEST_USERS]
): Promise<void> {
  await loginWithOTP(page, user.email);
}
