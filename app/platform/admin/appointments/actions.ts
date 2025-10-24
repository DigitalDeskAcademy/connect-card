"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Appointment schema for validation
 */
const appointmentSchema = z.object({
  contactId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  timezone: z.string().default("UTC"),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

/**
 * Rate limiting for appointment operations
 * 10 requests per minute per admin
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

// NOTE: Appointment fetching moved to /app/data/admin/admin-get-appointments.ts
// following the courses pattern. This actions file is only for mutations (create/update/delete).

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: AppointmentInput & { organizationId: string }
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }

    const validation = appointmentSchema.safeParse(data);

    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid appointment data",
      };
    }

    await prisma.appointment.create({
      data: {
        ...validation.data,
        organizationId: data.organizationId,
        startTime: new Date(validation.data.startTime),
        endTime: new Date(validation.data.endTime),
        timezone: validation.data.timezone || "UTC",
        status: "SCHEDULED",
      },
    });

    revalidatePath("/platform/admin/appointments");

    return {
      status: "success",
      message: "Appointment created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create appointment",
    };
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  appointmentId: string,
  data: Partial<AppointmentInput>
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existingAppointment) {
      return {
        status: "error",
        message: "Appointment not found",
      };
    }

    const updateData: {
      title?: string;
      description?: string;
      startTime?: Date;
      endTime?: Date;
      location?: string;
      contactId?: string;
    } = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.contactId) updateData.contactId = data.contactId;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    revalidatePath("/platform/admin/appointments");

    return {
      status: "success",
      message: "Appointment updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update appointment",
    };
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(
  appointmentId: string
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    revalidatePath("/platform/admin/appointments");

    return {
      status: "success",
      message: "Appointment deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete appointment",
    };
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    revalidatePath("/platform/admin/appointments");

    return {
      status: "success",
      message: "Appointment status updated",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update status",
    };
  }
}
