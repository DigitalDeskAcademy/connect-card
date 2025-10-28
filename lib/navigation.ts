/**
 * Navigation Configuration - Single Source of Truth
 *
 * This file defines all navigation structures used across the application.
 * Both sidebars and page headers use this config to ensure consistency.
 *
 * Pattern: Sidebar is the source of truth for page titles and navigation structure.
 *
 * Usage:
 * - Sidebars: Import and render navigation menus
 * - Headers: Import and lookup page titles by current URL
 * - Always update this file when changing navigation structure
 */

import {
  type Icon,
  IconHome,
  IconUserPlus,
  IconHeart,
  IconPray,
  IconDots,
  IconCalendarMonth,
  IconAddressBook,
  IconCash,
  IconMessage,
  IconUsers,
  IconBrain,
  IconChartBar,
  IconSchool,
  IconSettings,
  IconHelp,
  IconSearch,
  IconCreditCard,
  IconCode,
  IconClipboardCheck,
} from "@tabler/icons-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon?: Icon; // Tabler icon component
  className?: string;
  isActive?: boolean;
  items?: Omit<NavigationItem, "items">[]; // Nested items (one level only)
}

export interface NavigationConfig {
  navMain: NavigationItem[];
  navAdmin?: NavigationItem[];
  navSecondary: NavigationItem[];
}

/**
 * Church/Agency Navigation Configuration
 *
 * Provides navigation structure for church administrators and staff.
 * URLs are dynamic based on church slug for multi-tenant routing.
 *
 * @param slug - Organization slug for URL generation
 * @returns Complete navigation configuration for church admin area
 */
export function getChurchNavigation(slug: string): NavigationConfig {
  return {
    navMain: [
      {
        title: "Dashboard",
        url: `/church/${slug}/admin`,
        icon: IconHome,
      },
      {
        title: "Connect Cards",
        url: `/church/${slug}/admin/connect-cards/upload`,
        icon: IconUserPlus,
        items: [
          {
            title: "Upload Cards",
            url: `/church/${slug}/admin/connect-cards/upload`,
            icon: IconUserPlus,
          },
          {
            title: "Review Queue",
            url: `/church/${slug}/admin/connect-cards/review`,
            icon: IconClipboardCheck,
          },
        ],
      },
      {
        title: "Volunteer",
        url: `/church/${slug}/admin/volunteer`,
        icon: IconHeart,
      },
      {
        title: "Prayer",
        url: `/church/${slug}/admin/prayer`,
        icon: IconPray,
      },
      // Collapsible "More" section for secondary features
      {
        title: "More",
        url: "#",
        icon: IconDots,
        className: "mt-4",
        items: [
          {
            title: "Calendar",
            url: `/church/${slug}/admin/calendar`,
            icon: IconCalendarMonth,
          },
          {
            title: "Contacts",
            url: `/church/${slug}/admin/contacts`,
            icon: IconAddressBook,
          },
          {
            title: "Payments",
            url: `/church/${slug}/admin/payments`,
            icon: IconCash,
          },
          {
            title: "Conversations",
            url: `/church/${slug}/admin/conversations`,
            icon: IconMessage,
          },
          {
            title: "Team",
            url: `/church/${slug}/admin/team`,
            icon: IconUsers,
          },
          {
            title: "AI Insights",
            url: `/church/${slug}/admin/insights`,
            icon: IconBrain,
          },
          {
            title: "Analytics",
            url: `/church/${slug}/admin/analytics`,
            icon: IconChartBar,
          },
          {
            title: "Training Center",
            url: `/church/${slug}/admin/courses`,
            icon: IconSchool,
          },
          {
            title: "Connect Cards (Test)",
            url: `/church/${slug}/admin/connect-cards/test`,
            icon: IconCode,
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: `/church/${slug}/admin/settings`,
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: `/church/${slug}/admin/support`,
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
  };
}

/**
 * Platform Admin Navigation Configuration
 *
 * Provides navigation structure for platform administrators.
 * Static URLs for platform-level administration.
 *
 * @returns Complete navigation configuration for platform admin area
 */
export function getPlatformNavigation(): NavigationConfig {
  return {
    navMain: [
      {
        title: "Dashboard",
        url: "/platform/admin",
        icon: IconHome,
      },
      {
        title: "Contacts",
        url: "/platform/admin/contacts",
        icon: IconUsers,
      },
      {
        title: "Calendar",
        url: "/platform/admin/appointments",
        icon: IconCalendarMonth,
      },
      {
        title: "Conversations",
        url: "/platform/admin/conversations",
        icon: IconMessage,
      },
      {
        title: "Payments",
        url: "/platform/admin/payments",
        icon: IconCreditCard,
      },
    ],
    navAdmin: [
      {
        title: "Dev",
        isActive: false,
        url: "#",
        icon: IconCode,
        items: [
          {
            title: "Courses",
            url: "/platform/admin/courses",
            icon: IconSchool,
          },
          {
            title: "Analytics",
            url: "/platform/admin/analytics",
            icon: IconChartBar,
          },
          {
            title: "API",
            url: "/platform/admin/api",
            icon: IconCode,
          },
          {
            title: "Projects",
            url: "/platform/admin/projects",
            icon: IconCode,
          },
          {
            title: "Team",
            url: "/platform/admin/team",
            icon: IconUsers,
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/platform/admin/settings",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "/platform/admin/help",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "/platform/admin/search",
        icon: IconSearch,
      },
    ],
  };
}

/**
 * Find Page Title by URL
 *
 * Searches through navigation config to find the matching page title.
 * Supports nested navigation items (one level deep).
 *
 * @param pathname - Current URL pathname from usePathname()
 * @param config - Navigation configuration to search through
 * @returns Page title if found, fallback title if not found
 */
export function getPageTitle(
  pathname: string,
  config: NavigationConfig
): string {
  // Normalize pathname (remove trailing slash)
  const normalizedPath =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  // Search all navigation sections
  const allNavItems = [
    ...config.navMain,
    ...(config.navAdmin || []),
    ...config.navSecondary,
  ];

  for (const item of allNavItems) {
    // Check top-level items
    if (item.url === normalizedPath) {
      return item.title;
    }

    // Check nested items
    if (item.items) {
      for (const nestedItem of item.items) {
        if (nestedItem.url === normalizedPath) {
          return nestedItem.title;
        }
      }
    }
  }

  // Fallback: extract from URL path
  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Special cases
  if (!lastSegment || lastSegment === "admin") return "Dashboard";

  // Convert kebab-case to Title Case
  return lastSegment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
