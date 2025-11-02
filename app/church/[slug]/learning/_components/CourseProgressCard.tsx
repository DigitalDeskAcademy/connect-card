/**
 * CourseProgressCard - Professional course progress display component for student dashboard
 *
 * Renders enrolled course cards with thumbnails, progress tracking, and navigation controls.
 * Integrates with course progress calculation and S3 image hosting for rich visual experience.
 *
 * Features:
 * - Course thumbnail images from S3/Tigris storage
 * - Real-time progress tracking with visual progress bars
 * - Professional card hover effects and interactions
 * - Badge indicators for course difficulty level
 * - Completion statistics with lesson counts
 * - Navigate to course lesson interface
 *
 * @component
 * @param {Object} props - Component properties
 * @param {EnrolledCourseType} props.data - Enrolled course data with course details and enrollment info
 * @param {Object} props.data.Course - Course information including title, description, thumbnail
 * @param {string} props.data.Course.id - Unique course identifier
 * @param {string} props.data.Course.title - Course display title
 * @param {string} props.data.Course.smallDescription - Brief course summary
 * @param {string} props.data.Course.fileKey - S3/Tigris storage key for course thumbnail
 * @param {string} props.data.Course.slug - URL-friendly course identifier for navigation
 * @param {string} props.data.Course.level - Course difficulty level (Beginner, Intermediate, Advanced)
 *
 * @returns {JSX.Element} Interactive course progress card with thumbnail and progress indicators
 *
 * @example
 * <CourseProgressCard
 *   data={{
 *     Course: {
 *       id: "course-123",
 *       title: "React Fundamentals",
 *       smallDescription: "Learn React from basics to advanced concepts",
 *       fileKey: "thumbnails/react-course.jpg",
 *       slug: "react-fundamentals",
 *       level: "Beginner"
 *     }
 *   }}
 * />
 */
"use client";

import { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useConstructUrl } from "@/hooks/use-construct-url";
import { useCourseProgress } from "@/hooks/use-course-progress";

import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: EnrolledCourseType;
  agencySlug: string;
}

export function CourseProgressCard({ data, agencySlug }: iAppProps) {
  // Convert S3/Tigris storage key to full URL for image display
  const thumbnailUrl = useConstructUrl(data.Course.fileKey);

  // Calculate real-time course progress using existing hook
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: data.Course });

  return (
    <Card className="group relative py-0 gap-0 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:scale-[1.02] transform">
      {/* Course difficulty badge positioned absolutely over thumbnail */}
      <Badge className="absolute top-2 right-2 z-10 bg-primary/90 hover:bg-primary">
        {data.Course.level}
      </Badge>

      {/* Course thumbnail image with proper aspect ratio */}
      <Image
        width={600}
        height={400}
        className="w-full rounded-t-xl aspect-video h-full object-cover"
        src={thumbnailUrl}
        alt={`Thumbnail image for ${data.Course.title} course`}
      />

      <CardContent className="p-4">
        {/* Course title with hover effect and navigation */}
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/church/${agencySlug}/learning/${data.Course.slug}`}
        >
          {data.Course.title}
        </Link>

        {/* Course description with line clamping for consistent card heights */}
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {data.Course.smallDescription}
        </p>

        {/* Progress tracking section with visual indicators */}
        <div className="space-y-4 mt-5">
          {/* Progress percentage display */}
          <div className="flex justify-between mb-1 text-sm">
            <p className="text-muted-foreground">Progress:</p>
            <p className="font-medium text-primary">{progressPercentage}%</p>
          </div>

          {/* Visual progress bar with brand-consistent styling */}
          <Progress value={progressPercentage} className="h-1.5" />

          {/* Lesson completion statistics */}
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>

        {/* Navigation button to course lesson interface */}
        <Link
          href={`/church/${agencySlug}/learning/${data.Course.slug}`}
          className={buttonVariants({ className: "w-full mt-4" })}
        >
          Continue Learning
        </Link>
      </CardContent>
    </Card>
  );
}
