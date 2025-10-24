/**
 * Admin Appointments Data Layer
 *
 * Provides type-safe, authenticated access to appointment data for admin interfaces.
 * Follows the same pattern as admin-get-courses.ts
 */

import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

/**
 * Fetches all appointments for admin management interface
 *
 * Retrieves appointments with contact information for administrative
 * operations and calendar management.
 *
 * @param organizationId - Optional filter by organization
 */
export async function adminGetAppointments(organizationId?: string) {
  await requireAdmin();

  const where = organizationId ? { organizationId } : {};

  const data = await prisma.appointment.findMany({
    where,
    orderBy: {
      startTime: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      status: true,
      location: true,
      calendarProvider: true,
      churchMember: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    take: 500, // Limit for performance
  });

  return data;
}

/**
 * Type Definition - Admin Appointment Interface
 *
 * Automatically inferred TypeScript type from the function return value.
 * Ensures type safety across admin components.
 */
export type AdminAppointmentType = Awaited<
  ReturnType<typeof adminGetAppointments>
>[0];
