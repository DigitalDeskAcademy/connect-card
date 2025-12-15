/**
 * Mobile Camera Wizard - Connect Card Scanning
 *
 * Full-screen camera experience for scanning connect cards on mobile devices.
 * Supports one-sided and two-sided cards with step-by-step guided capture.
 *
 * Authentication:
 * - Token-based: QR code scan provides ?token= for phone access (no login needed)
 * - Session-based: Direct access if already logged in
 *
 * Flow:
 * 1. Select card type (1-sided or 2-sided)
 * 2. Capture front image with live viewfinder
 * 3. Preview and accept/retake
 * 4. (2-sided) Capture back image
 * 5. Process immediately with Claude Vision
 * 6. Continue with next card or finish batch
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getOrganizationLocations } from "@/lib/data/locations";
import { PageContainer } from "@/components/layout/page-container";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScanWizardClient } from "./scan-wizard-client";
import { TokenExpiredError } from "./_components/token-expired-error";
import { createScanSession } from "@/lib/auth/scan-session";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ScanPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  let userId: string;
  let organizationId: string;

  // Token-based authentication (QR code scan from phone)
  if (token) {
    const scanToken = await prisma.scanToken.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, slug: true } },
      },
    });

    // Token not found or invalid
    if (!scanToken) {
      return (
        <TokenExpiredError
          slug={slug}
          message="Invalid or expired link. Please scan a new QR code."
        />
      );
    }

    // Token expired
    if (scanToken.expiresAt < new Date()) {
      await prisma.scanToken.delete({ where: { id: scanToken.id } });
      return (
        <TokenExpiredError
          slug={slug}
          message="This link has expired. Please scan a new QR code."
        />
      );
    }

    // Token already used - but allow reuse within session (don't block)
    // Just mark as used if not already
    if (!scanToken.usedAt) {
      await prisma.scanToken.update({
        where: { id: scanToken.id },
        data: { usedAt: new Date() },
      });
    }

    // Verify slug matches token's organization
    if (scanToken.organization.slug !== slug) {
      return (
        <TokenExpiredError
          slug={slug}
          message="Invalid link. Organization mismatch."
        />
      );
    }

    userId = scanToken.userId;
    organizationId = scanToken.organizationId;

    // Create scan session cookie for subsequent API calls
    await createScanSession(userId, organizationId, slug);
  } else {
    // Session-based authentication (direct access when logged in)
    const { session, organization, member } =
      await requireDashboardAccess(slug);

    // Block staff users - only owners and admins can scan connect cards
    if (member && member.role === "member") {
      redirect("/unauthorized");
    }

    userId = session.user.id;
    organizationId = organization.id;
  }

  // Fetch locations for the wizard
  const locations = await getOrganizationLocations(organizationId);

  // Edge case: No locations - redirect to main connect cards page
  if (locations.length === 0) {
    redirect(`/church/${slug}/admin/connect-cards`);
  }

  // Get user's default location
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultLocationId: true },
  });

  // Validate default location is still active
  const validLocationIds = new Set(locations.map(loc => loc.id));
  const defaultLocationId =
    user?.defaultLocationId && validLocationIds.has(user.defaultLocationId)
      ? user.defaultLocationId
      : locations[0]?.id || null;

  return (
    <PageContainer as="main">
      <ScanWizardClient
        slug={slug}
        locations={locations}
        defaultLocationId={defaultLocationId}
      />
    </PageContainer>
  );
}
