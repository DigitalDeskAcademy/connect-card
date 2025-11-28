import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Page Container Variants
 *
 * Standardized spacing patterns for admin pages:
 *
 * - **default**: Responsive padding + gap (dashboard, settings, forms)
 * - **padded**: Full-height with responsive padding (data tables)
 * - **fill**: Full-height with no padding (custom layouts)
 * - **tight**: Tighter gap spacing (contacts-style pages)
 * - **tabs**: No gap for NavTabs integration
 * - **none**: No wrapper at all (split-pane layouts)
 *
 * @see /docs/essentials/coding-patterns.md for usage guidelines
 */
export type PageContainerVariant =
  | "default"
  | "padded"
  | "fill"
  | "tight"
  | "tabs"
  | "none";

export interface PageContainerProps {
  /**
   * Page content to render
   */
  children: ReactNode;

  /**
   * Layout variant to use
   *
   * - `default`: Standard page with responsive padding and gap (most common)
   * - `padded`: Full-height page with responsive padding (for data tables)
   * - `fill`: Full-height with no padding (for custom layouts)
   * - `tight`: Tighter gap spacing (for contacts-style pages)
   * - `tabs`: No gap for NavTabs integration (prevents double-spacing)
   * - `none`: No wrapper at all (for split-pane layouts like conversations)
   *
   * @default "default"
   */
  variant?: PageContainerVariant;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * HTML element to render
   *
   * Use `main` for top-level page content (accessibility best practice)
   * Use `section` for sub-sections
   * Use `div` (default) for generic containers
   *
   * Note: `variant="none"` ignores this prop and renders children directly
   *
   * @default "div"
   */
  as?: "div" | "main" | "section";

  /**
   * Optional back button configuration
   *
   * When provided, renders a back button at the top of the page
   * using the standardized pattern (lucide-react ArrowLeft icon)
   */
  backButton?: {
    /**
     * URL to navigate back to
     */
    href: string;
    /**
     * Button label text
     * @default "Back"
     */
    label?: string;
  };

  /**
   * Optional header configuration
   *
   * When provided, renders a standardized page header with title
   * and optional description. Renders after back button (if present).
   */
  header?: {
    /**
     * Page title (h1)
     */
    title: string;
    /**
     * Optional description text below the title
     */
    description?: string;
  };
}

/**
 * Page Container Component
 *
 * Industry-standard layout wrapper for admin pages that enforces consistent
 * spacing patterns. Provides full coverage for all 28+ pages across platform
 * and agency admin areas.
 *
 * **Why this exists:**
 * Before PageContainer, every page manually chose `p-6`, `gap-6`, `flex-1`,
 * causing inconsistencies. This component makes "correct spacing" the default
 * and eliminates repetitive spacing conversations.
 *
 * **Pattern References:**
 * - Vercel Dashboard: Consistent page padding with responsive variants
 * - Stripe Dashboard: Standard spacing for all admin pages
 * - Supabase Studio: Unified page container with semantic HTML
 *
 * **Important Notes:**
 * - Gap spacing applies to **direct children only** (not nested elements)
 * - Responsive spacing: 16px (mobile) → 24px (desktop)
 * - Always renders `flex flex-col` layout (except `variant="none"`)
 * - Use `as="main"` for top-level page content (accessibility)
 *
 * @example
 * ```tsx
 * // Default variant (dashboard, settings)
 * export default async function DashboardPage() {
 *   return (
 *     <PageContainer as="main">
 *       <h1>Dashboard</h1>
 *       <StatsCards />
 *     </PageContainer>
 *   );
 * }
 *
 * // Padded variant (data tables)
 * export default async function MembersPage() {
 *   return (
 *     <PageContainer variant="padded" as="main">
 *       <SummaryCards />
 *       <MembersTable />
 *     </PageContainer>
 *   );
 * }
 *
 * // Fill variant (custom layouts)
 * export default async function CustomPage() {
 *   return (
 *     <PageContainer variant="fill">
 *       <CustomLayoutWithOwnSpacing />
 *     </PageContainer>
 *   );
 * }
 *
 * // Tight variant (contacts-style)
 * export default async function ContactsPage() {
 *   return (
 *     <PageContainer variant="tight" as="main">
 *       <ContactsHeader />
 *       <ContactsList />
 *     </PageContainer>
 *   );
 * }
 *
 * // Tabs variant (NavTabs integration)
 * export default async function TabsPage() {
 *   return (
 *     <PageContainer variant="tabs">
 *       <NavTabs items={tabs} />
 *       <TabContent />
 *     </PageContainer>
 *   );
 * }
 *
 * // None variant (split-pane layouts)
 * export default async function ConversationsPage() {
 *   return (
 *     <PageContainer variant="none">
 *       <SplitPaneLayout />
 *     </PageContainer>
 *   );
 * }
 * ```
 *
 * @see /docs/essentials/coding-patterns.md for migration guide
 * @see /docs/technical/architecture-decisions.md ADR-008
 */
export function PageContainer({
  children,
  variant = "default",
  className,
  as: Component = "div",
  backButton,
  header,
}: PageContainerProps) {
  // Special case: "none" variant renders children directly with no wrapper
  if (variant === "none") {
    return <>{children}</>;
  }

  const baseStyles = "flex flex-col" as const;

  // Type-safe variant styles with exhaustiveness checking
  const variantStyles = {
    // Standard page: responsive padding + gap (dashboard, settings, forms)
    default: "p-4 md:p-6 gap-4 md:gap-6",

    // Full-height with responsive padding: data tables, scrollable content
    padded: "flex-1 p-4 md:p-6 gap-4 md:gap-6",

    // Full-height canvas: custom layouts with internal spacing
    fill: "flex-1",

    // Tighter gap spacing: contacts-style pages
    tight: "p-4 md:p-6 gap-3 md:gap-4",

    // No gap: NavTabs integration (prevents double-spacing)
    tabs: "p-4 md:p-6 gap-0",

    // No wrapper: handled above, but included for type exhaustiveness
    none: "",
  } as const satisfies Record<PageContainerVariant, string>;

  return (
    <Component
      data-component="page-container"
      data-variant={variant}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {backButton && (
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href={backButton.href}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButton.label || "Back"}
            </Link>
          </Button>
        </div>
      )}
      {header && (
        <div>
          <h1 className="text-2xl font-bold">{header.title}</h1>
          {header.description && (
            <p className="text-muted-foreground">{header.description}</p>
          )}
        </div>
      )}
      {children}
    </Component>
  );
}
