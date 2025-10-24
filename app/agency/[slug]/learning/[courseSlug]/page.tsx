/**
 * Agency Course Overview Page
 *
 * Follows the exact pattern from single-tenant version:
 * - Fetches course data
 * - Finds first lesson
 * - Redirects to first lesson
 * - Shows "No lessons" message if empty
 *
 * Security:
 * - Validates user belongs to organization
 * - Ensures course is accessible to organization
 */

import { getCourseSidebarDataForAgency } from "@/app/data/course/get-course-sidebar-data-agency";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

interface AgencyCourseOverviewPageProps {
  params: Promise<{
    slug: string;
    courseSlug: string;
  }>;
}

export default async function AgencyCourseOverviewPage({
  params,
}: AgencyCourseOverviewPageProps) {
  const { slug, courseSlug } = await params;

  // Verify organization exists
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Verify user authentication and organization membership
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/agency/${slug}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true,
      role: true,
    },
  });

  if (!user || user.organizationId !== organization.id) {
    notFound();
  }

  // Get course data with chapters and lessons
  // This function handles all access validation internally
  const course = await getCourseSidebarDataForAgency(courseSlug);

  if (!course) {
    notFound();
  }

  // Find the first lesson in the first chapter
  const firstChapter = course.course.chapter[0];
  const firstLesson = firstChapter?.lessons[0];

  // Redirect to first lesson if available
  if (firstLesson) {
    redirect(`/agency/${slug}/learning/${courseSlug}/${firstLesson.id}`);
  }

  // No lessons available - show message
  return (
    <div className="flex items-center justify-center h-full text-center">
      <div>
        <h2 className="text-2xl font-bold mb-2">No lessons available</h2>
        <p className="text-muted-foreground">
          This course does not have any lessons yet!
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Please check back later or contact your administrator.
        </p>
      </div>
    </div>
  );
}
