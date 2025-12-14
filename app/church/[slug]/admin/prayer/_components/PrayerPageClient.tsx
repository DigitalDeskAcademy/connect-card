"use client";

/**
 * Prayer Page Client Component with NavTabs
 *
 * Provides URL-based tabbed navigation for prayer management:
 * - Requests: Prayer request table with search/filter
 * - Batches: Daily prayer batches for assignment
 * - My Prayer Sheet: Personal prayer session view
 */

import { NavTabs } from "@/components/layout/nav-tabs";
import { FileText, Package, BookOpen } from "lucide-react";
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

interface PrayerPageClientProps {
  slug: string;
  // All Requests tab data
  prayerRequests: PrayerRequestListItem[];
  locations: Location[];
  // Batches tab data
  batches: PrayerBatch[];
  // My Prayer Sheet tab data
  myPrayers: PrayerCardData[];
  userName: string;
  // URL-based tab state
  activeTab: string;
  pendingBatchCount: number;
  myPrayerCount: number;
}

export function PrayerPageClient({
  slug,
  prayerRequests,
  locations,
  batches,
  myPrayers,
  userName,
  activeTab,
  pendingBatchCount,
  myPrayerCount,
}: PrayerPageClientProps) {
  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/prayer`}
        tabs={[
          { label: "Requests", value: "requests", icon: FileText },
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
          title="Prayer Requests"
          pageSize={10}
          slug={slug}
          locations={locations}
          teamMembers={[]}
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
