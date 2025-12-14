/**
 * GHL (GoHighLevel) Service Types
 *
 * Type definitions for GHL API integration.
 * Based on GHL API v2 documentation.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface GHLCredentials {
  /** Private Integration Token (PIT) for API authentication */
  pit: string;
  /** GHL Location ID (sub-account) */
  locationId: string;
}

export interface GHLConfig {
  /** Base URL for GHL API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether to enable debug logging */
  debug: boolean;
}

// ============================================================================
// CONTACTS
// ============================================================================

export interface GHLContact {
  id: string;
  locationId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
  tags?: string[];
  customFields?: GHLCustomField[];
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
}

export interface GHLCustomField {
  id?: string;
  key?: string;
  field_value: string | string[] | Record<string, unknown>;
}

export interface CreateContactParams {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags?: string[];
  source?: string;
  customFields?: GHLCustomField[];
}

export interface UpsertContactParams extends CreateContactParams {
  /** Location ID - required for upsert */
  locationId: string;
}

export interface ContactResponse {
  contact?: GHLContact;
  new?: boolean;
  traceId?: string;
}

// ============================================================================
// CONVERSATIONS & MESSAGES
// ============================================================================

export type MessageType =
  | "SMS"
  | "Email"
  | "WhatsApp"
  | "IG"
  | "FB"
  | "Custom"
  | "Live_Chat";

export interface SendMessageParams {
  /** Contact ID to send message to */
  contactId: string;
  /** Message type */
  type: MessageType;
  /** Message content (for SMS/WhatsApp) */
  message?: string;
  /** Subject (for Email) */
  subject?: string;
  /** HTML content (for Email) */
  html?: string;
  /** From phone number (for SMS - uses location default if not provided) */
  fromNumber?: string;
  /** To phone number (for SMS - uses contact's phone if not provided) */
  toNumber?: string;
  /** Email to send to (uses contact's email if not provided) */
  emailTo?: string;
  /** From email address */
  emailFrom?: string;
  /** Attachments URLs */
  attachments?: string[];
}

export interface MessageResponse {
  conversationId?: string;
  messageId?: string;
  msg?: string;
  message?: string;
  dateAdded?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageDate?: string;
  lastMessageType?: MessageType;
  unreadCount?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface GHLApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface GHLListResponse<T> {
  contacts?: T[];
  conversations?: T[];
  meta?: {
    total: number;
    currentPage: number;
    nextPage?: number;
    prevPage?: number;
  };
}

// ============================================================================
// SERVICE RESULTS
// ============================================================================

export type GHLOperationStatus =
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED"
  | "RATE_LIMITED";

export interface GHLOperationResult<T = unknown> {
  success: boolean;
  status: GHLOperationStatus;
  data?: T;
  error?: string;
  /** Whether this was a dry run (dev mode without actual API call) */
  dryRun: boolean;
  /** Request trace ID for debugging */
  traceId?: string;
}

export interface ContactSyncResult {
  success: boolean;
  status: GHLOperationStatus;
  /** GHL contact ID (new or existing) */
  ghlContactId?: string;
  /** Whether a new contact was created (vs updated) */
  isNew?: boolean;
  error?: string;
  dryRun: boolean;
}

export interface SendSMSResult {
  success: boolean;
  status: GHLOperationStatus;
  messageId?: string;
  conversationId?: string;
  error?: string;
  dryRun: boolean;
}

// ============================================================================
// LOGGING
// ============================================================================

export interface GHLSyncLog {
  id: string;
  organizationId: string;
  churchMemberId?: string;
  operation: "CONTACT_SYNC" | "SEND_SMS" | "SEND_EMAIL";
  status: GHLOperationStatus;
  ghlContactId?: string;
  ghlMessageId?: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}
