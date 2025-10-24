"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
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
  pageHeader: ReactNode;
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
  pageHeader,
  showInfoSidebar = false,
}: DashboardContentWrapperProps) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const { setOpen: setLeftSidebarOpen, open: isLeftSidebarOpen } = useSidebar();
  const prevLeftSidebarOpen = useRef(isLeftSidebarOpen);

  // Handle AI sidebar toggle - close left nav when opening
  const handleAiSidebarToggle = () => {
    if (!isAiSidebarOpen && isLeftSidebarOpen) {
      setLeftSidebarOpen(false);
    }
    setIsAiSidebarOpen(!isAiSidebarOpen);
  };

  // Monitor left sidebar opening to close AI sidebar (mutual exclusivity)
  // Only close AI sidebar when left sidebar transitions from closed to open
  useEffect(() => {
    if (!prevLeftSidebarOpen.current && isLeftSidebarOpen && isAiSidebarOpen) {
      setIsAiSidebarOpen(false);
    }
    prevLeftSidebarOpen.current = isLeftSidebarOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeftSidebarOpen]);

  return (
    <div className="flex flex-col h-screen">
      {/* Sticky header wrapper */}
      <div className="sticky top-0 z-50 bg-background">
        <SiteHeader
          brandName={brandName}
          organization={organization}
          showInfoSidebar={showInfoSidebar}
          onInfoSidebarToggle={handleAiSidebarToggle}
        />
        {pageHeader}
      </div>

      {/* Main content + AI sidebar flex container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="@container/main flex flex-col h-full">{children}</div>
        </div>

        {/* SideCar AI assistant sidebar - integrated into layout */}
        <SideCarAISidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
