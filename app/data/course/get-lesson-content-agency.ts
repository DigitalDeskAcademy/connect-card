import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "../organization/get-organization-by-slug";

/**
 * Agency version of getLessonContent
 *
 * Key changes from original:
 * - NO enrollment check (users have automatic access)
 * - Added organization context verification
 * - Everything else stays the same
 */
export async function getLessonContentForAgency(
  lessonId: string,
  orgSlug: string
) {
  const session = await requireUser();

  // Get organization
  const organization = await getOrganizationBySlug(orgSlug);
  if (!organization) {
    return notFound();
  }

  // Verify user belongs to this organization
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      organizationId: true,
    },
  });

  if (user?.organizationId !== organization.id) {
    return notFound();
  }

  // SAME query as original - no changes here
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      position: true,
      lessonProgress: {
        where: {
          userId: session.id,
        },
        select: {
          completed: true,
          lessonId: true,
        },
      },
      Chapter: {
        select: {
          courseId: true,
          Course: {
            select: {
              slug: true,
              organizationId: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  // Verify course is available to this agency
  // Platform courses (organizationId: null) are available to all
  // Agency courses must match user's organization
  const courseOrgId = lesson.Chapter.Course.organizationId;
  if (courseOrgId !== null && courseOrgId !== organization.id) {
    return notFound();
  }

  // NO ENROLLMENT CHECK - This is the key difference!
  // Original had:
  // const enrollment = await prisma.enrollment.findUnique({...})
  // if (!enrollment || enrollment.status !== "Active") { notFound() }

  return lesson;
}

export type LessonContentType = Awaited<
  ReturnType<typeof getLessonContentForAgency>
>;
