"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { getGHLAccessToken } from "@/lib/ghl-token";
import { prisma } from "@/lib/db";

// Rate limiting configuration - 5 API tests per minute
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Test GHL API connection
 * Validates API credentials by fetching location details
 * @param locationId - Optional specific location ID to test (for multi-location setups)
 */
export async function testGHLConnection(
  locationId?: string
): Promise<ApiResponse> {
  // 1. Authentication check
  const session = await requireAdmin();

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Rate limit exceeded. Please wait before testing again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked",
      };
    }
  }

  try {
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return {
        status: "error",
        message: "No organization found",
      };
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getGHLAccessToken(user.organizationId);

    if (!accessToken) {
      return {
        status: "error",
        message: "GHL not connected. Click 'Connect GHL' to authorize.",
      };
    }

    // Determine which location to test
    let targetLocationId = locationId;

    if (!targetLocationId) {
      // No location specified - try to get from token record
      const tokenRecord = await prisma.gHLToken.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (tokenRecord?.locationId) {
        // Location-level OAuth - use the stored locationId
        targetLocationId = tokenRecord.locationId;
      } else {
        // Agency-level OAuth - fetch first location from database
        const firstLearner = await prisma.contact.findFirst({
          where: {
            organizationId: user.organizationId,
            integrations: {
              some: {
                provider: "ghl",
              },
            },
          },
          include: {
            integrations: {
              where: { provider: "ghl" },
            },
          },
        });

        if (!firstLearner || !firstLearner.integrations[0]) {
          return {
            status: "error",
            message: "No locations found. Try reconnecting GHL.",
          };
        }

        targetLocationId = firstLearner.integrations[0].externalId;
      }
    }

    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/${targetLocationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!response.ok) {
      return {
        status: "error",
        message: "API connection failed",
      };
    }

    const data = await response.json();

    return {
      status: "success",
      message: `Connected to ${data.location?.name || "location"} (${data.location?.id || targetLocationId})`,
    };
  } catch {
    return {
      status: "error",
      message: "Failed to connect to GHL API",
    };
  }
}

/**
 * Fetch GHL locations
 * Gets list of authorized locations for the API key
 */
export async function fetchGHLLocations(): Promise<ApiResponse> {
  const session = await requireAdmin();

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Rate limit exceeded",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked",
      };
    }
  }

  try {
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return {
        status: "error",
        message: "No organization found",
      };
    }

    // Get valid access token
    const accessToken = await getGHLAccessToken(user.organizationId);

    if (!accessToken) {
      return {
        status: "error",
        message: "GHL not connected. Click 'Connect GHL' to authorize.",
      };
    }

    const response = await fetch(
      "https://services.leadconnectorhq.com/locations/search",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!response.ok) {
      return {
        status: "error",
        message: "Failed to fetch locations",
      };
    }

    const data = await response.json();
    const count = data.locations?.length || 0;

    return {
      status: "success",
      message: `Found ${count} location${count !== 1 ? "s" : ""}`,
    };
  } catch {
    return {
      status: "error",
      message: "Request failed",
    };
  }
}

/**
 * Fetch GHL contacts
 * Gets contacts for the configured location
 * @param locationId - Optional specific location ID to fetch contacts for
 */
export async function fetchGHLContacts(
  locationId?: string
): Promise<ApiResponse> {
  const session = await requireAdmin();

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Rate limit exceeded",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked",
      };
    }
  }

  try {
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return {
        status: "error",
        message: "No organization found",
      };
    }

    // Get valid access token
    const accessToken = await getGHLAccessToken(user.organizationId);

    if (!accessToken) {
      return {
        status: "error",
        message: "GHL not connected. Click 'Connect GHL' to authorize.",
      };
    }

    // Determine which location to use
    let targetLocationId = locationId;

    if (!targetLocationId) {
      const tokenRecord = await prisma.gHLToken.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (tokenRecord?.locationId) {
        targetLocationId = tokenRecord.locationId;
      } else {
        const firstLearner = await prisma.contact.findFirst({
          where: {
            organizationId: user.organizationId,
            integrations: {
              some: {
                provider: "ghl",
              },
            },
          },
          include: {
            integrations: {
              where: { provider: "ghl" },
            },
          },
        });

        if (!firstLearner || !firstLearner.integrations[0]) {
          return {
            status: "error",
            message: "No locations found. Try reconnecting GHL.",
          };
        }

        targetLocationId = firstLearner.integrations[0].externalId;
      }
    }

    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${targetLocationId}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!response.ok) {
      return {
        status: "error",
        message: "Failed to fetch contacts",
      };
    }

    const data = await response.json();
    const count = data.contacts?.length || 0;

    return {
      status: "success",
      message: `Found ${count} contact${count !== 1 ? "s" : ""}`,
    };
  } catch {
    return {
      status: "error",
      message: "Request failed",
    };
  }
}

/**
 * Manually sync GHL locations to Learner records
 * Fetches locations from GHL API and creates Learner + LearnerIntegration records
 */
export async function syncGHLLocations(): Promise<ApiResponse> {
  const session = await requireAdmin();

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Rate limit exceeded",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked",
      };
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return {
        status: "error",
        message: "No organization found",
      };
    }

    // Get valid access token
    const accessToken = await getGHLAccessToken(user.organizationId);

    if (!accessToken) {
      return {
        status: "error",
        message: "GHL not connected. Click 'Connect GHL' to authorize.",
      };
    }

    // Fetch locations from GHL API
    const response = await fetch(
      "https://services.leadconnectorhq.com/locations/search",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "GHL API error:",
        response.status,
        response.statusText,
        errorText
      );
      return {
        status: "error",
        message: `Failed to fetch locations: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const locations = data.locations || [];

    if (locations.length === 0) {
      return {
        status: "error",
        message: "No locations found in GHL account",
      };
    }

    // Create/update Learner records for each location
    const createdLearners = [];

    for (const location of locations) {
      // Check if learner already exists via integration
      const existingIntegration = await prisma.contactIntegration.findUnique({
        where: {
          provider_externalId: {
            provider: "ghl",
            externalId: location.id,
          },
        },
        include: { contact: true },
      });

      if (existingIntegration) {
        // Update existing learner
        const updated = await prisma.contact.update({
          where: { id: existingIntegration.contactId },
          data: {
            name: location.name,
            email: location.email,
            phone: location.phone,
            address: location.address,
            timezone: location.timezone,
          },
        });
        createdLearners.push(updated.name);
      } else {
        // Create new learner + integration
        const learner = await prisma.contact.create({
          data: {
            organizationId: user.organizationId,
            name: location.name,
            email: location.email,
            phone: location.phone,
            address: location.address,
            timezone: location.timezone,
            integrations: {
              create: {
                provider: "ghl",
                externalId: location.id,
                externalData: {
                  website: location.website,
                  companyId: location.companyId,
                },
                lastSyncAt: new Date(),
                syncStatus: "active",
              },
            },
          },
        });
        createdLearners.push(learner.name);
      }
    }

    return {
      status: "success",
      message: `Synced ${createdLearners.length} learners: ${createdLearners.join(", ")}`,
    };
  } catch (error) {
    console.error("GHL sync error:", error);
    return {
      status: "error",
      message: "Failed to sync locations",
    };
  }
}

/**
 * Get all learners for current organization
 * Returns learners from database with their integration details
 */
export async function getLearners(): Promise<{
  learners: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    timezone: string | null;
    ghlLocationId: string | null;
  }>;
}> {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return { learners: [] };
  }

  const learners = await prisma.contact.findMany({
    where: {
      organizationId: user.organizationId,
    },
    include: {
      integrations: {
        where: { provider: "ghl" },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return {
    learners: learners.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      address: l.address,
      timezone: l.timezone,
      ghlLocationId: l.integrations[0]?.externalId || null,
    })),
  };
}

/**
 * Check if GHL is connected for current organization
 */
export async function checkGHLConnection(): Promise<{
  connected: boolean;
  locationId?: string;
  isAgencyLevel: boolean;
  locationCount: number;
}> {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return { connected: false, isAgencyLevel: false, locationCount: 0 };
  }

  const tokenRecord = await prisma.gHLToken.findUnique({
    where: { organizationId: user.organizationId },
  });

  if (!tokenRecord) {
    return { connected: false, isAgencyLevel: false, locationCount: 0 };
  }

  // Count learners with GHL integrations
  const learnerCount = await prisma.contact.count({
    where: {
      organizationId: user.organizationId,
      integrations: {
        some: {
          provider: "ghl",
        },
      },
    },
  });

  const isAgencyLevel =
    !tokenRecord.locationId && tokenRecord.companyId !== null;

  return {
    connected: true,
    locationId: tokenRecord.locationId || undefined,
    isAgencyLevel,
    locationCount: learnerCount,
  };
}

/**
 * Disconnect GHL by deleting tokens
 */
export async function disconnectGHL(): Promise<{ success: boolean }> {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return { success: false };
  }

  await prisma.gHLToken.deleteMany({
    where: { organizationId: user.organizationId },
  });

  return { success: true };
}
