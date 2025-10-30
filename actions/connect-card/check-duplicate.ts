"use server";

import { prisma } from "@/lib/db";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * Check if a connect card is a potential duplicate
 * Matches on name + (email OR phone) within the same organization
 * Returns existing card info if found
 */
export async function checkDuplicate(
  slug: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    currentCardId?: string; // Skip checking against the card being edited
  }
) {
  // 1. Verify authentication and organization access
  const { organization } = await requireDashboardAccess(slug);

  if (!organization?.id) {
    return {
      status: "error",
      message: "Organization not found",
    };
  }

  // 2. Clean up inputs for comparison
  const cleanName = data.name?.trim().toLowerCase();
  const cleanEmail = data.email?.trim().toLowerCase();
  const formattedPhone = formatPhoneNumber(data.phone); // Format for consistent comparison

  if (!cleanName) {
    return { status: "success", isDuplicate: false };
  }

  // 3. Check for existing cards with matching name + (email OR phone)
  try {
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        organizationId: organization.id,
        id: data.currentCardId ? { not: data.currentCardId } : undefined,
        // Case-insensitive name match
        name: {
          mode: "insensitive" as const,
          equals: cleanName,
        },
        // Match on email OR phone (at least one must be present)
        OR: [
          cleanEmail
            ? { email: { mode: "insensitive" as const, equals: cleanEmail } }
            : undefined,
          formattedPhone ? { phone: { equals: formattedPhone } } : undefined,
        ].filter(
          (condition): condition is NonNullable<typeof condition> =>
            condition !== undefined
        ),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        scannedAt: true,
        status: true,
      },
      orderBy: {
        scannedAt: "desc",
      },
    });

    if (existingCard) {
      return {
        status: "success",
        isDuplicate: true,
        existingCard: {
          id: existingCard.id,
          name: existingCard.name,
          email: existingCard.email,
          phone: existingCard.phone,
          scannedAt: existingCard.scannedAt,
          status: existingCard.status,
        },
      };
    }

    return {
      status: "success",
      isDuplicate: false,
    };
  } catch (error) {
    console.error("Duplicate check error:", error);
    return {
      status: "error",
      message: "Failed to check for duplicates",
    };
  }
}
