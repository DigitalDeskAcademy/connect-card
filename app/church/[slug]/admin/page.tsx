/**
 * Church Admin Dashboard
 *
 * Main dashboard for church administrators showing connect card analytics,
 * recent activity, and key metrics for visitor engagement and follow-up.
 */

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import {
  getConnectCardAnalytics,
  getRecentConnectCards,
} from "@/lib/data/connect-card-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  UserPlus,
  Heart,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ConnectCardsTable } from "@/components/dashboard/connect-cards/connect-cards-table";

interface ChurchAdminDashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function ChurchAdminDashboard({
  params,
}: ChurchAdminDashboardProps) {
  const { slug } = await params;
  const { organization } = await requireAgencyAdmin(slug);

  const [analytics, recentCards] = await Promise.all([
    getConnectCardAnalytics(organization.id),
    getRecentConnectCards(organization.id, 100), // Fetch more for pagination
  ]);

  return (
    <PageContainer as="main">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {(
                (analytics.firstTimeVisitors / analytics.totalCards) * 100 || 0
              ).toFixed(1)}
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
            <div className="text-2xl font-bold">{analytics.prayerRequests}</div>
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
            <p className="text-xs text-muted-foreground">Cards scanned today</p>
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

      {/* Recent Cards Table - Enterprise TanStack Table */}
      <ConnectCardsTable data={recentCards} />
    </PageContainer>
  );
}
