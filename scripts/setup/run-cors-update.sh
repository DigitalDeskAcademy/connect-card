#!/bin/bash

# Simple wrapper to load .env and run CORS update script
# Handles .env files with special characters properly

cd "$(dirname "$0")/.." || exit 1

# Load .env file using Node.js to handle special characters
npx tsx << 'EOF'
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};

// Parse .env manually (handles quotes and special chars)
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envVars[key] = value;
  }
});

// Set environment variables and run the script
Object.assign(process.env, envVars);

// Import and run the CORS update script
import('./update-tigris-cors.ts');
EOF
