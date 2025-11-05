/**
 * Connect Cards Client Component
 *
 * Provides tabbed interface for connect card operations.
 * Tabs: Upload | Review Queue | Analytics
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Package, ChartBar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ConnectCardUploadClient } from "./upload/upload-client";
import { BatchesClient } from "./batches/batches-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
interface Location {
  id: string;
  name: string;
  slug: string;
}

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
  _count: {
    cards: number;
  };
}

interface ConnectCardsClientProps {
  slug: string;
  locations: Location[];
  defaultLocationId: string | null;
  batches: Batch[];
  pendingBatchCount: number;
}

export default function ConnectCardsClient({
  slug,
  locations,
  defaultLocationId,
  batches,
  pendingBatchCount,
}: ConnectCardsClientProps) {
  const [selectedTab, setSelectedTab] = useState("upload");

  return (
    <Tabs
      defaultValue="upload"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
          <TabsTrigger
            value="upload"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <Upload className="mr-2 w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <Package className="mr-2 w-4 h-4" />
            Batches
            {pendingBatchCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {pendingBatchCount}
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

        <Button variant="outline" size="sm" asChild>
          <Link href={`/church/${slug}/admin`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Upload Tab */}
      <TabsContent value="upload">
        <ConnectCardUploadClient
          locations={locations}
          defaultLocationId={defaultLocationId}
        />
      </TabsContent>

      {/* Batches Tab */}
      <TabsContent value="batches">
        <BatchesClient batches={batches} slug={slug} />
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics">
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
