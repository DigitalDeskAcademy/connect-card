import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import {
  getConnectCardAnalytics,
  getRecentConnectCards,
} from "@/lib/data/connect-card-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  UserPlus,
  Heart,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageContainer } from "@/components/layout/page-container";

export default async function ConnectCardDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardAccess(slug);

  const [analytics, recentCards] = await Promise.all([
    getConnectCardAnalytics(organization.id),
    getRecentConnectCards(organization.id, 25),
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

      {/* Recent Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Connect Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No connect cards yet</p>
              <p className="text-sm mt-2">
                Upload and process cards to see them here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Prayer Request</TableHead>
                  <TableHead>Interests</TableHead>
                  <TableHead>Scanned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCards.map(card => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">
                      {card.name || (
                        <span className="text-muted-foreground italic">
                          No name
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {card.email && (
                          <div className="text-muted-foreground">
                            {card.email}
                          </div>
                        )}
                        {card.phone && <div>{card.phone}</div>}
                        {!card.email && !card.phone && (
                          <span className="text-muted-foreground italic">
                            No contact
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {card.visitType ? (
                        <Badge
                          variant={
                            card.visitType.toLowerCase().includes("first")
                              ? "default"
                              : "secondary"
                          }
                        >
                          {card.visitType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">
                          Unknown
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {card.prayerRequest ? (
                        <div className="max-w-xs truncate text-sm">
                          {card.prayerRequest}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {card.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {card.interests.slice(0, 2).map((interest, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {interest}
                            </Badge>
                          ))}
                          {card.interests.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{card.interests.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(card.scannedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
