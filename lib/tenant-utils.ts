/**
 * Tenant validation utilities for multi-tenant routing
 * These are minimal helper functions that work alongside existing auth
 * WITHOUT modifying the core authentication logic
 *
 * Security: All functions validate input and reuse existing secure patterns
 */

import { headers } from "next/headers";

/**
 * Validate slug format for security
 * Only allows lowercase letters, numbers, and hyphens
 */
const VALID_SLUG_REGEX = /^[a-z0-9-]+$/;

export function isValidSlug(slug: string): boolean {
  return VALID_SLUG_REGEX.test(slug) && slug.length > 0 && slug.length <= 50;
}

/**
 * Extract organization slug from URL pathname
 * Used to identify which tenant is being accessed
 * Validates slug format for security
 */
export function extractOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/agency\/([^\/]+)/);
  const slug = match ? match[1] : null;

  // Validate extracted slug to prevent injection attacks
  if (slug && !isValidSlug(slug)) {
    console.warn(`Invalid slug format detected: ${slug}`);
    return null;
  }

  return slug;
}

/**
 * Extract organization slug from future platform admin routes
 * For when we implement platform-level org management
 */
export function extractOrgSlugFromPlatformPath(
  pathname: string
): string | null {
  const match = pathname.match(/^\/platform\/admin\/orgs\/([^\/]+)/);
  const slug = match ? match[1] : null;

  // Validate extracted slug
  if (slug && !isValidSlug(slug)) {
    console.warn(`Invalid slug format detected: ${slug}`);
    return null;
  }

  return slug;
}

/**
 * Get current organization context from URL
 * Simple helper for components to know which org context they're in
 * Reuses existing getOrganizationBySlug for consistency
 */
export async function getCurrentTenantContext() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const orgSlug = extractOrgSlugFromPath(pathname);

  if (!orgSlug) {
    return { slug: null, organization: null };
  }

  // Reuse existing secure function instead of duplicating logic
  const { getOrganizationBySlug } = await import(
    "@/app/data/organization/get-organization-by-slug"
  );
  const organization = await getOrganizationBySlug(orgSlug);

  return {
    slug: orgSlug,
    organization,
  };
}

/**
 * Check if we're in a platform admin context
 * Simple pathname check, no auth logic
 */
export function isPlatformAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/platform/admin") || pathname.startsWith("/admin")
  );
}

/**
 * Check if we're in an agency context
 * Simple pathname check, no auth logic
 */
export function isAgencyPath(pathname: string): boolean {
  return pathname.startsWith("/agency/");
}

/**
 * Check if we're in an agency admin context
 * Simple pathname check, no auth logic
 */
export function isAgencyAdminPath(pathname: string): boolean {
  return pathname.match(/^\/agency\/[^\/]+\/admin/) !== null;
}

/**
 * Check if we're in an agency learning context
 * Simple pathname check, no auth logic
 */
export function isAgencyLearningPath(pathname: string): boolean {
  return pathname.match(/^\/agency\/[^\/]+\/learning/) !== null;
}
