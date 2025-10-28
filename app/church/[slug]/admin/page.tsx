/**
 * Agency Admin Dashboard
 *
 * Main dashboard for church administrators.
 * Currently showing placeholder content during setup phase.
 */

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AgencyAdminDashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyAdminDashboard({
  params,
}: AgencyAdminDashboardProps) {
  const { slug } = await params;
  const { organization } = await requireAgencyAdmin(slug);

  return (
    <PageContainer as="main">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome to {organization.name}
          </CardTitle>
          <CardDescription>
            Church Connect Card Management Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your church management dashboard is being configured. Connect card
            scanning and member management features coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Placeholder Stats - Hidden during setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connect Cards</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Volunteers</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
