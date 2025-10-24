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
import { NavTabs } from "@/components/layout/nav-tabs";
import { ContactsPageClient } from "./_components/ContactsPageClient";
import { type Contact } from "@/components/contacts/ContactsTable";

// Mock data - TODO: Replace with database queries
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Wade Arthur",
    initials: "WA",
    phone: "(509) 201-1078",
    email: "wade.arthur@example.com",
    created: "Oct 15 2025",
    lastActivity: "8 hours ago",
    tags: ["name via lookup"],
    color: "bg-purple-500",
  },
  {
    id: "2",
    name: "Website",
    initials: "W",
    phone: "(425) 200-0460",
    email: "contact@website.com",
    created: "Oct 13 2025",
    lastActivity: "2 days ago",
    tags: ["name via lookup"],
    color: "bg-pink-500",
  },
  {
    id: "3",
    name: "Butler Mary",
    initials: "BM",
    phone: "(509) 201-1487",
    email: "butler.mary@example.com",
    created: "Oct 13 2025",
    lastActivity: "2 days ago",
    tags: ["name via lookup"],
    color: "bg-blue-500",
  },
  {
    id: "4",
    name: "Time-Out 3 Llc",
    initials: "TL",
    phone: "(509) 201-1265",
    email: "timeout@example.com",
    created: "Oct 13 2025",
    lastActivity: "2 days ago",
    tags: ["name via lookup"],
    color: "bg-indigo-500",
  },
  {
    id: "5",
    name: "Unknown",
    initials: "?",
    phone: "(312) 761-2230",
    email: "",
    created: "Oct 09 2025",
    lastActivity: "6 days ago",
    tags: ["couldn't find caller name"],
    color: "bg-gray-500",
  },
  {
    id: "6",
    name: "Unknown",
    initials: "?",
    phone: "(209) 703-1945",
    email: "",
    created: "Oct 08 2025",
    lastActivity: "5 days ago",
    tags: ["couldn't find caller name", "spam likely"],
    color: "bg-gray-500",
  },
  {
    id: "7",
    name: "Unknown",
    initials: "?",
    phone: "(509) 223-4897",
    email: "",
    created: "Oct 07 2025",
    lastActivity: "1 week ago",
    tags: ["couldn't find caller name", "spam likely"],
    color: "bg-gray-500",
  },
  {
    id: "8",
    name: "Unknown",
    initials: "?",
    phone: "(206) 201-1559",
    email: "",
    created: "Oct 06 2025",
    lastActivity: "1 day ago",
    tags: ["couldn't find caller name"],
    color: "bg-gray-500",
  },
  {
    id: "9",
    name: "Finish Line Spe",
    initials: "FS",
    phone: "(509) 201-1577",
    email: "finishline@example.com",
    created: "Oct 03 2025",
    lastActivity: "1 week ago",
    tags: ["name via lookup"],
    color: "bg-green-500",
  },
  {
    id: "10",
    name: "Unknown",
    initials: "?",
    phone: "(206) 201-7085",
    email: "",
    created: "Oct 01 2025",
    lastActivity: "1 week ago",
    tags: ["couldn't find caller name"],
    color: "bg-gray-500",
  },
];

type SearchParams = Promise<{ tab?: string }>;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "all";

  return (
    <div className="flex flex-1 flex-col gap-0">
      {/* Header now rendered via Named Slots pattern (@header/contacts/page.tsx) */}

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
        <ContactsPageClient contacts={mockContacts} totalRecords={77} />
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
    </div>
  );
}
