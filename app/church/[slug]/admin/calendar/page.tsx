import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Calendar Page
 *
 * Appointment scheduling and calendar management for IV therapy clinic.
 * Integrates with Cal.com for appointment booking and syncs with GHL contacts.
 *
 * Phase 1 Priority: Cal.com integration with GHL contact sync
 */
export default async function CalendarPage({ params }: PageProps) {
  const { slug } = await params;
  await requireDashboardAccess(slug);

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented in Phase 1 */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          📅 Calendar Integration Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Cal.com appointment scheduling with GHL contact sync
        </p>
      </div>
    </div>
  );
}
