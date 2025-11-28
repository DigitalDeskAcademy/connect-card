/**
 * Volunteer Onboarding Settings Page
 *
 * Configuration page for managing volunteer onboarding workflows:
 * - Document library (PDFs, policies, forms to send to volunteers)
 * - Ministry requirements (which ministries need background checks, training)
 * - Background check provider settings
 *
 * Access: Requires admin permissions (canManageUsers)
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getOnboardingSettings } from "@/actions/volunteers/onboarding";
import { VolunteerOnboardingClient } from "@/components/dashboard/settings/volunteer-onboarding/volunteer-onboarding-client";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VolunteerOnboardingSettingsPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // Only admins can access onboarding settings
  if (!dataScope.filters.canManageUsers) {
    redirect(`/church/${slug}/admin`);
  }

  // Fetch current settings
  const settings = await getOnboardingSettings(slug);

  if (settings.status !== "success" || !settings.data) {
    return (
      <PageContainer
        as="main"
        backButton={{
          href: `/church/${slug}/admin/settings`,
          label: "Settings",
        }}
      >
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground text-lg mb-2">
            Failed to load onboarding settings
          </p>
          <p className="text-sm text-muted-foreground">{settings.message}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      as="main"
      backButton={{
        href: `/church/${slug}/admin/settings`,
        label: "Settings",
      }}
    >
      <VolunteerOnboardingClient
        slug={slug}
        organizationId={organization.id}
        documents={settings.data.documents}
        ministryRequirements={settings.data.requirements}
        backgroundCheckConfig={settings.data.backgroundCheckConfig}
      />
    </PageContainer>
  );
}
