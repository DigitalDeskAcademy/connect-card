/**
 * Platform Admin Preview Course Page
 *
 * Redirects to first lesson, matching agency pattern.
 */

import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { prisma } from "@/lib/db";

interface PlatformPreviewPageProps {
  params: Promise<{ courseSlug: string }>;
}

export default async function PlatformPreviewPage({
  params,
}: PlatformPreviewPageProps) {
  const { courseSlug } = await params;

  // Get first lesson of course
  const course = await prisma.course.findFirst({
    where: {
      slug: courseSlug,
      organizationId: null, // Platform courses only
    },
    include: {
      chapter: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Find first lesson
  const firstLesson = course.chapter[0]?.lessons[0];
  if (firstLesson) {
    redirect(`/platform/admin/preview/${courseSlug}/${firstLesson.id}`);
  }

  // If no lessons, show empty state
  return (
    <PageContainer variant="fill">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No lessons available</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This course doesn&apos;t have any lessons yet.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
