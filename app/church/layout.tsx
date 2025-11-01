/**
 * Agency Layout - White-Label Public Layout
 *
 * This layout provides the same structure as the public layout but allows
 * for agency-specific branding to be passed through to components.
 */

import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Training Portal",
  description: "Access your training dashboard",
};

export default function AgencyLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      {/* Agency pages handle their own layout structure */}
      {children}
      {/* Toaster is in root layout.tsx - no need to duplicate here */}
    </>
  );
}
