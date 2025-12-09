/**
 * Vitest Setup File
 *
 * Runs before each test file. Use for:
 * - Global mocks
 * - Database connection
 * - Environment setup
 */

import { beforeAll, afterAll, afterEach, vi } from "vitest";

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

// Mock next/cache (revalidatePath, revalidateTag)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/headers (cookies, headers)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}));

// Mock Arcjet rate limiting (always allow in tests)
vi.mock("@arcjet/next", () => ({
  request: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/arcjet", () => ({
  default: {
    withRule: vi.fn(() => ({
      protect: vi.fn().mockResolvedValue({
        isDenied: () => false,
        reason: { isRateLimit: () => false },
      }),
    })),
  },
  fixedWindow: vi.fn(),
  arcjetMode: "LIVE",
}));

// ============================================================================
// DATABASE SETUP (for integration tests)
// ============================================================================

// Import prisma for integration tests
// Tests that need DB will import this directly
// Note: Integration tests run against the real dev database
// Future: Use a separate test database or transactions

beforeAll(async () => {
  // Add any global setup here
  // e.g., seed test data, connect to test DB
});

afterEach(async () => {
  // Reset mocks between tests
  vi.clearAllMocks();
});

afterAll(async () => {
  // Cleanup after all tests
  // e.g., disconnect from DB, cleanup test data
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Helper to create a mock organization context
 * Use in integration tests that need auth context
 */
export const mockOrganizationContext = {
  session: {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
  },
  organization: {
    id: "test-org-id",
    name: "Test Church",
    slug: "test-church",
  },
  dataScope: {
    filters: {
      canManageUsers: true,
      canManageContent: true,
      canManageSettings: true,
    },
  },
};

/**
 * Helper to create a mock volunteer
 */
export const createMockVolunteer = (overrides = {}) => ({
  id: "test-volunteer-id",
  organizationId: "test-org-id",
  churchMemberId: "test-member-id",
  status: "PENDING_APPROVAL",
  backgroundCheckStatus: "NOT_STARTED",
  documentsSentAt: null,
  churchMember: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+12065550100",
  },
  categories: [],
  ...overrides,
});
