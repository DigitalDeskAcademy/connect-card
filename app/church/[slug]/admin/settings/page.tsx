import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconUsers,
  IconBuilding,
  IconCreditCard,
  IconPlugConnected,
  IconChevronRight,
} from "@tabler/icons-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Settings Page
 *
 * Organization settings and configuration for church operations.
 * Manages integrations, billing, team permissions, and system preferences.
 */
export default async function SettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const { dataScope } = await requireDashboardAccess(slug);

  // Settings categories with conditional access
  const settingsCategories = [
    {
      title: "Volunteer Onboarding",
      description:
        "Documents, ministry requirements, and background check settings",
      href: `/church/${slug}/admin/settings/volunteer-onboarding`,
      icon: IconUsers,
      requiresAdmin: true,
    },
    {
      title: "Organization",
      description: "Church name, logo, contact information",
      href: `/church/${slug}/admin/settings/organization`,
      icon: IconBuilding,
      requiresAdmin: true,
      comingSoon: true,
    },
    {
      title: "Billing",
      description: "Subscription, invoices, payment methods",
      href: `/church/${slug}/admin/settings/billing`,
      icon: IconCreditCard,
      requiresAdmin: true,
      comingSoon: true,
    },
    {
      title: "Integrations",
      description: "Planning Center, GoHighLevel, and other connections",
      href: `/church/${slug}/admin/settings/integrations`,
      icon: IconPlugConnected,
      requiresAdmin: true,
      comingSoon: true,
    },
  ];

  // Filter based on permissions
  const visibleSettings = settingsCategories.filter(
    setting => !setting.requiresAdmin || dataScope.filters.canManageUsers
  );

  return (
    <PageContainer as="main">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your church&apos;s settings and configurations
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleSettings.map(setting => {
            const Icon = setting.icon;
            const isDisabled = setting.comingSoon;

            const content = (
              <Card
                className={`transition-colors ${
                  isDisabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {setting.title}
                      </CardTitle>
                      {setting.comingSoon && (
                        <span className="text-xs text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  {!isDisabled && (
                    <IconChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription>{setting.description}</CardDescription>
                </CardContent>
              </Card>
            );

            if (isDisabled) {
              return <div key={setting.title}>{content}</div>;
            }

            return (
              <Link key={setting.title} href={setting.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
