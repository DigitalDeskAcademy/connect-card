import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

/**
 * Platform Contacts Page Header
 *
 * Displays page title and action button for platform-wide contacts.
 * Server component - renders on initial page load.
 */
export default function PlatformContactsHeader() {
  return (
    <PageHeader
      title="Contacts"
      actions={
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      }
    />
  );
}
