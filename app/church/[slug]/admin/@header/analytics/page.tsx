import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconFileExport, IconCalendar } from "@tabler/icons-react";

/**
 * Analytics Page Header
 *
 * Displays page title, time period filters, and export actions.
 * Server component - renders on initial page load.
 */
export default function AnalyticsHeader() {
  return (
    <PageHeader
      title="Analytics"
      actions={
        <>
          <Button variant="outline" size="sm">
            <IconCalendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <IconFileExport className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </>
      }
    />
  );
}
