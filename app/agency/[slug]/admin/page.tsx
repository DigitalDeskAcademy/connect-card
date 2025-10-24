/**
 * Agency Admin Dashboard
 *
 * Main dashboard for agency administrators showing key metrics
 * and quick access to management functions.
 *
 * Features:
 * - Organization statistics (users, courses, enrollments)
 * - Quick navigation to key admin functions
 * - Real-time metrics from scoped data
 */

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { createAgencyDataScope } from "@/lib/agency-data-scope";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  IconListDetails,
  IconUsers,
  IconChartBar,
  IconSchool,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";

interface AgencyAdminDashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyAdminDashboard({
  params,
}: AgencyAdminDashboardProps) {
  const { slug } = await params;
  const { organization } = await requireAgencyAdmin(slug);

  // Get scoped data for this organization
  const dataScope = createAgencyDataScope(organization.id);
  const stats = await dataScope.getStats();

  // Navigation cards for agency features
  const navigationCards = [
    {
      title: "Course Library",
      description: "Manage platform and custom courses",
      icon: <IconListDetails className="size-8 text-primary" />,
      href: `/agency/${slug}/admin/courses`,
      buttonText: "Manage Courses",
      stats: `${stats.customCourseCount} Custom Courses`,
    },
    {
      title: "Create Course",
      description: "Build a custom course for your clients",
      icon: <IconPlus className="size-8 text-green-600" />,
      href: `/agency/${slug}/admin/courses/create`,
      buttonText: "Create Course",
      stats: "Quick Start",
    },
    {
      title: "Team Members",
      description: "Manage your organization's users",
      icon: <IconUsers className="size-8 text-purple-600" />,
      href: `/agency/${slug}/admin/users`,
      buttonText: "Manage Team",
      stats: `${stats.userCount} Users`,
    },
    {
      title: "Analytics",
      description: "View learning metrics and progress",
      icon: <IconChartBar className="size-8 text-blue-600" />,
      href: `/agency/${slug}/admin/analytics`,
      buttonText: "View Analytics",
      stats: `${stats.completedLessons} Lessons Completed`,
    },
    {
      title: "Enrollments",
      description: "Manage course enrollments",
      icon: <IconSchool className="size-8 text-indigo-600" />,
      href: `/agency/${slug}/admin/enrollments`,
      buttonText: "View Enrollments",
      stats: `${stats.activeEnrollments} Active`,
    },
    {
      title: "Settings",
      description: "Configure organization settings",
      icon: <IconSettings className="size-8 text-gray-600" />,
      href: `/agency/${slug}/admin/settings`,
      buttonText: "Open Settings",
      stats: organization.type,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header now rendered via Named Slots pattern (@header/default.tsx) */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{stats.userCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active in your organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Courses</CardDescription>
            <CardTitle className="text-2xl">
              {stats.customCourseCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Created by your team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Enrollments</CardDescription>
            <CardTitle className="text-2xl">
              {stats.activeEnrollments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Users currently learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lessons Completed</CardDescription>
            <CardTitle className="text-2xl">{stats.completedLessons}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total progress made</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationCards.map((card, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow flex flex-col"
          >
            <CardHeader className="flex-1">
              <div className="flex items-center justify-between mb-4">
                {card.icon}
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {card.stats}
                </span>
              </div>
              <CardTitle className="text-lg">{card.title}</CardTitle>
              <CardDescription className="text-sm mt-2">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href={card.href}>
                <Button
                  className="w-full cursor-pointer"
                  variant={
                    card.href.includes("settings") ? "secondary" : "default"
                  }
                >
                  {card.buttonText}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
