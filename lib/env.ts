import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().optional(),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    AUTH_GITHUB_CLIENT_SECRET: z.string().min(1),
    AUTH_GITHUB_CLIENT_ID_PREVIEW: z.string().min(1).optional(),
    AUTH_GITHUB_CLIENT_SECRET_PREVIEW: z.string().min(1).optional(),
    AUTH_GITHUB_CLIENT_ID_LIVE_PREVIEW: z.string().min(1).optional(),
    AUTH_GITHUB_CLIENT_SECRET_LIVE_PREVIEW: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    ARCJET_KEY: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string().min(1),
    AWS_ENDPOINT_URL_IAM: z.string().min(1),
    AWS_REGION: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    CLAUDE_VISION_MODEL: z.string().default("claude-opus-4-5-20251101"), // Model for connect card extraction
    S3_UPLOAD_ALLOWED_DOMAINS: z.string().optional(), // Comma-separated production domains
    PLATFORM_ADMIN_EMAIL: z.string().email().optional(), // Platform admin email for auto-promotion
    GHL_CLIENT_ID: z.string().min(1).optional(), // GoHighLevel OAuth - Phase 4 feature
    GHL_CLIENT_SECRET: z.string().min(1).optional(),
    GHL_REDIRECT_URI: z.string().url().optional(),
    // GHL Private Integration Token (PIT) - for demo/single-tenant
    GHL_PIT: z.string().min(1).optional(), // Private Integration Token
    GHL_LOCATION_ID: z.string().min(1).optional(), // GHL Location ID (sub-account)
    GHL_CALL_IN_DEV: z.string().optional(), // Set to "true" to make API calls in dev
    // Cron job authentication
    CRON_SECRET: z.string().min(1).optional(), // Secret for authenticating cron job requests
  },

  client: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES:
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Skip validation in CI - secrets aren't needed for build verification
  // Runtime validation still occurs when the app starts
  skipValidation: !!process.env.CI,
});
