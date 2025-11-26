/**
 * Rate Limiting Strategy
 *
 * Centralized rate limit configuration for all server actions and API routes.
 * Uses Arcjet fixedWindow rate limiting to prevent abuse and manage API costs.
 *
 * @see https://docs.arcjet.com/rate-limiting/quick-start
 */

/**
 * CRITICAL Tier (3 requests/minute)
 *
 * For expensive AI-powered operations that consume significant resources:
 * - Claude Vision API calls (costly per request)
 * - Image processing with AI extraction
 * - Bulk AI operations
 *
 * @example
 * ```typescript
 * import { RATE_LIMITS } from "@/lib/rate-limits";
 *
 * const aj = arcjet.withRule(
 *   fixedWindow({ mode: "LIVE", ...RATE_LIMITS.CRITICAL })
 * );
 * ```
 */
export const RATE_LIMIT_CRITICAL = {
  window: "1m",
  max: 3,
} as const;

/**
 * STANDARD Tier (5 requests/minute)
 *
 * For normal create/update/delete operations:
 * - Saving connect cards
 * - Creating prayer requests
 * - Updating team members
 * - Deleting volunteers
 *
 * @example
 * ```typescript
 * import { RATE_LIMITS } from "@/lib/rate-limits";
 *
 * const aj = arcjet.withRule(
 *   fixedWindow({ mode: "LIVE", ...RATE_LIMITS.STANDARD })
 * );
 * ```
 */
export const RATE_LIMIT_STANDARD = {
  window: "1m",
  max: 5,
} as const;

/**
 * BULK Tier (10 requests/minute)
 *
 * For read operations and bulk actions:
 * - Fetching lists of data
 * - Search operations
 * - Batch updates
 * - Bulk approvals
 *
 * @example
 * ```typescript
 * import { RATE_LIMITS } from "@/lib/rate-limits";
 *
 * const aj = arcjet.withRule(
 *   fixedWindow({ mode: "LIVE", ...RATE_LIMITS.BULK })
 * );
 * ```
 */
export const RATE_LIMIT_BULK = {
  window: "1m",
  max: 10,
} as const;

/**
 * Rate Limits Collection
 *
 * Export all rate limits as a named object for easy importing
 */
export const RATE_LIMITS = {
  CRITICAL: RATE_LIMIT_CRITICAL,
  STANDARD: RATE_LIMIT_STANDARD,
  BULK: RATE_LIMIT_BULK,
} as const;

/**
 * Rate Limit Usage Guidance
 *
 * WHEN TO USE EACH TIER:
 *
 * 1. CRITICAL (3/min) - Use for:
 *    - AI Vision API calls (connect card extraction)
 *    - Expensive third-party API calls
 *    - Operations that cost money per request
 *
 * 2. STANDARD (5/min) - Use for:
 *    - Create operations (new records)
 *    - Update operations (modify existing records)
 *    - Delete operations (remove records)
 *    - Authentication operations (login, signup)
 *
 * 3. BULK (10/min) - Use for:
 *    - Read operations (fetch lists)
 *    - Search queries
 *    - Bulk updates (approve all, batch actions)
 *    - Invite sending (team invitations)
 *
 * FINGERPRINTING BEST PRACTICES:
 *
 * Always include both userId AND organizationId in fingerprints:
 * ```typescript
 * fingerprint: `${session.user.id}_${organization.id}_action_name`
 * ```
 *
 * This ensures:
 * - Rate limits are per-user per-organization
 * - Multi-tenant isolation (one org can't exhaust another's quota)
 * - Better tracking and debugging of abuse
 *
 * EXAMPLE IMPLEMENTATIONS:
 *
 * See existing implementations in:
 * - /actions/connect-card/save-connect-card.ts (STANDARD tier)
 * - /app/api/connect-cards/extract/route.ts (CRITICAL tier)
 * - /actions/volunteers/volunteers.ts (BULK tier)
 */
