"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UserPlus, Heart, Users, Building2 } from "lucide-react";
import type {
  ConnectCardAnalytics,
  ConnectCardChartDataPoint,
} from "@/lib/data/connect-card-analytics";
import { ConnectCardChart } from "./ConnectCardChart";
import { TrendBadge } from "./TrendBadge";

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
  chartData: ConnectCardChartDataPoint[];
}

export function DashboardClient({
  slug, // eslint-disable-line @typescript-eslint/no-unused-vars -- Future: used for dynamic routing when fetching per-tab analytics
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars -- Future: used with locationId for per-tab analytics fetching
  locations,
  cumulativeAnalytics,
  chartData,
}: DashboardClientProps) {
  const [selectedTab, setSelectedTab] = useState("cumulative");

  // For now, we'll just show cumulative data
  // In the future, we can add dynamic fetching per tab using organizationId + locationId
  const analytics = cumulativeAnalytics;

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

      {/* Cumulative Tab Content */}
      <TabsContent value="cumulative" className="mt-6">
        {/* Summary Stats - This Week with Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* This Week's Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">
                  {analytics.thisWeek.totalCards}
                </div>
                <TrendBadge trend={analytics.trends.totalCards} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs {analytics.fourWeekAverage.totalCards} avg
              </p>
            </CardContent>
          </Card>

          {/* First-Time Visitors This Week */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                First-Time Visitors
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">
                  {analytics.thisWeek.firstTimeVisitors}
                </div>
                <TrendBadge trend={analytics.trends.firstTimeVisitors} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs {analytics.fourWeekAverage.firstTimeVisitors} avg
              </p>
            </CardContent>
          </Card>

          {/* Prayer Requests This Week */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prayer Requests
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">
                  {analytics.thisWeek.prayerRequests}
                </div>
                <TrendBadge trend={analytics.trends.prayerRequests} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs {analytics.fourWeekAverage.prayerRequests} avg
              </p>
            </CardContent>
          </Card>

          {/* Volunteer Interest This Week */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Volunteer Interest
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">
                  {analytics.thisWeek.volunteersInterested}
                </div>
                <TrendBadge trend={analytics.trends.volunteersInterested} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs {analytics.fourWeekAverage.volunteersInterested} avg
              </p>
            </CardContent>
          </Card>

          {/* Top Prayer Categories */}
          {analytics.topPrayerCategories.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Top Prayer Categories This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.topPrayerCategories.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium capitalize">
                          {category.category}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {category.count} requests
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chart */}
        <div className="mb-6">
          <ConnectCardChart data={chartData} />
        </div>
      </TabsContent>

      {/* Location Tabs (same structure for each location) */}
      {locations.map(location => (
        <TabsContent key={location.slug} value={location.slug} className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Per-location analytics coming soon for {location.name}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
