import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageData, mediaType } = await request.json();

    if (!imageData || !mediaType) {
      return NextResponse.json(
        { error: "Image data and media type are required" },
        { status: 400 }
      );
    }

    console.log("📷 Processing connect card image (base64)");

    // Call Claude Vision API with base64 data
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929", // Latest Claude Sonnet 4.5 model
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
- Whether this is a first-time visitor (checkbox marked by visitor)
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
  "first_time_visitor": true/false/null,
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

    console.log("✅ Claude response received");

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
      console.error("No JSON found in response:", extractedText);
      return NextResponse.json(
        {
          error: "Could not extract JSON from response",
          raw_response: extractedText,
        },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log("📋 Extracted data:", extractedData);

    return NextResponse.json({
      success: true,
      data: extractedData,
      raw_text: extractedText,
    });
  } catch (error) {
    console.error("❌ Error processing connect card:", error);

    return NextResponse.json(
      {
        error: "Failed to process connect card",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
