import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageContainer } from "@/components/layout/page-container";

/**
 * Platform Search Page
 *
 * Global search across all platform data.
 * Search contacts, appointments, conversations, and platform content.
 */
export default async function SearchPage() {
  await requireAdmin();

  return (
    <PageContainer as="main">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          🔍 Global Search Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Search across contacts, appointments, conversations, and all platform
          data
        </p>
      </div>
    </PageContainer>
  );
}
