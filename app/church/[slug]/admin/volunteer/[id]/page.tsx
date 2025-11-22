import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getVolunteerById } from "@/lib/data/volunteers";
import { VolunteerDetailClient } from "@/components/dashboard/volunteers/volunteer-detail-client";
import { PageContainer } from "@/components/layout/page-container";
import { notFound } from "next/navigation";

/**
 * Volunteer Detail Page
 *
 * Displays comprehensive volunteer profile with tabbed interface:
 * - Overview: Profile info, background check status, emergency contacts
 * - Skills & Certifications: Skills list with verification status
 * - Availability & Schedule: Recurring schedules, blackout dates
 * - Shift History: Past and upcoming shifts with reliability metrics
 * - Notes: Internal notes and observations
 *
 * Uses server component to fetch volunteer data with multi-tenant isolation.
 * Location-based filtering applied via dataScope.
 */

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function VolunteerDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const { dataScope } = await requireDashboardAccess(slug);

  // Fetch volunteer with skills, availability, shifts
  const volunteer = await getVolunteerById(dataScope, id);

  if (!volunteer) {
    notFound();
  }

  return (
    <PageContainer
      variant="tabs"
      as="main"
      backButton={{
        href: `/church/${slug}/admin/volunteer`,
        label: "Back",
      }}
    >
      <VolunteerDetailClient volunteer={volunteer} slug={slug} />
    </PageContainer>
  );
}
