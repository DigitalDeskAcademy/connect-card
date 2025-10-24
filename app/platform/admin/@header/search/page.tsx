import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";

/**
 * Platform Search Page Header
 *
 * Displays page title and search input.
 * Server component - renders on initial page load.
 */
export default function SearchHeader() {
  return (
    <PageHeader
      title="Search"
      actions={
        <Input
          type="search"
          placeholder="Search platform..."
          className="w-[300px]"
        />
      }
    />
  );
}
