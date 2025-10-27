/**
 * Agency Learning Dashboard
 *
 * Main dashboard for agency students/clients.
 * The layout provides the sidebar and header, this page focuses on content.
 *
 * Features:
 * - Progress overview with statistics
 * - Enrolled courses with progress tracking
 * - Course discovery section
 * - Recent activity tracking
 */

import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { createAgencyDataScope } from "@/lib/agency-data-scope";
import { PageContainer } from "@/components/layout/page-container";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { EmptyState } from "@/components/general/EmptyState";
import { CompactCourseCard } from "@/components/courses/CompactCourseCard";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, BookOpen, Trophy, Clock, TrendingUp } from "lucide-react";

interface AgencyLearningPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyLearningPage({
  params,
}: AgencyLearningPageProps) {
  const { slug } = await params;

  // Layout handles auth, we just need the data
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/agency/${slug}/login`);
  }

  // Get agency-scoped data - filter hidden courses for end users
  const dataScope = createAgencyDataScope(organization.id);
  const courses = await dataScope.getVisibleCourses();

  // Get user's enrollments with progress details
  const enrolledCourses = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: "Active",
    },
    include: {
      Course: {
        include: {
          chapter: {
            include: {
              lessons: {
                include: {
                  lessonProgress: {
                    where: {
                      userId: session.user.id,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Calculate overall progress
  let totalLessons = 0;
  let completedLessons = 0;

  enrolledCourses.forEach(enrollment => {
    enrollment.Course.chapter.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        totalLessons++;
        if (lesson.lessonProgress.some(p => p.completed)) {
          completedLessons++;
        }
      });
    });
  });

  const overallProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Filter available courses
  const availableCourses = courses.filter(
    course => !enrolledCourses.some(e => e.Course.id === course.id)
  );

  // Get recent activity
  const recentProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      completed: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
    include: {
      Lesson: {
        include: {
          Chapter: {
            include: {
              Course: true,
            },
          },
        },
      },
    },
  });

  return (
    <PageContainer variant="default">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and continue learning
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableCourses.length} available to enroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lessons Completed
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground">
              {totalLessons - completedLessons} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Learning Streak
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Track your daily progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </div>
            {enrolledCourses.length > 3 && (
              <Link
                href={`/agency/${slug}/learning/all`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <EmptyState
              title="No courses enrolled"
              description="Browse our course catalog to get started"
              buttonText="Browse Courses"
              href={`/agency/${slug}/learning/courses`}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.slice(0, 3).map(enrollment => (
                <CourseProgressCard
                  key={enrollment.id}
                  data={enrollment}
                  agencySlug={slug}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest completed lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProgress.map(progress => (
                <div key={progress.id} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {progress.Lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {progress.Lesson.Chapter.Course.title} • Completed{" "}
                      {new Date(progress.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discover New Courses */}
      {availableCourses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Discover New Courses</CardTitle>
                <CardDescription>Expand your knowledge</CardDescription>
              </div>
              <Link
                href={`/agency/${slug}/learning/courses`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Browse All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {availableCourses.slice(0, 4).map(course => (
                <CompactCourseCard
                  key={course.id}
                  course={course}
                  href={`/agency/${slug}/learning/courses/${course.slug}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
