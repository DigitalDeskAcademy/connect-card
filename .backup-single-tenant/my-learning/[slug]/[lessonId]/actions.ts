"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    revalidatePath(`/my-learning/${slug}`);
    revalidatePath(`/my-learning/${slug}/${lessonId}`);

    return {
      status: "success",
      message: "Lesson completed successfully!",
    };
  } catch {
    // Error will be handled by the UI layer - no console logging needed in production
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}

export async function markLessonIncomplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.delete({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
    });

    revalidatePath(`/my-learning/${slug}`);
    revalidatePath(`/my-learning/${slug}/${lessonId}`);

    return {
      status: "success",
      message: "Lesson marked as incomplete",
    };
  } catch {
    // Error will be handled by the UI layer - no console logging needed in production
    return {
      status: "error",
      message: "Failed to mark lesson as incomplete",
    };
  }
}
