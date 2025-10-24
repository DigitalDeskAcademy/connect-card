/**
 * Course Management Hub - Centralized course administration interface
 *
 * Primary dashboard for course lifecycle management including creation, editing,
 * deletion, and overview. Optimized for content creator productivity with efficient
 * course discovery and bulk operations.
 *
 * Admin Workflow:
 * - Visual course gallery with thumbnail previews and key metrics
 * - Quick course creation access via prominent CTA button
 * - Contextual course actions (edit, preview, delete) via dropdown menus
 * - Responsive grid layout adapting to screen size and content volume
 *
 * Content Management Features:
 * - Course status and visibility indicators
 * - Enrollment statistics and completion metrics
 * - Thumbnail upload status and file management
 * - Course structure summary (chapters/lessons count)
 *
 * Performance Optimization:
 * - Server-side data fetching with streaming responses
 * - Skeleton loading states for perceived performance
 * - Suspense boundaries for incremental page loading
 * - Optimistic UI updates for immediate feedback
 *
 * User Experience:
 * - Empty state guidance for first-time users
 * - Consistent card layout with hover interactions
 * - Accessibility-compliant navigation and controls
 * - Mobile-responsive design for on-the-go management
 */

import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseListingPage } from "@/components/courses/CourseListingPage";

/**
 * Courses Management Page
 *
 * Displays all courses with management controls and creation access.
 * Implements efficient loading patterns for optimal admin experience.
 *
 * Header: Rendered via Named Slots pattern (@header/default.tsx)
 */
export default function CoursesPage() {
  return (
    <Suspense fallback={<CourseLoadingSkeleton />}>
      <RenderCourses />
    </Suspense>
  );
}

/**
 * Course Data Rendering Component
 *
 * Handles server-side course data fetching and conditional rendering.
 * Uses the shared CourseListingPage component for consistency.
 */
async function RenderCourses() {
  const courses = await adminGetCourses();

  return (
    <CourseListingPage
      courses={courses}
      userRole="platform_admin"
      showTabs={false}
      showCreateButton={true}
      pageTitle=""
      pageDescription=""
    />
  );
}

/**
 * Course Loading Skeleton
 *
 * Provides visual feedback during course data loading.
 */
function CourseLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
