"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Rate limiting per CODING_PATTERNS.md
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10, // Slightly higher for lesson progress
  })
);

export async function markLessonComplete(
  lessonId: string,
  courseSlug: string,
  orgSlug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  // Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }
    return {
      status: "error",
      message: "Request blocked. Please try again.",
    };
  }

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

    // Revalidate the lesson page and learning dashboard
    revalidatePath(`/church/${orgSlug}/learning/${courseSlug}/${lessonId}`);
    revalidatePath(`/church/${orgSlug}/learning`);

    return {
      status: "success",
      message: "Lesson completed successfully!",
    };
  } catch {
    // Generic error per CODING_PATTERNS.md
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}

export async function markLessonIncomplete(
  lessonId: string,
  courseSlug: string,
  orgSlug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  // Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }
    return {
      status: "error",
      message: "Request blocked. Please try again.",
    };
  }

  try {
    await prisma.lessonProgress.delete({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
    });

    // Revalidate the lesson page and learning dashboard
    revalidatePath(`/church/${orgSlug}/learning/${courseSlug}/${lessonId}`);
    revalidatePath(`/church/${orgSlug}/learning`);

    return {
      status: "success",
      message: "Lesson marked as incomplete",
    };
  } catch {
    // Generic error per CODING_PATTERNS.md
    return {
      status: "error",
      message: "Failed to mark lesson as incomplete",
    };
  }
}
