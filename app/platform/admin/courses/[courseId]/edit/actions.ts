"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
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

export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const user = await requireAdmin();

  const req = await request();
  await aj.protect(req, {
    fingerprint: user.user.id,
  });

  try {
    const result = courseSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Admin users can edit any course, others need ownership
    const whereClause =
      user.user.role === "platform_admin"
        ? { id: courseId }
        : { id: courseId, userId: user.user.id };

    await prisma.course.update({
      where: whereClause,
      data: {
        ...result.data,
      },
    });

    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath("/admin/courses");

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

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons to reorder",
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

    revalidatePath(`/admin/courses/${courseId}/edit`);

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

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters to reorder",
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
    revalidatePath(`/admin/courses/${courseId}/edit`);
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

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
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

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

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

export async function createLesson(values: LessonSchemaType): Promise<
  ApiResponse<{
    lessonId: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  }>
> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
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

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

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

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    // Step 1: Get lesson data for S3 cleanup
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

    revalidatePath(`/admin/courses/${courseId}/edit`);

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

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
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

    revalidatePath(`/admin/courses/${courseId}/edit`);

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
