import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageContainer } from "@/components/layout/page-container";
import { AgencyLessonForm } from "./_components/AgencyLessonForm";
import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";

interface Props {
  params: Promise<{
    slug: string;
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>;
}

export default async function AgencyLessonEditPage({ params }: Props) {
  const { slug, courseId, chapterId, lessonId } = await params;

  // Verify agency admin access
  const { organization } = await requireAgencyAdmin(slug);

  // Get lesson with authorization check
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: {
        id: chapterId,
        Course: {
          id: courseId,
          organizationId: organization.id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      videoKey: true,
      thumbnailKey: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <PageContainer as="main">
      <h1 className="text-2xl font-bold mb-6">Edit Lesson</h1>
      <AgencyLessonForm
        lesson={lesson}
        chapterId={chapterId}
        courseId={courseId}
        agencySlug={slug}
      />
    </PageContainer>
  );
}
