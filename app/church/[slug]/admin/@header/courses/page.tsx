import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

/**
 * Courses Page Header
 *
 * Displays page title and create course button.
 * Server component - renders on initial page load.
 */
export default async function CoursesHeader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageHeader
      title="Courses"
      actions={
        <Button size="sm" asChild>
          <Link href={`/agency/${slug}/admin/courses/create`}>
            <IconPlus className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        </Button>
      }
    />
  );
}
