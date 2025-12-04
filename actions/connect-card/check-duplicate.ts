"use server";

import { prisma } from "@/lib/db";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance normalized by max length
 */
function stringSimilarity(str1: string | null, str2: string | null): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Calculate phone number similarity (digits only)
 * Returns percentage of matching digits in same positions
 */
function phoneSimilarity(phone1: string | null, phone2: string | null): number {
  if (!phone1 || !phone2) return 0;

  // Extract digits only
  const digits1 = phone1.replace(/\D/g, "");
  const digits2 = phone2.replace(/\D/g, "");

  if (digits1 === digits2) return 1;
  if (digits1.length === 0 || digits2.length === 0) return 0;

  // Compare digit by digit (handle different lengths)
  const maxLen = Math.max(digits1.length, digits2.length);
  let matches = 0;

  for (let i = 0; i < maxLen; i++) {
    if (digits1[i] === digits2[i]) matches++;
  }

  return matches / maxLen;
}

// Match confidence threshold - above this, don't bother reviewer with discrepancies
const CONFIDENCE_THRESHOLD = 0.8;

/**
 * Check if a connect card matches an existing member or another connect card
 *
 * Match Priority:
 * 1. Email match (strongest - email is unique identifier)
 *    - If email matches, person IS the same - check similarity of other fields
 *    - >80% similar: auto-flag as existing, don't surface discrepancies
 *    - <80% similar: surface to reviewer (could be legitimately new data)
 * 2. Name + Phone match (fallback when no email)
 *
 * Checks against:
 * 1. ChurchMember table (existing members)
 * 2. ConnectCard table (previously scanned cards)
 */
export async function checkDuplicate(
  slug: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    currentCardId?: string;
  }
) {
  const { organization } = await requireDashboardAccess(slug);

  if (!organization?.id) {
    return { status: "error", message: "Organization not found" };
  }

  const cleanName = data.name?.trim();
  const cleanEmail = data.email?.trim().toLowerCase();
  const formattedPhone = formatPhoneNumber(data.phone);

  if (!cleanName && !cleanEmail) {
    return { status: "success", isDuplicate: false };
  }

  try {
    // PRIORITY 1: Email match against ChurchMember (strongest identifier)
    if (cleanEmail) {
      const existingMember = await prisma.churchMember.findFirst({
        where: {
          organizationId: organization.id,
          email: { mode: "insensitive" as const, equals: cleanEmail },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          memberType: true,
        },
      });

      if (existingMember) {
        // Calculate similarity for other fields
        const nameSim = stringSimilarity(cleanName, existingMember.name);
        const phoneSim = phoneSimilarity(formattedPhone, existingMember.phone);
        const avgSimilarity = (nameSim + phoneSim) / 2;

        return {
          status: "success",
          isDuplicate: true,
          matchType: "member_email" as const,
          confidence: avgSimilarity,
          // Only surface discrepancies if below threshold
          hasDiscrepancies: avgSimilarity < CONFIDENCE_THRESHOLD,
          existingMember: {
            id: existingMember.id,
            name: existingMember.name,
            email: existingMember.email,
            phone: existingMember.phone,
            memberType: existingMember.memberType,
          },
          // Include similarity scores for transparency
          similarity: {
            name: Math.round(nameSim * 100),
            phone: Math.round(phoneSim * 100),
          },
        };
      }
    }

    // PRIORITY 2: Email match against ConnectCard
    if (cleanEmail) {
      const existingCard = await prisma.connectCard.findFirst({
        where: {
          organizationId: organization.id,
          id: data.currentCardId ? { not: data.currentCardId } : undefined,
          email: { mode: "insensitive" as const, equals: cleanEmail },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          scannedAt: true,
          status: true,
        },
        orderBy: { scannedAt: "desc" },
      });

      if (existingCard) {
        const nameSim = stringSimilarity(cleanName, existingCard.name);
        const phoneSim = phoneSimilarity(formattedPhone, existingCard.phone);
        const avgSimilarity = (nameSim + phoneSim) / 2;

        return {
          status: "success",
          isDuplicate: true,
          matchType: "card_email" as const,
          confidence: avgSimilarity,
          hasDiscrepancies: avgSimilarity < CONFIDENCE_THRESHOLD,
          existingCard: {
            id: existingCard.id,
            name: existingCard.name,
            email: existingCard.email,
            phone: existingCard.phone,
            scannedAt: existingCard.scannedAt,
            status: existingCard.status,
          },
          similarity: {
            name: Math.round(nameSim * 100),
            phone: Math.round(phoneSim * 100),
          },
        };
      }
    }

    // PRIORITY 3: Name + Phone match against ChurchMember (fallback)
    if (cleanName && formattedPhone) {
      const existingMember = await prisma.churchMember.findFirst({
        where: {
          organizationId: organization.id,
          name: { mode: "insensitive" as const, equals: cleanName },
          phone: { equals: formattedPhone },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          memberType: true,
        },
      });

      if (existingMember) {
        return {
          status: "success",
          isDuplicate: true,
          matchType: "member_name_phone" as const,
          confidence: 1, // Exact match on name+phone
          hasDiscrepancies: false,
          existingMember: {
            id: existingMember.id,
            name: existingMember.name,
            email: existingMember.email,
            phone: existingMember.phone,
            memberType: existingMember.memberType,
          },
        };
      }
    }

    // PRIORITY 4: Name + Phone match against ConnectCard (fallback)
    if (cleanName && formattedPhone) {
      const existingCard = await prisma.connectCard.findFirst({
        where: {
          organizationId: organization.id,
          id: data.currentCardId ? { not: data.currentCardId } : undefined,
          name: { mode: "insensitive" as const, equals: cleanName },
          phone: { equals: formattedPhone },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          scannedAt: true,
          status: true,
        },
        orderBy: { scannedAt: "desc" },
      });

      if (existingCard) {
        return {
          status: "success",
          isDuplicate: true,
          matchType: "card_name_phone" as const,
          confidence: 1,
          hasDiscrepancies: false,
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
    }

    return { status: "success", isDuplicate: false };
  } catch (error) {
    console.error("[checkDuplicate] Error:", error);
    return { status: "error", message: "Failed to check for duplicates" };
  }
}
