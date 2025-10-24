/**
 * Platform Course Delete Page
 *
 * Entry point for platform administrators to delete courses.
 * Uses the shared DeleteCourseConfirmation component with platform-specific configuration.
 * Follows ADR-001: Direct server action imports with context parameters.
 */

import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import { DeleteCourseConfirmation } from "@/components/courses/DeleteCourseConfirmation";

interface DeleteCourseRouteProps {
  params: Promise<{ courseId: string }>;
}

export default async function DeleteCourseRoute({
  params,
}: DeleteCourseRouteProps) {
  const { courseId } = await params;
  const course = await adminGetCourse(courseId);

  return (
    <DeleteCourseConfirmation
      courseId={courseId}
      courseTitle={course.title}
      courseSlug={course.slug}
      organizationContext={{ type: "platform" }}
      cancelHref="/platform/admin/courses"
      redirectPath="/platform/admin/courses"
    />
  );
}
