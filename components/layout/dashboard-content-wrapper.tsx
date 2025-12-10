"use client";

import { ReactNode, useState } from "react";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SideCarAISidebar } from "@/components/sidebar/sidecar-ai-sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface Organization {
  id: string;
  name: string;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
}

interface DashboardContentWrapperProps {
  children: ReactNode;
  brandName: string;
  organization?: Organization;
  showInfoSidebar?: boolean;
}

/**
 * Dashboard Content Wrapper (Client Component)
 *
 * Manages ONLY client-side state for sidebar interactions.
 * Renders the complete dashboard structure including headers (which are Server Components).
 *
 * Sidebar Behavior:
 * - When AI sidebar opens → left nav closes
 * - When left nav opens → AI sidebar closes
 * - Only one sidebar visible at a time
 */
export function DashboardContentWrapper({
  children,
  brandName,
  organization,
  showInfoSidebar = false,
}: DashboardContentWrapperProps) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const { setOpen: setLeftSidebarOpen, open: isLeftSidebarOpen } = useSidebar();

  // Track previous left sidebar state for transition detection (React 18+ pattern)
  const [prevLeftSidebarOpen, setPrevLeftSidebarOpen] =
    useState(isLeftSidebarOpen);

  // Adjust state during render when left sidebar state changes (not in an effect)
  // This follows React's guidance: https://react.dev/learn/you-might-not-need-an-effect
  // When left sidebar opens, close AI sidebar (mutual exclusivity)
  if (isLeftSidebarOpen !== prevLeftSidebarOpen) {
    setPrevLeftSidebarOpen(isLeftSidebarOpen);

    // Only close AI sidebar when left sidebar transitions from closed to open
    if (!prevLeftSidebarOpen && isLeftSidebarOpen && isAiSidebarOpen) {
      setIsAiSidebarOpen(false);
    }
  }

  // Handle AI sidebar toggle - close left nav when opening
  const handleAiSidebarToggle = () => {
    if (!isAiSidebarOpen && isLeftSidebarOpen) {
      setLeftSidebarOpen(false);
    }
    setIsAiSidebarOpen(!isAiSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Sticky header wrapper */}
      <div className="sticky top-0 z-50 bg-card">
        <SiteHeader
          brandName={brandName}
          organization={organization}
          showInfoSidebar={showInfoSidebar}
          onInfoSidebarToggle={handleAiSidebarToggle}
        />
      </div>

      {/* Main content + AI sidebar flex container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="@container/main flex flex-col h-full">{children}</div>
        </div>

        {/* Church Connect AI assistant sidebar - integrated into layout */}
        <SideCarAISidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
