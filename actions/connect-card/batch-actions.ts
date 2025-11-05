"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  updateBatchStatus,
  getBatchWithCards,
  getOrCreateActiveBatch,
} from "@/lib/data/connect-card-batch";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
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
  const { session, organization } = await requireDashboardAccess(slug);

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_get_active_batch`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    const batch = await getOrCreateActiveBatch(
      session.user.id,
      organization.id
    );

    return {
      status: "success",
      message: "Active batch retrieved",
      data: batch,
    };
  } catch (error) {
    console.error("Failed to get active batch:", error);
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
    console.error("Failed to complete batch:", error);
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
    console.error("Failed to start new batch:", error);
    return {
      status: "error",
      message: "Failed to start new batch",
    };
  }
}
