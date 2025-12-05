"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Map of theme names to CSS class names
const THEME_CLASSES: Record<string, string> = {
  "jetbrains-blue": "theme-jetbrains-blue",
  "soft-pop": "theme-soft-pop",
};

/**
 * Theme Variant Provider
 *
 * Applies alternate theme based on URL param.
 * Usage: Add ?theme=jetbrains-blue to URL to switch theme.
 *
 * Example:
 *   /church/demo/admin → primary theme (default)
 *   /church/demo/admin?theme=jetbrains-blue → JetBrains Blue theme
 */
export function ThemeVariantProvider() {
  const searchParams = useSearchParams();
  const themeVariant = searchParams.get("theme");

  useEffect(() => {
    const html = document.documentElement;

    // Remove all theme classes first
    Object.values(THEME_CLASSES).forEach(cls => {
      html.classList.remove(cls);
    });

    // Add the selected theme class if it exists
    if (themeVariant && THEME_CLASSES[themeVariant]) {
      html.classList.add(THEME_CLASSES[themeVariant]);
    }

    // Cleanup on unmount
    return () => {
      Object.values(THEME_CLASSES).forEach(cls => {
        html.classList.remove(cls);
      });
    };
  }, [themeVariant]);

  return null;
}
