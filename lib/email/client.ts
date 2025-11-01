import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Resend Email Client
 *
 * Centralized email client for sending transactional emails.
 * Uses Resend API for reliable email delivery with webhooks support.
 *
 * Configuration:
 * - API Key: env.RESEND_API_KEY
 * - From Address: Should be verified domain in Resend dashboard
 *
 * Usage:
 * ```ts
 * import { resend } from "@/lib/email/client";
 * await resend.emails.send({
 *   from: "noreply@yourdomain.com",
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<p>Hello!</p>",
 * });
 * ```
 */
export const resend = new Resend(env.RESEND_API_KEY);

/**
 * Default sender email address
 * TODO: Update with your verified domain in Resend
 */
export const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";
