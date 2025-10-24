import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus, IconCalendarEvent } from "@tabler/icons-react";

/**
 * Calendar Page Header
 *
 * Displays page title, view tabs, and appointment actions.
 * Server component - renders on initial page load.
 */
export default function CalendarHeader() {
  return (
    <PageHeader
      title="Calendar"
      actions={
        <>
          <Button variant="outline" size="sm">
            <IconCalendarEvent className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </>
      }
    />
  );
}
