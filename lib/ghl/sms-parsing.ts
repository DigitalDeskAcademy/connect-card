/**
 * SMS Response Parsing Utilities
 *
 * Extracts testable logic from the webhook handler.
 * These pure functions can be unit tested without any external dependencies.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ParsedResponse = "YES" | "NO" | null;

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse volunteer response from SMS message
 *
 * Returns 'YES', 'NO', or null for unrecognized responses.
 *
 * Current implementation: Exact match only (case-insensitive)
 * Matches: YES, Y, NO, N
 *
 * @example
 * parseResponse("YES")     // → "YES"
 * parseResponse("y")       // → "YES"
 * parseResponse("no")      // → "NO"
 * parseResponse("maybe")   // → null
 * parseResponse("  yes  ") // → "YES" (trims whitespace)
 */
export function parseResponse(message: string): ParsedResponse {
  const normalized = message.trim().toUpperCase();

  // Exact YES matches
  if (normalized === "YES" || normalized === "Y") {
    return "YES";
  }

  // Exact NO matches
  if (normalized === "NO" || normalized === "N") {
    return "NO";
  }

  // Unrecognized - don't process
  return null;
}

/**
 * Extended response parsing with fuzzy matching
 *
 * This is the "future enhancement" mentioned in the spec.
 * More permissive matching for common variations.
 *
 * @example
 * parseResponseFuzzy("yeah")  // → "YES"
 * parseResponseFuzzy("yep")   // → "YES"
 * parseResponseFuzzy("nope")  // → "NO"
 * parseResponseFuzzy("can't") // → "NO"
 */
export function parseResponseFuzzy(message: string): ParsedResponse {
  const normalized = message.trim().toLowerCase();

  // YES patterns (order matters - check longer patterns first)
  const yesPatterns = [
    "yes",
    "yeah",
    "yep",
    "yup",
    "sure",
    "ok",
    "okay",
    "absolutely",
    "definitely",
    "of course",
    "i can",
    "count me in",
    "i'm in",
    "im in",
    "y",
  ];

  // NO patterns
  const noPatterns = [
    "no",
    "nope",
    "nah",
    "can't",
    "cant",
    "cannot",
    "sorry",
    "unable",
    "i can't",
    "i cant",
    "not available",
    "pass",
    "n",
  ];

  // Check YES patterns
  for (const pattern of yesPatterns) {
    if (normalized === pattern || normalized.startsWith(pattern + " ")) {
      return "YES";
    }
  }

  // Check NO patterns
  for (const pattern of noPatterns) {
    if (normalized === pattern || normalized.startsWith(pattern + " ")) {
      return "NO";
    }
  }

  return null;
}

/**
 * Extract the message text from various GHL payload formats
 *
 * GHL webhooks can send the message in different fields depending
 * on the webhook configuration and trigger type.
 */
export function extractMessageFromPayload(payload: {
  message?: string;
  body?: string;
  text?: string;
}): string {
  return payload.message || payload.body || payload.text || "";
}
