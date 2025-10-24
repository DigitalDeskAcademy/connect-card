import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

/**
 * Conversations Page Header
 *
 * Displays page title, subtitle, and action button for unified inbox.
 * Server component - renders on initial page load.
 */
export default function ConversationsHeader() {
  return (
    <PageHeader
      title="Conversations"
      actions={
        <Button size="sm">
          <IconPlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      }
    />
  );
}
