import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Inventory Page
 *
 * System-wide inventory monitoring across all organizations.
 * Track supply levels, equipment status, and inventory alerts.
 */
export default async function InventoryPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          📦 Platform Inventory Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          System-wide inventory monitoring across all clinics
        </p>
      </div>
    </div>
  );
}
