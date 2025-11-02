/**
 * Agency Courses Browse Page - End User View
 *
 * Allows authenticated end users to browse all courses available to their organization.
 * This includes both platform core courses and agency custom courses.
 *
 * Security:
 * - Requires user authentication (not admin)
 * - Scoped to organization's available courses
 * - No enrollment system - users have automatic access
 *
 * Features:
 * - Browse all available courses in grid layout
 * - "Start Learning" buttons instead of admin actions
 * - Visual distinction between platform and custom courses
 * - Responsive design matching admin interfaces
 */

import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { createAgencyDataScope } from "@/lib/agency-data-scope";
import { PageContainer } from "@/components/layout/page-container";
import { CourseListingPage } from "@/components/courses/CourseListingPage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

interface AgencyCoursesPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * End User Courses Page
 *
 * This page allows regular users (not admins) to browse and access
 * all courses available to their organization. It uses the same
 * shared components as admin pages but with user-appropriate actions.
 */
export default async function AgencyCoursesPage({
  params,
}: AgencyCoursesPageProps) {
  const { slug } = await params;

  // Get organization details
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Check authentication (any authenticated user, not just admins)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Redirect to agency-specific login page
    redirect(`/church/${slug}/login`);
  }

  // Verify user belongs to this organization by fetching full user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true,
    },
  });

  if (user?.organizationId !== organization.id) {
    // User is authenticated but not part of this organization
    notFound();
  }

  // Get courses available to end users (filters hidden courses)
  const dataScope = createAgencyDataScope(organization.id);
  const courses = await dataScope.getVisibleCourses();

  // Render the course listing page with user role
  return (
    <PageContainer variant="none">
      <CourseListingPage
        courses={courses}
        userRole="user"
        orgSlug={slug}
        organizationId={organization.id}
        showTabs={false} // No tabs for end users
        showCreateButton={false} // No create button for end users
        pageTitle="Available Courses"
        pageDescription="Start learning with our comprehensive course library"
      />
    </PageContainer>
  );
}
