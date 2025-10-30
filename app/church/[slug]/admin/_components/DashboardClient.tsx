"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectCardsTable } from "@/components/dashboard/connect-cards/connect-cards-table";
import {
  FileText,
  UserPlus,
  Heart,
  Users,
  Calendar,
  TrendingUp,
  Building2,
} from "lucide-react";
import type { ConnectCardAnalytics } from "@/lib/data/connect-card-analytics";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface DashboardClientProps {
  slug: string;
  organizationId: string;
  locations: Location[];
  cumulativeAnalytics: ConnectCardAnalytics;
  cumulativeCards: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    visitType: string | null;
    prayerRequest: string | null;
    interests: string[];
    scannedAt: Date;
    createdAt: Date;
  }>;
}

export function DashboardClient({
  slug, // eslint-disable-line @typescript-eslint/no-unused-vars -- Future: used for dynamic routing when fetching per-tab analytics
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars -- Future: used with locationId for per-tab analytics fetching
  locations,
  cumulativeAnalytics,
  cumulativeCards,
}: DashboardClientProps) {
  const [selectedTab, setSelectedTab] = useState("cumulative");

  // For now, we'll just show cumulative data
  // In the future, we can add dynamic fetching per tab using organizationId + locationId
  const analytics = cumulativeAnalytics;
  const cards = cumulativeCards;

  return (
    <Tabs
      defaultValue="cumulative"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full"
    >
      <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
        <TabsTrigger
          value="cumulative"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <Building2 className="mr-2 w-4 h-4" />
          All Locations
        </TabsTrigger>
        {locations.map(location => (
          <TabsTrigger
            key={location.id}
            value={location.slug}
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            {location.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={selectedTab} className="mt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCards}</div>
              <p className="text-xs text-muted-foreground">
                All time connect cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                First-Time Visitors
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.firstTimeVisitors}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalCards > 0
                  ? (
                      (analytics.firstTimeVisitors / analytics.totalCards) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                % of total cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prayer Requests
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.prayerRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Cards with prayer requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Volunteer Interest
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.volunteersInterested}
              </div>
              <p className="text-xs text-muted-foreground">
                People interested in serving
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.todayCount}</div>
              <p className="text-xs text-muted-foreground">
                Cards scanned today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.weekCount}</div>
              <p className="text-xs text-muted-foreground">
                Cards in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cards Table */}
        <ConnectCardsTable data={cards} />
      </TabsContent>
    </Tabs>
  );
}
