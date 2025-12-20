"use client";

/**
 * Prayer Page Client Component with NavTabs
 *
 * Provides URL-based tabbed navigation for prayer management:
 * - Requests: Unassigned prayers inbox (select & assign to create batches)
 * - Batches: View/manage assigned prayer batches
 * - My Prayer Sheet: Personal prayer session view
 */

import { NavTabs } from "@/components/layout/nav-tabs";
import { Inbox, Package, BookOpen } from "lucide-react";
import { PrayerRequestDataTable } from "@/components/dashboard/prayer-requests/data-table";
import { prayerRequestColumns } from "@/components/dashboard/prayer-requests/columns";
import { PrayerBatchesClient } from "../../prayer-batches/prayer-batches-client";
import { MyPrayersClient } from "../../../my-prayers/my-prayers-client";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";
import type { PrayerCardData } from "@/components/prayer-session/prayer-card";

// Type for prayer batch from getPrayerBatches
interface PrayerBatch {
  id: string;
  name: string;
  batchDate: Date;
  status: string;
  prayerCount: number;
  locationId: string | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
  _count: {
    prayerRequests: number;
  };
}

interface Location {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

interface PrayerPageClientProps {
  slug: string;
  // Requests tab data (unassigned prayers)
  prayerRequests: PrayerRequestListItem[];
  locations: Location[];
  teamMembers: TeamMember[];
  // Batches tab data
  batches: PrayerBatch[];
  // My Prayer Sheet tab data
  myPrayers: PrayerCardData[];
  userName: string;
  // URL-based tab state
  activeTab: string;
  pendingBatchCount: number;
  myPrayerCount: number;
  unassignedCount: number;
}

export function PrayerPageClient({
  slug,
  prayerRequests,
  locations,
  teamMembers,
  batches,
  myPrayers,
  userName,
  activeTab,
  pendingBatchCount,
  myPrayerCount,
  unassignedCount,
}: PrayerPageClientProps) {
  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/prayer`}
        tabs={[
          {
            label: "Inbox",
            value: "requests",
            icon: Inbox,
            count: unassignedCount > 0 ? unassignedCount : undefined,
          },
          {
            label: "Batches",
            value: "batches",
            icon: Package,
            count: pendingBatchCount > 0 ? pendingBatchCount : undefined,
          },
          {
            label: "My Prayers",
            value: "my-prayers",
            icon: BookOpen,
            count: myPrayerCount > 0 ? myPrayerCount : undefined,
          },
        ]}
      />

      {/* Tab Content */}
      {activeTab === "requests" && (
        <PrayerRequestDataTable
          columns={prayerRequestColumns}
          data={prayerRequests}
          title="Unassigned Prayer Requests"
          pageSize={10}
          slug={slug}
          locations={locations}
          teamMembers={teamMembers}
        />
      )}

      {activeTab === "batches" && (
        <PrayerBatchesClient batches={batches} slug={slug} />
      )}

      {activeTab === "my-prayers" && (
        <MyPrayersClient prayers={myPrayers} slug={slug} userName={userName} />
      )}
    </>
  );
}
