/**
 * Connect Cards Client Component
 *
 * Provides tabbed interface for connect card operations.
 * Tabs: Upload | Batches | Analytics
 *
 * Uses URL-based tabs (NavTabs) for:
 * - Shareable/bookmarkable URLs
 * - Browser back/forward support
 * - State persistence on refresh
 */

"use client";

import { NavTabs } from "@/components/layout/nav-tabs";
import { Upload, Package, ChartBar } from "lucide-react";
import { ConnectCardUploadClient } from "./upload/upload-client";
import { BatchesClient } from "./batches/batches-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Batch {
  id: string;
  name: string;
  status: string;
  cardCount: number;
  locationId: string | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    cards: number;
  };
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface ConnectCardsClientProps {
  slug: string;
  defaultLocationId: string | null;
  batches: Batch[];
  pendingBatchCount: number;
  activeTab: string;
  locations: Location[];
}

export default function ConnectCardsClient({
  slug,
  defaultLocationId,
  batches,
  pendingBatchCount,
  activeTab,
  locations,
}: ConnectCardsClientProps) {
  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/connect-cards`}
        tabs={[
          { label: "Upload", value: "upload", icon: Upload },
          {
            label: "Batches",
            value: "batches",
            icon: Package,
            count: pendingBatchCount > 0 ? pendingBatchCount : undefined,
          },
          { label: "Analytics", value: "analytics", icon: ChartBar },
        ]}
      />

      {/* Tab Content */}
      {activeTab === "upload" && (
        <ConnectCardUploadClient defaultLocationId={defaultLocationId} />
      )}

      {activeTab === "batches" && (
        <BatchesClient batches={batches} slug={slug} locations={locations} />
      )}

      {activeTab === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Card Analytics</CardTitle>
            <CardDescription>
              Detailed analytics and reporting for connect card processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChartBar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Advanced analytics including extraction accuracy rates,
                processing times, and trends will be available in a future
                update.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
