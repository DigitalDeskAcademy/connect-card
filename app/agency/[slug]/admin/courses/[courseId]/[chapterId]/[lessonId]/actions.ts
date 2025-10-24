"use server";

import { prisma } from "@/lib/db";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";

/**
 * Update lesson - Agency version with organization scoping
 */
export async function updateLesson(values: LessonSchemaType, lessonId: string) {
  try {
    // Get agency slug from the lesson's course organization
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        Chapter: {
          select: {
            Course: {
              select: {
                organization: {
                  select: { slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson?.Chapter?.Course?.organization?.slug) {
      return {
        status: "error" as const,
        message: "Lesson not found or not associated with an agency",
      };
    }

    const orgSlug = lesson.Chapter.Course.organization.slug;

    // Verify agency admin access
    const { organization } = await requireAgencyAdmin(orgSlug);

    // Validate input
    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error" as const,
        message: result.error.errors[0].message,
      };
    }

    // Verify the lesson belongs to this organization's course
    const lessonCheck = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: {
          Course: {
            organizationId: organization.id,
          },
        },
      },
    });

    if (!lessonCheck) {
      return {
        status: "error" as const,
        message: "You don't have permission to edit this lesson",
      };
    }

    // Update the lesson
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: result.data.name,
        description: result.data.description ?? null,
        videoKey: result.data.videoKey ?? null,
      },
    });

    revalidatePath(
      `/agency/${orgSlug}/admin/courses/${result.data.courseId}/edit`
    );
    revalidatePath(`/agency/${orgSlug}/learning`);

    return {
      status: "success" as const,
      message: "Lesson updated successfully",
    };
  } catch {
    return {
      status: "error" as const,
      message: "Failed to update lesson",
    };
  }
}
