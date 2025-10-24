import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

/**
 * Platform Courses Page Header
 *
 * Displays page title and course management actions.
 * Server component - renders on initial page load.
 */
export default function CoursesHeader() {
  return (
    <PageHeader
      title="Courses"
      actions={
        <Link href="/platform/admin/courses/create">
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      }
    />
  );
}
