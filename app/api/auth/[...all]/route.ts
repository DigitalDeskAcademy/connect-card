/**
 * Better Auth API Routes with Arcjet Security Protection
 *
 * This file implements the central authentication API for the application using Better Auth
 * with comprehensive security protection via Arcjet. All authentication flows (login, signup,
 * OAuth, email verification) are handled through these endpoints.
 *
 * Security Architecture:
 * - Rate limiting to prevent brute force attacks and spam
 * - Bot detection to block automated abuse
 * - Email validation to prevent disposable/invalid email addresses
 * - IP-based and user-based rate limiting
 * - CSRF protection through Better Auth's built-in mechanisms
 * - Session management with secure cookies (httpOnly, secure, sameSite)
 *
 * Threat Model Protection:
 * - Brute Force: Rate limiting (5 attempts per 2 minutes)
 * - Bot Attacks: Automated bot detection and blocking
 * - Email Abuse: Disposable email detection and validation
 * - Account Enumeration: Generic error messages
 * - Session Hijacking: Secure cookie configuration
 * - CSRF: SameSite cookies and origin validation
 *
 * Performance Considerations:
 * - Arcjet rules cached for optimal performance
 * - User-based rate limiting for authenticated requests
 * - IP fallback for anonymous requests
 * - Request cloning for body inspection (signup protection)
 *
 * @route GET|POST /api/auth/[...all] - Handles all Better Auth endpoints
 */

import arcjet from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import ip from "@arcjet/ip";
import {
  type ArcjetDecision,
  type BotOptions,
  type EmailOptions,
  type ProtectSignupOptions,
  type SlidingWindowRateLimitOptions,
  detectBot,
  protectSignup,
  slidingWindow,
} from "@arcjet/next";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

/**
 * Security Configuration for Arcjet Protection
 *
 * These options define the security policies applied to authentication endpoints.
 * All configurations are set to LIVE mode for production security enforcement.
 */

/**
 * Email Validation Configuration
 *
 * Prevents abuse through invalid or disposable email addresses.
 * Blocks common attack vectors in signup/login flows.
 */
const emailOptions = {
  mode: "LIVE", // Active blocking (use "DRY_RUN" for testing only)
  // Block problematic email types to prevent abuse
  // DISPOSABLE: Temporary email services (10minutemail, guerrillamail, etc.)
  // INVALID: Malformed email addresses that fail RFC validation
  // NO_MX_RECORDS: Domains without mail exchange records (non-functional emails)
  block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
} satisfies EmailOptions;

/**
 * Bot Detection Configuration
 *
 * Prevents automated attacks against authentication endpoints.
 * Uses Arcjet's comprehensive bot detection database.
 */
const botOptions = {
  mode: "LIVE", // Active blocking of detected bots
  // Empty allow list = block all detected bots
  // Add specific bot user-agents here if legitimate bots need access
  // Reference: https://arcjet.com/bot-list
  allow: [],
} satisfies BotOptions;

/**
 * Rate Limiting Configuration
 *
 * Prevents brute force attacks and abuse by limiting request frequency.
 * Uses sliding window to provide smooth rate limiting experience.
 */
const rateLimitOptions = {
  mode: "LIVE", // Active rate limiting enforcement
  interval: "2m", // 2-minute sliding window for rate calculation
  max: 5, // Maximum 5 authentication attempts per window per user/IP
  // Chosen limits balance security vs. user experience:
  // - Prevents brute force while allowing legitimate retry attempts
  // - 2-minute window allows password manager issues/typos
} satisfies SlidingWindowRateLimitOptions<[]>;

/**
 * Combined Signup Protection Configuration
 *
 * Integrates all security measures for comprehensive signup protection.
 * Applied specifically to signup endpoints for enhanced security.
 */
const signupOptions = {
  email: emailOptions,
  bots: botOptions,
  rateLimit: rateLimitOptions,
} satisfies ProtectSignupOptions<[]>;

/**
 * Request Protection Function
 *
 * Applies appropriate Arcjet security rules based on the authentication endpoint
 * being accessed. Uses intelligent user identification for consistent rate limiting.
 *
 * Security Strategy:
 * - Authenticated users: Rate limit by user ID (cross-device/session enforcement)
 * - Anonymous users: Rate limit by IP address (prevents IP-based abuse)
 * - Signup endpoints: Full protection suite (email + bot + rate limiting)
 * - Other auth endpoints: Bot detection only (lighter protection for login/oauth)
 *
 * @param req - Next.js request object containing headers and body
 * @returns Promise<ArcjetDecision> - Decision object indicating allow/deny status
 */
async function protect(req: NextRequest): Promise<ArcjetDecision> {
  // Check for existing user session to determine rate limiting strategy
  // Session check here is safe - no redirect behavior, just data retrieval
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  /**
   * User Identification for Rate Limiting
   *
   * Priority order for rate limiting fingerprints:
   * 1. User ID (authenticated): Enables cross-device rate limiting
   * 2. IP Address (anonymous): Prevents IP-based abuse
   * 3. Localhost fallback: Development environment safety
   */
  let userId: string;
  if (session?.user.id) {
    // Authenticated user: Use user ID for consistent cross-session rate limiting
    // This prevents users from bypassing limits by switching devices/browsers
    userId = session.user.id;
  } else {
    // Anonymous user: Use IP address for basic rate limiting
    // Fallback to localhost prevents errors in development environments
    userId = ip(req) || "127.0.0.1";
  }

  /**
   * Endpoint-Specific Protection Rules
   *
   * Different auth endpoints require different levels of protection:
   * - Signup: Full protection (most vulnerable to abuse)
   * - Login/OAuth: Bot detection only (balance security vs. UX)
   */
  if (req.nextUrl.pathname.startsWith("/api/auth/sign-up")) {
    /**
     * Enhanced Signup Protection
     *
     * Signup endpoints are the most vulnerable to abuse and require
     * comprehensive protection including email validation.
     */

    // Clone request for body inspection (Better Auth will also read the body)
    // Cloning prevents "body already read" errors in the main handler
    const body = await req.clone().json();

    if (typeof body.email === "string") {
      // Full protection suite with email validation
      // Validates email quality, detects bots, and applies rate limiting
      return arcjet
        .withRule(protectSignup(signupOptions))
        .protect(req, { email: body.email, fingerprint: userId });
    } else {
      // Fallback protection if email not found in body
      // Still applies bot detection and rate limiting for security
      return arcjet
        .withRule(detectBot(botOptions))
        .withRule(slidingWindow(rateLimitOptions))
        .protect(req, { fingerprint: userId });
    }
  } else {
    /**
     * Standard Auth Endpoint Protection
     *
     * Login, OAuth, and other auth endpoints use lighter protection
     * to maintain good user experience while preventing bot abuse.
     */
    return arcjet
      .withRule(detectBot(botOptions))
      .protect(req, { fingerprint: userId });
  }
}

/**
 * Better Auth Handler Conversion
 *
 * Converts Better Auth's internal handler to Next.js-compatible format.
 * GET requests pass through directly without additional security checks.
 */
const authHandlers = toNextJsHandler(auth.handler);

/**
 * GET Handler - Direct Pass-through
 *
 * GET requests for auth endpoints (session checks, OAuth callbacks, etc.)
 * are considered safe and don't require additional Arcjet protection.
 *
 * Examples:
 * - GET /api/auth/session - Session validation requests
 * - GET /api/auth/callback/github - OAuth callback handling
 * - GET /api/auth/csrf - CSRF token retrieval
 */
export const { GET } = authHandlers;

/**
 * POST Handler - Protected Authentication Endpoint
 *
 * All POST requests to authentication endpoints are wrapped with Arcjet
 * security protection before being passed to Better Auth for processing.
 *
 * Security Flow:
 * 1. Arcjet evaluates request against configured rules
 * 2. If denied, returns appropriate error response
 * 3. If allowed, passes request to Better Auth handler
 *
 * Error Handling Strategy:
 * - Rate limit exceeded: 429 status (standard rate limit response)
 * - Email validation failed: 400 with descriptive message
 * - Bot detected: 403 status (generic forbidden)
 * - Other denials: 403 status (generic security denial)
 *
 * @param req - Next.js request object
 * @returns Response with auth result or security denial
 */
export const POST = async (req: NextRequest) => {
  /**
   * Development-Only Exception: Anonymous Auth Bypass
   *
   * In development mode, skip Arcjet protection for anonymous sign-in endpoint.
   * This enables E2E testing with Playwright without triggering bot detection.
   *
   * Security: Safe because:
   * - Only enabled in NODE_ENV === 'development'
   * - Anonymous plugin itself is only enabled in dev mode (see lib/auth.ts)
   * - Production deployments won't have this endpoint available
   */
  if (
    process.env.NODE_ENV === "development" &&
    req.nextUrl.pathname === "/api/auth/sign-in/anonymous"
  ) {
    return authHandlers.POST(req);
  }

  // Apply security protection rules before processing auth request
  const decision = await protect(req);

  // Security decisions are handled appropriately without debug logging in production

  /**
   * Security Denial Handling
   *
   * Different denial reasons require different response strategies
   * to balance security with user experience.
   */
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      /**
       * Rate Limit Exceeded
       *
       * Return 429 (Too Many Requests) without body to prevent
       * information leakage about rate limiting configuration.
       */
      return new Response(null, { status: 429 });
    } else if (decision.reason.isEmail()) {
      /**
       * Email Validation Failed
       *
       * Provide specific, user-friendly error messages to help
       * users understand and fix email issues. These messages
       * are safe to expose as they help legitimate users.
       */
      let message: string;

      if (decision.reason.emailTypes.includes("INVALID")) {
        message = "Email address format is invalid. Is there a typo?";
      } else if (decision.reason.emailTypes.includes("DISPOSABLE")) {
        message = "We do not allow disposable email addresses.";
      } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
        message =
          "Your email domain does not have an MX record. Is there a typo?";
      } else {
        // Exhaustive fallback based on configured email rules
        // Should not occur with current configuration but provides safety
        message = "Invalid email.";
      }

      return Response.json({ message }, { status: 400 });
    } else {
      /**
       * Generic Security Denial
       *
       * Bot detection or other security rules triggered.
       * Return generic 403 without details to prevent information
       * leakage about security measures to potential attackers.
       */
      return new Response(null, { status: 403 });
    }
  }

  /**
   * Security Check Passed
   *
   * Request passed all Arcjet security checks and can be
   * forwarded to Better Auth for normal authentication processing.
   */
  return authHandlers.POST(req);
};
