/**
 * Volunteer Dual-Write Module
 *
 * Phase 4 of Member Unification: Provides helper functions for writing
 * volunteer data to both the legacy Volunteer model AND the unified
 * ChurchMember model during the transition period.
 *
 * Strategy:
 * 1. Continue writing to Volunteer model (backward compatibility)
 * 2. Also write to ChurchMember model (forward compatibility)
 * 3. Set isVolunteer: true on ChurchMember
 *
 * This dual-write approach ensures:
 * - Existing queries using Volunteer model continue working
 * - New queries using ChurchMember.isVolunteer work immediately
 * - Data consistency between both models
 *
 * @see /docs/member-unification-implementation-plan.md
 */

import { prisma } from "@/lib/db";
import type {
  BackgroundCheckStatus,
  VolunteerStatus,
} from "@/lib/generated/prisma";

/**
 * Status mapping: Volunteer model (enum) → ChurchMember model (string)
 * The Volunteer model uses uppercase enums, ChurchMember uses lowercase strings
 */
const VOLUNTEER_STATUS_TO_STRING: Record<VolunteerStatus, string> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ON_BREAK: "on_break",
  PENDING_APPROVAL: "pending",
};

const BG_CHECK_STATUS_TO_STRING: Record<BackgroundCheckStatus, string> = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  PENDING_REVIEW: "pending_review",
  CLEARED: "cleared",
  FLAGGED: "flagged",
  EXPIRED: "expired",
};

/**
 * Volunteer status update payload for dual-write operations
 */
export interface VolunteerStatusUpdate {
  status?: VolunteerStatus;
  backgroundCheckStatus?: BackgroundCheckStatus;
  backgroundCheckDate?: Date | null;
  backgroundCheckExpiry?: Date | null;
  startDate?: Date;
  endDate?: Date | null;
  inactiveReason?: string | null;
  readyForExport?: boolean;
  readyForExportDate?: Date | null;
  documentsSentAt?: Date | null;
  notes?: string | null;
}

/**
 * Volunteer category update payload
 */
export interface VolunteerCategoryUpdate {
  categories: string[];
}

/**
 * Dual-write: Update volunteer status on both models
 *
 * Writes status changes to both Volunteer and ChurchMember models
 * to maintain data consistency during migration period.
 *
 * @param volunteerId - The Volunteer model ID
 * @param churchMemberId - The ChurchMember model ID
 * @param update - Status update payload
 * @param tx - Optional transaction client (for atomic operations)
 */
export async function dualWriteVolunteerStatus(
  volunteerId: string,
  churchMemberId: string,
  update: VolunteerStatusUpdate,
  tx?: typeof prisma
): Promise<void> {
  const client = tx ?? prisma;

  // Build ChurchMember update payload with string conversions
  const churchMemberUpdate: Record<string, unknown> = {};

  if (update.status !== undefined) {
    churchMemberUpdate.volunteerStatus =
      VOLUNTEER_STATUS_TO_STRING[update.status];
  }
  if (update.backgroundCheckStatus !== undefined) {
    churchMemberUpdate.backgroundCheckStatus =
      BG_CHECK_STATUS_TO_STRING[update.backgroundCheckStatus];
  }
  if (update.backgroundCheckDate !== undefined) {
    churchMemberUpdate.backgroundCheckDate = update.backgroundCheckDate;
  }
  if (update.backgroundCheckExpiry !== undefined) {
    churchMemberUpdate.backgroundCheckExpiry = update.backgroundCheckExpiry;
  }
  if (update.startDate !== undefined) {
    churchMemberUpdate.volunteerStartDate = update.startDate;
  }
  if (update.endDate !== undefined) {
    churchMemberUpdate.volunteerEndDate = update.endDate;
  }
  if (update.inactiveReason !== undefined) {
    churchMemberUpdate.volunteerInactiveReason = update.inactiveReason;
  }
  if (update.readyForExport !== undefined) {
    churchMemberUpdate.readyForExport = update.readyForExport;
  }
  if (update.readyForExportDate !== undefined) {
    churchMemberUpdate.readyForExportDate = update.readyForExportDate;
  }
  if (update.documentsSentAt !== undefined) {
    churchMemberUpdate.documentsSentAt = update.documentsSentAt;
  }
  if (update.notes !== undefined) {
    churchMemberUpdate.volunteerNotes = update.notes;
  }

  // Execute dual-write
  await Promise.all([
    // Update legacy Volunteer model
    client.volunteer.update({
      where: { id: volunteerId },
      data: update,
    }),
    // Update unified ChurchMember model
    client.churchMember.update({
      where: { id: churchMemberId },
      data: {
        isVolunteer: true, // Always ensure this is set
        ...churchMemberUpdate,
      },
    }),
  ]);
}

/**
 * Dual-write: Update volunteer categories on both models
 *
 * Writes category changes to both VolunteerCategory table (for Volunteer)
 * and volunteerCategories array (on ChurchMember).
 *
 * @param volunteerId - The Volunteer model ID
 * @param churchMemberId - The ChurchMember model ID
 * @param organizationId - Organization ID for VolunteerCategory entries
 * @param categories - Array of category strings
 * @param tx - Optional transaction client
 */
export async function dualWriteVolunteerCategories(
  volunteerId: string,
  churchMemberId: string,
  organizationId: string,
  categories: string[],
  tx?: typeof prisma
): Promise<void> {
  const client = tx ?? prisma;

  await Promise.all([
    // Delete existing and recreate VolunteerCategory entries
    (async () => {
      await client.volunteerCategory.deleteMany({
        where: { volunteerId },
      });
      if (categories.length > 0) {
        await client.volunteerCategory.createMany({
          data: categories.map(category => ({
            volunteerId,
            organizationId,
            category:
              category as import("@/lib/generated/prisma").VolunteerCategoryType,
          })),
        });
      }
    })(),
    // Update ChurchMember.volunteerCategories array directly
    client.churchMember.update({
      where: { id: churchMemberId },
      data: {
        volunteerCategories: categories,
      },
    }),
  ]);
}

/**
 * Dual-write: Set volunteer as ready for export on both models
 *
 * @param volunteerId - The Volunteer model ID
 * @param churchMemberId - The ChurchMember model ID
 * @param tx - Optional transaction client
 */
export async function dualWriteReadyForExport(
  volunteerId: string,
  churchMemberId: string,
  tx?: typeof prisma
): Promise<void> {
  const now = new Date();
  await dualWriteVolunteerStatus(
    volunteerId,
    churchMemberId,
    {
      readyForExport: true,
      readyForExportDate: now,
    },
    tx
  );
}

/**
 * Dual-write: Mark documents as sent on both models
 *
 * @param volunteerId - The Volunteer model ID
 * @param churchMemberId - The ChurchMember model ID
 * @param tx - Optional transaction client
 */
export async function dualWriteDocumentsSent(
  volunteerId: string,
  churchMemberId: string,
  tx?: typeof prisma
): Promise<void> {
  await dualWriteVolunteerStatus(
    volunteerId,
    churchMemberId,
    { documentsSentAt: new Date() },
    tx
  );
}

/**
 * Ensure ChurchMember has isVolunteer=true set
 *
 * Call this after any volunteer creation to ensure the unified model is updated.
 *
 * @param churchMemberId - The ChurchMember ID
 * @param tx - Optional transaction client
 */
export async function ensureIsVolunteerFlag(
  churchMemberId: string,
  tx?: typeof prisma
): Promise<void> {
  const client = tx ?? prisma;
  await client.churchMember.update({
    where: { id: churchMemberId },
    data: { isVolunteer: true },
  });
}

/**
 * Sync volunteer data from Volunteer model to ChurchMember model
 *
 * Useful for backfilling existing volunteer data to ChurchMember.
 * This is a one-way sync: Volunteer → ChurchMember
 *
 * @param volunteerId - The Volunteer model ID to sync from
 */
export async function syncVolunteerToChurchMember(
  volunteerId: string
): Promise<void> {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
    include: {
      categories: { select: { category: true } },
    },
  });

  if (!volunteer) {
    throw new Error(`Volunteer not found: ${volunteerId}`);
  }

  await prisma.churchMember.update({
    where: { id: volunteer.churchMemberId },
    data: {
      isVolunteer: true,
      volunteerStatus: VOLUNTEER_STATUS_TO_STRING[volunteer.status],
      volunteerCategories: volunteer.categories.map(c => c.category),
      volunteerStartDate: volunteer.startDate,
      volunteerEndDate: volunteer.endDate,
      volunteerInactiveReason: volunteer.inactiveReason,
      volunteerNotes: volunteer.notes,
      emergencyContactName: volunteer.emergencyContactName,
      emergencyContactPhone: volunteer.emergencyContactPhone,
      backgroundCheckStatus:
        BG_CHECK_STATUS_TO_STRING[volunteer.backgroundCheckStatus],
      backgroundCheckDate: volunteer.backgroundCheckDate,
      backgroundCheckExpiry: volunteer.backgroundCheckExpiry,
      bgCheckToken: volunteer.bgCheckToken,
      bgCheckConfirmedAt: volunteer.bgCheckConfirmedAt,
      readyForExport: volunteer.readyForExport,
      readyForExportDate: volunteer.readyForExportDate,
      volunteerExportedAt: volunteer.exportedAt,
      documentsSentAt: volunteer.documentsSentAt,
      automationStatus: volunteer.automationStatus,
      automationStartedAt: volunteer.automationStartedAt,
      automationResponseAt: volunteer.automationResponseAt,
    },
  });
}
