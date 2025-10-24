import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Team Page
 *
 * Team member management across organizations.
 * View and manage platform administrators, agency owners, and team roles.
 */
export default async function TeamPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          👥 Team Management Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Manage team members, roles, and permissions across all organizations
        </p>
      </div>
    </div>
  );
}
