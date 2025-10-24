import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Support Page
 *
 * Help center and support resources for clinic staff.
 * Provides documentation, FAQs, and contact options for technical support.
 */
export default async function SupportPage({ params }: PageProps) {
  const { slug } = await params;
  await requireDashboardAccess(slug);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          💬 Help Center Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Documentation, FAQs, and technical support
        </p>
      </div>
    </div>
  );
}
