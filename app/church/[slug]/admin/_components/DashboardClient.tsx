"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavTabs } from "@/components/layout/nav-tabs";
import { FileText, UserPlus, Heart, Users, Building2 } from "lucide-react";
import type {
  ConnectCardAnalytics,
  ConnectCardChartDataPoint,
} from "@/lib/data/connect-card-analytics";
import type { OnboardingStatus } from "@/lib/data/onboarding";
import { ConnectCardChart } from "./ConnectCardChart";
import { TrendBadge } from "./TrendBadge";
import { QuickActionsGrid } from "./QuickActionsGrid";
import { CollapsibleSection } from "./CollapsibleSection";
import {
  OnboardingChecklist,
  getDefaultOnboardingSteps,
} from "./OnboardingChecklist";
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
  organizationName: string;
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
  /** Active tab from URL (location slug or "cumulative") */
  activeTab: string;
  /** Count of batches with cards awaiting review */
  batchesNeedingReview: number;
  /** Onboarding status for new church checklist */
  onboardingStatus: OnboardingStatus;
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
  trend: number;
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
  organizationName,
  locations,
  cumulativeAnalytics,
  chartData,
  locationAnalytics,
  userDefaultLocationSlug,
  canSeeAllLocations,
  activeTab,
  batchesNeedingReview,
  onboardingStatus,
}: DashboardClientProps) {
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

  // Track if user has dismissed onboarding checklist
  const [checklistDismissed, setChecklistDismissed] = useLocalStorage(
    `onboarding-dismissed-${slug}`,
    false
  );

  // Build onboarding steps with completion states and skipped steps
  const onboardingSteps = getDefaultOnboardingSteps(
    slug,
    onboardingStatus.completionState,
    onboardingStatus.skippedSteps
  );

  const toggleSection = (key: keyof SectionState) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter locations for display based on user permissions
  const visibleLocations = canSeeAllLocations
    ? locations
    : locations.filter(loc => loc.slug === userDefaultLocationSlug);

  // Build tabs array for NavTabs
  const tabs = [
    // Only show "All Locations" tab if user has permission
    ...(canSeeAllLocations
      ? [{ label: "All Locations", value: "cumulative", icon: Building2 }]
      : []),
    // Location tabs
    ...visibleLocations.map(location => ({
      label: location.name,
      value: location.slug,
    })),
  ];

  // Get current analytics based on active tab
  const currentAnalytics =
    activeTab === "cumulative"
      ? { analytics: cumulativeAnalytics, chartData }
      : locationAnalytics[activeTab];

  const currentLocationName =
    activeTab === "cumulative"
      ? undefined
      : visibleLocations.find(loc => loc.slug === activeTab)?.name;

  // Show onboarding checklist if not dismissed and status says to show
  const showOnboarding = onboardingStatus.showChecklist && !checklistDismissed;

  return (
    <>
      {/* Location Filter Tabs */}
      <NavTabs
        baseUrl={`/church/${slug}/admin`}
        paramName="location"
        tabs={tabs}
      />

      <div className="space-y-6 pt-6">
        {/* Onboarding Checklist for new churches */}
        {showOnboarding && (
          <OnboardingChecklist
            slug={slug}
            churchName={organizationName}
            steps={onboardingSteps}
            daysRemaining={onboardingStatus.daysRemaining ?? undefined}
            onDismiss={() => setChecklistDismissed(true)}
          />
        )}

        {/* Quick Actions */}
        <CollapsibleSection
          title="Quick Actions"
          isOpen={sections.quickActions}
          onToggle={() => toggleSection("quickActions")}
        >
          <QuickActionsGrid
            slug={slug}
            defaultLocationSlug={userDefaultLocationSlug}
            batchesNeedingReview={batchesNeedingReview}
          />
        </CollapsibleSection>

        {/* Dashboard Content for active tab */}
        {currentAnalytics && (
          <DashboardContent
            analytics={currentAnalytics.analytics}
            chartData={currentAnalytics.chartData}
            locationName={currentLocationName}
            sections={sections}
            onToggleSection={toggleSection}
          />
        )}
      </div>
    </>
  );
}
