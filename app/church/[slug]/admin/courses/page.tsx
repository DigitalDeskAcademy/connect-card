/**
 * Agency Courses Management Page
 *
 * Displays both platform core courses and agency custom courses.
 * Core courses are read-only, while custom courses can be edited.
 *
 * Features:
 * - Tabbed interface separating core and custom courses
 * - Visual distinction between course types
 * - Create custom course capability
 * - Course management actions for custom courses only
 */

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { createAgencyDataScope } from "@/lib/agency-data-scope";
import { PageContainer } from "@/components/layout/page-container";
import { CourseListingPage } from "@/components/courses/CourseListingPage";

interface AgencyCoursesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyCoursesPage({
  params,
}: AgencyCoursesPageProps) {
  const { slug } = await params;
  const { organization } = await requireAgencyAdmin(slug);

  // Get all courses available to this agency
  const dataScope = createAgencyDataScope(organization.id);
  const courses = await dataScope.getCourses();

  // Use the shared CourseListingPage component
  // Header is rendered via Named Slots pattern (@header/default.tsx)
  return (
    <PageContainer variant="none">
      <CourseListingPage
        courses={courses}
        userRole="agency_admin"
        orgSlug={slug}
        organizationId={organization.id}
        showTabs={true} // Agency admins see tabs for platform vs custom
        showCreateButton={true} // Agency admins can create courses
        pageTitle=""
        pageDescription=""
      />
    </PageContainer>
  );
}
