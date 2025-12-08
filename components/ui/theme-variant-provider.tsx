"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "theme-variant";

// Map of theme names to CSS class names
export const THEME_CLASSES: Record<string, string> = {
  "jetbrains-blue": "theme-jetbrains-blue",
  "soft-pop": "theme-soft-pop",
  "starry-night": "theme-starry-night",
};

/**
 * Theme Variant Provider
 *
 * Applies alternate theme based on URL param or localStorage.
 * URL param takes precedence and persists choice to localStorage.
 *
 * Usage:
 *   - Add ?theme=soft-pop to URL (persists across navigation)
 *   - Use dropdown switcher in header (dev only)
 */
export function ThemeVariantProvider() {
  const searchParams = useSearchParams();
  const urlTheme = searchParams.get("theme");

  useEffect(() => {
    const html = document.documentElement;

    // URL param takes precedence, otherwise use localStorage
    let activeTheme = urlTheme;
    if (urlTheme && THEME_CLASSES[urlTheme]) {
      // Save URL param choice to localStorage
      localStorage.setItem(STORAGE_KEY, urlTheme);
    } else {
      // No URL param, try localStorage
      activeTheme = localStorage.getItem(STORAGE_KEY);
    }

    // Remove all theme classes first
    Object.values(THEME_CLASSES).forEach(cls => {
      html.classList.remove(cls);
    });

    // Add the selected theme class if it exists
    if (activeTheme && THEME_CLASSES[activeTheme]) {
      html.classList.add(THEME_CLASSES[activeTheme]);
    }

    // Cleanup on unmount
    return () => {
      Object.values(THEME_CLASSES).forEach(cls => {
        html.classList.remove(cls);
      });
    };
  }, [urlTheme]);

  return null;
}

export function getStoredTheme(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredTheme(theme: string | null) {
  if (typeof window === "undefined") return;
  if (theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
