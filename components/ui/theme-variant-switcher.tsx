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
  // Lazy initialize from localStorage
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
      html.classList.remove(cls);
    });

    // Apply new theme
    if (value === "primary") {
      setStoredTheme(null);
    } else {
      html.classList.add(THEME_CLASSES[value]);
      setStoredTheme(value);
    }

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
          <SelectItem value="jetbrains-blue">JetBrains Blue</SelectItem>
          <SelectItem value="soft-pop">Soft Pop</SelectItem>
          <SelectItem value="starry-night">Starry Night</SelectItem>
          <SelectItem value="starry-night-main">Starry Night Main</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
