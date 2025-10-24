/**
 * Load .env and run CORS retrieval script
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";

// Read .env file
const envFile = readFileSync(".env", "utf-8");

// Parse and set environment variables
envFile.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
});

console.log("✅ Environment loaded from .env\n");

// Run the CORS retrieval script
execSync("npx tsx scripts/get-tigris-cors.ts", {
  stdio: "inherit",
  env: process.env,
});
