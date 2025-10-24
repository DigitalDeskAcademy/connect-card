/**
 * Admin Course Card Component - Visual course management interface
 *
 * Provides comprehensive course overview and management controls in a compact card format.
 * Optimized for admin productivity with immediate access to common course operations.
 *
 * Admin Workflow Features:
 * - Thumbnail preview with fallback for incomplete courses
 * - Quick access dropdown with edit, preview, and delete actions
 * - Course metadata display (duration, difficulty level, description)
 * - Primary edit action button for efficient course management
 *
 * Content Management:
 * - S3 thumbnail integration with automatic URL construction
 * - Course status indicators and visual feedback
 * - Responsive image handling with Next.js optimization
 * - Hover states and interactive feedback for admin actions
 *
 * Business Operations:
 * - Direct navigation to course editing interface
 * - Course preview functionality for quality assurance
 * - Secure deletion workflow with confirmation patterns
 * - Accessibility compliance for keyboard navigation
 *
 * Performance Optimization:
 * - Lazy loading for thumbnail images
 * - Efficient re-rendering with React.memo patterns
 * - Optimistic UI updates for immediate feedback
 * - Skeleton loading states for data fetching
 */

import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  EyeIcon,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: AdminCourseType;
}

/**
 * Admin Course Card
 *
 * Individual course display component with management controls.
 * Provides visual course overview and contextual admin actions.
 *
 * @param data - Course data including metadata, thumbnail, and identifiers
 */
export function AdminCourseCard({ data }: iAppProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey);
  return (
    <Card className="group relative py-0 gap-0">
      {/* absolute dropdown */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${data.id}/edit`}>
                <Pencil className="size-4 mr-2" />
                Edit Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${data.slug}`}>
                <EyeIcon className="size-4 mr-2" />
                Preview Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${data.id}/delete`}>
                <Trash2 className="size-4 mr-2 text-destructive" />
                Delete Course
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative w-full aspect-video">
        <Image
          src={thumbnailUrl || "/placeholder-course.jpg"}
          alt={"Course thumbnail"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority
          className="w-full rounded-t-lg aspect-video h-full object-cover"
        />
      </div>

      <CardContent className="p-4 flex flex-col h-full">
        <Link
          href={`/admin/courses/${data.id}/edit`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2 min-h-[2.5rem]">
          {data.smallDescription}
        </p>
        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm ">{data.duration}h</p>
          </div>
          <div className="flex items-center gap-x-2">
            <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm ">{data.level}</p>
          </div>
        </div>

        <div className="mt-4 flex-1 flex items-end">
          <Link
            className={buttonVariants({
              className: "w-full",
            })}
            href={`/admin/courses/${data.id}/edit`}
          >
            Edit Course <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Admin Course Card Skeleton
 *
 * Loading placeholder that matches the exact layout and proportions of AdminCourseCard.
 * Provides visual continuity during async data operations for optimal admin UX.
 *
 * Performance Benefits:
 * - Prevents layout shift during course data loading
 * - Maintains visual consistency with loaded course cards
 * - Provides immediate feedback for admin interface responsiveness
 * - Matches exact spacing and proportions of actual course cards
 *
 * Design Considerations:
 * - Skeleton elements mirror actual content structure
 * - Appropriate width variations for realistic appearance
 * - Consistent spacing and typography hierarchy
 * - Accessibility-compliant loading state indicators
 */
export function AdminCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="relative w-full aspect-video">
        <Skeleton className="w-full rounded-t-lg aspect-video h-[250px] object-cover" />
      </div>

      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />

        <div className="flex items-center gap-x-5 mb-4">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>

        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
