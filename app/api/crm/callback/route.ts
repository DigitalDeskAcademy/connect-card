import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * GHL OAuth Callback Endpoint
 * Receives authorization code and exchanges it for access/refresh tokens
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify user authentication (use auth instead of requireAdmin to avoid redirect)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/login?error=auth_required", req.url)
      );
    }

    // 2. Get authorization code from query params
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/platform/admin/api?error=${error}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/platform/admin/api?error=no_code", req.url)
      );
    }

    // 3. Exchange authorization code for tokens
    const clientId = env.GHL_CLIENT_ID;
    const clientSecret = env.GHL_CLIENT_SECRET;
    const redirectUri = env.GHL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL("/platform/admin/api?error=config", req.url)
      );
    }

    const tokenResponse = await fetch(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/platform/admin/api?error=token_exchange", req.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // 4. Calculate token expiration (typically 24 hours)
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // 5. Get user's organization ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.redirect(
        new URL("/platform/admin/api?error=no_org", req.url)
      );
    }

    // 6. Store tokens in database (upsert to handle reconnection)
    await prisma.gHLToken.upsert({
      where: { organizationId: user.organizationId },
      create: {
        organizationId: user.organizationId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        locationId: tokenData.locationId || null,
        companyId: tokenData.companyId || null,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        locationId: tokenData.locationId || null,
        companyId: tokenData.companyId || null,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
      },
    });

    // 7. If agency-level connection (no locationId), fetch all locations
    if (!tokenData.locationId && tokenData.access_token) {
      try {
        const locationsResponse = await fetch(
          "https://services.leadconnectorhq.com/locations/",
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Version: "2021-07-28",
            },
          }
        );

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          const locations = locationsData.locations || [];

          // Find the token we just created
          const ghlToken = await prisma.gHLToken.findUnique({
            where: { organizationId: user.organizationId },
          });

          if (ghlToken) {
            // Store each location as a ChurchMember with GHL integration
            for (const location of locations) {
              // Upsert ChurchMember (GHL Location)
              const churchMember = await prisma.churchMember.upsert({
                where: {
                  organizationId_email: {
                    organizationId: user.organizationId,
                    email: location.email || `${location.id}@ghl.temp`,
                  },
                },
                create: {
                  organizationId: user.organizationId,
                  name: location.name,
                  email: location.email || `${location.id}@ghl.temp`,
                  phone: location.phone,
                  address: location.address,
                  memberType: "VISITOR", // GHL locations synced as visitors by default
                },
                update: {
                  name: location.name,
                  phone: location.phone,
                  address: location.address,
                },
              });

              // Upsert MemberIntegration for GHL
              await prisma.memberIntegration.upsert({
                where: {
                  provider_externalId: {
                    provider: "ghl",
                    externalId: location.id,
                  },
                },
                create: {
                  churchMemberId: churchMember.id,
                  provider: "ghl",
                  externalId: location.id,
                  externalData: {
                    website: location.website,
                    timezone: location.timezone,
                    ...location,
                  },
                  syncStatus: "active",
                },
                update: {
                  externalData: {
                    website: location.website,
                    timezone: location.timezone,
                    ...location,
                  },
                  lastSyncAt: new Date(),
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch GHL locations:", error);
        // Don't fail the whole OAuth flow if locations fetch fails
      }
    }

    // 7. Redirect back to API dashboard with success message
    return NextResponse.redirect(
      new URL("/platform/admin/api?success=connected", req.url)
    );
  } catch (error) {
    console.error("GHL callback error:", error);
    return NextResponse.redirect(
      new URL("/platform/admin/api?error=server", req.url)
    );
  }
}
