/**
 * Email Service - Industry Standard Email Abstraction
 *
 * Provides environment-aware email delivery with audit logging.
 *
 * Behavior by environment:
 * - development: Logs to console + database, doesn't send (unless RESEND_SEND_IN_DEV=true)
 * - test: Logs to database only, doesn't send
 * - production: Sends via Resend + logs to database
 *
 * Features:
 * - Audit trail for all email attempts (EmailLog table)
 * - Consistent error handling
 * - Easy to swap providers (Resend, SendGrid, etc.)
 * - Retry-friendly (logged emails can be resent)
 */

import { resend, DEFAULT_FROM_EMAIL } from "./client";
import { prisma } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

export type EmailStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  /** Organization ID for multi-tenant audit trail */
  organizationId?: string;
  /** Optional metadata for logging (e.g., volunteerId, templateName) */
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  status: EmailStatus;
  emailLogId?: string;
  error?: string;
  /** True if email was logged but not actually sent (dev mode) */
  dryRun: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/** Force sending in development (for testing with Resend sandbox) */
const forceSendInDev = process.env.RESEND_SEND_IN_DEV === "true";

/** Should we actually send emails? Never in test, optionally in dev, always in prod */
const shouldSend = isProduction || (isDevelopment && forceSendInDev);

// ============================================================================
// EMAIL SERVICE
// ============================================================================

/**
 * Send an email with automatic logging and environment handling
 *
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: "volunteer@example.com",
 *   subject: "Welcome to Kids Ministry!",
 *   html: getVolunteerDocumentsEmail({...}),
 *   text: getVolunteerDocumentsText({...}),
 *   organizationId: org.id,
 *   metadata: { volunteerId: "123", template: "volunteer-documents" }
 * });
 *
 * if (result.success) {
 *   console.log("Email sent/logged:", result.emailLogId);
 * }
 * ```
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const {
    to,
    subject,
    html,
    text,
    from = DEFAULT_FROM_EMAIL,
    replyTo,
    organizationId,
    metadata = {},
  } = params;

  let status: EmailStatus = "PENDING";
  let error: string | undefined;
  let resendId: string | undefined;

  // Log email attempt to console in development
  if (isDevelopment) {
    console.log("\n" + "=".repeat(60));
    console.log("📧 EMAIL SERVICE" + (shouldSend ? "" : " [DRY RUN]"));
    console.log("=".repeat(60));
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    if (replyTo) console.log(`ReplyTo: ${replyTo}`);
    if (Object.keys(metadata).length > 0) {
      console.log(`Meta:    ${JSON.stringify(metadata)}`);
    }
    console.log("-".repeat(60));
    // Show truncated preview of email content
    const preview = text || html.replace(/<[^>]*>/g, "").substring(0, 200);
    console.log(`Preview: ${preview}...`);
    console.log("=".repeat(60) + "\n");
  }

  // Actually send email if we should
  if (shouldSend) {
    try {
      const response = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
        replyTo,
      });

      if (response.error) {
        status = "FAILED";
        error = response.error.message;
      } else {
        status = "SENT";
        resendId = response.data?.id;
      }
    } catch (err) {
      status = "FAILED";
      error = err instanceof Error ? err.message : "Unknown error";
    }
  } else {
    // Dry run - mark as skipped (not failed)
    status = "SKIPPED";
  }

  // Log to database for audit trail
  let emailLogId: string | undefined;
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        organizationId,
        to,
        from,
        subject,
        status,
        resendId,
        error,
        metadata,
        sentAt: status === "SENT" ? new Date() : null,
      },
    });
    emailLogId = emailLog.id;
  } catch (dbError) {
    // Don't fail the whole operation if logging fails
    console.error("Failed to log email to database:", dbError);
  }

  return {
    success: status === "SENT" || status === "SKIPPED",
    status,
    emailLogId,
    error,
    dryRun: !shouldSend,
  };
}

/**
 * Resend a previously logged email
 *
 * Useful for retrying failed emails or testing in production.
 */
export async function resendEmail(
  emailLogId: string
): Promise<SendEmailResult> {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
  });

  if (!emailLog) {
    return {
      success: false,
      status: "FAILED",
      error: "Email log not found",
      dryRun: false,
    };
  }

  // Fetch the original email content from a template recreation
  // For now, we'd need to store HTML in the log or recreate from metadata
  // This is a placeholder for future enhancement
  return {
    success: false,
    status: "FAILED",
    error: "Resend not yet implemented - email content not stored",
    dryRun: false,
  };
}

/**
 * Get email delivery statistics for an organization
 */
export async function getEmailStats(organizationId: string) {
  const [total, sent, failed, skipped] = await Promise.all([
    prisma.emailLog.count({ where: { organizationId } }),
    prisma.emailLog.count({ where: { organizationId, status: "SENT" } }),
    prisma.emailLog.count({ where: { organizationId, status: "FAILED" } }),
    prisma.emailLog.count({ where: { organizationId, status: "SKIPPED" } }),
  ]);

  return { total, sent, failed, skipped };
}
