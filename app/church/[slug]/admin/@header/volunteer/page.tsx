import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconUserPlus } from "@tabler/icons-react";

/**
 * Volunteer Page Header
 *
 * Displays page title and action button for volunteer management.
 * Server component - renders on initial page load.
 */
export default function VolunteerHeader() {
  return (
    <PageHeader
      title="Volunteers"
      actions={
        <Button size="sm">
          <IconUserPlus className="h-4 w-4 mr-2" />
          Add Volunteer
        </Button>
      }
    />
  );
}
