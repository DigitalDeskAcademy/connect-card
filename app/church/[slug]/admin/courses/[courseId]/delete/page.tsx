/**
 * Agency Course Delete Page
 *
 * Entry point for agency administrators to delete courses.
 * Uses the shared DeleteCourseConfirmation component with agency-specific configuration.
 * Follows ADR-001: Direct server action imports with context parameters.
 *
 * Security:
 * - Requires agency admin authentication
 * - Validates course belongs to the agency
 * - Rate limited delete operation
 */

import { agencyGetCourse } from "@/app/data/agency/agency-get-course";
import { PageContainer } from "@/components/layout/page-container";
import { DeleteCourseConfirmation } from "@/components/courses/DeleteCourseConfirmation";

interface AgencyDeleteCourseRouteProps {
  params: Promise<{ slug: string; courseId: string }>;
}

export default async function AgencyDeleteCourseRoute({
  params,
}: AgencyDeleteCourseRouteProps) {
  const { slug, courseId } = await params;
  const course = await agencyGetCourse(slug, courseId);

  return (
    <PageContainer variant="none">
      <DeleteCourseConfirmation
        courseId={courseId}
        courseTitle={course.title}
        courseSlug={course.slug}
        organizationContext={{ type: "agency", slug }}
        cancelHref={`/agency/${slug}/admin/courses`}
        redirectPath={`/agency/${slug}/admin/courses`}
      />
    </PageContainer>
  );
}
