import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";

/**
 * Platform Payments Page Header
 *
 * Displays page title and payment filters.
 * Server component - renders on initial page load.
 */
export default function PaymentsHeader() {
  return (
    <PageHeader
      title="Payments"
      actions={
        <Button variant="outline" size="sm">
          <IconFileExport className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      }
    />
  );
}
