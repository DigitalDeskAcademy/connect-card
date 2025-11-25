/**
 * Contacts Management Page - Core CRM functionality for managing contacts
 *
 * Platform admin view with full access to all contacts across organizations.
 * Uses URL-based navigation with NavTabs for bookmarkable views.
 *
 * Access: platform_admin only
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { NavTabs } from "@/components/layout/nav-tabs";
import { ContactsPageClient } from "./_components/ContactsPageClient";
// Contacts data will be fetched from database when GHL integration is implemented

type SearchParams = Promise<{ tab?: string }>;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "all";

  return (
    <PageContainer variant="tabs">
      {/* Navigation Tabs - URL-based for bookmarkable views */}
      <NavTabs
        baseUrl="/platform/admin/contacts"
        tabs={[
          { label: "All", value: "all" },
          { label: "Smart Lists", value: "smart-lists" },
          { label: "Companies", value: "companies" },
        ]}
      />

      {/* Tab Content - minimal padding for maximum screen space */}
      {activeTab === "all" && (
        <ContactsPageClient contacts={[]} totalRecords={0} />
      )}

      {activeTab === "smart-lists" && (
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Lists</CardTitle>
              <CardDescription>
                Create and manage dynamic contact segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smart lists feature coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "companies" && (
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Manage company relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Company management coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
