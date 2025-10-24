import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Settings Page
 *
 * Platform-wide configuration and settings management.
 * Configure integrations, billing, notifications, and general platform settings.
 */
export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          ⚙️ Settings Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Configure platform settings, integrations, billing, and preferences
        </p>
      </div>
    </div>
  );
}
