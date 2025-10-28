/**
 * Test Anthropic API Connection
 *
 * Run this to verify your API key works and see how requests/billing work
 *
 * Usage: pnpm tsx scripts/test-anthropic-api.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env";

async function testAnthropicAPI() {
  console.log("🔍 Testing Anthropic API Connection...\n");

  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  try {
    console.log("📤 Sending test message to Claude...");

    const startTime = Date.now();

    // Simple text test (cheapest way to verify connection)
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Say 'API connection successful!' and nothing else.",
        },
      ],
    });

    const duration = Date.now() - startTime;

    console.log("\n✅ API Connection Successful!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Response Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Model: ${response.model}`);
    console.log(`Response Time: ${duration}ms`);
    console.log(`Stop Reason: ${response.stop_reason}`);
    console.log(`\n💬 Claude's Response:`);

    const textContent = response.content.find(block => block.type === "text");
    if (textContent && textContent.type === "text") {
      console.log(`   "${textContent.text}"`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💰 Token Usage (This is how you're billed!):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Input Tokens:  ${response.usage.input_tokens}`);
    console.log(`Output Tokens: ${response.usage.output_tokens}`);
    console.log(
      `Total Tokens:  ${response.usage.input_tokens + response.usage.output_tokens}`
    );

    // Calculate approximate cost
    // Claude 3.5 Sonnet pricing (as of 2025):
    // Input: $3 per million tokens
    // Output: $15 per million tokens
    const inputCost = (response.usage.input_tokens / 1_000_000) * 3;
    const outputCost = (response.usage.output_tokens / 1_000_000) * 15;
    const totalCost = inputCost + outputCost;

    console.log(`\n💵 Estimated Cost for this request:`);
    console.log(
      `   Input:  $${inputCost.toFixed(6)} (${response.usage.input_tokens} tokens × $3/1M)`
    );
    console.log(
      `   Output: $${outputCost.toFixed(6)} (${response.usage.output_tokens} tokens × $15/1M)`
    );
    console.log(
      `   Total:  $${totalCost.toFixed(6)} (~${(totalCost * 1000).toFixed(4)} cents)`
    );

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📸 For Connect Card Image Analysis:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Typical usage per card:");
    console.log("  • Input: ~1,500 tokens (image + prompt)");
    console.log("  • Output: ~150 tokens (JSON response)");
    console.log("  • Cost: ~$0.007 per card (0.7 cents)");
    console.log("\nFor 100 cards per week:");
    console.log("  • Weekly: ~$0.70");
    console.log("  • Monthly: ~$2.80");
    console.log("\n✅ Very affordable for church use!");
  } catch (error) {
    console.error("\n❌ API Connection Failed!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (error instanceof Error) {
      console.error("Error Message:", error.message);

      // Common error types
      if (
        error.message.includes("401") ||
        error.message.includes("authentication")
      ) {
        console.error("\n🔑 Authentication Error:");
        console.error("   Your API key is invalid or not set correctly.");
        console.error("   Check your .env file: ANTHROPIC_API_KEY=sk-ant-...");
      } else if (error.message.includes("429")) {
        console.error("\n⏱️  Rate Limit Error:");
        console.error("   Too many requests. Wait a moment and try again.");
      } else if (error.message.includes("402")) {
        console.error("\n💳 Payment Required:");
        console.error("   Your Anthropic account needs credits.");
        console.error(
          "   Add payment method at: https://console.anthropic.com/settings/billing"
        );
      }
    } else {
      console.error("Unknown error:", error);
    }

    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Monitor usage: https://console.anthropic.com/settings/usage");
  console.log(
    "2. Set spending limits: https://console.anthropic.com/settings/billing"
  );
  console.log(
    "3. View all requests: https://console.anthropic.com/settings/logs"
  );
  console.log("\n");
}

testAnthropicAPI();
