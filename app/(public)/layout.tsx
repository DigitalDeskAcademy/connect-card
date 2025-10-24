/**
 * Public Layout - Foundation for marketing and conversion pages
 *
 * Core layout that wraps all public-facing pages in the customer acquisition
 * and conversion funnel. Optimized for user experience, SEO performance,
 * and conversion optimization across desktop and mobile devices.
 *
 * Business Objectives:
 * - Provide consistent, professional branding across all touchpoints
 * - Optimize navigation for course discovery and enrollment conversion
 * - Maintain fast loading performance for SEO and user experience
 * - Support seamless authentication flows and user state management
 *
 * User Journey Integration:
 * 1. Landing (/): Brand introduction and value proposition
 * 2. Course Discovery (/courses): Browse and compare offerings
 * 3. Course Details (/courses/[slug]): Detailed evaluation and enrollment CTA
 * 4. Features (/features): Feature comparison and benefits
 * 5. Pricing (/pricing): Transparent pricing and plan selection
 * 6. Registration (/signup): Account creation and onboarding
 *
 * Conversion Optimization Features:
 * - Persistent navigation with clear call-to-actions
 * - Authentication state awareness for personalized experience
 * - Mobile-first responsive design for cross-device consistency
 * - Fast rendering for reduced bounce rates
 *
 * SEO & Performance Considerations:
 * - Server-side rendering for search engine crawlability
 * - Semantic HTML structure for accessibility and SEO
 * - Consistent container spacing for visual hierarchy
 * - Optimized layout shifts and Core Web Vitals
 *
 * Technical Implementation:
 * - Shared layout reduces bundle size and improves caching
 * - Container system provides responsive breakpoints
 * - Navigation component handles authentication state management
 *
 * @component PublicLayout
 * @param {ReactNode} children - Page content to render within layout
 * @returns {JSX.Element} Complete public page layout with navigation
 *
 * @example
 * // Automatically wraps all pages in (public) route group:
 * // - / (homepage)
 * // - /courses (course catalog)
 * // - /courses/[slug] (course details)
 * // - /pricing (pricing page)
 * // - /features (features page)
 * // - /signup (registration page)
 */

import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { PublicSidebar } from "./_components/PublicSidebar";
import { PublicHeader } from "./_components/PublicHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

/**
 * Public Layout Component
 *
 * Root layout component for all public-facing pages. Provides consistent
 * navigation, branding, and responsive container structure optimized for
 * conversion and user experience.
 *
 * Layout Structure:
 * - Mobile: Uses SidebarProvider with Sheet-based navigation
 * - Desktop: Uses traditional Navbar
 * - Main Container: Responsive content area with consistent padding
 *
 * Responsive Breakpoints:
 * - Mobile (default): px-4 (16px horizontal padding)
 * - Tablet (md:): px-6 (24px horizontal padding)
 * - Desktop (lg:): px-8 (32px horizontal padding)
 *
 * Container Benefits:
 * - Centers content with max-width constraints
 * - Provides consistent horizontal spacing across devices
 * - Maintains readability on large screens
 * - Follows design system spacing tokens
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Page content to render in main area
 * @returns {JSX.Element} Complete public layout structure
 */
export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Mobile experience - uses SidebarProvider pattern like authenticated pages */}
      <div className="md:hidden">
        <SidebarProvider>
          <PublicSidebar />
          <SidebarInset>
            <PublicHeader />
            <div className="flex flex-1 flex-col overflow-hidden">
              <main className="flex flex-col gap-4 py-4 px-4">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Desktop experience - keep existing navbar */}
      <div className="hidden md:block">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          {children}
        </main>
      </div>
    </>
  );
}
