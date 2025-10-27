/**
 * Agency Course Creation Page
 *
 * Entry point for agency administrators to create custom courses.
 * Uses PageHeader context for consistent UI without double headers.
 *
 * Agency Features:
 * - Disabled pricing field (subscription model)
 * - Organization-scoped file uploads
 * - Custom navigation with slug parameter
 * - Auto-scoping to organization on creation
 */

import { use } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { AgencyCourseCreateClient } from "./_components/AgencyCourseCreateClient";

interface AgencyCourseCreationPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Agency Course Creation Page Component
 *
 * Provides agencies with the ability to create custom courses
 * that are automatically scoped to their organization.
 */
export default function AgencyCourseCreationPage({
  params,
}: AgencyCourseCreationPageProps) {
  const { slug } = use(params);

  return (
    <PageContainer variant="none">
      <AgencyCourseCreateClient slug={slug} />
    </PageContainer>
  );
}
