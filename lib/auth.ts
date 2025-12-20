import { betterAuth } from "better-auth";

import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins";

/**
 * BASE URL CONFIGURATION
 *
 * Priority order for determining base URL:
 * 1. VERCEL_URL - Automatically set by Vercel for all deployments (preview & production)
 * 2. Development fallback - localhost:3000 for local development
 * 3. BETTER_AUTH_URL - Explicit URL for production or custom domains
 *
 * Security benefits:
 * - CSRF protection works with correct domain
 * - Cookie domain settings align with actual site
 * - OAuth callbacks redirect to correct URLs
 * - Origin validation prevents cross-site attacks
 *
 * This approach is the industry standard used by Vercel, Supabase, Clerk, etc.
 */
function getBaseUrl(): string {
  // For Vercel PRODUCTION, use the known production URL
  // VERCEL_URL gives deployment-specific URLs which break OAuth callbacks
  if (process.env.VERCEL_ENV === "production") {
    return "https://connect-card-two.vercel.app";
  }

  // For Vercel PREVIEW deployments, use the dynamic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // For local development, use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // For production with custom domain, use explicit BETTER_AUTH_URL
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL;
  }

  // Should not reach here in normal operation
  throw new Error(
    "Unable to determine base URL for authentication. Please set BETTER_AUTH_URL or deploy to Vercel."
  );
}

/**
 * HARDCODED PRODUCTION OAUTH CREDENTIALS
 *
 * Always uses main production OAuth app credentials.
 */
function getOAuthCredentials(): { clientId: string; clientSecret: string } {
  // Development uses preview credentials if available
  if (process.env.NODE_ENV === "development") {
    return {
      clientId: env.AUTH_GITHUB_CLIENT_ID_PREVIEW || env.AUTH_GITHUB_CLIENT_ID,
      clientSecret:
        env.AUTH_GITHUB_CLIENT_SECRET_PREVIEW || env.AUTH_GITHUB_CLIENT_SECRET,
    };
  }

  // Everything else uses main production credentials
  return {
    clientId: env.AUTH_GITHUB_CLIENT_ID,
    clientSecret: env.AUTH_GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: getBaseUrl(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      // Dynamic OAuth credential selection based on environment
      clientId: getOAuthCredentials().clientId,
      clientSecret: getOAuthCredentials().clientSecret,
    },
  },

  // Trust all Vercel preview deployments dynamically
  // Include localhost for development and the dynamic Vercel URL for previews
  trustedOrigins: [
    "http://localhost:3000",
    // Production URL (Vercel alias)
    "https://connect-card-two.vercel.app",
    // Dynamic preview URLs
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    // Production URL from Vercel env (if set)
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
  ].filter(Boolean),

  // Development mode configuration
  advanced: {
    // In development, disable CSRF protection for easier testing
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },

  plugins: [
    // Anonymous auth for testing (dev only)
    ...(process.env.NODE_ENV === "development" ? [anonymous()] : []),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        /**
         * ╔═══════════════════════════════════════════════════════════════════╗
         * ║  🚨🚨🚨 SECURITY TODO: REMOVE BEFORE REAL PRODUCTION 🚨🚨🚨       ║
         * ║                                                                    ║
         * ║  OTP logging is enabled for ALL environments including production ║
         * ║  This is ONLY for demo purposes while using Resend test mode.     ║
         * ║                                                                    ║
         * ║  BEFORE LAUNCH WITH REAL USERS:                                   ║
         * ║  1. Verify custom domain in Resend                                ║
         * ║  2. Set RESEND_FROM_EMAIL to your domain                          ║
         * ║  3. Remove the isProduction condition below (revert to original)  ║
         * ║                                                                    ║
         * ╚═══════════════════════════════════════════════════════════════════╝
         */
        const isPreview = process.env.VERCEL_ENV === "preview";
        const isDevelopment = process.env.NODE_ENV === "development";
        const isProduction = process.env.VERCEL_ENV === "production";

        // 🚨 DEMO MODE: Log OTP in ALL environments (remove isProduction before real launch)
        const shouldLogOTP = isDevelopment || isPreview || isProduction;

        if (shouldLogOTP) {
          console.log(`[OTP] Attempting to send OTP for ${email}`);
          console.log(
            `[OTP] Environment - Preview: ${isPreview}, Dev: ${isDevelopment}, Prod: ${isProduction}`
          );
          console.log(`[OTP] VERCEL_ENV: ${process.env.VERCEL_ENV}`);
          console.log(`[OTP] NODE_ENV: ${process.env.NODE_ENV}`);
        }

        if (shouldLogOTP) {
          const envLabel = isProduction
            ? "🚨 PRODUCTION"
            : isPreview
              ? "PREVIEW"
              : "DEVELOPMENT";
          console.log("\n" + "=".repeat(60));
          console.log(`🔐 ${envLabel} OTP CODE: ${otp}`);
          console.log(`📧 For email: ${email}`);
          console.log(`⏰ Generated at: ${new Date().toLocaleTimeString()}`);
          console.log("=".repeat(60) + "\n");
        }

        // Send email with proper error handling
        try {
          const fromEmail =
            process.env.RESEND_FROM_EMAIL ||
            "Church Connect Card <onboarding@resend.dev>";

          const result = await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: "Church Connect Card - Verify your email",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Verify your email</h2>
                <p>Use the following code to verify your email address:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${otp}
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            `,
          });

          if (isDevelopment || isPreview) {
            console.log("📧 Email send attempt:", result);
          }
        } catch (error) {
          console.error("❌ Failed to send OTP email:", error);

          // If using resend.dev domain and getting validation error
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("You can only send testing emails")) {
            console.warn(
              "\n⚠️  RESEND LIMITATION: The 'resend.dev' domain can only send to your Resend account email."
            );
            console.warn(
              "   To send to other emails, add and verify your own domain in Resend dashboard."
            );
            console.warn(
              "   Then set RESEND_FROM_EMAIL='noreply@yourdomain.com' in your .env file.\n"
            );
          }

          // Don't throw in development since we log the OTP
          // 🚨 DEMO MODE: Also don't throw for .test/.example emails (they can't receive mail)
          const isTestEmail =
            email.endsWith(".test") || email.endsWith(".example");
          if (process.env.NODE_ENV === "production" && !isTestEmail) {
            throw error; // In production with real emails, email must work
          }
          if (isTestEmail) {
            console.log(
              `⚠️  Test email (${email}) - OTP logged above, email not sent`
            );
          }
        }
      },
    }),
    admin(),
    organization({
      // Allow agency owners to create organizations
      allowUserToCreateOrganization: async user => {
        // Check if user has the AGENCY_OWNER role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        return (
          dbUser?.role === "church_owner" || dbUser?.role === "platform_admin"
        );
      },
      // Automatically set active organization on session creation
      setActiveOrganizationOnSignUp: true,
    }),
  ],
});
