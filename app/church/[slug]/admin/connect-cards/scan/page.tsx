/**
 * Mobile Camera Wizard - Connect Card Scanning
 *
 * Full-screen camera experience for scanning connect cards on mobile devices.
 * Supports one-sided and two-sided cards with step-by-step guided capture.
 *
 * Flow:
 * 1. Select card type (1-sided or 2-sided)
 * 2. Capture front image with live viewfinder
 * 3. Preview and accept/retake
 * 4. (2-sided) Capture back image
 * 5. Process immediately with Claude Vision
 * 6. Continue with next card or finish batch
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getOrganizationLocations } from "@/lib/data/locations";
import { PageContainer } from "@/components/layout/page-container";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScanWizardClient } from "./scan-wizard-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ScanPage({ params }: PageProps) {
  const { slug } = await params;
  const { session, organization, member } = await requireDashboardAccess(slug);

  // Block staff users - only owners and admins can scan connect cards
  if (member && member.role === "member") {
    redirect("/unauthorized");
  }

  // Fetch locations for the wizard
  const locations = await getOrganizationLocations(organization.id);

  // Edge case: No locations - redirect to main connect cards page
  if (locations.length === 0) {
    redirect(`/church/${slug}/admin/connect-cards`);
  }

  // Get user's default location
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultLocationId: true },
  });

  // Validate default location is still active
  const validLocationIds = new Set(locations.map(loc => loc.id));
  const defaultLocationId =
    user?.defaultLocationId && validLocationIds.has(user.defaultLocationId)
      ? user.defaultLocationId
      : locations[0]?.id || null;

  return (
    <PageContainer as="main">
      <ScanWizardClient
        slug={slug}
        locations={locations}
        defaultLocationId={defaultLocationId}
      />
    </PageContainer>
  );
}
