import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

/**
 * Prayer Page Header
 *
 * Displays page title and action button for prayer request management.
 * Server component - renders on initial page load.
 */
export default function PrayerHeader() {
  return (
    <PageHeader
      title="Prayer Requests"
      actions={
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          Add Prayer Request
        </Button>
      }
    />
  );
}
