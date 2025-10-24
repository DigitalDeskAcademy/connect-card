import { prisma } from "@/lib/db";

/**
 * Get valid GHL access token for organization
 * Automatically refreshes if expired
 */
export async function getGHLAccessToken(
  organizationId: string
): Promise<string | null> {
  try {
    // 1. Fetch token from database
    const tokenRecord = await prisma.gHLToken.findUnique({
      where: { organizationId },
    });

    if (!tokenRecord) {
      return null;
    }

    // 2. Check if token is still valid (with 5 minute buffer)
    const isExpired =
      new Date(tokenRecord.expiresAt).getTime() - Date.now() < 5 * 60 * 1000;

    if (!isExpired) {
      return tokenRecord.accessToken;
    }

    // 3. Token expired - refresh it
    const clientId = process.env.GHL_CLIENT_ID;
    const clientSecret = process.env.GHL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GHL OAuth credentials not configured");
    }

    const refreshResponse = await fetch(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: tokenRecord.refreshToken,
        }),
      }
    );

    if (!refreshResponse.ok) {
      console.error("Token refresh failed");
      return null;
    }

    const refreshData = await refreshResponse.json();

    // 4. Update database with new tokens
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

    await prisma.gHLToken.update({
      where: { organizationId },
      data: {
        accessToken: refreshData.access_token,
        refreshToken: refreshData.refresh_token || tokenRecord.refreshToken,
        expiresAt: newExpiresAt,
      },
    });

    return refreshData.access_token;
  } catch (error) {
    console.error("Error getting GHL access token:", error);
    return null;
  }
}

/**
 * Check if organization has GHL connected
 */
export async function hasGHLConnected(
  organizationId: string
): Promise<boolean> {
  const tokenRecord = await prisma.gHLToken.findUnique({
    where: { organizationId },
  });

  return tokenRecord !== null;
}
