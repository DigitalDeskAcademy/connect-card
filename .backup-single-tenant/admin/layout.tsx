/**
 * Admin Layout Redirect
 *
 * Maintains backward compatibility during migration to platform/admin.
 * This layout redirect ensures that any admin routes still work.
 */

import { ReactNode } from "react";

export default function AdminLayoutRedirect({
  children,
}: {
  children: ReactNode;
}) {
  // Since we're redirecting at the page level, this layout
  // just passes through children to avoid double redirects
  return <>{children}</>;
}
