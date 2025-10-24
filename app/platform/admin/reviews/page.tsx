import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Reviews Page
 *
 * System-wide review and feedback monitoring.
 * Track patient reviews, ratings, and feedback across all organizations.
 */
export default async function ReviewsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          ⭐ Platform Reviews Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Patient review and feedback monitoring across all clinics
        </p>
      </div>
    </div>
  );
}
