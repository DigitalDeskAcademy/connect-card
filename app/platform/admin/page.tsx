/**
 * Platform Admin Dashboard
 *
 * Main dashboard for platform administrators.
 * Currently showing placeholder content during setup phase.
 */

import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PlatformAdminDashboard() {
  return (
    <PageContainer as="main">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Platform Administration</CardTitle>
          <CardDescription>
            Church Connect Card Management - Platform Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Platform administration dashboard is being configured. System
            monitoring and multi-church management features coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Placeholder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Churches</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
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
            <CardDescription>System Status</CardDescription>
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
