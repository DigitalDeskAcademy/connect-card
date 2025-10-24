"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";

import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const user = await requireAdmin();

  try {
    // Admin users can delete any course, others need ownership
    const whereClause =
      user.user.role === "PLATFORM_ADMIN"
        ? { id: courseId }
        : { id: courseId, userId: user.user.id };

    await prisma.course.delete({
      where: whereClause,
    });

    revalidatePath("/admin/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch {
    // Error will be handled by the UI layer - no console logging needed in production
    return {
      status: "error",
      message: "Failed to delete Course!",
    };
  }
}
