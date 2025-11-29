import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Calculate SHA-256 hash of image data for duplicate detection
 * Done BEFORE Claude Vision call to save API costs on duplicates
 */
function calculateImageHash(base64Data: string): string {
  return crypto.createHash("sha256").update(base64Data).digest("hex");
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
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
    // 1. Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse request body (read once)
    const body = await nextRequest.json();
    const { imageData, mediaType, organizationSlug } = body;

    if (!organizationSlug) {
      return NextResponse.json(
        { error: "Organization slug is required" },
        { status: 400 }
      );
    }

    if (!imageData || !mediaType) {
      return NextResponse.json(
        { error: "Image data and media type are required" },
        { status: 400 }
      );
    }

    // 3. Verify user has access to organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    // 4. Rate limiting
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: `${session.user.id}_${user.organization.id}_extract`,
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

    // 5. Calculate image hash BEFORE Claude Vision call (saves money on duplicates)
    const imageHash = calculateImageHash(imageData);

    // 6. Check for duplicate image in database
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        organizationId: user.organization.id,
        imageHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        scannedAt: true,
        status: true,
      },
    });

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

    // 7. Call Claude Vision API with base64 data (only for non-duplicates)
    const response = await anthropic.messages.create({
      model: env.CLAUDE_VISION_MODEL, // Configurable via CLAUDE_VISION_MODEL env var
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: "text",
              text: `You are analyzing a church connect card to extract VISITOR INFORMATION ONLY.

IMPORTANT: Only extract information written or checked BY THE VISITOR. Ignore all pre-printed form content, church branding, logos, social media icons, website URLs, and form titles.

Extract these visitor-specific fields:
- Full name (handwritten or typed by visitor)
- Email address (visitor's email)
- Phone number (visitor's phone)
- Prayer request or prayer needs (visitor's written request)
- Visit status (extract the EXACT text of whichever checkbox/option is marked: "First Visit", "First Time", "New Guest", "Returning", "Member", etc. - use the actual words on the form)
- Interests or ministries they checked or wrote
- Address (if visitor filled it in)
- Age or age group (if visitor indicated)
- Family information (spouse, children - only if visitor wrote this)

DO NOT INCLUDE:
- Church name, branding, or logos
- Social media icons or handles
- Website URLs on the form
- Form titles or headers
- Pre-printed text or instructions
- Any decoration or design elements

Return ONLY a JSON object with this structure:
{
  "name": "extracted name or null",
  "email": "extracted email or null",
  "phone": "extracted phone or null",
  "prayer_request": "extracted prayer request or null",
  "visit_status": "exact text of marked option or null",
  "interests": ["array", "of", "interests"] or null,
  "address": "extracted address or null",
  "age_group": "extracted age group or null",
  "family_info": "extracted family info or null",
  "additional_notes": "any other visitor-specific information or null"
}

If a field is not present or cannot be read, set it to null.
Be thorough with handwritten content, even if messy, but strict about ignoring pre-printed form content.`,
            },
          ],
        },
      ],
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
      imageHash, // Include hash for save action to store
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
