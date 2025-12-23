"use client";

import { useMemo } from "react";
import { NavTabs } from "@/components/layout/nav-tabs";
import { VolunteersTable } from "./volunteers-table";
import { Users, Clock, ClipboardCheck } from "lucide-react";
import type { VolunteerForList } from "@/lib/data/volunteers";

/**
 * Volunteer with relations for display
 *
 * Phase 3 (Dec 2025): Now uses VolunteerForList type from unified ChurchMember model.
 * The old type is kept as an alias for backward compatibility with VolunteersTable.
 */
export type VolunteerWithRelations = VolunteerForList;

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
