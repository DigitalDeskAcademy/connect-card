import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageContainer } from "@/components/layout/page-container";

/**
 * Platform Projects Page
 *
 * Project management and tracking for GHL integration development.
 * Monitor API integration projects, feature rollouts, and development tasks.
 */
export default async function ProjectsPage() {
  await requireAdmin();

  return (
    <PageContainer as="main">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          🚀 Projects Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Track GHL API integration projects, feature development, and
          deployment tasks
        </p>
      </div>
    </PageContainer>
  );
}
