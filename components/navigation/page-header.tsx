"use client";

import { usePageHeader } from "@/app/providers/page-header-context";
import { SubNavBar } from "./sub-nav-bar";

/**
 * PageHeader component that automatically renders based on context
 *
 * This is rendered in the layout and shows the title/tabs
 * configured by individual pages via usePageHeader hook.
 */
export function PageHeader() {
  const { config } = usePageHeader();

  if (!config) return null;

  return (
    <SubNavBar
      title={config.title}
      tabs={config.tabs}
      defaultValue={config.activeTab}
      onValueChange={config.onTabChange}
    >
      {config.children}
    </SubNavBar>
  );
}
