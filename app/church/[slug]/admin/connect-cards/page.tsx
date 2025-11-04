/**
 * Connect Cards Management Page
 *
 * Centralized page for all connect card operations.
 * Provides tabs for Upload, Review Queue, and Analytics.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getOrganizationLocations } from "@/lib/data/locations";
import { getConnectCardsForReview } from "@/lib/data/connect-card-review";
import { prisma } from "@/lib/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import ConnectCardsClient from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConnectCardsPage({ params }: PageProps) {
  const { slug } = await params;
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

  // Fetch connect cards awaiting review
  const cardsForReview = await getConnectCardsForReview(organization.id);

  return (
    <PageContainer as="main">
      <ConnectCardsClient
        slug={slug}
        locations={locations}
        defaultLocationId={defaultLocationId}
        cardsForReview={cardsForReview}
        reviewQueueCount={cardsForReview.length}
      />
    </PageContainer>
  );
}
