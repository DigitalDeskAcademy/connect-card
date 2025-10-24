/**
 * Analytics Admin Redirect
 * Redirects to new platform admin structure
 */

import { redirect } from "next/navigation";

export default function AnalyticsRedirect() {
  redirect("/platform/admin/analytics");
}
