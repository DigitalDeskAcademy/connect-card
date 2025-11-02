/**
 * DataScope Type Definitions and Type Guards
 *
 * These types define the data access scope for different user roles.
 * Separated from require-dashboard-access.ts to allow imports in both
 * server and client components.
 */

/**
 * Base scope shared by all types
 */
interface DataScopeBase {
  organizationId: string;
  filters: {
    canSeeAllOrganizations: boolean;
    canEditData: boolean;
    canDeleteData: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
    canSeeAllLocations: boolean; // Can see data from all locations in the org
    locationId: string | null; // Restricted to specific location (null = all locations)
  };
}

/**
 * Platform admin scope - can see all organizations
 */
export interface PlatformScope extends DataScopeBase {
  type: "platform";
}

/**
 * Agency scope - scoped to single organization (church)
 *
 * Location Access Model:
 * - Account Owner (church_owner): canSeeAllLocations = true, locationId = null (always)
 * - Multi-Campus Admin (church_admin + user.canSeeAllLocations): canSeeAllLocations = true, locationId = null
 * - Campus Admin (church_admin): canSeeAllLocations = false, locationId = user.defaultLocationId
 * - Staff (user): canSeeAllLocations = false, locationId = user.defaultLocationId
 *
 * The user.canSeeAllLocations flag allows churches to selectively grant multi-campus
 * access to specific admins (typically 1-2 people) while keeping most admins campus-specific.
 */
export interface AgencyScope extends DataScopeBase {
  type: "agency";
}

/**
 * Discriminated union of all scope types
 */
export type DataScope = PlatformScope | AgencyScope;

/**
 * Type guard for platform scope
 */
export function isPlatformScope(scope: DataScope): scope is PlatformScope {
  return scope.type === "platform";
}

/**
 * Type guard for agency scope
 */
export function isAgencyScope(scope: DataScope): scope is AgencyScope {
  return scope.type === "agency";
}
