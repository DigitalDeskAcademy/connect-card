import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    console.log("📷 Processing connect card image:", imageUrl);

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `You are analyzing a church connect card. Please extract ALL information you can find from this image and return it as a JSON object.

Look for these common fields (but include any other information you find):
- Full name
- Email address
- Phone number
- Prayer request or prayer needs
- Whether this is a first-time visitor
- Interests or ministries they're interested in
- Address (if present)
- Age or age group (if present)
- Family information (spouse, children, if mentioned)
- Any checkboxes that are marked
- Any other written information

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
  "additional_notes": "any other information found or null"
}

If a field is not present or cannot be read, set it to null.
Be thorough and extract everything you can see, even if the handwriting is messy.`,
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
