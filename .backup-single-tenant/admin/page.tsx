/**
 * Admin Dashboard Redirect
 *
 * Maintains backward compatibility by redirecting old admin routes
 * to the new platform admin structure. This ensures existing bookmarks
 * and links continue to work during the migration period.
 */

import { redirect } from "next/navigation";

export default function AdminRedirect() {
  redirect("/platform/admin");
}
