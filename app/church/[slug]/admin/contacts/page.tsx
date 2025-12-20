/**
 * Contacts Management Page
 *
 * Enterprise-grade contacts management built on ChurchMember model.
 * Uses the unified DataTable system with full sorting, filtering, and pagination.
 *
 * Data scoping:
 * - Platform admins: All contacts across all organizations
 * - Church admins: Organization-filtered contacts
 * - Staff: Location-filtered contacts (if applicable)
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import {
  getContacts,
  getContactTags,
  getContactKeywords,
} from "@/lib/data/contacts";
import ContactsClient from "./contacts-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    memberType?: string;
    tag?: string;
    keyword?: string;
  }>;
}

export default async function ContactsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const search = await searchParams;

  const { organization, dataScope } = await requireDashboardAccess(slug);

  // Parse search params
  const page = parseInt(search.page ?? "1", 10);
  const pageSize = parseInt(search.pageSize ?? "25", 10);
  const searchQuery = search.search ?? "";
  const memberType = search.memberType as
    | "VISITOR"
    | "RETURNING"
    | "MEMBER"
    | "VOLUNTEER"
    | "STAFF"
    | undefined;
  const tag = search.tag;
  const keyword = search.keyword;

  // Fetch contacts with filters
  const result = await getContacts({
    organizationId: organization.id,
    search: searchQuery,
    memberType,
    tags: tag ? [tag] : undefined,
    keyword,
    page,
    pageSize,
  });

  // Fetch available tags and keywords for filtering (in parallel)
  const [availableTags, availableKeywords] = await Promise.all([
    getContactTags(organization.id),
    getContactKeywords(organization.id),
  ]);

  return (
    <ContactsClient
      contacts={result.contacts}
      totalCount={result.totalCount}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      availableTags={availableTags}
      availableKeywords={availableKeywords}
      organizationId={organization.id}
      slug={slug}
      dataScope={dataScope}
      initialSearch={searchQuery}
      initialMemberType={memberType}
      initialTag={tag}
      initialKeyword={keyword}
    />
  );
}
