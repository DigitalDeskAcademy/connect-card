/**
 * Courses Admin Redirect
 * Redirects to new platform admin structure
 */

import { redirect } from "next/navigation";

export default function CoursesRedirect() {
  redirect("/platform/admin/courses");
}
