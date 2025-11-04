/**
 * Connect Cards Client Component
 *
 * Provides tabbed interface for connect card operations.
 * Tabs: Upload | Review Queue | Analytics
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ClipboardCheck, ChartBar } from "lucide-react";
import { ConnectCardUploadClient } from "./upload/upload-client";
import { ReviewQueueClient } from "./review/review-queue-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConnectCardForReview } from "@/lib/data/connect-card-review";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface ConnectCardsClientProps {
  slug: string;
  locations: Location[];
  defaultLocationId: string | null;
  cardsForReview: ConnectCardForReview[];
  reviewQueueCount: number;
}

export default function ConnectCardsClient({
  slug,
  locations,
  defaultLocationId,
  cardsForReview,
  reviewQueueCount,
}: ConnectCardsClientProps) {
  const [selectedTab, setSelectedTab] = useState("upload");

  return (
    <Tabs
      defaultValue="upload"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full"
    >
      <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
        <TabsTrigger
          value="upload"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <Upload className="mr-2 w-4 h-4" />
          Upload
        </TabsTrigger>
        <TabsTrigger
          value="review"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <ClipboardCheck className="mr-2 w-4 h-4" />
          Review Queue
          {reviewQueueCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {reviewQueueCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <ChartBar className="mr-2 w-4 h-4" />
          Analytics
        </TabsTrigger>
      </TabsList>

      {/* Upload Tab */}
      <TabsContent value="upload" className="mt-6">
        <ConnectCardUploadClient
          locations={locations}
          defaultLocationId={defaultLocationId}
        />
      </TabsContent>

      {/* Review Queue Tab */}
      <TabsContent value="review" className="mt-6">
        <ReviewQueueClient cards={cardsForReview} slug={slug} />
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="mt-6">
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
      </TabsContent>
    </Tabs>
  );
}
