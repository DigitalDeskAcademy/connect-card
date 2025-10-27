/**
 * Agency Admin Preview Landing Page
 *
 * Redirects to the first lesson of the course when accessing preview without a specific lesson.
 * Maintains admin context throughout the navigation.
 */

import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { prisma } from "@/lib/db";

type Params = Promise<{
  slug: string;
  courseSlug: string;
}>;

export default async function AgencyAdminPreviewPage({
  params,
}: {
  params: Params;
}) {
  const { slug, courseSlug } = await params;

  // Verify agency admin access
  const { organization } = await requireAgencyAdmin(slug);

  // Get first lesson from course
  // Platform courses (organizationId = null) are accessible to all agencies
  // Agency courses must belong to this organization
  const course = await prisma.course.findFirst({
    where: {
      slug: courseSlug,
      OR: [
        { organizationId: null }, // Platform courses
        { organizationId: organization.id }, // This agency's courses
      ],
    },
    include: {
      chapter: {
        orderBy: { position: "asc" },
        take: 1,
        include: {
          lessons: {
            orderBy: { position: "asc" },
            take: 1,
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const firstLessonId = course?.chapter[0]?.lessons[0]?.id;

  if (firstLessonId) {
    redirect(`/agency/${slug}/admin/preview/${courseSlug}/${firstLessonId}`);
  }

  return (
    <PageContainer variant="fill">
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">This course has no lessons yet.</p>
      </div>
    </PageContainer>
  );
}
