import { adminGetAppointments } from "@/app/data/admin/admin-get-appointments";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClient } from "./_components/CalendarClient";

/**
 * Platform Appointments Page
 *
 * System-wide appointment monitoring and management.
 * View and manage appointments across all organizations.
 *
 * Uses FullCalendar free version with:
 * - Month/Week/Day/List views
 * - Event interaction (click, drag, select)
 * - Real-time database sync
 * - Multi-tenant data scoping
 *
 * Header: Rendered via Named Slots pattern (@header/appointments/page.tsx)
 */
export default function AppointmentsPage() {
  return (
    <Suspense fallback={<CalendarLoadingSkeleton />}>
      <RenderCalendar />
    </Suspense>
  );
}

/**
 * Calendar Data Rendering Component
 *
 * Handles server-side appointment data fetching and rendering.
 */
async function RenderCalendar() {
  const appointments = await adminGetAppointments();

  return <CalendarClient appointments={appointments} />;
}

/**
 * Calendar Loading Skeleton
 *
 * Provides visual feedback during appointment data loading.
 */
function CalendarLoadingSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-[calc(100vh-200px)] w-full rounded-lg" />
    </div>
  );
}
