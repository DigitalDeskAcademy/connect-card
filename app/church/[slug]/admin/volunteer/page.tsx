/**
 * Volunteer Management
 *
 * Manage church volunteers and serving teams:
 * - Volunteer roster and scheduling
 * - Team assignments
 * - Service area tracking
 * - Volunteer hours and check-in
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VolunteerPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Volunteer Management</CardTitle>
          <CardDescription>Manage volunteers and serving teams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Volunteer management features coming soon.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p className="font-medium">Planned Features:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Volunteer roster and profiles</li>
              <li>Team and service area assignments</li>
              <li>Scheduling and availability tracking</li>
              <li>Check-in and hour logging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
