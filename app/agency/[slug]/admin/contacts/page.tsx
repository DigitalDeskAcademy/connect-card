/**
 * Universal Contacts Management Page
 *
 * Used by all three tiers with different data scoping:
 * - Platform admins: See all contacts across all organizations
 * - Agency admins: See all contacts in their organization
 * - End users (clinics): See only their clinic's contacts
 *
 * All users see the same UI, data is filtered based on role.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import AgencyContactsClient from "./client";
import { type Contact } from "@/components/contacts/ContactsTable";

// Mock data - TODO: Replace with role-based scoped queries
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    initials: "JS",
    phone: "(555) 123-4567",
    email: "john.smith@clinic.com",
    created: "Oct 15 2025",
    lastActivity: "2 hours ago",
    tags: ["IV Therapy Client", "VIP"],
    color: "bg-purple-500",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    initials: "SJ",
    phone: "(555) 234-5678",
    email: "sarah.j@example.com",
    created: "Oct 14 2025",
    lastActivity: "1 day ago",
    tags: ["New Patient"],
    color: "bg-pink-500",
  },
  {
    id: "3",
    name: "Michael Brown",
    initials: "MB",
    phone: "(555) 345-6789",
    email: "mbrown@company.com",
    created: "Oct 13 2025",
    lastActivity: "3 days ago",
    tags: ["Corporate Account"],
    color: "bg-blue-500",
  },
  {
    id: "4",
    name: "Emily Davis",
    initials: "ED",
    phone: "(555) 456-7890",
    email: "emily.davis@email.com",
    created: "Oct 12 2025",
    lastActivity: "1 week ago",
    tags: ["Monthly Member"],
    color: "bg-indigo-500",
  },
  {
    id: "5",
    name: "Robert Wilson",
    initials: "RW",
    phone: "(555) 567-8901",
    email: "r.wilson@gmail.com",
    created: "Oct 10 2025",
    lastActivity: "2 days ago",
    tags: ["Referral"],
    color: "bg-green-500",
  },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgencyContactsPage({ params }: PageProps) {
  const { slug } = await params;
  const { organization, dataScope } = await requireDashboardAccess(slug);

  // TODO: Fetch contacts based on data scope
  // Platform admin: all contacts
  // Agency admin: organizationId filtered
  // End user (clinic): clinic-specific contacts

  // For now, use mock data that represents the scoped view
  const contacts = mockContacts;

  // In production, this would be:
  // if (dataScope.type === 'platform') {
  //   contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } });
  // } else if (dataScope.type === 'agency') {
  //   contacts = await db.contact.findMany({
  //     where: { organizationId: dataScope.organizationId },
  //     orderBy: { createdAt: 'desc' }
  //   });
  // } else if (dataScope.type === 'clinic') {
  //   contacts = await db.contact.findMany({
  //     where: {
  //       organizationId: dataScope.organizationId,
  //       clinicId: dataScope.clinicId
  //     },
  //     orderBy: { createdAt: 'desc' }
  //   });
  // }

  return (
    <AgencyContactsClient
      contacts={contacts}
      organizationId={organization.id}
      dataScope={dataScope}
    />
  );
}
