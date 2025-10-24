/**
 * Agency Course Card Component
 *
 * Displays courses in the agency admin portal with proper access control.
 * Platform courses are read-only, while agency custom courses are fully editable.
 *
 * Features:
 * - Visual distinction between platform and custom courses
 * - Read-only mode for platform courses (no edit/delete actions)
 * - Full CRUD operations for agency custom courses
 * - Agency-specific routing for course management
 * - Badge indicators for course type
 */

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  EyeIcon,
  Lock,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/generated/prisma";

interface AgencyCourseCardProps {
  data: Course;
  agencySlug: string;
  isPlatformCourse?: boolean;
}

/**
 * Agency Course Card
 *
 * Renders a course card with appropriate actions based on course ownership.
 * Platform courses show a lock icon and preview-only actions.
 * Custom courses show full management options with agency-specific routing.
 *
 * @param data - Course data from database
 * @param agencySlug - Agency slug for URL construction
 * @param isPlatformCourse - Whether this is a platform core course
 */
export function AgencyCourseCard({
  data,
  agencySlug,
  isPlatformCourse = false,
}: AgencyCourseCardProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey);

  return (
    <Card className="group relative py-0 gap-0">
      {/* Platform course badge */}
      {isPlatformCourse && (
        <Badge className="absolute top-2 left-2 z-10" variant="secondary">
          Platform Course
        </Badge>
      )}

      {/* Action dropdown - only for custom courses */}
      {!isPlatformCourse && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href={`/agency/${agencySlug}/admin/courses/${data.id}/edit`}
                >
                  <Pencil className="size-4 mr-2" />
                  Edit Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/agency/${agencySlug}/courses/${data.slug}`}>
                  <EyeIcon className="size-4 mr-2" />
                  Preview Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/agency/${agencySlug}/admin/courses/${data.id}/delete`}
                >
                  <Trash2 className="size-4 mr-2 text-destructive" />
                  Delete Course
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Preview-only button for platform courses */}
      {isPlatformCourse && (
        <div className="absolute top-2 right-2 z-10">
          <Link href={`/agency/${agencySlug}/courses/${data.slug}`}>
            <Button variant="secondary" size="icon" title="Preview course">
              <EyeIcon className="size-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Course thumbnail */}
      <div className="relative w-full aspect-video">
        <Image
          src={thumbnailUrl || "/placeholder-course.jpg"}
          alt={`${data.title} thumbnail`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority
          className="w-full rounded-t-lg aspect-video h-full object-cover"
        />
        {isPlatformCourse && (
          <div className="absolute inset-0 bg-black/5 rounded-t-lg" />
        )}
      </div>

      <CardContent className="p-4 flex flex-col h-full">
        {/* Course title - links to edit for custom, preview for platform */}
        <Link
          href={
            isPlatformCourse
              ? `/agency/${agencySlug}/courses/${data.slug}`
              : `/agency/${agencySlug}/admin/courses/${data.id}/edit`
          }
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2 min-h-[2.5rem]">
          {data.smallDescription}
        </p>

        {/* Course metadata */}
        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm">{data.duration}h</p>
          </div>
          <div className="flex items-center gap-x-2">
            <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm">{data.level}</p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-4 flex-1 flex items-end">
          {isPlatformCourse ? (
            <Link
              className={buttonVariants({
                variant: "secondary",
                className: "w-full",
              })}
              href={`/agency/${agencySlug}/courses/${data.slug}`}
            >
              <Lock className="size-4 mr-2" />
              View Only
            </Link>
          ) : (
            <Link
              className={buttonVariants({
                className: "w-full",
              })}
              href={`/agency/${agencySlug}/admin/courses/${data.id}/edit`}
            >
              Edit Course <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
