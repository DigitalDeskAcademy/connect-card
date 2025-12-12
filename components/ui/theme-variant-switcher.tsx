"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  THEME_CLASSES,
  setStoredTheme,
  getStoredTheme,
} from "./theme-variant-provider";

/**
 * Theme Variant Switcher - Dev only
 *
 * Dropdown to switch between theme variants during development.
 * Persists choice to localStorage for cross-navigation persistence.
 * Only visible in development mode.
 */
export function ThemeVariantSwitcher() {
  // Lazy initialize from localStorage, default to "primary" (Starry Night Main)
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window === "undefined") return "primary";
    return getStoredTheme() || "primary";
  });

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleThemeChange = (value: string) => {
    const html = document.documentElement;

    // Remove all theme classes
    Object.values(THEME_CLASSES).forEach(cls => {
      if (cls) html.classList.remove(cls);
    });

    // Apply new theme class if it exists
    const themeClass = THEME_CLASSES[value];
    if (themeClass) {
      html.classList.add(themeClass);
    }

    setStoredTheme(value);
    setCurrentTheme(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Theme:</span>
      <Select value={currentTheme} onValueChange={handleThemeChange}>
        <SelectTrigger size="sm" className="w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primary</SelectItem>
          <SelectItem value="primary-square">Primary Square</SelectItem>
          <SelectItem value="jetbrains-blue">JetBrains Blue</SelectItem>
          <SelectItem value="soft-pop">Soft Pop</SelectItem>
          <SelectItem value="starry-night">Starry Night</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
