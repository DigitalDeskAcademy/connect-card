import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconScan } from "@tabler/icons-react";

/**
 * N2N Page Header
 *
 * Displays page title and action button for visitor engagement workflow.
 * Server component - renders on initial page load.
 */
export default function N2NHeader() {
  return (
    <PageHeader
      title="New to Newlife"
      actions={
        <Button size="sm">
          <IconScan className="h-4 w-4 mr-2" />
          Scan Connect Card
        </Button>
      }
    />
  );
}
