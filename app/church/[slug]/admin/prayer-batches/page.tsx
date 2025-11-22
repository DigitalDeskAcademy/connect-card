/**
 * Prayer Batches Management Page
 *
 * Lists daily prayer batches for assignment to prayer team members.
 * Batches are auto-created daily when connect cards with prayer requests are submitted.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getPrayerBatches } from "@/lib/data/prayer-batches";
import { PrayerBatchesClient } from "./prayer-batches-client";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrayerBatchesPage({ params }: PageProps) {
  const { slug } = await params;
  const { organization, member } = await requireDashboardAccess(slug);

  // Block staff users from accessing prayer batches
  // Only owners and admins can manage prayer assignments
  if (member && member.role === "member") {
    redirect("/unauthorized");
  }

  // Fetch all prayer batches for the organization
  const batches = await getPrayerBatches(organization.id);

  return (
    <PageContainer as="main">
      <PrayerBatchesClient batches={batches} slug={slug} />
    </PageContainer>
  );
}
