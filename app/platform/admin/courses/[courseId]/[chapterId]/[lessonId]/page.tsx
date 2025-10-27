import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageContainer } from "@/components/layout/page-container";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PlatformLessonForm } from "./_components/PlatformLessonForm";

interface Props {
  params: Promise<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>;
}

/**
 * Platform Admin Lesson Edit Page
 *
 * Enterprise pattern: Direct Prisma query with security checks
 * Matches agency admin pattern for consistency
 */
export default async function LessonIdPage({ params }: Props) {
  const { courseId, chapterId, lessonId } = await params;

  // Verify admin access
  await requireAdmin();

  // Get lesson with chapter relation
  // courseId from URL is the actual UUID (not a slug)
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: {
        id: chapterId,
        Course: {
          id: courseId, // courseId from URL is the UUID
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      videoKey: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <PageContainer as="main">
      <h1 className="text-2xl font-bold mb-6">Edit Lesson</h1>
      <PlatformLessonForm
        lesson={lesson}
        chapterId={chapterId}
        courseId={courseId}
      />
    </PageContainer>
  );
}
