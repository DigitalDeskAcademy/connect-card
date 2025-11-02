/**
 * Role Mapping Utility
 *
 * Maps between UI roles (what users see) and database roles (Prisma enums).
 *
 * Context:
 * - UI uses simplified roles: "owner", "admin", "member"
 * - Member.role (Better Auth) uses strings: "owner", "admin", "member"
 * - User.role (Prisma) uses enum: church_owner, church_admin, user
 *
 * This dual role system is the industry-standard pattern used by:
 * - Slack (User account + Workspace roles)
 * - GitHub (User account + Organization roles)
 * - Discord (User account + Server roles)
 *
 * See: /docs/technical/architecture-decisions.md (ADR-003)
 */

import { UserRole } from "@/lib/generated/prisma";

/**
 * UI Role Type (what users see in the team management interface)
 */
export type UIRole = "owner" | "admin" | "member";

/**
 * Map UI role to Prisma UserRole enum
 *
 * Used when creating/updating users to set their global platform role.
 *
 * @param uiRole - Simplified role from UI ("owner", "admin", "member")
 * @returns Prisma UserRole enum value
 *
 * @example
 * ```typescript
 * const userRole = mapUIRoleToUserRole("admin"); // Returns "church_admin"
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: { role: userRole }
 * });
 * ```
 */
export function mapUIRoleToUserRole(uiRole: UIRole): UserRole {
  switch (uiRole) {
    case "owner":
      return "church_owner";
    case "admin":
      return "church_admin";
    case "member":
      return "user";
    default:
      // TypeScript exhaustiveness check - should never reach here
      const _exhaustive: never = uiRole;
      throw new Error(`Invalid UI role: ${_exhaustive}`);
  }
}

/**
 * Map Prisma UserRole enum to UI role
 *
 * Used when displaying user roles in the UI.
 *
 * @param userRole - Prisma UserRole enum value
 * @returns Simplified UI role string
 *
 * @example
 * ```typescript
 * const user = await prisma.user.findUnique({ where: { id } });
 * const uiRole = mapUserRoleToUIRole(user.role); // "church_admin" → "admin"
 * ```
 */
export function mapUserRoleToUIRole(userRole: UserRole | null): UIRole {
  switch (userRole) {
    case "church_owner":
      return "owner";
    case "church_admin":
      return "admin";
    case "user":
      return "member";
    case "volunteer_leader":
      return "member"; // Treat volunteer leaders as regular staff members in UI
    case "platform_admin":
      throw new Error(
        "Platform admins should not be displayed in organization team management UI"
      );
    case null:
      return "member"; // Default fallback for users without a role
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = userRole;
      throw new Error(`Unknown UserRole: ${_exhaustive}`);
  }
}

/**
 * Validate that a UI role is allowed for invitation
 *
 * Church admins can only invite "admin" or "member" roles.
 * They cannot invite "owner" roles (would require platform admin).
 *
 * @param uiRole - Role to validate
 * @returns true if role is valid for invitation
 */
export function isValidInvitationRole(uiRole: string): uiRole is UIRole {
  return uiRole === "admin" || uiRole === "member";
}

/**
 * Get human-readable role label for UI display
 *
 * @param uiRole - UI role
 * @returns Display label
 *
 * @example
 * ```typescript
 * getRoleLabel("owner")  // "Account Owner"
 * getRoleLabel("admin")  // "Admin"
 * getRoleLabel("member") // "Staff"
 * ```
 */
export function getRoleLabel(uiRole: UIRole): string {
  switch (uiRole) {
    case "owner":
      return "Account Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Staff";
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = uiRole;
      throw new Error(`Unknown role: ${_exhaustive}`);
    }
  }
}
