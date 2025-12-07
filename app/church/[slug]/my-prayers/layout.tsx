/**
 * My Prayer Sheet Layout
 *
 * Minimal layout for the prayer session experience.
 * Intentionally separate from admin layout for distraction-free prayer.
 *
 * Features:
 * - Simple back navigation to admin dashboard
 * - Clean, focused UI for prayer time
 * - Print-friendly (layout hidden on print)
 */

import { ReactNode } from "react";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { OrganizationProvider } from "@/app/providers/organization-context";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function MyPrayersLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;

  // Verify access
  const { organization } = await requireDashboardAccess(slug);

  return (
    <OrganizationProvider organization={organization}>
      {/* Minimal navigation bar - hidden on print */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/church/${slug}/admin`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {organization.name}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/church/${slug}/admin/prayer`}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="sr-only">Prayer Admin</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-12 print:pt-0">{children}</div>
    </OrganizationProvider>
  );
}
