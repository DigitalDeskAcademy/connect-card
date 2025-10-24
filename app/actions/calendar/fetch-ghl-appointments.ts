/**
 * Server Action: Fetch GHL Appointments
 *
 * Fetches appointments from GoHighLevel for all contacts in an organization.
 * Transforms GHL appointment data to FullCalendar event format.
 */

"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { getGHLAccessToken } from "@/lib/ghl-token";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Rate limiting - 10 calendar fetches per minute
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO 8601 format
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    contactId: string;
    contactName: string;
    appointmentStatus: string;
    address?: string;
    notes?: string;
    description?: string;
    assignedUserId?: string;
    calendarId?: string;
    locationId?: string;
  };
};

type GHLAppointment = {
  id: string;
  calendarId: string;
  status: string;
  title: string;
  assignedUserId: string;
  notes?: string;
  startTime: string;
  endTime: string;
  address?: string;
  locationId: string;
  contactId: string;
  groupId?: string;
  appointmentStatus: string;
  users?: string[];
  dateAdded: string;
  dateUpdated: string;
};

/**
 * Fetch appointments from GHL for an organization
 * @param startDate - Start date for filtering (ISO format)
 * @param endDate - End date for filtering (ISO format)
 */
export async function fetchGHLAppointments(
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  events?: CalendarEvent[];
  error?: string;
}> {
  try {
    // 1. Authentication check
    const session = await requireAdmin();

    // 2. Rate limiting
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait before refreshing.",
      };
    }

    // 3. Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return {
        success: false,
        error: "No organization found",
      };
    }

    // 4. Get GHL access token
    const accessToken = await getGHLAccessToken(user.organizationId);

    if (!accessToken) {
      return {
        success: false,
        error: "GHL not connected. Please connect GoHighLevel first.",
      };
    }

    // 5. Get all contacts for the organization (with GHL integration)
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        integrations: {
          some: {
            provider: "ghl",
          },
        },
      },
      include: {
        integrations: {
          where: { provider: "ghl" },
        },
      },
    });

    if (contacts.length === 0) {
      return {
        success: true,
        events: [],
      };
    }

    // 6. Fetch appointments for each contact from GHL API
    const allAppointments: CalendarEvent[] = [];

    // Process contacts in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      const batchPromises = batch.map(async contact => {
        const ghlContactId = contact.integrations[0]?.externalId;
        if (!ghlContactId) return [];

        try {
          const response = await fetch(
            `https://services.leadconnectorhq.com/contacts/${ghlContactId}/appointments`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: "2021-07-28",
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(
              `Failed to fetch appointments for contact ${ghlContactId}:`,
              response.status
            );
            return [];
          }

          const data = await response.json();
          const appointments: GHLAppointment[] = data.events || [];

          // Filter by date range if provided
          const filteredAppointments = appointments.filter(apt => {
            if (!startDate && !endDate) return true;

            const aptStart = new Date(apt.startTime);
            if (startDate && aptStart < new Date(startDate)) return false;
            if (endDate && aptStart > new Date(endDate)) return false;

            return true;
          });

          // Transform to FullCalendar format
          return filteredAppointments.map(apt =>
            transformGHLToCalendarEvent(apt, contact.name)
          );
        } catch (error) {
          console.error(
            `Error fetching appointments for contact ${ghlContactId}:`,
            error
          );
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allAppointments.push(...batchResults.flat());
    }

    return {
      success: true,
      events: allAppointments,
    };
  } catch (error) {
    console.error("Error fetching GHL appointments:", error);
    return {
      success: false,
      error: "Failed to fetch appointments. Please try again.",
    };
  }
}

/**
 * Transform GHL appointment to FullCalendar event format
 */
function transformGHLToCalendarEvent(
  appointment: GHLAppointment,
  contactName: string
): CalendarEvent {
  // Determine color based on appointment status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return { bg: "#10b981", border: "#059669", text: "#ffffff" }; // Green
      case "cancelled":
        return { bg: "#ef4444", border: "#dc2626", text: "#ffffff" }; // Red
      case "showed":
        return { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" }; // Blue
      case "noshow":
        return { bg: "#f59e0b", border: "#d97706", text: "#ffffff" }; // Orange
      case "new":
        return { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff" }; // Purple
      default:
        return { bg: "#6b7280", border: "#4b5563", text: "#ffffff" }; // Gray
    }
  };

  const statusColor = getStatusColor(appointment.appointmentStatus);

  return {
    id: appointment.id,
    title: appointment.title || contactName,
    start: appointment.startTime,
    end: appointment.endTime,
    backgroundColor: statusColor.bg,
    borderColor: statusColor.border,
    textColor: statusColor.text,
    extendedProps: {
      contactId: appointment.contactId,
      contactName,
      appointmentStatus: appointment.appointmentStatus,
      address: appointment.address,
      notes: appointment.notes,
      assignedUserId: appointment.assignedUserId,
      calendarId: appointment.calendarId,
      locationId: appointment.locationId,
    },
  };
}
