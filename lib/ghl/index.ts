/**
 * GHL (GoHighLevel) Integration Module
 *
 * Provides SMS/Email automation via GoHighLevel for volunteer onboarding.
 *
 * @example Basic contact sync
 * ```ts
 * import { syncConnectCardToGHL } from "@/lib/ghl";
 *
 * const result = await syncConnectCardToGHL(organizationId, {
 *   name: "John Doe",
 *   email: "john@example.com",
 *   phone: "555-123-4567",
 * }, {
 *   sendWelcomeSMS: true,
 *   ministryName: "Kids Ministry",
 * });
 * ```
 *
 * @example Check GHL status
 * ```ts
 * import { getGHLStatus, isGHLConfigured } from "@/lib/ghl";
 *
 * if (isGHLConfigured()) {
 *   const status = await getGHLStatus(organizationId);
 *   console.log(`${status.syncedContacts} contacts synced`);
 * }
 * ```
 *
 * Required Environment Variables:
 * - GHL_PIT: Private Integration Token
 * - GHL_LOCATION_ID: GHL Location ID (sub-account)
 * - GHL_CALL_IN_DEV: Set to "true" to make actual API calls in development
 *
 * @module
 */

// Main service (high-level workflows)
export { syncConnectCardToGHL, getGHLStatus } from "./service";

// Contact operations
export {
  syncContactToGHL,
  upsertContact,
  createContact,
  getContact,
  searchContacts,
  addContactTags,
} from "./contacts";

// Message operations
export {
  sendSMS,
  sendGHLEmail,
  sendMessage,
  sendBulkSMS,
  smsTemplates,
} from "./messages";

// Client utilities
export {
  isGHLConfigured,
  testConnection,
  getDefaultCredentials,
  getCredentialsForOrg,
} from "./client";

// Types
export type {
  // Config
  GHLCredentials,
  GHLConfig,
  // Contacts
  GHLContact,
  CreateContactParams,
  UpsertContactParams,
  ContactResponse,
  GHLCustomField,
  // Messages
  MessageType,
  SendMessageParams,
  MessageResponse,
  Conversation,
  // Results
  GHLOperationStatus,
  GHLOperationResult,
  ContactSyncResult,
  SendSMSResult,
  // Logging
  GHLSyncLog,
  // API
  GHLApiError,
  GHLListResponse,
} from "./types";
