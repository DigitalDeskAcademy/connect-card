/**
 * Location Filter Utilities
 *
 * Helper functions to apply location-based filtering to database queries
 * based on user's DataScope permissions.
 *
 * Usage:
 * ```typescript
 * const { dataScope } = await requireDashboardAccess(slug);
 *
 * const cards = await prisma.connectCard.findMany({
 *   where: {
 *     organizationId: dataScope.organizationId,
 *     ...getLocationFilter(dataScope), // Apply location filter
 *   },
 * });
 * ```
 */

import type { DataScope } from "@/app/data/dashboard/data-scope-types";

/**
 * Get location filter for Prisma queries
 *
 * Returns a Prisma where clause that restricts data to the user's allowed location(s).
 *
 * @param dataScope - User's data scope from requireDashboardAccess
 * @returns Prisma where clause for location filtering
 *
 * @example
 * ```typescript
 * // Account Owner or Admin - no filter (sees all locations)
 * getLocationFilter(dataScope) // returns {}
 *
 * // Staff - filtered to their location
 * getLocationFilter(dataScope) // returns { locationId: "location-uuid" }
 * ```
 */
export function getLocationFilter(dataScope: DataScope): {
  locationId?: string;
} {
  // If user can see all locations, return empty filter (no restriction)
  if (dataScope.filters.canSeeAllLocations) {
    return {};
  }

  // Staff members are restricted to their assigned location
  if (dataScope.filters.locationId) {
    return { locationId: dataScope.filters.locationId };
  }

  // Fallback: no filter (should not reach here with proper data scope setup)
  return {};
}

/**
 * Check if user can access a specific location
 *
 * @param dataScope - User's data scope
 * @param locationId - Location ID to check access for
 * @returns true if user can access this location
 *
 * @example
 * ```typescript
 * if (!canAccessLocation(dataScope, card.locationId)) {
 *   return { status: "error", message: "Access denied" };
 * }
 * ```
 */
export function canAccessLocation(
  dataScope: DataScope,
  locationId: string | null
): boolean {
  // Users who can see all locations have access to everything
  if (dataScope.filters.canSeeAllLocations) {
    return true;
  }

  // Staff can only access their assigned location
  return dataScope.filters.locationId === locationId;
}

/**
 * Get location ID for creating new records
 *
 * When staff create records (upload connect cards), they should default to their location.
 * When admins/owners create records, they must specify which location.
 *
 * @param dataScope - User's data scope
 * @returns Location ID for new records, or null if user must specify
 *
 * @example
 * ```typescript
 * const defaultLocationId = getDefaultLocationForNewRecords(dataScope);
 * // Staff: returns their locationId
 * // Admin/Owner: returns null (must choose location)
 * ```
 */
export function getDefaultLocationForNewRecords(
  dataScope: DataScope
): string | null {
  // Staff have a default location (their assigned location)
  if (!dataScope.filters.canSeeAllLocations && dataScope.filters.locationId) {
    return dataScope.filters.locationId;
  }

  // Admins/Owners must explicitly choose a location
  return null;
}
