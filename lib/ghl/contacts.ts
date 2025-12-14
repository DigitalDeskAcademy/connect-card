/**
 * GHL Contacts Service
 *
 * Contact management functions for GoHighLevel integration.
 * Handles contact creation, upsert, and sync operations.
 */

import { ghlRequest, getCredentialsForOrg } from "./client";
import type {
  GHLCredentials,
  GHLContact,
  CreateContactParams,
  UpsertContactParams,
  ContactResponse,
  ContactSyncResult,
  GHLListResponse,
} from "./types";

// ============================================================================
// CONTACT OPERATIONS
// ============================================================================

/**
 * Create a new contact in GHL
 */
export async function createContact(
  params: CreateContactParams,
  credentials: GHLCredentials
): Promise<ContactSyncResult> {
  const result = await ghlRequest<ContactResponse>({
    method: "POST",
    path: "/contacts/",
    body: {
      ...params,
      locationId: credentials.locationId,
    },
    credentials,
  });

  if (result.success && result.data?.contact) {
    return {
      success: true,
      status: "SUCCESS",
      ghlContactId: result.data.contact.id,
      isNew: true,
      dryRun: result.dryRun,
    };
  }

  return {
    success: false,
    status: result.error?.statusCode === 429 ? "RATE_LIMITED" : "FAILED",
    error: result.error?.message || "Failed to create contact",
    dryRun: result.dryRun,
  };
}

/**
 * Upsert (create or update) a contact in GHL
 * Uses email as the unique identifier for deduplication
 */
export async function upsertContact(
  params: UpsertContactParams,
  credentials: GHLCredentials
): Promise<ContactSyncResult> {
  const result = await ghlRequest<ContactResponse>({
    method: "POST",
    path: "/contacts/upsert",
    body: params as unknown as Record<string, unknown>,
    credentials,
  });

  if (result.success && result.data?.contact) {
    return {
      success: true,
      status: "SUCCESS",
      ghlContactId: result.data.contact.id,
      isNew: result.data.new === true,
      dryRun: result.dryRun,
    };
  }

  // Handle dry run mock
  if (result.dryRun) {
    return {
      success: true,
      status: "SUCCESS",
      ghlContactId: `mock-contact-${Date.now()}`,
      isNew: true,
      dryRun: true,
    };
  }

  return {
    success: false,
    status: result.error?.statusCode === 429 ? "RATE_LIMITED" : "FAILED",
    error: result.error?.message || "Failed to upsert contact",
    dryRun: result.dryRun,
  };
}

/**
 * Get a contact by ID
 */
export async function getContact(
  contactId: string,
  credentials: GHLCredentials
): Promise<GHLContact | null> {
  const result = await ghlRequest<{ contact: GHLContact }>({
    method: "GET",
    path: `/contacts/${contactId}`,
    credentials,
  });

  return result.data?.contact || null;
}

/**
 * Search contacts by email or phone
 */
export async function searchContacts(
  query: string,
  credentials: GHLCredentials,
  limit = 20
): Promise<GHLContact[]> {
  const result = await ghlRequest<GHLListResponse<GHLContact>>({
    method: "GET",
    path: "/contacts/",
    query: {
      locationId: credentials.locationId,
      query,
      limit,
    },
    credentials,
  });

  return result.data?.contacts || [];
}

/**
 * Add tags to a contact
 */
export async function addContactTags(
  contactId: string,
  tags: string[],
  credentials: GHLCredentials
): Promise<boolean> {
  const result = await ghlRequest<{ tags: string[] }>({
    method: "POST",
    path: `/contacts/${contactId}/tags`,
    body: { tags },
    credentials,
  });

  return result.success;
}

// ============================================================================
// HIGH-LEVEL SYNC FUNCTIONS
// ============================================================================

/**
 * Sync a church member to GHL
 *
 * This is the main entry point for syncing contacts from the app to GHL.
 * It handles the full flow: lookup org credentials, format data, upsert.
 */
export async function syncContactToGHL(
  organizationId: string,
  memberData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    tags?: string[];
    source?: string;
  }
): Promise<ContactSyncResult> {
  // Get credentials for this organization
  const credentials = await getCredentialsForOrg(organizationId);

  if (!credentials) {
    return {
      success: false,
      status: "SKIPPED",
      error: "GHL not configured for this organization",
      dryRun: false,
    };
  }

  // Parse name into first/last if only name provided
  let firstName = memberData.firstName;
  let lastName = memberData.lastName;
  if (!firstName && !lastName && memberData.name) {
    const nameParts = memberData.name.trim().split(/\s+/);
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(" ") || undefined;
  }

  // Build contact params
  const contactParams: UpsertContactParams = {
    locationId: credentials.locationId,
    firstName,
    lastName,
    email: memberData.email,
    phone: formatPhoneForGHL(memberData.phone),
    address1: memberData.address,
    city: memberData.city,
    state: memberData.state,
    postalCode: memberData.zipCode,
    tags: memberData.tags || [],
    source: memberData.source || "Church Connect Hub",
  };

  // Upsert to GHL
  return upsertContact(contactParams, credentials);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format phone number for GHL (E.164 format preferred)
 */
function formatPhoneForGHL(phone?: string): string | undefined {
  if (!phone) return undefined;

  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // If 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If already has + prefix, return as-is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Otherwise return the digits (GHL will handle validation)
  return digits;
}
