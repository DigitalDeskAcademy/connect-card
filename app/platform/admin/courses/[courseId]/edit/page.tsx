/**
 * Course Editing Page - Comprehensive course management interface
 *
 * Central hub for all course editing operations with tabbed interface for organized workflow.
 * Provides content creators with efficient access to both basic course information and
 * advanced course structure management in a single, coherent interface.
 *
 * Admin Workflow:
 * - Unified page header with back button, course title, and tabs
 * - Context-aware page title displaying current course name for clarity
 * - Seamless switching between course metadata editing and content organization
 * - Consistent card-based layout maintaining visual hierarchy
 * - Server-side data loading with proper course ownership validation
 *
 * Feature Organization:
 * - Basic Info Tab: Course metadata, pricing, description, thumbnail management
 * - Course Structure Tab: Drag-and-drop chapter/lesson organization and creation
 * - Responsive tab layout adapting to various screen sizes
 * - Clear visual separation between different editing contexts
 *
 * Content Management:
 * - Real-time course data integration from database
 * - Proper course ownership validation and authorization
 * - Seamless data flow between basic information and structure management
 * - Consistent error handling and user feedback patterns
 *
 * Technical Implementation:
 * - Server component with async data fetching for optimal performance
 * - Type-safe parameter handling with Promise-based routing
 * - Client component wrapper for PageHeader context integration
 * - Responsive design with tab-based navigation for optimal UX
 */

import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import { PageContainer } from "@/components/layout/page-container";
import { CourseEditClient } from "./_components/CourseEditClient";

type Params = Promise<{ courseId: string }>;

/**
 * Course Editing Page Component
 *
 * Provides comprehensive course editing interface with tabbed organization.
 * Handles both course metadata and structure management in unified interface.
 *
 * @param params - Route parameters containing courseId for data fetching
 */
export default async function EditRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  const data = await adminGetCourse(courseId);

  return (
    <PageContainer variant="none">
      <CourseEditClient course={data} />
    </PageContainer>
  );
}
