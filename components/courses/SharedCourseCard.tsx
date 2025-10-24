/**
 * Shared Course Card Component
 *
 * Unified course display component that works for all user roles.
 * Replaces duplicate implementations across platform and agency routes.
 *
 * Features:
 * - Single source of truth for course card UI
 * - Role-based actions (edit/delete for admins, start learning for users)
 * - Platform course indicators (lock icon for read-only)
 * - Consistent visual structure across all contexts
 *
 * This component follows the component-based composition pattern to eliminate
 * code duplication between platform and agency admin interfaces.
 */

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  BookOpen,
  EyeIcon,
  EyeOff,
  Heart,
  Lock,
  MoreVertical,
  Pencil,
  School,
  Share2,
  TimerIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleCourseVisibility } from "@/app/agency/[slug]/admin/courses/[courseId]/edit/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type UserRole = "platform_admin" | "agency_admin" | "user";

// Define a minimal course type that works with both full courses and admin courses
interface MinimalCourse {
  id: string;
  title: string;
  slug: string;
  smallDescription: string;
  fileKey: string;
  duration: number;
  level: string;
  isHiddenFromClients?: boolean;
}

interface SharedCourseCardProps {
  data: MinimalCourse;
  userRole: UserRole;
  context: {
    orgSlug?: string; // Required for agency routes
    isPlatformCourse?: boolean; // Whether this is a platform core course
    isOwnCourse?: boolean; // For agency admins, whether they own this course
  };
}

/**
 * Shared Course Card
 *
 * Renders a course card with appropriate actions based on user role and context.
 * Platform admins can edit all courses, agency admins can edit their own courses,
 * and users get a "Start Learning" button.
 *
 * @param data - Course data from database
 * @param userRole - The role of the current user
 * @param context - Additional context for determining actions and routes
 */
export function SharedCourseCard({
  data,
  userRole,
  context,
}: SharedCourseCardProps) {
  const constructedUrl = useConstructUrl(data.fileKey);
  const thumbnailUrl =
    !data.fileKey || data.fileKey === ""
      ? "/Thumbnail-Placeholder.png"
      : constructedUrl;
  const { orgSlug, isPlatformCourse = false, isOwnCourse = false } = context;

  const router = useRouter();
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Determine the primary link destination based on role
  const getPrimaryLink = () => {
    switch (userRole) {
      case "platform_admin":
        return `/platform/admin/courses/${data.id}/edit`;
      case "agency_admin":
        if (isOwnCourse) {
          return `/agency/${orgSlug}/admin/courses/${data.id}/edit`;
        } else {
          // Platform courses are view-only for agency admins
          return `/agency/${orgSlug}/courses/${data.slug}`;
        }
      case "user":
        // Users go directly to the course learning page
        return `/agency/${orgSlug}/courses/${data.slug}`;
      default:
        return "#";
    }
  };

  // Check if course is hidden
  const isHidden = data.isHiddenFromClients || false;

  // Determine which actions to show based on role and context
  // Now all roles get a dropdown menu with different options
  const showDropdownMenu = true;

  return (
    <Card
      className={`group relative py-0 gap-0 ${isHidden && userRole === "agency_admin" ? "opacity-60" : ""}`}
    >
      {/* Platform course badge - shown for non-owners */}
      {isPlatformCourse && userRole !== "platform_admin" && (
        <Badge className="absolute top-2 left-2 z-10" variant="secondary">
          Platform Course
        </Badge>
      )}

      {/* Hidden badge - shown to agency admins when course is hidden */}
      {isHidden && userRole === "agency_admin" && (
        <Badge className="absolute top-2 left-2 z-10" variant="destructive">
          <EyeOff className="size-3 mr-1" />
          Hidden
        </Badge>
      )}

      {/* Action dropdown - all roles get menu with different options */}
      {showDropdownMenu && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Platform Admin Options */}
              {userRole === "platform_admin" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/platform/admin/courses/${data.id}/edit`}>
                      <Pencil className="size-4 mr-2" />
                      Edit Course
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/platform/admin/preview/${data.slug}`}>
                      <EyeIcon className="size-4 mr-2" />
                      Preview Course
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/platform/admin/courses/${data.id}/delete`}>
                      <Trash2 className="size-4 mr-2 text-destructive" />
                      Delete Course
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Agency Admin Options */}
              {userRole === "agency_admin" && (
                <>
                  {isOwnCourse && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/agency/${orgSlug}/admin/courses/${data.id}/edit`}
                        >
                          <Pencil className="size-4 mr-2" />
                          Edit Course
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/agency/${orgSlug}/admin/preview/${data.slug}`}
                    >
                      <EyeIcon className="size-4 mr-2" />
                      Preview Course
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      if (isOwnCourse && orgSlug) {
                        setIsTogglingVisibility(true);
                        const result = await toggleCourseVisibility(
                          orgSlug,
                          data.id
                        );
                        if (result.status === "success") {
                          toast.success(result.message);
                          router.refresh();
                        } else {
                          toast.error(result.message);
                        }
                        setIsTogglingVisibility(false);
                      }
                    }}
                    disabled={!isOwnCourse || isTogglingVisibility}
                  >
                    {isHidden ? (
                      <>
                        <EyeIcon className="size-4 mr-2" />
                        Show to Users
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-4 mr-2" />
                        Hide from Users
                      </>
                    )}
                  </DropdownMenuItem>
                  {isOwnCourse && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/agency/${orgSlug}/admin/courses/${data.id}/delete`}
                        >
                          <Trash2 className="size-4 mr-2 text-destructive" />
                          Delete Course
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}

              {/* End User Options */}
              {userRole === "user" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/agency/${orgSlug}/learning/${data.slug}`}>
                      <BookOpen className="size-4 mr-2" />
                      Start Learning
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Heart className="size-4 mr-2" />
                    Add to Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="size-4 mr-2" />
                    Share Course
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Course thumbnail */}
      <div className="relative w-full aspect-video">
        <Image
          src={thumbnailUrl}
          alt={`${data.title} thumbnail`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority
          className="w-full rounded-t-lg aspect-video h-full object-cover"
        />
        {isPlatformCourse && userRole === "agency_admin" && (
          <div className="absolute inset-0 bg-black/5 rounded-t-lg" />
        )}
      </div>

      <CardContent className="p-4 flex flex-col h-full">
        {/* Course title - links to appropriate destination */}
        <Link
          href={getPrimaryLink()}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="line-clamp-3 text-sm text-muted-foreground leading-tight mt-2 min-h-[3.75rem] cursor-help">
                {data.smallDescription}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{data.smallDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

        {/* Action button - varies by role */}
        <div className="mt-4 flex-1 flex items-end">
          {userRole === "user" ? (
            <Link
              className={buttonVariants({
                className: "w-full",
              })}
              href={`/agency/${orgSlug}/learning/${data.slug}`}
            >
              <BookOpen className="size-4 mr-2" />
              Start Learning
            </Link>
          ) : userRole === "agency_admin" && isPlatformCourse ? (
            <Link
              className={buttonVariants({
                variant: "secondary",
                className: "w-full",
              })}
              href={`/agency/${orgSlug}/learning/${data.slug}`}
            >
              <Lock className="size-4 mr-2" />
              View Only
            </Link>
          ) : (
            <Link
              className={buttonVariants({
                className: "w-full",
              })}
              href={getPrimaryLink()}
            >
              Edit Course <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
