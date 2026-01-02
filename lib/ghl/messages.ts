/**
 * GHL Messages Service
 *
 * SMS and Email sending functions via GoHighLevel.
 * Messages are sent through GHL's conversation system.
 */

import { ghlRequest, getCredentialsForOrg } from "./client";
import type {
  GHLCredentials,
  SendMessageParams,
  MessageResponse,
  SendSMSResult,
} from "./types";

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Send a message through GHL conversation system
 */
export async function sendMessage(
  params: SendMessageParams,
  credentials: GHLCredentials
): Promise<SendSMSResult> {
  const result = await ghlRequest<MessageResponse>({
    method: "POST",
    path: "/conversations/messages",
    body: {
      type: params.type,
      contactId: params.contactId,
      message: params.message,
      subject: params.subject,
      html: params.html,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      emailTo: params.emailTo,
      emailFrom: params.emailFrom,
      attachments: params.attachments,
    },
    credentials,
  });

  if (result.success) {
    return {
      success: true,
      status: "SUCCESS",
      messageId: result.data?.messageId,
      conversationId: result.data?.conversationId,
      dryRun: result.dryRun,
    };
  }

  // Handle dry run mock
  if (result.dryRun) {
    return {
      success: true,
      status: "SUCCESS",
      messageId: `mock-msg-${Date.now()}`,
      conversationId: `mock-conv-${Date.now()}`,
      dryRun: true,
    };
  }

  return {
    success: false,
    status: result.error?.statusCode === 429 ? "RATE_LIMITED" : "FAILED",
    error: result.error?.message || "Failed to send message",
    dryRun: result.dryRun,
  };
}

// ============================================================================
// HIGH-LEVEL SENDING FUNCTIONS
// ============================================================================

/**
 * Send SMS to a GHL contact
 *
 * @example
 * ```ts
 * const result = await sendSMS(organizationId, {
 *   contactId: "ghl-contact-123",
 *   message: "Welcome to Kids Ministry! Reply STOP to opt out."
 * });
 * ```
 */
export async function sendSMS(
  organizationId: string,
  params: {
    /** GHL contact ID (must sync contact first) */
    contactId: string;
    /** SMS message content */
    message: string;
    /** From phone number (optional - uses location default) */
    fromNumber?: string;
  }
): Promise<SendSMSResult> {
  const credentials = await getCredentialsForOrg(organizationId);

  if (!credentials) {
    return {
      success: false,
      status: "SKIPPED",
      error: "GHL not configured for this organization",
      dryRun: false,
    };
  }

  return sendMessage(
    {
      type: "SMS",
      contactId: params.contactId,
      message: params.message,
      fromNumber: params.fromNumber,
    },
    credentials
  );
}

/**
 * Send Email through GHL
 *
 * @example
 * ```ts
 * const result = await sendGHLEmail(organizationId, {
 *   contactId: "ghl-contact-123",
 *   subject: "Welcome to Kids Ministry!",
 *   html: "<p>Thank you for volunteering...</p>"
 * });
 * ```
 */
export async function sendGHLEmail(
  organizationId: string,
  params: {
    /** GHL contact ID */
    contactId: string;
    /** Email subject */
    subject: string;
    /** HTML content */
    html: string;
    /** From email address (optional - uses location default) */
    fromEmail?: string;
  }
): Promise<SendSMSResult> {
  const credentials = await getCredentialsForOrg(organizationId);

  if (!credentials) {
    return {
      success: false,
      status: "SKIPPED",
      error: "GHL not configured for this organization",
      dryRun: false,
    };
  }

  return sendMessage(
    {
      type: "Email",
      contactId: params.contactId,
      subject: params.subject,
      html: params.html,
      emailFrom: params.fromEmail,
    },
    credentials
  );
}

// ============================================================================
// SMS TEMPLATES
// ============================================================================

/**
 * Pre-built SMS templates for common volunteer onboarding scenarios
 */
export const smsTemplates = {
  /**
   * Welcome SMS sent when volunteer is first processed
   */
  volunteerWelcome: (params: {
    firstName: string;
    ministryName: string;
    churchName: string;
  }) => {
    return `Hi ${params.firstName}! Welcome to ${params.ministryName} at ${params.churchName}. We're excited to have you on the team! You'll receive an email shortly with next steps. Reply STOP to opt out.`;
  },

  /**
   * Background check reminder SMS
   */
  backgroundCheckReminder: (params: {
    firstName: string;
    bgCheckUrl: string;
  }) => {
    return `Hi ${params.firstName}, friendly reminder to complete your background check: ${params.bgCheckUrl} Questions? Reply to this message. Reply STOP to opt out.`;
  },

  /**
   * Volunteer event invitation
   * Note: Asks for YES/NO reply for SMS automation
   */
  eventInvitation: (params: {
    firstName: string;
    eventName: string;
    eventDate: string;
  }) => {
    return `Hi ${params.firstName}! Can you serve at ${params.eventName} on ${params.eventDate}? Reply YES or NO. Reply STOP to opt out.`;
  },

  /**
   * Urgent volunteer request
   */
  urgentRequest: (params: {
    ministryName: string;
    needDescription: string;
    contactInfo: string;
  }) => {
    return `[URGENT] ${params.ministryName} needs help: ${params.needDescription}. Contact ${params.contactInfo} if you can help. Reply STOP to opt out.`;
  },

  /**
   * Event confirmation SMS (sent when volunteer replies YES)
   */
  eventConfirmation: (params: {
    firstName: string;
    eventName: string;
    eventDate: string;
    leaderName?: string;
  }) => {
    const leaderText = params.leaderName
      ? ` Questions? Contact ${params.leaderName}.`
      : "";
    return `Thanks ${params.firstName}! You're confirmed for ${params.eventName} on ${params.eventDate}.${leaderText} Reply STOP to opt out.`;
  },

  /**
   * Event cancellation SMS (sent when event is cancelled)
   */
  eventCancellation: (params: {
    firstName: string;
    eventName: string;
    eventDate: string;
  }) => {
    return `Hi ${params.firstName}, ${params.eventName} on ${params.eventDate} has been cancelled. Sorry for any inconvenience. Reply STOP to opt out.`;
  },
};

// ============================================================================
// BULK MESSAGING (FUTURE)
// ============================================================================

/**
 * Send SMS to multiple contacts (batch)
 * TODO: Implement with queue for rate limiting
 */
export async function sendBulkSMS(
  organizationId: string,
  params: {
    contactIds: string[];
    message: string;
  }
): Promise<{
  queued: number;
  skipped: number;
  errors: string[];
}> {
  // Phase 3: Implement with BullMQ queue
  // For now, return placeholder indicating not implemented
  void organizationId;
  void params;

  return {
    queued: 0,
    skipped: 0,
    errors: ["Bulk SMS not yet implemented - Phase 3 feature"],
  };
}
