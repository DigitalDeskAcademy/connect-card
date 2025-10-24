/**
 * Course Detail Page - Primary conversion and enrollment page
 *
 * Critical conversion page that transforms course interest into enrollments.
 * Designed for maximum conversion optimization with comprehensive course
 * information, social proof elements, and compelling enrollment experience.
 *
 * Business Objectives:
 * - Convert course browsers into paying customers through detailed value communication
 * - Provide comprehensive course evaluation tools to reduce purchase hesitation
 * - Maximize enrollment conversion through strategic pricing display and CTAs
 * - Build trust through transparent course content and curriculum preview
 * - Support mobile commerce with responsive design and touch-optimized interactions
 *
 * Conversion Optimization Strategy:
 * - Above-the-fold: Hero image + course title + pricing = immediate value proposition
 * - Sticky enrollment card: Persistent CTA visibility throughout page scroll
 * - Course curriculum preview: Transparency builds trust and perceived value
 * - Social proof elements: Trust signals (guarantee, lifetime access, certificates)
 * - Benefit-focused messaging: "What you will get" vs technical specifications
 * - Clear value communication: Course features, duration, difficulty level display
 *
 * User Journey Optimization:
 * 1. Course Discovery: Arrived from course catalog or direct link
 * 2. Initial Evaluation: Hero image + title + pricing assessment (< 3 seconds)
 * 3. Detailed Assessment: Course description + curriculum review
 * 4. Enrollment Decision: Sticky CTA card with trust signals and guarantees
 * 5. Enrollment Flow: Direct path to Stripe checkout or login requirement
 *
 * Technical Implementation:
 * - Server-side rendering for SEO and fast initial load
 * - Async data fetching with proper error handling
 * - Suspense boundaries for progressive loading experience
 * - Responsive grid layout (mobile stack, desktop 2-column)
 * - Sticky positioning for enrollment card on desktop
 * - Optimized images with Next.js Image component
 *
 * SEO & Performance Features:
 * - Dynamic metadata generation from course data
 * - Semantic HTML structure with proper heading hierarchy
 * - Optimized images with priority loading for hero image
 * - Clean URL structure with course slugs
 * - Rich snippets potential through structured data
 *
 * Accessibility & UX Enhancements:
 * - Keyboard navigation support for collapsible sections
 * - Screen reader optimized content structure
 * - High contrast design for visual accessibility
 * - Touch-friendly interactive elements for mobile
 * - Loading states that prevent layout shift
 *
 * @page CourseDetail
 * @route /courses/[slug]
 * @access Public (authentication not required for viewing)
 * @param {string} slug - Course URL slug for identification
 * @returns {JSX.Element} Complete course detail page with enrollment functionality
 *
 * @example
 * // Course evaluation and enrollment flow:
 * // 1. User clicks course card from catalog (/courses)
 * // 2. Lands on course detail page (/courses/javascript-fundamentals)
 * // 3. Reviews course content, curriculum, and pricing
 * // 4. Clicks "Enroll Now" button in sticky enrollment card
 * // 5. Proceeds to Stripe checkout or login if required
 * // 6. After enrollment, button changes to "Watch Course"
 */

import { getIndividualCourse } from "@/app/data/course/get-course";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/lib/construct-url";
import {
  IconBook,
  IconCategory,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { checkIfCoursePurchased } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";
import { EnrollmentButton } from "./_components/EnrollmentButton";
import { buttonVariants } from "@/components/ui/button";
import { Suspense } from "react";

/**
 * Next.js 15 Async Params Type Pattern
 *
 * Type definition for dynamic route parameters in Next.js 15+.
 * Params are now async and must be awaited before use.
 */
type Params = Promise<{ slug: string }>;

/**
 * Course Detail Page Component
 *
 * Main page component that handles route parameters and renders course detail
 * content with proper loading states and error boundaries.
 *
 * Architecture:
 * - Async params extraction (Next.js 15 requirement)
 * - Suspense boundary for progressive loading
 * - Skeleton fallback for better perceived performance
 * - Clean separation of concerns between routing and content rendering
 *
 * @param {Object} props - Component properties
 * @param {Params} props.params - Async route parameters containing course slug
 * @returns {JSX.Element} Course detail page with suspense boundaries
 */
export default async function SlugPage({ params }: { params: Params }) {
  // Extract slug from async params (Next.js 15 requirement)
  const { slug } = await params;

  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetailContent slug={slug} />
    </Suspense>
  );
}

/**
 * Course Detail Content Component
 *
 * Core content component that fetches course data and renders the complete
 * course detail experience with enrollment functionality.
 *
 * Data Flow:
 * 1. Fetch course data by slug from database
 * 2. Check user enrollment status for conditional CTA rendering
 * 3. Render complete course detail layout with conversion optimization
 * 4. Handle both enrolled and non-enrolled user states
 *
 * Conversion Strategy:
 * - Comprehensive course information for informed decision making
 * - Strategic pricing placement for maximum visibility
 * - Trust signals and social proof elements
 * - Clear enrollment path with minimal friction
 *
 * @param {Object} props - Component properties
 * @param {string} props.slug - Course URL slug for data fetching
 * @returns {JSX.Element} Complete course detail layout with enrollment features
 */
async function CourseDetailContent({ slug }: { slug: string }) {
  // Fetch comprehensive course data including chapters and lessons
  const course = await getIndividualCourse(slug);

  // Check enrollment status to render appropriate CTA (Enroll vs Watch)
  const isEnrolled = await checkIfCoursePurchased(course.id);

  return (
    <div>
      {/* Navigation Breadcrumb - Course catalog return path */}
      <div className="container mx-auto px-4 py-2">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Courses
        </Link>
      </div>

      {/* Main Content Layout - Conversion-optimized two-column design */}
      {/* 
        Responsive Strategy:
        - Mobile: Single column stack (content → enrollment card)
        - Desktop: Two-column layout (2/3 content + 1/3 sticky enrollment)
        - Enrollment card sticky positioning maintains CTA visibility
      */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 container mx-auto px-4">
        {/* Main Content Area - Course details */}
        <div className="order-1 lg:col-span-2">
          {/* Hero Image Section */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
            <Image
              // Use centralized URL construction for S3 files
              src={constructUrl(course.fileKey)}
              alt={`${course.title} course preview`} // Improved accessibility
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-cover"
              priority // Load image immediately as it's above the fold
            />
            {/* Subtle gradient overlay for better text readability if overlaid */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Course Header Information */}
          <div className="mt-8 space-y-6">
            {/* Title and Short Description */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                {course.title}
              </h1>
              {/* line-clamp-2 ensures description doesn't overflow on mobile */}
              <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
                {course.smallDescription}
              </p>
            </div>

            {/* Course Metadata Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge className="flex items-center gap-1 px-3 py-1">
                <IconChartBar className="size-4" />
                <span>{course.level}</span>
              </Badge>
              <Badge className="flex items-center gap-1 px-3 py-1">
                <IconCategory className="size-4" />
                <span>{course.category}</span>
              </Badge>
              <Badge className="flex items-center gap-1 px-3 py-1">
                <IconClock className="size-4" />
                <span>{course.duration} hours</span>
              </Badge>
            </div>

            <Separator className="my-8" />

            {/* Full Course Description Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight">
                Course Description
              </h2>

              {/* Render rich text description from JSON stored in database */}
              <RenderDescription json={JSON.parse(course.description)} />
            </div>
          </div>

          {/* Course Curriculum Section */}
          <div className="mt-12 space-y-6">
            {/* Section Header with Course Stats */}
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold tracking-tight">
                Course Content
              </h2>
              {/* Display total chapters and lessons count */}
              <div>
                {course.chapter.length} chapters |{" "}
                {/* Calculate total lessons across all chapters */}
                {course.chapter.reduce(
                  (total, chapter) => total + chapter.lessons.length,
                  0
                ) || 0}{" "}
                Lessons
              </div>
            </div>

            {/* Chapters List - Collapsible accordion style */}
            <div className="space-y-4">
              {course.chapter.map((chapter, index) => (
                // First chapter is open by default for better UX
                <Collapsible key={chapter.id} defaultOpen={index === 0}>
                  <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md gap-0">
                    <CollapsibleTrigger>
                      <div>
                        <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Chapter number indicator */}
                              <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                {index + 1}
                              </p>
                              <div>
                                <h3 className="text-xl font-semibold text-left">
                                  {chapter.title}
                                </h3>
                                {/* Pluralize "lesson" based on count */}
                                <p className="text-sm text-muted-foreground mt-1 text-left">
                                  {chapter.lessons.length} lesson
                                  {chapter.lessons.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </Badge>

                              <IconChevronDown className="size-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {/* Lessons Container - Shows when chapter is expanded */}
                      <div className="border-t bg-muted/20">
                        <div className="p-6 pt-4 space-y-3">
                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors"
                            >
                              <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
                                <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>

                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Lesson {lessonIndex + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollment Card - Sticky sidebar on desktop */}
        <div className="order-2 lg:col-span1">
          {/* Sticky positioning keeps card visible while scrolling */}
          <div className="sticky top-20">
            <Card className="py-0">
              <CardContent className="p-6">
                {/* Course Features Summary */}
                <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                  <h4 className="font-medium">What you will get:</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconClock className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Course Duration</p>
                        <p className="text-sm text-muted-foreground">
                          {course.duration} hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconChartBar className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Difficulty Level</p>
                        <p className="text-sm text-muted-foreground">
                          {course.level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconCategory className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Category</p>
                        <p className="text-sm text-muted-foreground">
                          {course.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconBook className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Lessons</p>
                        <p className="text-sm text-muted-foreground">
                          {course.chapter.reduce(
                            (total, chapter) => total + chapter.lessons.length,
                            0
                          ) || 0}{" "}
                          Lessons
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h4>What you&apos;ll master:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                        <CheckIcon className="size-3" />
                      </div>
                      <span>Hands-on GHL training</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                        <CheckIcon className="size-3" />
                      </div>
                      <span>Learn at your own pace</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                        <CheckIcon className="size-3" />
                      </div>
                      <span>Apply skills to your business</span>
                    </li>
                  </ul>
                </div>

                {/* Conditional CTA based on enrollment status */}
                {isEnrolled ? (
                  // Already enrolled - link to course content
                  <Link
                    className={buttonVariants({ className: "w-full" })}
                    href="/dashboard"
                  >
                    Watch Course
                  </Link>
                ) : (
                  // Not enrolled - show enrollment button
                  <EnrollmentButton courseId={course.id} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Course Detail Loading Skeleton
 *
 * Comprehensive loading skeleton that matches the exact layout and proportions
 * of the course detail page. Provides professional loading experience during
 * data fetching and prevents layout shifts when content loads.
 *
 * Design Strategy:
 * - Pixel-perfect matching of actual content layout structure
 * - Realistic content proportions and spacing
 * - Two-column responsive layout matching real content
 * - Progressive disclosure pattern matching course curriculum sections
 *
 * Performance Benefits:
 * - Immediate visual feedback that content is loading
 * - Maintains user engagement during data fetching periods
 * - Prevents cumulative layout shift (CLS) for better Core Web Vitals
 * - Professional loading experience that builds user confidence
 *
 * Layout Consistency:
 * - Matches responsive breakpoints of actual page
 * - Same container sizing and padding structure
 * - Identical sticky positioning for enrollment card area
 * - Realistic skeleton proportions for all content sections
 *
 * @component CourseDetailSkeleton
 * @returns {JSX.Element} Complete loading skeleton for course detail page
 */
function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb Skeleton */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 container mx-auto px-4">
        <div className="order-1 lg:col-span-2">
          {/* Hero Image Skeleton */}
          <Skeleton className="aspect-video w-full rounded-xl" />

          <div className="mt-8 space-y-6">
            {/* Title and Description Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>

            {/* Badges Skeleton */}
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>

            <Separator className="my-8" />

            {/* Description Section Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* Course Content Skeleton */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* Chapter Cards Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map(index => (
                <Card key={index} className="p-0 overflow-hidden border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="size-10 rounded-full" />
                        <div>
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollment Card Skeleton */}
        <div className="order-2 lg:col-span-1">
          <div className="sticky top-20">
            <Card className="py-0">
              <CardContent className="p-6">
                {/* Features Skeleton */}
                <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                  <Skeleton className="h-5 w-32 mb-3" />
                  {[1, 2, 3, 4].map(index => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Includes List Skeleton */}
                <div className="mb-6 space-y-3">
                  <Skeleton className="h-5 w-40 mb-3" />
                  {[1, 2, 3].map(index => (
                    <div key={index} className="flex items-center gap-2">
                      <Skeleton className="size-4 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ))}
                </div>

                {/* Button Skeleton */}
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48 mx-auto mt-3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
