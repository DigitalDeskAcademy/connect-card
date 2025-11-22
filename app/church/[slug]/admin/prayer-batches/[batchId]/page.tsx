/**
 * Prayer Batch Detail Page
 *
 * View and assign prayers within a specific batch to prayer team members.
 * Supports bulk assignment workflow with checkbox selection.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getPrayerBatchWithRequests } from "@/lib/data/prayer-batches";
import { notFound } from "next/navigation";
import { PrayerBatchDetailClient } from "./prayer-batch-detail-client";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{
    slug: string;
    batchId: string;
  }>;
}

export default async function PrayerBatchDetailPage({ params }: PageProps) {
  const { slug, batchId } = await params;
  const { organization } = await requireDashboardAccess(slug);

  // Fetch batch with all prayer requests
  const batch = await getPrayerBatchWithRequests(batchId);

  // Verify batch exists and belongs to this organization
  if (!batch || batch.organizationId !== organization.id) {
    notFound();
  }

  // Fetch team members for assignment dropdown
  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <PageContainer as="main">
      <PrayerBatchDetailClient
        slug={slug}
        batch={batch}
        teamMembers={teamMembers}
      />
    </PageContainer>
  );
}
