import "server-only";

import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { getLocationFilter } from "./location-filter";

/**
 * Volunteer Data Layer - Unified Model
 *
 * This module queries the unified ChurchMember model with isVolunteer: true
 * instead of the legacy Volunteer model with JOINs.
 *
 * Phase 3 of Member Unification (Dec 2025):
 * - Queries ChurchMember directly (no JOINs to Volunteer)
 * - Returns data shaped for backward compatibility with existing UI
 * - Uses unified fields (volunteerStatus, volunteerCategories, etc.)
 *
 * @see /docs/member-unification-implementation-plan.md
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Display-friendly volunteer status values (uppercase for UI consistency).
 * Database stores lowercase with underscores; this is the normalized format.
 *
 * Using string literal unions (industry standard) over enums for:
 * - Better type inference and tree-shaking
 * - Simpler imports and JSON compatibility
 * - More flexible type operations
 */
export type VolunteerStatusDisplay =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_BREAK"
  | "PENDING_APPROVAL";

/**
 * Display-friendly background check status values.
 */
export type BackgroundCheckStatusDisplay =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "CLEARED"
  | "FLAGGED"
  | "EXPIRED";

/**
 * Volunteer return type for backward compatibility with existing UI.
 *
 * The UI expects:
 * - volunteer.id (now ChurchMember.id)
 * - volunteer.status (now volunteerStatus)
 * - volunteer.churchMember.name (now directly on member)
 * - volunteer.categories[].category (now volunteerCategories string[])
 *
 * This type maintains the nested churchMember structure for compatibility
 * while querying the unified model.
 */
export interface VolunteerForList {
  id: string;
  status: VolunteerStatusDisplay;
  startDate: Date | null;
  backgroundCheckStatus: BackgroundCheckStatusDisplay;
  readyForExport: boolean;
  readyForExportDate: Date | null;
  locationId: string | null;
  // Nested churchMember for backward compatibility with UI
  churchMember: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  // Categories shaped as array of objects for backward compatibility
  categories: Array<{
    id: string;
    category: string;
  }>;
  // Skills from the new direct relation
  skills: Array<{
    id: string;
    skillName: string;
    proficiency: string | null;
    isVerified: boolean;
    expiryDate: Date | null;
  }>;
}

/**
 * Detailed volunteer return type (for single volunteer fetch)
 */
export interface VolunteerDetail extends VolunteerForList {
  endDate: Date | null;
  inactiveReason: string | null;
  notes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  backgroundCheckDate: Date | null;
  backgroundCheckExpiry: Date | null;
  documentsSentAt: Date | null;
  churchMember: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform volunteerCategories string array to {id, category} objects.
 *
 * The UI expects categories as objects with id and category fields.
 * Since we flattened to a string array, we generate synthetic IDs.
 * This maintains backward compatibility with existing table columns.
 */
function transformCategories(
  volunteerCategories: string[]
): Array<{ id: string; category: string }> {
  return volunteerCategories.map((category, index) => ({
    id: `cat-${index}`, // Synthetic ID for backward compatibility
    category,
  }));
}

/**
 * Normalize volunteer status from database format to display format.
 *
 * Database format: lowercase with underscores (Prisma default)
 * - "active", "inactive", "on_break", "pending_approval"
 *
 * Display format: uppercase with underscores (matches existing UI constants)
 * - "ACTIVE", "INACTIVE", "ON_BREAK", "PENDING_APPROVAL"
 *
 * Uses `as const satisfies` pattern for compile-time type validation.
 *
 * @param status - Raw status from database (nullable)
 * @returns Normalized status safe for UI display
 * @default "PENDING_APPROVAL" if status is null or unrecognized
 */
const VOLUNTEER_STATUS_MAPPING = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  on_break: "ON_BREAK",
  pending: "PENDING_APPROVAL",
  pending_approval: "PENDING_APPROVAL",
} as const satisfies Record<string, VolunteerStatusDisplay>;

function normalizeStatus(status: string | null): VolunteerStatusDisplay {
  if (!status) return "PENDING_APPROVAL";

  const normalized =
    VOLUNTEER_STATUS_MAPPING[
      status.toLowerCase() as keyof typeof VOLUNTEER_STATUS_MAPPING
    ];

  if (!normalized) {
    // Log unexpected values for monitoring (not PII)
    console.warn(
      `[volunteers] Unexpected status value from database: "${status}"`
    );
    return "PENDING_APPROVAL";
  }

  return normalized;
}

/**
 * Normalize background check status from database format to display format.
 *
 * @param status - Raw status from database (nullable)
 * @returns Normalized status safe for UI display
 * @default "NOT_STARTED" if status is null or unrecognized
 */
const BG_CHECK_STATUS_MAPPING = {
  not_started: "NOT_STARTED",
  in_progress: "IN_PROGRESS",
  pending_review: "PENDING_REVIEW",
  cleared: "CLEARED",
  flagged: "FLAGGED",
  expired: "EXPIRED",
} as const satisfies Record<string, BackgroundCheckStatusDisplay>;

function normalizeBackgroundCheckStatus(
  status: string | null
): BackgroundCheckStatusDisplay {
  if (!status) return "NOT_STARTED";

  const normalized =
    BG_CHECK_STATUS_MAPPING[
      status.toLowerCase() as keyof typeof BG_CHECK_STATUS_MAPPING
    ];

  if (!normalized) {
    console.warn(
      `[volunteers] Unexpected background check status from database: "${status}"`
    );
    return "NOT_STARTED";
  }

  return normalized;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get Volunteers for Organization (Unified Model)
 *
 * Fetches church members who are volunteers (isVolunteer: true).
 * No longer queries the Volunteer model - uses unified ChurchMember.
 *
 * Performance: Single query, no JOINs through Volunteer table.
 *
 * @param dataScope - User's data scope (includes organizationId and location permissions)
 * @param filters - Optional filters (status, search, location)
 * @returns Array of volunteers shaped for backward compatibility
 */
export async function getVolunteersForScope(
  dataScope: DataScope,
  filters?: {
    status?: string[];
    search?: string;
    locationId?: string;
  }
): Promise<VolunteerForList[]> {
  // Build where clause for ChurchMember with isVolunteer: true
  const where: Prisma.ChurchMemberWhereInput = {
    organizationId: dataScope.organizationId,
    isVolunteer: true, // Unified model filter
    ...getLocationFilter(dataScope),
    ...(filters?.locationId && { locationId: filters.locationId }),
    ...(filters?.search && {
      name: {
        contains: filters.search,
        mode: "insensitive" as const,
      },
    }),
  };

  // Filter by volunteer status if provided
  if (filters?.status && filters.status.length > 0) {
    // Map uppercase status values to lowercase for query
    const normalizedStatuses = filters.status.map(s => s.toLowerCase());
    where.volunteerStatus = { in: normalizedStatuses };
  }

  const members = await prisma.churchMember.findMany({
    where,
    include: {
      // Include skills via the new direct relation
      skills: {
        select: {
          id: true,
          skillName: true,
          proficiency: true,
          isVerified: true,
          expiryDate: true,
        },
        orderBy: {
          skillName: "asc",
        },
      },
    },
    orderBy: [
      { volunteerStatus: "asc" }, // ACTIVE volunteers first
      { name: "asc" },
    ],
    take: 200, // Limit for memory safety
  });

  // Transform to backward-compatible shape
  return members.map(member => ({
    id: member.id, // ChurchMember ID (replaces old Volunteer ID)
    status: normalizeStatus(member.volunteerStatus),
    startDate: member.volunteerStartDate,
    backgroundCheckStatus: normalizeBackgroundCheckStatus(
      member.backgroundCheckStatus
    ),
    readyForExport: member.readyForExport,
    readyForExportDate: member.readyForExportDate,
    locationId: member.locationId,
    // Nested churchMember for backward compatibility
    churchMember: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    },
    // Transform string array to object array
    categories: transformCategories(member.volunteerCategories),
    // Skills from direct relation
    skills: member.skills,
  }));
}

/**
 * Get Single Volunteer by ID (Unified Model)
 *
 * Fetches detailed volunteer information for a single church member.
 * The ID is now the ChurchMember ID (not the old Volunteer ID).
 *
 * @param dataScope - User's data scope
 * @param volunteerId - ChurchMember ID (was previously Volunteer ID)
 * @returns Volunteer with full details or null if not found
 */
export async function getVolunteerById(
  dataScope: DataScope,
  volunteerId: string
): Promise<VolunteerDetail | null> {
  const member = await prisma.churchMember.findFirst({
    where: {
      id: volunteerId,
      organizationId: dataScope.organizationId,
      isVolunteer: true,
      ...getLocationFilter(dataScope),
    },
    include: {
      skills: {
        orderBy: {
          skillName: "asc",
        },
      },
    },
  });

  if (!member) return null;

  return {
    id: member.id,
    status: normalizeStatus(member.volunteerStatus),
    startDate: member.volunteerStartDate,
    endDate: member.volunteerEndDate,
    inactiveReason: member.volunteerInactiveReason,
    notes: member.volunteerNotes,
    backgroundCheckStatus: normalizeBackgroundCheckStatus(
      member.backgroundCheckStatus
    ),
    backgroundCheckDate: member.backgroundCheckDate,
    backgroundCheckExpiry: member.backgroundCheckExpiry,
    readyForExport: member.readyForExport,
    readyForExportDate: member.readyForExportDate,
    documentsSentAt: member.volunteerExportedAt, // Map to old field name
    locationId: member.locationId,
    emergencyContactName: member.emergencyContactName,
    emergencyContactPhone: member.emergencyContactPhone,
    churchMember: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      address: member.address,
    },
    categories: transformCategories(member.volunteerCategories),
    skills: member.skills,
  };
}

/**
 * Get Volunteers Needing Background Checks (Unified Model)
 *
 * Returns volunteers with expired or missing background checks.
 * Now queries ChurchMember directly.
 *
 * @param organizationId - Organization ID
 * @returns Array of volunteers needing attention
 */
export async function getVolunteersNeedingBackgroundCheck(
  organizationId: string
): Promise<VolunteerForList[]> {
  const today = new Date();

  const members = await prisma.churchMember.findMany({
    where: {
      organizationId,
      isVolunteer: true,
      volunteerStatus: "active",
      OR: [
        {
          // No background check at all for volunteers in kids ministry
          backgroundCheckStatus: "not_started",
          volunteerCategories: {
            has: "KIDS_MINISTRY",
          },
        },
        {
          // Expired background check
          backgroundCheckStatus: "cleared",
          backgroundCheckExpiry: {
            lt: today,
          },
        },
      ],
    },
    include: {
      skills: {
        select: {
          id: true,
          skillName: true,
          proficiency: true,
          isVerified: true,
          expiryDate: true,
        },
      },
    },
    orderBy: {
      backgroundCheckExpiry: "asc",
    },
    take: 50,
  });

  return members.map(member => ({
    id: member.id,
    status: normalizeStatus(member.volunteerStatus),
    startDate: member.volunteerStartDate,
    backgroundCheckStatus: normalizeBackgroundCheckStatus(
      member.backgroundCheckStatus
    ),
    readyForExport: member.readyForExport,
    readyForExportDate: member.readyForExportDate,
    locationId: member.locationId,
    churchMember: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    },
    categories: transformCategories(member.volunteerCategories),
    skills: member.skills,
  }));
}

/**
 * Get Volunteer Statistics (Unified Model)
 *
 * Returns aggregate statistics for volunteer management dashboard.
 * Now counts ChurchMember records with isVolunteer: true.
 *
 * @param organizationId - Organization ID
 * @param locationId - Optional location filter
 * @returns Statistics object
 */
export async function getVolunteerStats(
  organizationId: string,
  locationId?: string
) {
  const where = {
    organizationId,
    isVolunteer: true,
    ...(locationId && { locationId }),
  };

  const [totalVolunteers, activeVolunteers, inactiveVolunteers, pendingReview] =
    await Promise.all([
      // Total volunteers
      prisma.churchMember.count({ where }),

      // Active volunteers
      prisma.churchMember.count({
        where: { ...where, volunteerStatus: "active" },
      }),

      // Inactive volunteers
      prisma.churchMember.count({
        where: { ...where, volunteerStatus: "inactive" },
      }),

      // Pending BG check review
      prisma.churchMember.count({
        where: {
          ...where,
          backgroundCheckStatus: "pending_review",
        },
      }),
    ]);

  return {
    totalVolunteers,
    activeVolunteers,
    inactiveVolunteers,
    pendingReview,
  };
}

// ============================================================================
// VOLUNTEER EXPORT FUNCTIONS
// ============================================================================

/**
 * Exportable volunteer type for ChMS export
 * Updated to use unified model fields including firstName/lastName
 */
export type ExportableVolunteer = {
  id: string;
  category: string;
  backgroundCheckStatus: BackgroundCheckStatusDisplay;
  readyForExport: boolean;
  readyForExportDate: Date | null;
  exportedAt: Date | null;
  documentsSentAt: Date | null;
  // Name fields (prefer firstName/lastName, fallback to name)
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
};

/**
 * Get Exportable Volunteers (Unified Model)
 *
 * Returns volunteers that are ready for export to ChMS.
 * Now queries ChurchMember directly with firstName/lastName support.
 *
 * @param organizationId - Organization ID
 * @param filters - Optional filters
 * @returns Array of exportable volunteers
 */
export async function getExportableVolunteers(
  organizationId: string,
  filters?: {
    locationId?: string;
    category?: string;
    onlyNew?: boolean;
  }
): Promise<ExportableVolunteer[]> {
  const members = await prisma.churchMember.findMany({
    where: {
      organizationId,
      isVolunteer: true,
      readyForExport: true,
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.onlyNew && { volunteerExportedAt: null }),
      ...(filters?.category && {
        volunteerCategories: { has: filters.category },
      }),
    },
    include: {
      location: {
        select: { name: true },
      },
    },
    orderBy: [{ readyForExportDate: "desc" }, { name: "asc" }],
    take: 500,
  });

  return members.map(member => ({
    id: member.id,
    category: member.volunteerCategories.join(", ") || "GENERAL",
    backgroundCheckStatus: normalizeBackgroundCheckStatus(
      member.backgroundCheckStatus
    ),
    readyForExport: member.readyForExport,
    readyForExportDate: member.readyForExportDate,
    exportedAt: member.volunteerExportedAt,
    documentsSentAt: member.documentsSentAt,
    // Name fields for ChMS export
    name: member.name,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    location: member.location,
  }));
}

/**
 * Get Exportable Volunteers Count (Unified Model)
 *
 * Returns count of volunteers ready for export.
 *
 * @param organizationId - Organization ID
 * @param onlyNew - Only count not-yet-exported volunteers
 * @returns Count of exportable volunteers
 */
export async function getExportableVolunteersCount(
  organizationId: string,
  onlyNew: boolean = true
): Promise<number> {
  return await prisma.churchMember.count({
    where: {
      organizationId,
      isVolunteer: true,
      readyForExport: true,
      ...(onlyNew && { volunteerExportedAt: null }),
    },
  });
}

/**
 * Mark Volunteers as Exported (Unified Model)
 *
 * Updates volunteerExportedAt timestamp for volunteers included in export.
 * Now updates ChurchMember directly.
 *
 * @param volunteerIds - Array of ChurchMember IDs to mark as exported
 * @returns Number of records updated
 */
export async function markVolunteersExported(
  volunteerIds: string[]
): Promise<number> {
  if (volunteerIds.length === 0) return 0;

  const result = await prisma.churchMember.updateMany({
    where: {
      id: { in: volunteerIds },
      isVolunteer: true, // Safety check
    },
    data: {
      volunteerExportedAt: new Date(),
    },
  });

  return result.count;
}
