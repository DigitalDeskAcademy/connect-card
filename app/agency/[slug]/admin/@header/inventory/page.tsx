import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";

/**
 * Inventory Page Header
 *
 * Displays page title, inventory categories, and management actions.
 * Server component - renders on initial page load.
 */
export default function InventoryHeader() {
  return (
    <PageHeader
      title="Inventory"
      actions={
        <>
          <Button variant="outline" size="sm">
            <IconFileExport className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </>
      }
    />
  );
}
