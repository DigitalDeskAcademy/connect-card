import { betterAuth } from "better-auth";

import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";

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
  // For Vercel deployments (preview & production), use automatic VERCEL_URL
  // This is secure because VERCEL_URL is provided by Vercel's infrastructure, not user input
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
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
  ].filter(Boolean),

  // Development mode configuration
  advanced: {
    // In development, disable CSRF protection for easier testing
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // In development mode OR Vercel preview, log OTP to console for easy testing
        const isPreview = process.env.VERCEL_ENV === "preview";
        const isDevelopment = process.env.NODE_ENV === "development";

        // Always log in preview/dev that we're attempting to send OTP
        if (isDevelopment || isPreview) {
          console.log(`[OTP] Attempting to send OTP for ${email}`);
          console.log(
            `[OTP] Environment - Preview: ${isPreview}, Dev: ${isDevelopment}`
          );
          console.log(`[OTP] VERCEL_ENV: ${process.env.VERCEL_ENV}`);
          console.log(`[OTP] NODE_ENV: ${process.env.NODE_ENV}`);
        }

        if (isDevelopment || isPreview) {
          const envLabel = isPreview ? "PREVIEW" : "DEVELOPMENT";
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
            "Sidecar Platform <onboarding@resend.dev>";

          const result = await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: "Sidecar Platform - Verify your email",
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
          if (process.env.NODE_ENV === "production") {
            throw error; // In production, email must work
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
