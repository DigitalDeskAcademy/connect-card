"use server";

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
  LessonSchemaType,
} from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { cleanupLessonFiles } from "@/lib/s3-cleanup";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Edit agency course with multi-tenant security
 */
export async function editAgencyCourse(
  slug: string,
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const { session, organization } = await requireAgencyAdmin(slug);

  const req = await request();
  await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}`,
  });

  try {
    const result = courseSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // CRITICAL: Ensure course belongs to the agency
    await prisma.course.update({
      where: {
        id: courseId,
        organizationId: organization.id, // Multi-tenant security
      },
      data: {
        ...result.data,
      },
    });

    revalidatePath(`/agency/${slug}/admin/courses/${courseId}/edit`);
    revalidatePath(`/agency/${slug}/admin/courses`);

    return {
      status: "success",
      message: "Course Saved Successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course",
    };
  }
}

/**
 * Reorder lessons within a chapter
 */
export async function reorderLessons(
  slug: string,
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons to reorder",
      };
    }

    // Verify chapter belongs to organization's course
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        Course: {
          organizationId: organization.id,
        },
      },
    });

    if (!chapter) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const updates = lessons.map(lesson =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/agency/${slug}/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons",
    };
  }
}

/**
 * Reorder chapters within a course
 */
export async function reorderChapters(
  slug: string,
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters to reorder",
      };
    }

    // Verify course belongs to organization
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId: organization.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const updates = chapters.map(chapter =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
        },
        data: {
          position: chapter.position,
        },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/agency/${slug}/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

/**
 * Create a new chapter for agency course
 */
export async function createChapter(
  slug: string,
  values: ChapterSchemaType
): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Verify course belongs to organization
    const course = await prisma.course.findFirst({
      where: {
        id: result.data.courseId,
        organizationId: organization.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    await prisma.$transaction(async tx => {
      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.chapter.create({
        data: {
          title: result.data.name,
          slug: slugify(result.data.name, { lower: true, strict: true }),
          courseId: result.data.courseId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(
      `/agency/${slug}/admin/courses/${result.data.courseId}/edit`
    );

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

/**
 * Create a new lesson for agency course
 */
export async function createLesson(
  slug: string,
  values: LessonSchemaType
): Promise<
  ApiResponse<{
    lessonId: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  }>
> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    // Verify chapter belongs to organization's course
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: result.data.chapterId,
        Course: {
          organizationId: organization.id,
        },
      },
    });

    if (!chapter) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const createdLesson = await prisma.$transaction(async tx => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      return await tx.lesson.create({
        data: {
          title: result.data.name,
          slug: slugify(result.data.name, { lower: true, strict: true }),
          description: result.data.description,
          videoKey: result.data.videoKey,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
        select: {
          id: true,
          title: true,
          description: true,
          videoKey: true,
        },
      });
    });

    revalidatePath(
      `/agency/${slug}/admin/courses/${result.data.courseId}/edit`
    );

    return {
      status: "success",
      message: "Lesson created successfully",
      data: {
        lessonId: createdLesson.id,
        title: createdLesson.title,
        description: createdLesson.description,
        videoKey: createdLesson.videoKey,
      },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

/**
 * Delete a lesson from agency course
 */
export async function deleteLesson({
  slug,
  chapterId,
  courseId,
  lessonId,
}: {
  slug: string;
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    // Step 1: Verify ownership and get lesson data for S3 cleanup
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId: organization.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        slug: true,
        videoKey: true,
        thumbnailKey: true,
        s3Prefix: true,
        Chapter: {
          select: {
            slug: true,
            id: true,
            Course: {
              select: {
                slug: true,
                id: true,
                organizationId: true,
                organization: {
                  select: {
                    slug: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    // Step 2: Clean up S3 files
    const s3Result = await cleanupLessonFiles(lesson);

    if (s3Result.errors > 0) {
      console.warn(
        `S3 cleanup had ${s3Result.errors} errors:`,
        s3Result.errorDetails
      );
    }

    // Step 3: Continue with existing reorder logic
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const lessons = chapterWithLessons.lessons;
    const remaingLessons = lessons.filter(lesson => lesson.id !== lessonId);

    const updates = remaingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);

    revalidatePath(`/agency/${slug}/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: `Lesson deleted (${s3Result.deleted} files cleaned)`,
    };
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

/**
 * Delete a chapter from agency course
 */
export async function deleteChapter({
  slug,
  chapterId,
  courseId,
}: {
  slug: string;
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  try {
    // Step 1: Get all lessons in chapter for S3 cleanup
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        lessons: {
          select: {
            id: true,
            slug: true,
            videoKey: true,
            thumbnailKey: true,
            s3Prefix: true,
            Chapter: {
              select: {
                slug: true,
                id: true,
                Course: {
                  select: {
                    slug: true,
                    id: true,
                    organizationId: true,
                    organization: {
                      select: {
                        slug: true,
                        id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!chapter) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    // Step 2: Clean up S3 files for all lessons in chapter
    let totalDeleted = 0;
    let totalErrors = 0;

    for (const lesson of chapter.lessons) {
      const s3Result = await cleanupLessonFiles(lesson);
      totalDeleted += s3Result.deleted;
      totalErrors += s3Result.errors;

      if (s3Result.errors > 0) {
        console.warn(
          `Lesson ${lesson.id} cleanup errors:`,
          s3Result.errorDetails
        );
      }
    }

    // Step 3: Continue with existing reorder logic
    const courseWithChapters = await prisma.course.findUnique({
      where: {
        id: courseId,
        organizationId: organization.id, // Multi-tenant security
      },
      select: {
        chapter: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const chapters = courseWithChapters.chapter;
    const remaingChapters = chapters.filter(
      chapter => chapter.id !== chapterId
    );

    const updates = remaingChapters.map((chapter, index) => {
      return prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);

    revalidatePath(`/agency/${slug}/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: `Chapter deleted (${totalDeleted} files cleaned, ${totalErrors} errors)`,
    };
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    return {
      status: "error",
      message: "Failed to delete Chapter",
    };
  }
}

/**
 * Toggle course visibility for agency clients
 */
export async function toggleCourseVisibility(
  slug: string,
  courseId: string
): Promise<ApiResponse> {
  const { session, organization } = await requireAgencyAdmin(slug);

  const req = await request();
  await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}`,
  });

  try {
    // Get current course visibility state
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId: organization.id, // Multi-tenant security
      },
      select: {
        isHiddenFromClients: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // Toggle the visibility
    await prisma.course.update({
      where: {
        id: courseId,
        organizationId: organization.id,
      },
      data: {
        isHiddenFromClients: !course.isHiddenFromClients,
      },
    });

    revalidatePath(`/agency/${slug}/admin/courses`);
    revalidatePath(`/agency/${slug}/learning/courses`);

    return {
      status: "success",
      message: course.isHiddenFromClients
        ? "Course is now visible to users"
        : "Course is now hidden from users",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course visibility",
    };
  }
}
