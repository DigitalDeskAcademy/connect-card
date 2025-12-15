/**
 * Root Application Layout - Core Infrastructure & Performance Foundation
 *
 * Foundation of the entire application providing global configuration,
 * theme management, and performance optimizations. Implements Next.js 15
 * App Router patterns with optimal Core Web Vitals and accessibility.
 *
 * Architecture Decisions:
 * - Geist font family with variable font optimization for performance
 * - Theme system with system preference detection and hydration handling
 * - Global CSS reset and design system foundation via Tailwind CSS v4
 * - Toast notification system with accessibility and positioning
 * - SEO meta data architecture (TODO: Update with actual app information)
 * - Performance monitoring readiness with antialiased font rendering
 *
 * Infrastructure Features:
 * - Supports all authentication flows and user states
 * - Enables theme switching across entire application with zero flash
 * - Provides consistent typography and spacing system via CSS custom properties
 * - Optimizes font loading with variable fonts and swap strategies
 * - Hydration suppression prevents theme flash on initial load
 *
 * Performance Optimizations:
 * - Variable fonts reduce bundle size vs separate font weights
 * - CSS custom properties enable efficient theme switching
 * - Antialiased text rendering for improved readability across platforms
 * - Theme provider uses 'class' attribute for optimal CSS performance
 * - System theme detection provides native OS integration
 *
 * Scalability Patterns:
 * - Global providers architecture supports feature expansion
 * - Theme system scales to unlimited color schemes and variants
 * - Font system ready for additional typefaces and weights
 * - Toast system handles application-wide notifications
 * - Metadata system ready for SEO optimization and social sharing
 *
 * Security Considerations:
 * - suppressHydrationWarning only on html element for theme handling
 * - No client-side storage of sensitive data in global context
 * - Theme switching isolated from authentication state
 *
 * @layout Root layout wrapping entire application
 * @performance Core Web Vitals optimized with font and theme strategies
 * @accessibility Theme system respects user preferences and screen readers
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeVariantProvider } from "@/components/ui/theme-variant-provider";
import { Toaster } from "sonner";

// Configure Geist Sans font with CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure Geist Mono font for code blocks
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Church Connect Hub",
  description:
    "Multi-tenant church management platform with AI-powered connect card scanning, volunteer onboarding, and prayer management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <ThemeVariantProvider />
          </Suspense>
          {children}
          <Toaster
            closeButton
            position="bottom-center"
            richColors
            theme="system"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
