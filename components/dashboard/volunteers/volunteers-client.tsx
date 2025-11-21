"use client";

import { VolunteersTable } from "./volunteers-table";

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
  categories?: Array<{
    id: string;
    category: string;
  }>;
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
 * Process new volunteers and manage volunteer assignments.
 *
 * Features:
 * - Volunteers data table with status filtering
 * - Volunteer status badges and skills display
 * - Create new volunteer dialog with inline member creation
 * - Route volunteers to ministry leaders for onboarding
 * - Start automation workflows for background checks and paperwork
 */
export function VolunteersClient({
  volunteers,
  slug,
  organizationId,
  locations,
}: VolunteersClientProps) {
  /**
   * Layout: Canvas Pattern (Full-Height Component)
   *
   * Uses `flex-1` instead of `h-full` because parent is `flex flex-col`.
   * In flexbox columns, children need flex-1 to consume available space.
   *
   * Structure:
   * - Page header with description: flex-shrink-0 (fixed height)
   * - Table wrapper: flex-1 min-h-0 (fills remaining space, scrollable)
   */
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Volunteer Directory
        </h1>
        <p className="text-sm text-muted-foreground">
          Process new volunteers, route to ministry leaders, and start onboarding workflows
        </p>
      </div>

      {/* Volunteers Table (includes integrated create button) */}
      <div className="flex-1 min-h-0">
        <VolunteersTable
          volunteers={volunteers}
          slug={slug}
          organizationId={organizationId}
          locations={locations}
        />
      </div>
    </div>
  );
}
