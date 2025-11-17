"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconUsers,
  IconUserCheck,
  IconAlertCircle,
  IconUserPlus,
} from "@tabler/icons-react";
import { VolunteersTable } from "./volunteers-table";
import { CreateVolunteerDialog } from "./create-volunteer-dialog";
import { useRouter } from "next/navigation";

/**
 * Volunteer with relations for display
 *
 * Flexible type that accepts the data from getVolunteersForScope()
 */
export type VolunteerWithRelations = {
  id: string;
  status: string;
  startDate: Date;
  backgroundCheckStatus: string;
  churchMember: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  skills?: Array<{
    id: string;
    skillName: string;
  }>;
  availability?: Array<{
    id: string;
  }>;
  _count?: {
    shifts: number;
  };
};

interface Location {
  id: string;
  name: string;
}

interface VolunteersClientProps {
  volunteers: VolunteerWithRelations[];
  slug: string;
  organizationId: string;
  locations: Location[];
}

/**
 * Volunteers Client Component
 *
 * Displays volunteer management dashboard with summary cards and volunteer directory.
 *
 * Features:
 * - Volunteer summary cards (Total, Active, Background Checks, Shifts)
 * - Volunteers data table with status filtering
 * - Volunteer status badges and skills display
 * - Create new volunteer dialog with inline member creation
 */
export function VolunteersClient({
  volunteers,
  slug,
  organizationId,
  locations,
}: VolunteersClientProps) {
  const router = useRouter();

  // Calculate volunteer metrics
  const totalVolunteers = volunteers.length;
  const activeVolunteers = volunteers.filter(v => v.status === "ACTIVE").length;

  // Background checks needing attention (not started, in progress, or expired)
  const needingBackgroundCheck = volunteers.filter(
    v =>
      v.status === "ACTIVE" &&
      (v.backgroundCheckStatus === "NOT_STARTED" ||
        v.backgroundCheckStatus === "EXPIRED" ||
        v.backgroundCheckStatus === "IN_PROGRESS")
  ).length;

  // New volunteers this month
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newThisMonth = volunteers.filter(
    v => new Date(v.startDate) >= thirtyDaysAgo
  ).length;

  // Refresh data after volunteer creation
  const handleVolunteerCreated = () => {
    router.refresh();
  };

  /**
   * Layout: Canvas Pattern (Full-Height Component)
   *
   * Uses `flex-1` instead of `h-full` because parent is `flex flex-col`.
   * In flexbox columns, children need flex-1 to consume available space.
   *
   * Structure:
   * - Header with action button: flex-shrink-0
   * - Summary cards: flex-shrink-0 (fixed height)
   * - Table wrapper: flex-1 min-h-0 (fills remaining space, scrollable)
   */
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Volunteer Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage volunteers, skills, and serving schedules
          </p>
        </div>
        <CreateVolunteerDialog
          slug={slug}
          organizationId={organizationId}
          locations={locations}
          onSuccess={handleVolunteerCreated}
        />
      </div>

      {/* Volunteer Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Volunteers
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              {totalVolunteers === 1 ? "volunteer" : "volunteers"} registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Volunteers
            </CardTitle>
            <IconUserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              {totalVolunteers > 0
                ? Math.round((activeVolunteers / totalVolunteers) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Background Checks
            </CardTitle>
            {needingBackgroundCheck > 0 ? (
              <IconAlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <IconUserCheck className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${needingBackgroundCheck > 0 ? "text-destructive" : ""}`}
            >
              {needingBackgroundCheck}
            </div>
            <p className="text-xs text-muted-foreground">
              {needingBackgroundCheck === 1
                ? "volunteer needs"
                : "volunteers need"}{" "}
              attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New This Month
            </CardTitle>
            <IconUserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {newThisMonth === 1 ? "volunteer" : "volunteers"} joined recently
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Volunteers Table */}
      <div className="flex-1 min-h-0">
        <VolunteersTable volunteers={volunteers} />
      </div>
    </div>
  );
}
