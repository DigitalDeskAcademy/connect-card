"use client";

import * as React from "react";
import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_VARIANTS = [
  { id: "default", name: "Default", class: "" },
  {
    id: "jetbrains-blue",
    name: "JetBrains Blue",
    class: "theme-jetbrains-blue",
  },
  { id: "soft-pop", name: "Soft Pop", class: "theme-soft-pop" },
  { id: "starry-night", name: "Starry Night", class: "theme-starry-night" },
] as const;

function setThemeVariant(variantClass: string) {
  const html = document.documentElement;
  // Remove all theme classes
  THEME_VARIANTS.forEach(v => {
    if (v.class) html.classList.remove(v.class);
  });
  // Add new theme class
  if (variantClass) {
    html.classList.add(variantClass);
  }
  // Persist to localStorage
  localStorage.setItem("theme-variant", variantClass);
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [currentVariant, setCurrentVariant] = React.useState("");

  // Load saved variant on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("theme-variant") || "";
    setCurrentVariant(saved);
    if (saved) {
      document.documentElement.classList.add(saved);
    }
  }, []);

  const handleVariantChange = (variantClass: string) => {
    setThemeVariant(variantClass);
    setCurrentVariant(variantClass);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
          {theme === "system" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {THEME_VARIANTS.map(variant => (
          <DropdownMenuItem
            key={variant.id}
            onClick={() => handleVariantChange(variant.class)}
          >
            <Palette className="mr-2 h-4 w-4" />
            {variant.name}
            {currentVariant === variant.class && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
