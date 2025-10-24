/**
 * MyLearningPage - Student dashboard for enrolled course management and learning progress
 *
 * Central hub for students to view enrolled courses, track learning progress, and discover
 * new available courses. Integrates course enrollment data with progress tracking to provide
 * a comprehensive learning dashboard experience.
 *
 * Features:
 * - Dashboard statistics showing enrolled vs available course counts
 * - Grid-based course progress cards with visual progress indicators
 * - Smart course filtering to prevent duplicate enrollments
 * - Empty state handling with call-to-action for course discovery
 * - Responsive layout optimized for desktop and mobile
 * - Integration with Stripe enrollment system and S3 course thumbnails
 *
 * @page
 * @returns {JSX.Element} Complete student learning dashboard with progress tracking
 *
 * @example
 * // Accessed via student navigation: /my-learning
 * // Displays enrolled courses with progress bars and completion tracking
 * // Shows available courses for additional enrollment opportunities
 */
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { Ban, PlusCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function MyLearningPage() {
  // Check if user has an organization and redirect to agency learning
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        organization: {
          select: { slug: true },
        },
      },
    });

    // If user belongs to an organization, redirect to agency learning portal
    if (user?.organizationId && user.organization?.slug) {
      redirect(`/agency/${user.organization.slug}/learning`);
    }
  }
  // Parallel data fetching for optimal performance - fetch enrolled courses and catalog simultaneously
  const [courses, enrolledCourses] = await Promise.all([
    getAllCourses(),
    getEnrolledCourses(),
  ]);

  // Smart filtering: prevent duplicate enrollments by excluding already-enrolled courses from suggestions
  // This ensures students only see relevant new learning opportunities
  const availableCourses = courses.filter(
    course =>
      !enrolledCourses.some(({ Course: enrolled }) => enrolled.id === course.id)
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Dashboard Header - Welcome section with personalized learning messaging */}
      <div>
        <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your personalized learning experience
        </p>
      </div>

      {/* Quick Stats - Key performance indicators for student engagement and progress tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Enrolled Courses Counter - Shows active learning commitment */}
        <div className="p-4 bg-card border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">
            Enrolled Courses
          </h3>
          <p className="text-2xl font-bold text-primary">
            {enrolledCourses.length}
          </p>
        </div>

        {/* Available Courses Counter - Discovery opportunities for continued learning */}
        <div className="p-4 bg-card border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">
            Available Courses
          </h3>
          <p className="text-2xl font-bold">{availableCourses.length}</p>
        </div>

        {/* Progress Tracking - Future implementation for completion analytics */}
        <div className="p-4 bg-card border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">
            Progress
          </h3>
          <p className="text-2xl font-bold text-primary">Coming Soon</p>
        </div>
      </div>

      {/* Enrolled Courses Section - Primary learning interface with progress tracking */}
      <section>
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-muted-foreground">
            Continue your learning journey
          </p>
        </div>

        {/* Empty State: First-time user experience with course discovery call-to-action */}
        {enrolledCourses.length === 0 ? (
          <div className="flex flex-col min-h-80 items-center justify-center rounded-md border-dashed border p-12 text-center animate-in fade-in-50">
            <div className="flex w-20 h-20 items-center justify-center rounded-full bg-primary/10">
              <Ban className="size-10 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No courses yet</h2>
            <p className="mb-8 mt-2 text-center text-sm leading-tight text-muted-foreground max-w-md">
              You haven&apos;t enrolled in any courses yet. Explore our catalog
              to get started!
            </p>
            <Link href="/courses" className={buttonVariants()}>
              <PlusCircle className="size-4 mr-2" />
              Browse Courses
            </Link>
          </div>
        ) : (
          /* Active Learning: Responsive grid of enrolled course cards with progress tracking */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map(enrolledCourse => (
              <CourseProgressCard
                key={enrolledCourse.Course.id}
                data={enrolledCourse}
              />
            ))}
          </div>
        )}
      </section>

      {/* Course Discovery Section - Conditional display of available courses for enrollment expansion */}
      {availableCourses.length > 0 && (
        <section>
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-xl font-semibold">Discover New Courses</h2>
            <p className="text-muted-foreground">
              Expand your skills with these available courses
            </p>
          </div>

          {/* Course Preview Grid - Limited to 6 courses to prevent overwhelming interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.slice(0, 6).map(course => (
              <div
                key={course.id}
                className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
              >
                {/* Course Information Display */}
                <h3 className="font-semibold mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.smallDescription}
                </p>

                {/* Course Metadata - Level badge and pricing information */}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {course.level}
                  </span>
                  <span className="text-sm font-semibold">
                    ${(course.price / 100).toFixed(2)}
                  </span>
                </div>
                {/* TODO: Add enrollment button - requires Stripe checkout integration */}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
