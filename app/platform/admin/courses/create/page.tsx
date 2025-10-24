/**
 * Platform Course Creation Page
 *
 * Entry point for platform administrators to create new courses.
 * Uses PageHeader context for consistent UI without double headers.
 *
 * Platform Features:
 * - Active pricing field with Stripe integration
 * - Course creation for all platform users
 * - Standard navigation and redirects
 */

import { CourseCreateClient } from "./_components/CourseCreateClient";

/**
 * Platform Course Creation Page Component
 *
 * Provides platform administrators with course creation capabilities.
 */
export default function CourseCreationPage() {
  return <CourseCreateClient />;
}
