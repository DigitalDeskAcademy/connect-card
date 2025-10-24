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
  };
}

/**
 * Platform admin scope - can see all organizations
 */
export interface PlatformScope extends DataScopeBase {
  type: "platform";
}

/**
 * Agency scope - scoped to single organization
 */
export interface AgencyScope extends DataScopeBase {
  type: "agency";
}

/**
 * Clinic scope - scoped to single organization and clinic
 */
export interface ClinicScope extends DataScopeBase {
  type: "clinic";
  clinicId: string;
}

/**
 * Discriminated union of all scope types
 */
export type DataScope = PlatformScope | AgencyScope | ClinicScope;

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

/**
 * Type guard for clinic scope
 */
export function isClinicScope(scope: DataScope): scope is ClinicScope {
  return scope.type === "clinic";
}
