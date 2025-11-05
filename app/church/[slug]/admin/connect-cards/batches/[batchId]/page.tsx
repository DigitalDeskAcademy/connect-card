/**
 * Batch Detail Page
 *
 * View and review all connect cards within a specific batch
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getBatchWithCards } from "@/lib/data/connect-card-batch";
import { notFound } from "next/navigation";
import { BatchDetailClient } from "./batch-detail-client";

interface PageProps {
  params: Promise<{
    slug: string;
    batchId: string;
  }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { slug, batchId } = await params;
  const { organization } = await requireDashboardAccess(slug);

  // Fetch batch with all cards
  const batch = await getBatchWithCards(batchId);

  // Verify batch exists and belongs to this organization
  if (!batch || batch.organizationId !== organization.id) {
    notFound();
  }

  return (
    <PageContainer as="main">
      <BatchDetailClient slug={slug} batch={batch} />
    </PageContainer>
  );
}
