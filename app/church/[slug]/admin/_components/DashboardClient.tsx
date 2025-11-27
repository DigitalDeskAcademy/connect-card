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
import { QuickActionsGrid } from "./QuickActionsGrid";

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
  /** User's default location slug. Null if user can see all locations. */
  userDefaultLocationSlug: string | null;
  /** Whether user has permission to see all locations */
  canSeeAllLocations: boolean;
}

export function DashboardClient({
  slug,
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars -- Future: used with locationId for per-tab analytics fetching
  locations,
  cumulativeAnalytics,
  chartData,
  userDefaultLocationSlug,
  canSeeAllLocations,
}: DashboardClientProps) {
  // Default to user's location if they have one assigned, otherwise show cumulative
  const defaultTab = userDefaultLocationSlug ?? "cumulative";
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  // For now, we'll just show cumulative data
  // In the future, we can add dynamic fetching per tab using organizationId + locationId
  const analytics = cumulativeAnalytics;

  // Filter locations for display based on user permissions
  const visibleLocations = canSeeAllLocations
    ? locations
    : locations.filter(loc => loc.slug === userDefaultLocationSlug);

  return (
    <Tabs
      defaultValue={defaultTab}
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full space-y-6"
    >
      {/* Location Filter Tabs - At the very top */}
      <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
        {/* Only show "All Locations" tab if user has permission */}
        {canSeeAllLocations && (
          <TabsTrigger
            value="cumulative"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <Building2 className="mr-2 w-4 h-4" />
            All Locations
          </TabsTrigger>
        )}
        {visibleLocations.map(location => (
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
      <TabsContent value="cumulative" className="mt-0 space-y-6">
        {/* KPI Cards - 4 columns, prominent at top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.thisWeek.totalCards}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  vs {analytics.fourWeekAverage.totalCards} avg
                </p>
                <TrendBadge trend={analytics.trends.totalCards} />
              </div>
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
                {analytics.thisWeek.firstTimeVisitors}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  vs {analytics.fourWeekAverage.firstTimeVisitors} avg
                </p>
                <TrendBadge trend={analytics.trends.firstTimeVisitors} />
              </div>
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
                {analytics.thisWeek.prayerRequests}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  vs {analytics.fourWeekAverage.prayerRequests} avg
                </p>
                <TrendBadge trend={analytics.trends.prayerRequests} />
              </div>
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
                {analytics.thisWeek.volunteersInterested}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  vs {analytics.fourWeekAverage.volunteersInterested} avg
                </p>
                <TrendBadge trend={analytics.trends.volunteersInterested} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout: Quick Actions + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Left column (1/3 width on lg) */}
          <div className="lg:col-span-1">
            <QuickActionsGrid
              slug={slug}
              defaultLocationSlug={userDefaultLocationSlug}
            />
          </div>

          {/* Chart - Right column (2/3 width on lg) */}
          <div className="lg:col-span-2">
            <ConnectCardChart data={chartData} />
          </div>
        </div>

        {/* Top Prayer Categories - Full width below */}
        {analytics.topPrayerCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Top Prayer Categories This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {analytics.topPrayerCategories.map((category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {category.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({category.count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Location Tabs (same structure for each location) */}
      {visibleLocations.map(location => (
        <TabsContent key={location.slug} value={location.slug} className="mt-0">
          <div className="text-center text-muted-foreground py-12">
            Per-location analytics coming soon for {location.name}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
