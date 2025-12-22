/**
 * Connect Cards Management Page
 *
 * Centralized page for all connect card operations.
 * Provides tabs for Upload, Review Queue, and Analytics.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getOrganizationLocations } from "@/lib/data/locations";
import { getBatchesForReview } from "@/lib/data/connect-card-batch";
import { prisma } from "@/lib/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import ConnectCardsClient from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ConnectCardsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  // Any team member can upload/scan connect cards - no role restriction
  const { session, organization } = await requireDashboardAccess(slug);

  // Fetch locations for upload functionality
  const locations = await getOrganizationLocations(organization.id);

  // Edge case: No locations configured
  if (locations.length === 0) {
    return (
      <PageContainer as="main">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Setup Required</AlertTitle>
          <AlertDescription>
            Before uploading connect cards, you need to create at least one
            location (campus). Connect cards must be assigned to a location for
            proper tracking and follow-up.
            <div className="mt-4">
              <Button asChild variant="default">
                <Link href={`/church/${slug}/admin/settings`}>
                  Go to Settings
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // Get user's default location for upload
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultLocationId: true },
  });

  // Validate user's default location is still active
  const validLocationIds = new Set(locations.map(loc => loc.id));
  const defaultLocationId =
    user?.defaultLocationId && validLocationIds.has(user.defaultLocationId)
      ? user.defaultLocationId
      : locations[0]?.id || null;

  // Fetch batches for review
  const allBatches = await getBatchesForReview(
    session.user.id,
    organization.id
  );

  // Filter to only show batches that need action:
  // - Not COMPLETED status
  // - Has cards remaining to review (_count.cards > 0)
  const batches = allBatches.filter(
    (batch: { status: string; _count: { cards: number } }) =>
      batch.status !== "COMPLETED" && batch._count.cards > 0
  );

  // Count is just the filtered list length
  const pendingBatchCount = batches.length;

  // Determine active tab (default to "upload")
  const activeTab =
    typeof tab === "string" && ["upload", "batches", "analytics"].includes(tab)
      ? tab
      : "upload";

  return (
    <PageContainer as="main" variant="tabs">
      <ConnectCardsClient
        slug={slug}
        defaultLocationId={defaultLocationId}
        batches={batches}
        pendingBatchCount={pendingBatchCount}
        activeTab={activeTab}
        locations={locations}
      />
    </PageContainer>
  );
}
