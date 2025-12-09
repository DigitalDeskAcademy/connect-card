import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Use jsdom for React component tests
    environment: "jsdom",

    // Where to find tests
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],

    // Exclude Playwright E2E tests (they use their own runner)
    exclude: ["tests/e2e/**", "node_modules/**"],

    // Setup file runs before each test file
    setupFiles: ["tests/setup.ts"],

    // Enable global test functions (describe, it, expect) without imports
    globals: true,

    // Show detailed output
    reporters: ["verbose"],

    // Timeout for async tests
    testTimeout: 10000,

    // Coverage configuration (optional, run with --coverage)
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "actions/**/*.ts"],
      exclude: ["**/*.test.ts", "**/generated/**"],
    },
  },
});
