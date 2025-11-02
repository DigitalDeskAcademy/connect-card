/**
 * Dynamic Agency Homepage
 *
 * White-label homepage for agencies that looks identical to the main SideCar
 * homepage but with agency branding instead of SideCar branding.
 * Includes navigation, hero section, and all marketing content.
 *
 * Route: /church/[slug] (e.g., /church/digitaldesk, /church/acme-corp)
 */

import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { AgencyNavbar } from "../_components/AgencyNavbar";
import { AgencyHomepageContent } from "../_components/AgencyHomepageContent";

interface AgencyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AgencyPage({ params }: AgencyPageProps) {
  // Await params in Next.js 15
  const { slug } = await params;

  // Get agency from database by slug
  const agency = await getOrganizationBySlug(slug);

  if (!agency) {
    notFound(); // Return 404 if agency doesn't exist
  }

  return (
    <div>
      {/* Agency-branded navigation */}
      <AgencyNavbar agency={agency} />

      {/* Main content with same container as public layout */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8">
        <AgencyHomepageContent />
      </main>
    </div>
  );
}
