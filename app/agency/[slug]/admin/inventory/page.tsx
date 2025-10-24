import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Inventory Management Page
 *
 * Track IV therapy supplies, medications, and equipment inventory.
 * Monitors stock levels, expiration dates, and reorder points.
 *
 * Phase 1 Priority: Basic inventory tracking for IV supplies
 */
export default async function InventoryPage({ params }: PageProps) {
  const { slug } = await params;
  await requireDashboardAccess(slug);

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          📦 Inventory Tracking Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          IV supplies, medications, and equipment management
        </p>
      </div>
    </div>
  );
}
