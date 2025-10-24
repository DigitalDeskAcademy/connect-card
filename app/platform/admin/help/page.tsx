import { requireAdmin } from "@/app/data/admin/require-admin";

/**
 * Platform Help Page
 *
 * Documentation, support resources, and API reference.
 * Access help documentation, submit support tickets, and browse API docs.
 */
export default async function HelpPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      {/* Placeholder content - to be implemented */}
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">
          📚 Help & Documentation Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          Access platform documentation, support resources, and API reference
          guides
        </p>
      </div>
    </div>
  );
}
