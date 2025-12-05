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
import { CollapsibleSection } from "./CollapsibleSection";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface SectionState {
  quickActions: boolean;
  kpiCards: boolean;
  chart: boolean;
  prayerCategories: boolean;
}

interface DashboardClientProps {
  slug: string;
  organizationId: string;
  locations: Location[];
  cumulativeAnalytics: ConnectCardAnalytics;
  chartData: ConnectCardChartDataPoint[];
  /** Pre-fetched analytics for each location keyed by slug */
  locationAnalytics: Record<
    string,
    { analytics: ConnectCardAnalytics; chartData: ConnectCardChartDataPoint[] }
  >;
  /** User's default location slug. Null if user can see all locations. */
  userDefaultLocationSlug: string | null;
  /** Whether user has permission to see all locations */
  canSeeAllLocations: boolean;
}

/** Reusable KPI card for dashboard metrics */
function KPICard({
  title,
  icon: Icon,
  value,
  average,
  trend,
}: {
  title: string;
  icon: typeof FileText;
  value: number;
  average: number;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">vs {average} avg</p>
          <TrendBadge trend={trend} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Reusable dashboard content for both cumulative and location tabs */
function DashboardContent({
  analytics,
  chartData,
  locationName,
  sections,
  onToggleSection,
}: {
  analytics: ConnectCardAnalytics;
  chartData: ConnectCardChartDataPoint[];
  locationName?: string;
  sections: SectionState;
  onToggleSection: (key: keyof SectionState) => void;
}) {
  const kpiTitle = locationName
    ? `${locationName} - This Week's Metrics`
    : "This Week's Metrics";

  return (
    <>
      {/* KPI Cards */}
      <CollapsibleSection
        title={kpiTitle}
        isOpen={sections.kpiCards}
        onToggle={() => onToggleSection("kpiCards")}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="This Week"
            icon={FileText}
            value={analytics.thisWeek.totalCards}
            average={analytics.fourWeekAverage.totalCards}
            trend={analytics.trends.totalCards}
          />
          <KPICard
            title="First-Time Visitors"
            icon={UserPlus}
            value={analytics.thisWeek.firstTimeVisitors}
            average={analytics.fourWeekAverage.firstTimeVisitors}
            trend={analytics.trends.firstTimeVisitors}
          />
          <KPICard
            title="Prayer Requests"
            icon={Heart}
            value={analytics.thisWeek.prayerRequests}
            average={analytics.fourWeekAverage.prayerRequests}
            trend={analytics.trends.prayerRequests}
          />
          <KPICard
            title="Volunteer Interest"
            icon={Users}
            value={analytics.thisWeek.volunteersInterested}
            average={analytics.fourWeekAverage.volunteersInterested}
            trend={analytics.trends.volunteersInterested}
          />
        </div>
      </CollapsibleSection>

      {/* Activity Chart */}
      <CollapsibleSection
        title="Activity Chart"
        isOpen={sections.chart}
        onToggle={() => onToggleSection("chart")}
      >
        <ConnectCardChart data={chartData} />
      </CollapsibleSection>

      {/* Top Prayer Categories */}
      {analytics.topPrayerCategories.length > 0 && (
        <CollapsibleSection
          title="Top Prayer Categories"
          isOpen={sections.prayerCategories}
          onToggle={() => onToggleSection("prayerCategories")}
        >
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
        </CollapsibleSection>
      )}
    </>
  );
}

export function DashboardClient({
  slug,
  locations,
  cumulativeAnalytics,
  chartData,
  locationAnalytics,
  userDefaultLocationSlug,
  canSeeAllLocations,
}: DashboardClientProps) {
  // Default to user's location if they have one assigned, otherwise show cumulative
  const defaultTab = userDefaultLocationSlug ?? "cumulative";
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  // Section collapsed states (persisted to localStorage)
  const [sections, setSections] = useLocalStorage<SectionState>(
    "dashboard-sections",
    {
      quickActions: true,
      kpiCards: true,
      chart: true,
      prayerCategories: true,
    }
  );

  const toggleSection = (key: keyof SectionState) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

      {/* Quick Actions */}
      <CollapsibleSection
        title="Quick Actions"
        isOpen={sections.quickActions}
        onToggle={() => toggleSection("quickActions")}
      >
        <QuickActionsGrid
          slug={slug}
          defaultLocationSlug={userDefaultLocationSlug}
        />
      </CollapsibleSection>

      {/* Cumulative Tab Content */}
      <TabsContent value="cumulative" className="mt-0 space-y-6">
        <DashboardContent
          analytics={cumulativeAnalytics}
          chartData={chartData}
          sections={sections}
          onToggleSection={toggleSection}
        />
      </TabsContent>

      {/* Location Tabs */}
      {visibleLocations.map(location => {
        const locData = locationAnalytics[location.slug];
        if (!locData) return null;

        return (
          <TabsContent
            key={location.slug}
            value={location.slug}
            className="mt-0 space-y-6"
          >
            <DashboardContent
              analytics={locData.analytics}
              chartData={locData.chartData}
              locationName={location.name}
              sections={sections}
              onToggleSection={toggleSection}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
