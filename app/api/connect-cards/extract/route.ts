import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getScanSessionForApi } from "@/lib/auth/scan-session";

/**
 * Calculate SHA-256 hash of image data for duplicate detection
 * Done BEFORE Claude Vision call to save API costs on duplicates
 */
function calculateImageHash(base64Data: string): string {
  return crypto.createHash("sha256").update(base64Data).digest("hex");
}

// Initialize Anthropic client
// Use placeholder key in CI to allow build to succeed
// Actual API calls won't work without a real key
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY || "sk-ant-placeholder",
});

/// Rate limiting: Allow batch processing while preventing abuse
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 60, // 60 extractions per minute - supports batch uploads of 50+ cards
  })
);

export async function POST(nextRequest: NextRequest) {
  try {
    // 1. Authentication check - supports Better Auth session or scan session cookie
    let userId: string;
    let organizationId: string | null = null;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check for scan session cookie (phone QR code flow)
    const scanSession = await getScanSessionForApi();

    if (session?.user) {
      userId = session.user.id;
    } else if (scanSession) {
      userId = scanSession.userId;
      organizationId = scanSession.organizationId;
    } else {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse request body (read once)
    // Supports both single-sided (imageData) and two-sided (frontImageData + backImageData)
    const body = await nextRequest.json();
    const {
      // Single-sided format (backward compatible)
      imageData,
      mediaType,
      // Two-sided format
      frontImageData,
      frontMediaType,
      backImageData,
      backMediaType,
      // Common
      organizationSlug,
    } = body;

    if (!organizationSlug) {
      return NextResponse.json(
        { error: "Organization slug is required" },
        { status: 400 }
      );
    }

    // Support both old and new request formats
    const frontImage = frontImageData || imageData;
    const frontType = frontMediaType || mediaType;
    const backImage = backImageData || null;
    const backType = backMediaType || null;

    if (!frontImage || !frontType) {
      return NextResponse.json(
        { error: "Front image data and media type are required" },
        { status: 400 }
      );
    }

    // 3. Verify user has access to organization
    // For scan sessions, organizationId is already validated from the token
    if (scanSession) {
      // Verify the slug matches the scan session's organization
      const org = await prisma.organization.findUnique({
        where: { id: scanSession.organizationId },
        select: { slug: true },
      });
      if (!org || org.slug !== organizationSlug) {
        return NextResponse.json(
          { error: "Forbidden - invalid organization access" },
          { status: 403 }
        );
      }
      organizationId = scanSession.organizationId;
    } else {
      // For Better Auth sessions, lookup the user's organization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      });

      if (!user?.organization || user.organization.slug !== organizationSlug) {
        return NextResponse.json(
          { error: "Forbidden - invalid organization access" },
          { status: 403 }
        );
      }
      organizationId = user.organization.id;
    }

    // 4. Rate limiting
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: `${userId}_${organizationId}_extract`,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          {
            error:
              "Rate limited - too many extraction requests. Please wait before trying again.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Request blocked by security policy" },
        { status: 403 }
      );
    }

    // 5. Calculate image hashes BEFORE Claude Vision call (saves money on duplicates)
    const frontImageHash = calculateImageHash(frontImage);
    const backImageHash = backImage ? calculateImageHash(backImage) : null;

    console.log(
      "[DEBUG SERVER EXTRACT] Front image base64 length:",
      frontImage.length
    );
    console.log("[DEBUG SERVER EXTRACT] Front image hash:", frontImageHash);
    console.log("[DEBUG SERVER EXTRACT] Organization ID:", organizationId);

    // 6. Check for duplicate image in database (check front image hash)
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        organizationId: organizationId!,
        imageHash: frontImageHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        scannedAt: true,
        status: true,
      },
    });

    console.log(
      "[DEBUG SERVER EXTRACT] Existing card found:",
      existingCard ? "YES" : "NO"
    );
    if (existingCard) {
      console.log("[DEBUG SERVER EXTRACT] Matching card ID:", existingCard.id);
      console.log(
        "[DEBUG SERVER EXTRACT] Matching card scannedAt:",
        existingCard.scannedAt
      );
    }

    if (existingCard) {
      return NextResponse.json(
        {
          error: "Duplicate image detected",
          message: "This exact card has already been uploaded",
          duplicate: true,
          existingCard: {
            id: existingCard.id,
            name: existingCard.name,
            email: existingCard.email,
            scannedAt: existingCard.scannedAt,
            status: existingCard.status,
          },
        },
        { status: 409 }
      );
    }

    // 7. Build Claude Vision API content (supports single or two-sided cards)
    type ImageMediaType =
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    type ImageBlockParam = {
      type: "image";
      source: { type: "base64"; media_type: ImageMediaType; data: string };
    };
    type TextBlockParam = { type: "text"; text: string };

    const messageContent: (ImageBlockParam | TextBlockParam)[] = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: frontType as ImageMediaType,
          data: frontImage,
        },
      },
    ];

    // Add back image if provided (two-sided card)
    if (backImage && backType) {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: backType as ImageMediaType,
          data: backImage,
        },
      });
    }

    // Use different prompt for single vs two-sided cards
    const isTwoSided = Boolean(backImage);
    const extractionPrompt = isTwoSided
      ? `You are analyzing a TWO-SIDED church connect card to extract VISITOR INFORMATION ONLY.

IMAGE 1 is the FRONT of the card.
IMAGE 2 is the BACK of the card.

Extract all visitor information from BOTH images, combining data from both sides. If the same field appears on both sides with different values, prefer the more complete/legible version.

IMPORTANT: Only extract information written or checked BY THE VISITOR. Ignore all pre-printed form content, church branding, logos, social media icons, website URLs, and form titles.

CHECKBOX DETECTION - This is critical:
- Carefully look for ANY checkboxes, circles, or boxes that have been MARKED by the visitor
- A checkbox is marked if it contains: a checkmark (✓), an X, is filled in/colored, circled, or has any mark inside
- An EMPTY checkbox (just an outline with nothing inside) means NOT selected
- Report the EXACT label text next to each MARKED checkbox

Extract these visitor-specific fields:
- Full name (handwritten or typed by visitor)
- Email address (visitor's email)
- Phone number (visitor's phone)
- Prayer request or prayer needs (visitor's written request)
- Visit status: Look for checkboxes like "I'm new", "First Visit", "First Time Guest", "New Here", "Returning", "Member", "Regular Attender" - extract the EXACT text of the MARKED option only. If no visit status checkbox is marked, use null.
- Interests: Look for ANY marked checkboxes related to interests, getting involved, or volunteering. Common labels include: "I want to volunteer", "I'd like to serve", "Volunteering", "Small Groups", "Kids Ministry", "Youth", "Worship", etc. Include the exact text of ALL marked interest checkboxes.
- Address (if visitor filled it in)
- Age or age group (if visitor indicated)
- Family information (spouse, children - only if visitor wrote this)
- Campaign keywords: Look for standalone words or short phrases (1-2 words) written separately from other content, often at the bottom of the card or in margins. These are trigger words the church asks visitors to write (e.g., "impacted", "coffee oasis", "next steps"). They don't fit into other fields and stand alone.

DO NOT INCLUDE:
- Church name, branding, or logos
- Social media icons or handles
- Website URLs on the form
- Form titles or headers
- Pre-printed text or instructions
- Any decoration or design elements
- Unmarked/empty checkboxes

Return ONLY a JSON object with this structure:
{
  "name": "extracted name or null",
  "email": "extracted email or null",
  "phone": "extracted phone or null",
  "prayer_request": "extracted prayer request or null",
  "visit_status": "exact text of marked visit status checkbox or null if none marked",
  "interests": ["exact text of each marked interest checkbox"] or null if none marked,
  "address": "extracted address or null",
  "age_group": "extracted age group or null",
  "family_info": "extracted family info or null",
  "keywords": ["standalone keywords or short phrases, lowercase"] or null if none found,
  "additional_notes": "any other marked checkboxes or visitor-written information not captured above, or null"
}

If a field is not present or no checkbox is marked for it, set it to null.
Be thorough with handwritten content, even if messy, but strict about ignoring pre-printed form content and unmarked checkboxes.`
      : `You are analyzing a church connect card to extract VISITOR INFORMATION ONLY.

IMPORTANT: Only extract information written or checked BY THE VISITOR. Ignore all pre-printed form content, church branding, logos, social media icons, website URLs, and form titles.

CHECKBOX DETECTION - This is critical:
- Carefully look for ANY checkboxes, circles, or boxes that have been MARKED by the visitor
- A checkbox is marked if it contains: a checkmark (✓), an X, is filled in/colored, circled, or has any mark inside
- An EMPTY checkbox (just an outline with nothing inside) means NOT selected
- Report the EXACT label text next to each MARKED checkbox

Extract these visitor-specific fields:
- Full name (handwritten or typed by visitor)
- Email address (visitor's email)
- Phone number (visitor's phone)
- Prayer request or prayer needs (visitor's written request)
- Visit status: Look for checkboxes like "I'm new", "First Visit", "First Time Guest", "New Here", "Returning", "Member", "Regular Attender" - extract the EXACT text of the MARKED option only. If no visit status checkbox is marked, use null.
- Interests: Look for ANY marked checkboxes related to interests, getting involved, or volunteering. Common labels include: "I want to volunteer", "I'd like to serve", "Volunteering", "Small Groups", "Kids Ministry", "Youth", "Worship", etc. Include the exact text of ALL marked interest checkboxes.
- Address (if visitor filled it in)
- Age or age group (if visitor indicated)
- Family information (spouse, children - only if visitor wrote this)
- Campaign keywords: Look for standalone words or short phrases (1-2 words) written separately from other content, often at the bottom of the card or in margins. These are trigger words the church asks visitors to write (e.g., "impacted", "coffee oasis", "next steps"). They don't fit into other fields and stand alone.

DO NOT INCLUDE:
- Church name, branding, or logos
- Social media icons or handles
- Website URLs on the form
- Form titles or headers
- Pre-printed text or instructions
- Any decoration or design elements
- Unmarked/empty checkboxes

Return ONLY a JSON object with this structure:
{
  "name": "extracted name or null",
  "email": "extracted email or null",
  "phone": "extracted phone or null",
  "prayer_request": "extracted prayer request or null",
  "visit_status": "exact text of marked visit status checkbox or null if none marked",
  "interests": ["exact text of each marked interest checkbox"] or null if none marked,
  "address": "extracted address or null",
  "age_group": "extracted age group or null",
  "family_info": "extracted family info or null",
  "keywords": ["standalone keywords or short phrases, lowercase"] or null if none found,
  "additional_notes": "any other marked checkboxes or visitor-written information not captured above, or null"
}

If a field is not present or no checkbox is marked for it, set it to null.
Be thorough with handwritten content, even if messy, but strict about ignoring pre-printed form content and unmarked checkboxes.`;

    messageContent.push({ type: "text", text: extractionPrompt });

    // 8. Call Claude Vision API with base64 data (only for non-duplicates)
    const response = await anthropic.messages.create({
      model: env.CLAUDE_VISION_MODEL, // Configurable via CLAUDE_VISION_MODEL env var
      max_tokens: isTwoSided ? 1500 : 1024, // More tokens for two-sided cards
      messages: [{ role: "user", content: messageContent }],
    });

    // Extract the text content from the response
    const textContent = response.content.find(block => block.type === "text");

    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text content in response" },
        { status: 500 }
      );
    }

    // Parse the JSON from Claude's response
    const extractedText = textContent.text;

    // Try to find JSON in the response (Claude might wrap it in markdown)
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error: "Could not extract JSON from response",
          raw_response: extractedText,
        },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: extractedData,
      imageHash: frontImageHash, // Front image hash (backward compatible field name)
      backImageHash, // Back image hash (null if single-sided)
      raw_text: extractedText,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process connect card",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
