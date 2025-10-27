/**
 * Agency Course Editing Page
 *
 * Comprehensive course management interface for agency administrators.
 * Provides tabbed interface for editing course information and structure
 * with proper multi-tenant security.
 *
 * Features:
 * - Unified page header with back button, course title, and tabs
 * - Organization-scoped data access
 * - Agency-specific navigation
 * - Full course editing capabilities for custom courses
 *
 * Security:
 * - Requires agency admin authentication
 * - Validates course belongs to the agency
 * - Prevents cross-tenant data access
 *
 * Technical Implementation:
 * - Server component with async data fetching for optimal performance
 * - Type-safe parameter handling with Promise-based routing
 * - Client component wrapper for PageHeader context integration
 * - Responsive design with tab-based navigation for optimal UX
 */

import { agencyGetCourse } from "@/app/data/agency/agency-get-course";
import { PageContainer } from "@/components/layout/page-container";
import { AgencyCourseEditClient } from "./_components/AgencyCourseEditClient";

type Params = Promise<{ slug: string; courseId: string }>;

/**
 * Agency Course Editing Page Component
 *
 * Provides comprehensive course editing interface with tabbed organization.
 * Ensures agencies can only edit their own courses.
 *
 * @param params - Route parameters containing slug and courseId
 */
export default async function AgencyEditCoursePage({
  params,
}: {
  params: Params;
}) {
  const { slug, courseId } = await params;

  // Fetch course with organization validation
  const data = await agencyGetCourse(slug, courseId);

  return (
    <PageContainer variant="none">
      <AgencyCourseEditClient course={data} courseId={courseId} slug={slug} />
    </PageContainer>
  );
}
