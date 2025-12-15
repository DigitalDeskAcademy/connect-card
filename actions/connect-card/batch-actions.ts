"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  updateBatchStatus,
  getBatchWithCards,
  getOrCreateActiveBatch,
} from "@/lib/data/connect-card-batch";
import { prisma } from "@/lib/db";
import { validateScanSession } from "@/lib/auth/scan-session";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10,
  })
);

/**
 * Get Active Batch
 *
 * Returns the current active batch for the logged-in user.
 * Used by the Active Batch widget on the upload page.
 *
 * Security:
 * - Requires dashboard access
 * - Multi-tenant isolation via organizationId
 * - Rate limiting via Arcjet
 */
export async function getActiveBatchAction(slug: string): Promise<
  ApiResponse<{
    id: string;
    name: string;
    locationId: string | null;
    cardCount: number;
  }>
> {
  // Authentication: supports Better Auth session or scan session cookie
  let userId: string;
  let organizationId: string;

  // Check for scan session first (phone QR code flow)
  const scanSession = await validateScanSession();

  if (scanSession && scanSession.slug === slug) {
    userId = scanSession.userId;
    organizationId = scanSession.organizationId;
  } else {
    // Standard dashboard access (logged-in user)
    const { session, organization } = await requireDashboardAccess(slug);
    userId = session.user.id;
    organizationId = organization.id;
  }

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${userId}_${organizationId}_get_active_batch`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    const batch = await getOrCreateActiveBatch(userId, organizationId);

    return {
      status: "success",
      message: "Active batch retrieved",
      data: batch,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to get active batch",
    };
  }
}

/**
 * Complete Batch
 *
 * Marks a batch as completed after all cards have been reviewed.
 *
 * Security:
 * - Requires dashboard access
 * - Validates batch belongs to organization
 * - Rate limiting via Arcjet
 */
export async function completeBatchAction(
  slug: string,
  batchId: string
): Promise<ApiResponse<void>> {
  const { session, organization } = await requireDashboardAccess(slug);

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_complete_batch`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    // Verify batch belongs to organization (multi-tenant security)
    const batch = await getBatchWithCards(batchId);

    if (!batch || batch.organizationId !== organization.id) {
      return {
        status: "error",
        message: "Batch not found or access denied",
      };
    }

    // Update status to COMPLETED
    await updateBatchStatus(batchId, "COMPLETED");

    return {
      status: "success",
      message: "Batch marked as complete",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to complete batch",
    };
  }
}

/**
 * Start New Batch
 *
 * Completes the current active batch and creates a new one.
 * Used by the "Finish & Start New Batch" button on upload page.
 *
 * Security:
 * - Requires dashboard access
 * - Multi-tenant isolation
 * - Rate limiting via Arcjet
 */
export async function startNewBatchAction(
  slug: string,
  currentBatchId: string
): Promise<
  ApiResponse<{
    id: string;
    name: string;
    locationId: string | null;
    cardCount: number;
  }>
> {
  const { session, organization } = await requireDashboardAccess(slug);

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_start_new_batch`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    // Verify current batch belongs to organization
    const currentBatch = await getBatchWithCards(currentBatchId);

    if (!currentBatch || currentBatch.organizationId !== organization.id) {
      return {
        status: "error",
        message: "Batch not found or access denied",
      };
    }

    // Complete current batch
    await updateBatchStatus(currentBatchId, "COMPLETED");

    // Create new batch (will auto-create with new name and date)
    const newBatch = await getOrCreateActiveBatch(
      session.user.id,
      organization.id
    );

    return {
      status: "success",
      message: "New batch created",
      data: newBatch,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to start new batch",
    };
  }
}

/**
 * Delete Batch
 *
 * Permanently deletes a batch and all associated cards.
 * Only allowed for batches with 0 cards or PENDING status.
 *
 * Security:
 * - Requires dashboard access
 * - Validates batch belongs to organization
 * - Rate limiting via Arcjet
 * - Prevents deletion of batches with reviewed cards
 */
export async function deleteBatchAction(
  slug: string,
  batchId: string
): Promise<ApiResponse<void>> {
  const { session, organization } = await requireDashboardAccess(slug);

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_batch`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    // Verify batch belongs to organization (multi-tenant security)
    const batch = await getBatchWithCards(batchId);

    if (!batch || batch.organizationId !== organization.id) {
      return {
        status: "error",
        message: "Batch not found or access denied",
      };
    }

    // Safety check: only allow deletion of empty batches or pending batches
    // This prevents accidental deletion of reviewed/completed work
    const cardCount = batch.cards?.length || 0;

    if (cardCount > 0 && batch.status === "COMPLETED") {
      return {
        status: "error",
        message:
          "Cannot delete completed batch with cards. Archive it instead.",
      };
    }

    // Delete cards first (no cascade delete in schema), then delete batch
    if (cardCount > 0) {
      await prisma.connectCard.deleteMany({
        where: { batchId },
      });
    }

    // Now delete the batch
    await prisma.connectCardBatch.delete({
      where: { id: batchId },
    });

    return {
      status: "success",
      message: "Batch deleted successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to delete batch",
    };
  }
}
