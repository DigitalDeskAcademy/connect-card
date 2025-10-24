/**
 * Course Catalog - Public course discovery and enrollment hub
 *
 * Primary conversion page that showcases available courses and drives enrollment.
 * Optimized for course discovery, comparison shopping, and enrollment conversion
 * with comprehensive SEO and user experience enhancements.
 *
 * Business Objectives:
 * - Drive course enrollment through compelling course presentation
 * - Enable easy course comparison and discovery through visual design
 * - Maximize conversion rates with clear pricing and value communication
 * - Provide fast, accessible browsing experience across all devices
 * - Support SEO goals with server-side rendering and semantic structure
 *
 * User Journey Optimization:
 * 1. Course Discovery: Visual grid layout for easy browsing and scanning
 * 2. Course Evaluation: Clear course metadata (level, category, duration, price)
 * 3. Course Selection: Intuitive click-to-detail navigation with hover feedback
 * 4. Conversion Path: Direct path to course detail pages for enrollment
 *
 * Conversion Optimization Features:
 * - Visual hierarchy: Large course images → Titles → Key attributes → Price
 * - Compelling pricing display with professional currency formatting
 * - Course attribute badges for quick evaluation (level, category, duration)
 * - Hover effects and visual feedback for enhanced interactivity
 * - Clear call-to-action through "View Details →" prompts
 * - Responsive grid layout optimized for all screen sizes
 *
 * SEO & Performance Strategy:
 * - Server-side rendering for search engine crawlability and faster initial load
 * - Optimized images with Next.js Image component for performance
 * - Semantic HTML structure with proper heading hierarchy
 * - Responsive design for mobile-first indexing
 * - Suspense boundaries for progressive loading and better UX
 * - Proper alt text and accessibility features for inclusive design
 *
 * Technical Implementation:
 * - Async data fetching with server components for optimal performance
 * - Suspense fallback with skeleton loading for perceived performance
 * - Dynamic course grid with responsive breakpoints
 * - Professional image handling with aspect ratio preservation
 * - Optimized card layouts with consistent sizing and spacing
 *
 * Empty State Handling:
 * - Professional no-courses message when catalog is empty
 * - Encouraging copy that builds anticipation for future content
 * - Maintains page structure and SEO value even without courses
 *
 * @page CourseCatalog
 * @route /courses
 * @access Public (no authentication required)
 * @returns {JSX.Element} Complete course catalog with discovery and conversion features
 *
 * @example
 * // Automatic course discovery and enrollment flow:
 * // 1. User lands on /courses from navigation or homepage
 * // 2. Browses courses in responsive grid layout
 * // 3. Evaluates courses using visible metadata and pricing
 * // 4. Clicks course card to navigate to course detail page
 * // 5. Proceeds with enrollment from course detail page
 */

import { getAllCourses } from "@/app/data/course/get-all-courses";

// Revalidate this page every 10 minutes to ensure fresh course data
export const revalidate = 600;
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/lib/construct-url";
import { IconChartBar, IconClock, IconCategory } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

/**
 * Course Catalog Page Component
 *
 * Main course listing page that provides comprehensive course discovery experience
 * with SEO-optimized content structure and conversion-focused design.
 *
 * Page Structure:
 * - Header: Compelling headline and value proposition
 * - Course Grid: Responsive course cards with detailed information
 * - Loading States: Professional skeleton loading for better UX
 * - Empty States: Encouraging messaging when no courses available
 *
 * SEO Optimization:
 * - Semantic H1 headline for primary keyword targeting
 * - Descriptive page copy that encourages course exploration
 * - Server-side rendering for search engine crawlability
 * - Proper heading hierarchy and content structure
 *
 * @component CoursesPage
 * @returns {JSX.Element} Complete course catalog page with discovery features
 */
export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header - SEO optimized headline and value proposition */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">All Courses</h1>
        <p className="text-muted-foreground text-lg">
          Discover our comprehensive collection of courses designed to help you
          master new skills.
        </p>
      </div>

      {/* Course Grid with Progressive Loading - Suspense for better UX */}
      <Suspense fallback={<CourseCardSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
    </div>
  );
}

/**
 * Course Rendering Component
 *
 * Async server component that fetches and renders the complete course catalog.
 * Handles both populated and empty states with professional messaging.
 *
 * Data Flow:
 * 1. Fetch all available courses from database
 * 2. Handle empty state with encouraging messaging
 * 3. Render course grid with optimized card layouts
 * 4. Enable course navigation through click interactions
 *
 * Conversion Strategy:
 * - Visual course cards with compelling imagery and information
 * - Clear pricing display with professional formatting
 * - Course attribute communication through badges
 * - Intuitive navigation to course detail pages
 *
 * @component RenderCourses
 * @returns {JSX.Element} Course grid or empty state message
 */
async function RenderCourses() {
  // Fetch all available courses from database
  const courses = await getAllCourses();

  // Handle empty state with encouraging messaging
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">
          No courses available yet
        </h2>
        <p className="text-muted-foreground">
          We&apos;re working on adding new courses. Check back soon!
        </p>
      </div>
    );
  }

  /* Course Grid - Responsive layout optimized for course discovery */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map(course => (
        /* Course Card Link - Full card clickable for better UX */
        <Link
          key={course.id}
          href={`/courses/${course.slug}`}
          className="h-full group"
        >
          {/* Course Card - Enhanced hover effects with modern scale and shadow */}
          <Card className="group-hover:shadow-2xl group-hover:scale-105 group-hover:bg-muted/50 group-hover:border-primary/20 transition-all duration-200 h-full overflow-hidden p-4 gap-0 py-4">
            {/* Course Image - Visual appeal and course recognition */}
            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
              <Image
                src={constructUrl(course.fileKey)}
                alt={course.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>

            {/* Course Title Section */}
            <CardHeader className="pb-0 px-0 pt-3">
              {/* Course Title - Line clamp ensures consistent card heights */}
              <CardTitle className="text-xl line-clamp-2">
                {course.title}
              </CardTitle>
            </CardHeader>

            {/* Course Content - Expandable content area with consistent spacing */}
            <CardContent className="space-y-2 flex-1 flex flex-col px-0 pt-2">
              {/* Course Description - Consistent preview with ellipsis */}
              <p className="text-muted-foreground text-sm line-clamp-4 leading-relaxed">
                {course.smallDescription}
              </p>

              {/* Course Attributes - Quick evaluation badges */}
              <div className="flex flex-wrap gap-2">
                {/* Level Badge - Difficulty assessment */}
                <Badge variant="outline" className="flex items-center gap-1">
                  <IconChartBar className="size-3" />
                  <span className="text-xs">{course.level}</span>
                </Badge>

                {/* Category Badge - Course classification */}
                <Badge variant="outline" className="flex items-center gap-1">
                  <IconCategory className="size-3" />
                  <span className="text-xs">{course.category}</span>
                </Badge>

                {/* Duration Badge - Time investment indication */}
                <Badge variant="outline" className="flex items-center gap-1">
                  <IconClock className="size-3" />
                  <span className="text-xs">{course.duration}h</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * Course Card Skeleton Component
 *
 * Loading skeleton that matches the exact layout and dimensions of actual
 * course cards. Provides professional loading experience during data fetching
 * and improves perceived performance through visual continuity.
 *
 * Design Strategy:
 * - Matches actual course card structure exactly for seamless transition
 * - Realistic content proportions (3/4 width title, 4 description lines, etc.)
 * - Consistent spacing and sizing with real cards
 * - Professional skeleton animations through Skeleton component
 *
 * Performance Benefits:
 * - Reduces layout shift when real content loads
 * - Maintains user engagement during loading states
 * - Provides visual feedback that content is being loaded
 * - Prevents blank page experience that could increase bounce rates
 *
 * @component CourseCardSkeleton
 * @returns {JSX.Element} Loading skeleton matching course card layout
 */
function CourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden p-4 gap-0 py-4">
      {/* Course Image Skeleton - Matches aspect ratio of real images */}
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />

      <CardHeader className="pb-0 px-0 pt-3">
        {/* Course Title Skeleton - Two lines matching real title layout */}
        <Skeleton className="h-7 w-3/4 mb-1" />
        <Skeleton className="h-7 w-1/2" />
      </CardHeader>

      <CardContent className="space-y-2 flex-1 flex flex-col px-0 pt-1">
        {/* Course Description Skeleton - 4 lines matching real content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Course Attribute Badges Skeleton - Realistic badge sizes */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Pricing Section Skeleton - Matches price and CTA layout */}
        <div className="flex items-center justify-between pt-1 border-t mt-auto">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Course Catalog Skeleton Layout
 *
 * Complete skeleton layout for the course catalog grid. Shows 6 course card
 * skeletons in the same responsive grid layout as the real course catalog.
 *
 * UX Benefits:
 * - Immediate visual feedback that content is loading
 * - Maintains page structure during data fetching
 * - Professional loading experience that builds user confidence
 * - Prevents content jumping and layout shifts
 *
 * Layout Consistency:
 * - Same responsive grid: 1 column mobile, 2 tablet, 3 desktop
 * - Identical gap spacing and card sizing
 * - Realistic loading time representation (6 cards typical first load)
 *
 * @component CourseCardSkeletonLayout
 * @returns {JSX.Element} Complete skeleton grid layout for course catalog
 */
function CourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
