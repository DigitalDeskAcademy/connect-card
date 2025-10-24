"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  DateSelectArg,
  EventChangeArg,
} from "@fullcalendar/core";
import { updateAppointment } from "../actions";
import { toast } from "sonner";
import type { AdminAppointmentType } from "@/app/data/admin/admin-get-appointments";

interface CalendarClientProps {
  appointments?: AdminAppointmentType[];
}

/**
 * Calendar Client Component
 *
 * Full-featured calendar with month/week/day/list views.
 * Connected to local database with multi-tenant support.
 *
 * Features:
 * - Multiple view modes (month, week, day, list)
 * - Event interaction (click, drag, resize)
 * - Multi-tenant data scoping
 * - Real-time updates via server actions
 */
export function CalendarClient({ appointments = [] }: CalendarClientProps) {
  const calendarRef = useRef(null);

  /**
   * Transform database appointments to FullCalendar events
   */
  const events = appointments.map(apt => {
    // Determine color based on status
    let backgroundColor = "#3b82f6"; // default blue for scheduled
    if (apt.status === "CONFIRMED")
      backgroundColor = "#10b981"; // green
    else if (apt.status === "COMPLETED")
      backgroundColor = "#8b5cf6"; // purple
    else if (apt.status === "CANCELLED")
      backgroundColor = "#ef4444"; // red
    else if (apt.status === "NO_SHOW") backgroundColor = "#f59e0b"; // orange

    return {
      id: apt.id,
      title: apt.churchMember
        ? `${apt.title} - ${apt.churchMember.name}`
        : apt.title,
      start: apt.startTime,
      end: apt.endTime,
      backgroundColor,
      extendedProps: {
        description: apt.description,
        status: apt.status,
        location: apt.location,
        calendarProvider: apt.calendarProvider,
        contact: apt.churchMember,
      },
    };
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // TODO: Open create appointment modal
    toast.info("Create appointment modal - Coming soon");
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // Clear date selection
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // TODO: Open event details modal with edit/delete options
    const event = clickInfo.event;
    const props = event.extendedProps;

    toast.info(`Appointment: ${event.title}`, {
      description: `Status: ${props.status} | Location: ${props.location || "N/A"}`,
    });
  };

  /**
   * Handle event drag/drop or resize
   */
  const handleEventChange = async (changeInfo: EventChangeArg) => {
    const event = changeInfo.event;

    const result = await updateAppointment(event.id, {
      startTime: event.start?.toISOString() || "",
      endTime: event.end?.toISOString() || event.start?.toISOString() || "",
    });

    if (result.status === "error") {
      toast.error(result.message);
      // Revert the change in UI
      changeInfo.revert();
    } else {
      toast.success("Appointment updated");
    }
  };

  useEffect(() => {
    // Add custom styles for better dark mode and color support
    const style = document.createElement("style");
    style.innerHTML = `
      /* FullCalendar Custom Styling */
      .fc {
        color: hsl(var(--foreground));
      }

      .fc .fc-button {
        background-color: hsl(var(--primary));
        border-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      }

      .fc .fc-button:hover {
        background-color: hsl(var(--primary) / 0.9);
      }

      .fc .fc-button-active {
        background-color: hsl(var(--primary) / 0.8);
      }

      .fc .fc-daygrid-day-number {
        color: hsl(var(--foreground));
      }

      .fc .fc-col-header-cell {
        background-color: hsl(var(--muted));
        color: hsl(var(--foreground));
        font-weight: 600;
      }

      .fc .fc-scrollgrid {
        border-color: hsl(var(--border));
      }

      .fc td, .fc th {
        border-color: hsl(var(--border));
      }

      .fc .fc-daygrid-day.fc-day-today {
        background-color: hsl(var(--accent) / 0.3);
      }

      /* Event Colors */
      .fc-event {
        border: none !important;
        border-radius: 0.25rem;
        padding: 2px 4px;
      }

      .fc-event-title {
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /**
   * Layout: Canvas Pattern (Full-Height Component)
   *
   * Uses `flex-1` instead of `h-full` because parent is `flex flex-col`.
   * FullCalendar height="100%" fills the flex container.
   */
  return (
    <div className="flex-1 p-6 flex flex-col">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventChange={handleEventChange}
        height="100%"
        // Styling to match our design system
        themeSystem="standard"
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
      />
    </div>
  );
}
