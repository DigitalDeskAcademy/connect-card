import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  fromMemberKeywordsJson,
  toMemberKeywordsJson,
} from "@/lib/prisma/json-types";

/**
 * Cleanup Keywords Cron Job
 *
 * Clears stale campaign keywords from both connect cards and members.
 * Keywords are campaign-specific tracking data that becomes stale after ~1 month.
 *
 * For ConnectCards: Clears all keywords from cards older than 30 days
 * For ChurchMembers: Filters out individual keywords older than 30 days
 *
 * Schedule: Daily at 3:00 AM (configure in vercel.json or external cron)
 *
 * Security:
 * - Protected by CRON_SECRET header (Vercel cron) or API key
 * - Only clears keywords array, does not delete records
 */
export async function GET(request: NextRequest) {
  // Verify the request is authorized (Vercel cron or API key)
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  // Allow if CRON_SECRET matches or if running in development
  const isDev = process.env.NODE_ENV === "development";
  const isAuthorized =
    isDev ||
    authHeader === `Bearer ${cronSecret}` ||
    request.headers.get("x-vercel-cron") === "true";

  if (!isAuthorized && cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffIso = cutoffDate.toISOString();

    // 1. Clear keywords from connect cards older than 30 days
    const cardResult = await prisma.connectCard.updateMany({
      where: {
        scannedAt: {
          lt: cutoffDate,
        },
        detectedKeywords: {
          isEmpty: false, // Only update cards that have keywords
        },
      },
      data: {
        detectedKeywords: [], // Clear the keywords array
      },
    });

    // 2. Filter out stale keywords from church members
    // We need to process each member individually since we're filtering JSON content
    const membersWithKeywords = await prisma.churchMember.findMany({
      where: {
        NOT: {
          detectedKeywords: {
            equals: [],
          },
        },
      },
      select: {
        id: true,
        detectedKeywords: true,
      },
    });

    let membersUpdated = 0;
    let keywordsRemoved = 0;

    // Process members in batches using a transaction
    const updateOperations = [];

    for (const member of membersWithKeywords) {
      const keywords = fromMemberKeywordsJson(member.detectedKeywords);
      const freshKeywords = keywords.filter(kw => kw.detectedAt >= cutoffIso);

      // Only update if we're actually removing keywords
      if (freshKeywords.length < keywords.length) {
        keywordsRemoved += keywords.length - freshKeywords.length;
        membersUpdated++;

        updateOperations.push(
          prisma.churchMember.update({
            where: { id: member.id },
            data: {
              detectedKeywords: toMemberKeywordsJson(freshKeywords),
            },
          })
        );
      }
    }

    // Execute all updates in a transaction
    if (updateOperations.length > 0) {
      await prisma.$transaction(updateOperations);
    }

    const message = [
      `Cleared keywords from ${cardResult.count} connect cards`,
      `Removed ${keywordsRemoved} stale keywords from ${membersUpdated} members`,
    ].join("; ");

    console.log(`[CRON] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      connectCards: {
        clearedCount: cardResult.count,
      },
      members: {
        updatedCount: membersUpdated,
        keywordsRemovedCount: keywordsRemoved,
      },
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Keyword cleanup failed:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
