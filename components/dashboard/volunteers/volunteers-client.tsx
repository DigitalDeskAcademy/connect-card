"use client";

import { useMemo } from "react";
import { NavTabs } from "@/components/layout/nav-tabs";
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
  activeTab: string;
  tabCounts: { all: number; pending: number };
  canDelete: boolean;
}

/**
 * Volunteers Client Component
 *
 * Process new volunteers and manage volunteer assignments.
 *
 * Features:
 * - Two-tab navigation: "All Volunteers" / "Pending Volunteers"
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
  activeTab,
  tabCounts,
  canDelete,
}: VolunteersClientProps) {
  // Filter volunteers based on active tab
  const filteredVolunteers = useMemo(() => {
    if (activeTab === "pending") {
      return volunteers.filter(v => v.status === "PENDING_APPROVAL");
    }
    // "all" tab shows ACTIVE and INACTIVE volunteers (not PENDING_APPROVAL)
    return volunteers.filter(v => ["ACTIVE", "INACTIVE"].includes(v.status));
  }, [volunteers, activeTab]);

  /**
   * Layout: Simplified with PageContainer variant="tabs"
   *
   * PageContainer handles:
   * - Responsive padding (p-4 md:p-6)
   * - Flex column layout
   * - Gap-0 (prevents double-spacing with NavTabs)
   */
  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/volunteer`}
        tabs={[
          { label: "All Volunteers", value: "all", count: tabCounts.all },
          {
            label: "Pending Volunteers",
            value: "pending",
            count: tabCounts.pending,
          },
        ]}
      />

      <VolunteersTable
        volunteers={filteredVolunteers}
        slug={slug}
        organizationId={organizationId}
        locations={locations}
        activeTab={activeTab}
        canDelete={canDelete}
      />
    </>
  );
}
