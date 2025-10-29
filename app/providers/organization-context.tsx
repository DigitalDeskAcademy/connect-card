"use client";

/**
 * Organization Context Provider
 *
 * Provides organization data throughout agency routes.
 * This enables components to access organization information
 * without prop drilling.
 *
 * Security: Organization data is validated at the layout level
 * before being provided to child components.
 */

import { createContext, useContext, ReactNode } from "react";

// Define the shape of organization data we expose
type OrganizationContextType = {
  id: string;
  name: string;
  slug: string;
  type: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  createdAt: Date;
} | null;

// Create the context
const OrganizationContext = createContext<OrganizationContextType>(null);

/**
 * Organization Provider Component
 *
 * Wraps agency admin routes to provide organization context.
 * Organization data is validated before being passed here.
 */
export function OrganizationProvider({
  children,
  organization,
}: {
  children: ReactNode;
  organization: OrganizationContextType;
}) {
  return (
    <OrganizationContext.Provider value={organization}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to access organization context
 *
 * @throws Error if used outside of OrganizationProvider
 * @returns Organization data
 */
export function useOrganization() {
  const organization = useContext(OrganizationContext);

  if (!organization) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider. " +
        "This typically means you're trying to use organization data outside of an agency route."
    );
  }

  return organization;
}

/**
 * Hook to safely access organization context
 *
 * Returns null instead of throwing if no context.
 * Useful for components that might be used in both agency and non-agency contexts.
 */
export function useOrganizationSafe() {
  return useContext(OrganizationContext);
}
