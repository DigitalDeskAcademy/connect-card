/**
 * Course Listing Page Component
 *
 * Reusable course grid display component that works for all user contexts.
 * Provides consistent layout, empty states, and optional tabbed views.
 *
 * Features:
 * - Responsive grid layout matching existing design patterns
 * - Optional tabs for separating platform vs custom courses
 * - Role-appropriate empty states and CTAs
 * - Consistent spacing and visual hierarchy
 *
 * This component follows the DRY principle by providing a single
 * implementation for course listing across all user roles.
 */

import { SharedCourseCard, type UserRole } from "./SharedCourseCard";
import { EmptyState } from "@/components/general/EmptyState";
import { InfoMessage } from "@/components/general/InfoMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define a minimal course type that works with both full courses and admin courses
interface MinimalCourse {
  id: string;
  title: string;
  slug: string;
  smallDescription: string;
  fileKey: string;
  duration: number;
  level: string;
  organizationId?: string | null;
}

interface CourseListingPageProps {
  courses: MinimalCourse[];
  userRole: UserRole;
  orgSlug?: string;
  organizationId?: string;
  showTabs?: boolean;
  showCreateButton?: boolean;
  pageTitle?: string;
  pageDescription?: string;
}

/**
 * Course Listing Page
 *
 * Displays courses in a responsive grid with optional tabs for filtering.
 * Adapts its behavior based on the user role and context.
 *
 * @param courses - Array of courses to display
 * @param userRole - Current user's role for determining actions
 * @param orgSlug - Organization slug for URL construction
 * @param organizationId - Organization ID for determining course ownership
 * @param showTabs - Whether to show tabs for platform vs custom courses
 * @param showCreateButton - Whether to show create course button (admin only)
 * @param pageTitle - Optional custom page title
 * @param pageDescription - Optional custom page description
 */
export function CourseListingPage({
  courses,
  userRole,
  orgSlug,
  organizationId,
  showTabs = false,
  // Note: showCreateButton, pageTitle, pageDescription are no longer used
  // Headers are now rendered via Named Slots pattern (@header/default.tsx)
}: CourseListingPageProps) {
  // Separate platform courses from organization courses
  const platformCourses = courses.filter(course => !course.organizationId);
  const customCourses = courses.filter(
    course => course.organizationId === organizationId
  );

  // Determine the create button URL based on user role
  const getCreateUrl = () => {
    if (userRole === "platform_admin") {
      return "/platform/admin/courses/create";
    } else if (userRole === "agency_admin" && orgSlug) {
      return `/agency/${orgSlug}/admin/courses/create`;
    }
    return "#";
  };

  // Helper to render course grid
  const renderCourseGrid = (coursesToRender: MinimalCourse[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {coursesToRender.map(course => {
        const isPlatformCourse = !course.organizationId;
        const isOwnCourse =
          userRole === "platform_admin" ||
          (userRole === "agency_admin" &&
            course.organizationId === organizationId);

        return (
          <SharedCourseCard
            key={course.id}
            data={course}
            userRole={userRole}
            context={{
              orgSlug,
              isPlatformCourse,
              isOwnCourse,
            }}
          />
        );
      })}
    </div>
  );

  // Empty state for end users
  const getUserEmptyState = () => (
    <InfoMessage
      title="No courses available"
      description="Check back soon for new learning opportunities"
    />
  );

  // Empty state for admins
  const getAdminEmptyState = () => (
    <EmptyState
      title="No courses available"
      description="Start by creating a course for your organization"
      buttonText="Create Your First Course"
      href={getCreateUrl()}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Course Display - Header now rendered via Named Slots pattern */}
      {showTabs && userRole === "agency_admin" ? (
        // Tabbed view for agency admins
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">
              All Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="platform">
              Platform ({platformCourses.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              Custom ({customCourses.length})
            </TabsTrigger>
          </TabsList>

          {/* All Courses Tab */}
          <TabsContent value="all" className="mt-6">
            {courses.length === 0
              ? getAdminEmptyState()
              : renderCourseGrid(courses)}
          </TabsContent>

          {/* Platform Courses Tab */}
          <TabsContent value="platform" className="mt-6">
            {platformCourses.length === 0 ? (
              <InfoMessage
                title="No platform courses available"
                description="Platform courses will appear here once they're published"
              />
            ) : (
              <>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Platform courses are created and maintained by SideCar.
                    These courses are available to all your clients but cannot
                    be edited.
                  </p>
                </div>
                {renderCourseGrid(platformCourses)}
              </>
            )}
          </TabsContent>

          {/* Custom Courses Tab */}
          <TabsContent value="custom" className="mt-6">
            {customCourses.length === 0 ? (
              <EmptyState
                title="No custom courses yet"
                description="Create custom courses tailored to your organization's needs"
                buttonText="Create Your First Course"
                href={getCreateUrl()}
              />
            ) : (
              <>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Custom courses are created and owned by your organization.
                    You have full control to edit, manage, and customize these
                    courses.
                  </p>
                </div>
                {renderCourseGrid(customCourses)}
              </>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Simple grid view for platform admins and end users
        <>
          {courses.length === 0
            ? userRole === "user"
              ? getUserEmptyState()
              : getAdminEmptyState()
            : renderCourseGrid(courses)}
        </>
      )}
    </div>
  );
}
