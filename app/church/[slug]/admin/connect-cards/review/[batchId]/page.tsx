/**
 * Batch Review Page
 *
 * Server component that fetches connect cards for a specific batch
 * and renders the review queue interface for manual correction.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getConnectCardsForBatchReview } from "@/lib/data/connect-card-review";
import { getBatchWithCards } from "@/lib/data/connect-card-batch";
import { ReviewQueueClient } from "../review-queue-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string; batchId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { batchId } = await params;
  const batch = await getBatchWithCards(batchId);

  return {
    title: batch?.name ? `Review: ${batch.name}` : "Review Connect Cards",
  };
}

export default async function BatchReviewPage({ params }: PageProps) {
  const { slug, batchId } = await params;
  const { organization } = await requireDashboardAccess(slug);

  // Fetch batch details for validation and display
  const batch = await getBatchWithCards(batchId);

  // Validate batch exists and belongs to organization
  if (!batch || batch.organizationId !== organization.id) {
    notFound();
  }

  // Fetch cards needing review in this batch
  const cards = await getConnectCardsForBatchReview(batchId, organization.id);

  // Fetch volunteer leaders (users with volunteer categories assigned)
  const volunteerLeaders = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
      volunteerCategories: {
        isEmpty: false, // Only users with at least one category
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      volunteerCategories: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Empty state - all cards reviewed
  if (cards.length === 0) {
    return (
      <PageContainer as="main">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/church/${slug}/admin/connect-cards?tab=batches`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>All Cards Reviewed</AlertTitle>
          <AlertDescription>
            All connect cards in batch &quot;{batch.name}&quot; have been
            reviewed. No cards awaiting review.
            <div className="mt-4">
              <Button asChild variant="default">
                <Link href={`/church/${slug}/admin/connect-cards?tab=batches`}>
                  Back
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // Render review queue interface
  return (
    <PageContainer variant="padded" as="main">
      <ReviewQueueClient
        cards={cards}
        slug={slug}
        batchName={batch.name}
        volunteerLeaders={volunteerLeaders}
      />
    </PageContainer>
  );
}
