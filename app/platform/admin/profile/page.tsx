import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Profile Page
 *
 * User profile management and preferences.
 * Update account information, security settings, and personal preferences.
 */
export default async function ProfilePage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          👤 Profile Settings Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Manage your account, security settings, and personal preferences
        </p>
      </div>
    </div>
  );
}
