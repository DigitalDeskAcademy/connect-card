"use client";

import { useMemo } from "react";
import { NavTabs } from "@/components/layout/nav-tabs";
import { VolunteersTable } from "./volunteers-table";
import { Users, Clock, ClipboardCheck } from "lucide-react";

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
  readyForExport: boolean;
  readyForExportDate: Date | null;
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
  tabCounts: { all: number; pending: number; review: number };
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
    if (activeTab === "review") {
      // Show volunteers who have self-reported completing their background check
      return volunteers.filter(
        v => v.backgroundCheckStatus === "PENDING_REVIEW"
      );
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
          {
            label: "All Volunteers",
            value: "all",
            icon: Users,
            count: tabCounts.all,
          },
          {
            label: "Pending",
            value: "pending",
            icon: Clock,
            count: tabCounts.pending > 0 ? tabCounts.pending : undefined,
          },
          {
            label: "BG Check Review",
            value: "review",
            icon: ClipboardCheck,
            count: tabCounts.review > 0 ? tabCounts.review : undefined,
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
