/**
 * Connect Card Upload Page
 *
 * Allows church staff to upload and process connect card images.
 * Supports multi-file drag-and-drop, mobile camera capture, and test mode.
 * Uses Claude Vision AI to extract structured data from handwritten cards.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getOrganizationLocations } from "@/lib/data/locations";
import { prisma } from "@/lib/db";
import { ConnectCardUploadClient } from "./upload-client";
import { PageContainer } from "@/components/layout/page-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface ConnectCardUploadPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConnectCardUploadPage({
  params,
}: ConnectCardUploadPageProps) {
  const { slug } = await params;
  const { session, organization } = await requireDashboardAccess(slug);

  // Fetch locations for dropdown
  const locations = await getOrganizationLocations(organization.id);

  // Edge case: No locations configured
  if (locations.length === 0) {
    return (
      <PageContainer>
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

  // Get user's default location
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

  return (
    <ConnectCardUploadClient
      locations={locations}
      defaultLocationId={defaultLocationId}
    />
  );
}
