/**
 * Simple Anthropic API Test (Standalone)
 *
 * Usage: node scripts/test-anthropic-simple.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error("❌ ANTHROPIC_API_KEY not found in .env file");
  process.exit(1);
}

console.log("🔍 Testing Anthropic API Connection...\n");
console.log(`🔑 API Key Found: ${apiKey.slice(0, 12)}...${apiKey.slice(-4)}\n`);

const anthropic = new Anthropic({ apiKey });

try {
  console.log("📤 Sending test message to Claude...\n");

  const startTime = Date.now();

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

  console.log("✅ API Connection Successful!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Response Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Model: ${response.model}`);
  console.log(`Response Time: ${duration}ms`);
  console.log(`Stop Reason: ${response.stop_reason}`);

  const textContent = response.content.find(block => block.type === "text");
  if (textContent && textContent.type === "text") {
    console.log(`\n💬 Claude's Response: "${textContent.text}"`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 Token Usage (This is how you're billed!):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Input Tokens:  ${response.usage.input_tokens}`);
  console.log(`Output Tokens: ${response.usage.output_tokens}`);
  console.log(
    `Total Tokens:  ${
      response.usage.input_tokens + response.usage.output_tokens
    }`
  );

  // Calculate cost (Claude 3.5 Sonnet pricing as of 2025)
  const inputCost = (response.usage.input_tokens / 1_000_000) * 3;
  const outputCost = (response.usage.output_tokens / 1_000_000) * 15;
  const totalCost = inputCost + outputCost;

  console.log(`\n💵 Cost for this request:`);
  console.log(
    `   Input:  $${inputCost.toFixed(6)} (${
      response.usage.input_tokens
    } tokens × $3/1M)`
  );
  console.log(
    `   Output: $${outputCost.toFixed(6)} (${
      response.usage.output_tokens
    } tokens × $15/1M)`
  );
  console.log(
    `   Total:  $${totalCost.toFixed(6)} (~${(totalCost * 1000).toFixed(
      4
    )} cents)`
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

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 Monitor Your Usage:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    "1. Usage Dashboard: https://console.anthropic.com/settings/usage"
  );
  console.log(
    "2. Set Spending Limits: https://console.anthropic.com/settings/billing"
  );
  console.log(
    "3. View Request Logs: https://console.anthropic.com/settings/logs"
  );
  console.log("\n");
} catch (error) {
  console.error("\n❌ API Connection Failed!");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (error.status === 401) {
    console.error("🔑 Authentication Error:");
    console.error("   Your API key is invalid.");
    console.error(
      "   Get your key at: https://console.anthropic.com/settings/keys"
    );
  } else if (error.status === 429) {
    console.error("⏱️  Rate Limit Error:");
    console.error("   Too many requests. Wait and try again.");
  } else if (error.status === 402) {
    console.error("💳 Payment Required:");
    console.error(
      "   Add credits at: https://console.anthropic.com/settings/billing"
    );
  } else {
    console.error("Error:", error.message || error);
  }

  console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(1);
}
