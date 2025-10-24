import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Analytics Dashboard Page
 *
 * Business analytics and performance metrics for IV therapy clinic.
 * Track revenue, appointment trends, patient retention, and operational KPIs.
 *
 * Phase 1 Priority: Basic analytics from GHL data
 */
export default async function AnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  await requireDashboardAccess(slug);

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented in Phase 1 */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          📊 Analytics Dashboard Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Revenue tracking, appointment trends, and operational KPIs
        </p>
      </div>
    </div>
  );
}
