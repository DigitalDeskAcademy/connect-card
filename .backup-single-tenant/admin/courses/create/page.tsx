/**
 * Create Course Redirect
 */

import { redirect } from "next/navigation";

export default function CreateCourseRedirect() {
  redirect("/platform/admin/courses/create");
}
