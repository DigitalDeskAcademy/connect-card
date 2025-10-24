/**
 * User Enrollment Verification Module
 *
 * This module handles checking user enrollment status for courses.
 * Used to determine access rights and display appropriate UI elements
 * (e.g., "Watch Course" vs "Enroll Now" buttons)
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Checks if the current user has an active enrollment for a specific course
 *
 * This function is used to:
 * - Determine if user can access course content
 * - Show correct CTA buttons (Watch vs Enroll)
 * - Gate access to course materials
 *
 * @param courseId - The database ID of the course to check
 * @returns true if user has active enrollment, false otherwise
 *
 * @example
 * const canAccess = await checkIfCoursePurchased(courseId);
 * if (canAccess) {
 *   // Show course content
 * } else {
 *   // Show enrollment/payment options
 * }
 */
export async function checkIfCoursePurchased(
  courseId: string
): Promise<boolean> {
  // Retrieve current user session
  // Using Next.js headers for server component compatibility
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // No session = not enrolled (guest users)
  if (!session?.user) return false;

  // Query enrollment table for this specific user-course combination
  // Using composite unique key (userId_courseId) for efficient lookup
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        courseId: courseId,
        userId: session.user.id,
      },
    },
    select: {
      status: true, // Only fetch status field to minimize data transfer
    },
  });

  // Check for active enrollment status
  // Other statuses like "Pending" or "Cancelled" don't grant access
  // TODO: Consider handling different enrollment statuses for better UX
  // e.g., "Pending" could show "Payment Processing" message
  return enrollment?.status === "Active" ? true : false;
}
