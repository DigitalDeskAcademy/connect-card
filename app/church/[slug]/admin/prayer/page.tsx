/**
 * Prayer Request Management
 *
 * Manage prayer requests and prayer ministry:
 * - Prayer request submission and tracking
 * - Prayer team assignments
 * - Follow-up and answered prayers
 * - Privacy settings and sensitive requests
 */

import { PageContainer } from "@/components/layout/page-container";
import { PrayerRequestsTable } from "@/components/dashboard/prayer-requests/prayer-requests-table";

interface PrayerPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrayerPage({ params }: PrayerPageProps) {
  const { slug } = await params;

  return (
    <PageContainer as="main" variant="padded">
      <PrayerRequestsTable slug={slug} />
    </PageContainer>
  );
}
