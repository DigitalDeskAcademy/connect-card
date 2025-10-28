import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getConnectCardsForReview } from "@/lib/data/connect-card-review";
import { ReviewQueueClient } from "./review-queue-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConnectCardReviewPage({ params }: PageProps) {
  const { slug } = await params;

  // Verify user has dashboard access
  const { organization } = await requireDashboardAccess(slug);

  // Fetch connect cards awaiting review
  const cards = await getConnectCardsForReview(organization.id);

  return <ReviewQueueClient cards={cards} slug={slug} />;
}
