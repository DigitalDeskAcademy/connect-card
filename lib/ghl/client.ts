/**
 * GHL API Client
 *
 * Low-level HTTP client for GoHighLevel API v2.
 * Handles authentication, rate limiting, and error handling.
 *
 * Configuration:
 * - GHL_PIT: Private Integration Token (required)
 * - GHL_LOCATION_ID: Default location ID (required)
 *
 * Rate Limits:
 * - 100 requests per 10 seconds per token
 * - This client includes basic rate limit detection
 */

import type { GHLCredentials, GHLConfig, GHLApiError } from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: GHLConfig = {
  baseUrl: "https://services.leadconnectorhq.com",
  timeout: 30000,
  debug: process.env.NODE_ENV === "development",
};

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/** Force API calls in development (for testing) */
const forceCallsInDev = process.env.GHL_CALL_IN_DEV === "true";

/** Should we make actual API calls? */
const shouldCallApi = isProduction || (isDevelopment && forceCallsInDev);

// ============================================================================
// CREDENTIALS
// ============================================================================

/**
 * Get GHL credentials from environment
 * For demo: uses env vars. For production: will use per-org database lookup.
 */
export function getDefaultCredentials(): GHLCredentials | null {
  const pit = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!pit || !locationId) {
    return null;
  }

  return { pit, locationId };
}

/**
 * Get credentials for a specific organization
 * TODO: Implement database lookup for multi-tenant support
 */
export async function getCredentialsForOrg(
  organizationId: string
): Promise<GHLCredentials | null> {
  // For demo, just use default credentials
  // Phase 2: Look up from GHLCredentials table by organizationId
  void organizationId; // Will be used for multi-tenant lookup in Phase 2
  return getDefaultCredentials();
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
  credentials: GHLCredentials;
  config?: Partial<GHLConfig>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: GHLApiError;
  statusCode: number;
  dryRun: boolean;
}

/**
 * Make authenticated request to GHL API
 */
export async function ghlRequest<T>(
  options: RequestOptions
): Promise<ApiResponse<T>> {
  const { method, path, body, query, credentials, config = {} } = options;
  const { baseUrl, timeout, debug } = { ...DEFAULT_CONFIG, ...config };

  // Build URL with query params
  const url = new URL(path, baseUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Log in development
  if (debug) {
    console.log("\n" + "=".repeat(60));
    console.log(`🔗 GHL API ${method}` + (shouldCallApi ? "" : " [DRY RUN]"));
    console.log("=".repeat(60));
    console.log(`URL: ${url.toString()}`);
    console.log(`Location: ${credentials.locationId}`);
    if (body) {
      console.log(`Body: ${JSON.stringify(body, null, 2)}`);
    }
    console.log("=".repeat(60) + "\n");
  }

  // Dry run mode - return mock response
  if (!shouldCallApi) {
    return {
      success: true,
      data: {
        // Mock response for development
        id: `mock-${Date.now()}`,
        message: "Dry run - no API call made",
      } as T,
      statusCode: 200,
      dryRun: true,
    };
  }

  // Make actual API call
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${credentials.pit}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.json().catch(() => ({}));

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") || "10";
      return {
        success: false,
        error: {
          statusCode: 429,
          message: `Rate limited. Retry after ${retryAfter} seconds.`,
        },
        statusCode: 429,
        dryRun: false,
      };
    }

    // Handle errors
    if (!response.ok) {
      return {
        success: false,
        error: {
          statusCode: response.status,
          message:
            responseData.message || responseData.msg || "API request failed",
          error: responseData.error,
        },
        statusCode: response.status,
        dryRun: false,
      };
    }

    return {
      success: true,
      data: responseData as T,
      statusCode: response.status,
      dryRun: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes("abort");

    return {
      success: false,
      error: {
        statusCode: isTimeout ? 408 : 500,
        message: isTimeout ? "Request timeout" : message,
      },
      statusCode: isTimeout ? 408 : 500,
      dryRun: false,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if GHL is configured (credentials available)
 */
export function isGHLConfigured(): boolean {
  return getDefaultCredentials() !== null;
}

/**
 * Test GHL connection by fetching location info
 */
export async function testConnection(
  credentials: GHLCredentials
): Promise<{ success: boolean; locationName?: string; error?: string }> {
  const result = await ghlRequest<{ location?: { name: string } }>({
    method: "GET",
    path: `/locations/${credentials.locationId}`,
    credentials,
  });

  if (result.success && result.data?.location) {
    return {
      success: true,
      locationName: result.data.location.name,
    };
  }

  return {
    success: false,
    error: result.error?.message || "Failed to connect to GHL",
  };
}
