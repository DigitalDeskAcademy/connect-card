/**
 * Compact Course Card Component
 *
 * A smaller variant of the course card for use in dashboard widgets
 * and preview sections. Features thumbnail, title, and key metadata.
 *
 * This component is optimized for grid layouts in constrained spaces
 * while maintaining visual consistency with the full SharedCourseCard.
 */

import { useConstructUrl } from "@/hooks/use-construct-url";
import { School, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CompactCourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    smallDescription: string;
    fileKey: string;
    duration: number;
    level: string;
  };
  href: string;
}

/**
 * Compact Course Card
 *
 * Displays a clickable course preview with thumbnail and essential info.
 * Perfect for dashboard widgets and "Discover" sections.
 *
 * @param course - Minimal course data
 * @param href - Where clicking the card should navigate
 */
export function CompactCourseCard({ course, href }: CompactCourseCardProps) {
  const constructedUrl = useConstructUrl(course.fileKey);
  const thumbnailUrl =
    !course.fileKey || course.fileKey === ""
      ? "/Thumbnail-Placeholder.png"
      : constructedUrl;

  return (
    <Link href={href} className="group block space-y-2">
      {/* Thumbnail with aspect ratio */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <Image
          src={thumbnailUrl}
          alt={`${course.title} thumbnail`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Course info */}
      <div className="space-y-1">
        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {course.title}
        </h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground line-clamp-3 cursor-help">
                {course.smallDescription}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{course.smallDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            <School className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {course.level}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TimerIcon className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {course.duration}h
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
