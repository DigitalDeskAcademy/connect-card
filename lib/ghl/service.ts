/**
 * GHL Integration Service
 *
 * High-level orchestration for GoHighLevel integration.
 * Provides the main entry points for connect card → GHL workflows.
 *
 * Main Use Cases:
 * 1. Sync contact when staff clicks "Save & Next" in review queue
 * 2. Send welcome SMS when "Send onboarding materials" is checked
 * 3. Track sync status and errors for debugging
 */

import { prisma } from "@/lib/db";
import { syncContactToGHL } from "./contacts";
import { sendSMS, smsTemplates } from "./messages";
import { isGHLConfigured } from "./client";
import type { ContactSyncResult, SendSMSResult } from "./types";

// ============================================================================
// MAIN WORKFLOWS
// ============================================================================

/**
 * Sync connect card contact to GHL and optionally send welcome SMS
 *
 * This is the main function called from the review queue "Save & Next" action.
 *
 * @param organizationId - Organization ID for multi-tenant lookup
 * @param contactData - Extracted contact information from connect card
 * @param options - Additional options for the sync
 * @returns Sync result with GHL contact ID if successful
 *
 * @example
 * ```ts
 * // In updateConnectCard server action:
 * if (data.extractedData) {
 *   await syncConnectCardToGHL(organization.id, {
 *     name: data.extractedData.fullName,
 *     email: data.extractedData.email,
 *     phone: data.extractedData.phone,
 *     // ...
 *   }, {
 *     sendWelcomeSMS: data.sendBackgroundCheckInfo,
 *     ministryName: volunteer?.category,
 *     churchMemberId: createdMember?.id,
 *   });
 * }
 * ```
 */
export async function syncConnectCardToGHL(
  organizationId: string,
  contactData: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  },
  options: {
    /** Send welcome SMS after sync */
    sendWelcomeSMS?: boolean;
    /** Ministry name for SMS template */
    ministryName?: string;
    /** Church name for SMS template */
    churchName?: string;
    /** Church member ID to update with GHL contact ID */
    churchMemberId?: string;
    /** Source tag for tracking */
    source?: string;
    /** Additional tags to add */
    tags?: string[];
  } = {}
): Promise<{
  contactSync: ContactSyncResult;
  smsResult?: SendSMSResult;
}> {
  // Check if GHL is configured
  if (!isGHLConfigured()) {
    return {
      contactSync: {
        success: false,
        status: "SKIPPED",
        error: "GHL not configured",
        dryRun: false,
      },
    };
  }

  // Build tags
  const tags: string[] = options.tags || [];
  if (options.source) tags.push(options.source);
  tags.push("connect-card");
  if (options.ministryName)
    tags.push(options.ministryName.toLowerCase().replace(/\s+/g, "-"));

  // 1. Sync contact to GHL
  const contactSync = await syncContactToGHL(organizationId, {
    ...contactData,
    tags,
    source: options.source || "Connect Card",
  });

  // Log the sync attempt
  await logGHLOperation({
    organizationId,
    churchMemberId: options.churchMemberId,
    operation: "CONTACT_SYNC",
    status: contactSync.status,
    ghlContactId: contactSync.ghlContactId,
    error: contactSync.error,
  });

  // If sync failed, don't try to send SMS
  if (!contactSync.success || !contactSync.ghlContactId) {
    return { contactSync };
  }

  // 2. Update church member with GHL contact ID (if provided)
  if (options.churchMemberId && contactSync.ghlContactId) {
    await updateMemberIntegration(
      options.churchMemberId,
      contactSync.ghlContactId
    );
  }

  // 3. Send welcome SMS if requested
  let smsResult: SendSMSResult | undefined;
  if (options.sendWelcomeSMS && contactData.phone && contactSync.ghlContactId) {
    const firstName =
      contactData.firstName || contactData.name?.split(" ")[0] || "there";
    const ministryName = options.ministryName || "our volunteer team";
    const churchName =
      options.churchName || (await getChurchName(organizationId));

    const message = smsTemplates.volunteerWelcome({
      firstName,
      ministryName,
      churchName,
    });

    smsResult = await sendSMS(organizationId, {
      contactId: contactSync.ghlContactId,
      message,
    });

    // Log the SMS attempt
    await logGHLOperation({
      organizationId,
      churchMemberId: options.churchMemberId,
      operation: "SEND_SMS",
      status: smsResult.status,
      ghlContactId: contactSync.ghlContactId,
      ghlMessageId: smsResult.messageId,
      error: smsResult.error,
    });
  }

  return { contactSync, smsResult };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update church member with GHL integration data
 */
async function updateMemberIntegration(
  churchMemberId: string,
  ghlContactId: string
): Promise<void> {
  try {
    // Find existing integration for this member + provider
    const existing = await prisma.memberIntegration.findFirst({
      where: {
        churchMemberId,
        provider: "ghl",
      },
    });

    if (existing) {
      // Update existing integration
      await prisma.memberIntegration.update({
        where: { id: existing.id },
        data: {
          externalId: ghlContactId,
          lastSyncAt: new Date(),
          syncStatus: "active",
        },
      });
    } else {
      // Create new integration
      await prisma.memberIntegration.create({
        data: {
          churchMemberId,
          provider: "ghl",
          externalId: ghlContactId,
          lastSyncAt: new Date(),
          syncStatus: "active",
        },
      });
    }
  } catch (error) {
    // Don't fail the whole operation if this fails
    console.error("Failed to update member integration:", error);
  }
}

/**
 * Log GHL operation for audit trail
 */
async function logGHLOperation(params: {
  organizationId: string;
  churchMemberId?: string;
  operation: "CONTACT_SYNC" | "SEND_SMS" | "SEND_EMAIL";
  status: string;
  ghlContactId?: string;
  ghlMessageId?: string;
  error?: string;
}): Promise<void> {
  try {
    // TODO: Create GHLSyncLog table in schema
    // For now, just log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("\n📋 GHL Operation Log:", {
        ...params,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Don't fail if logging fails
    console.error("Failed to log GHL operation:", error);
  }
}

/**
 * Get church name for SMS templates
 */
async function getChurchName(organizationId: string): Promise<string> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    return org?.name || "our church";
  } catch {
    return "our church";
  }
}

// ============================================================================
// STATUS & DIAGNOSTICS
// ============================================================================

/**
 * Get GHL integration status for an organization
 */
export async function getGHLStatus(organizationId: string): Promise<{
  configured: boolean;
  hasCredentials: boolean;
  syncedContacts?: number;
  lastSync?: Date;
}> {
  const isConfigured = isGHLConfigured();

  if (!isConfigured) {
    return {
      configured: false,
      hasCredentials: false,
    };
  }

  // Count synced members
  const syncedCount = await prisma.memberIntegration.count({
    where: {
      provider: "ghl",
      churchMember: {
        organizationId,
      },
    },
  });

  // Get last sync
  const lastIntegration = await prisma.memberIntegration.findFirst({
    where: {
      provider: "ghl",
      churchMember: {
        organizationId,
      },
    },
    orderBy: {
      lastSyncAt: "desc",
    },
    select: {
      lastSyncAt: true,
    },
  });

  return {
    configured: true,
    hasCredentials: true,
    syncedContacts: syncedCount,
    lastSync: lastIntegration?.lastSyncAt || undefined,
  };
}
