"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Theme Variant Switcher - Dev only
 *
 * Dropdown to switch between theme variants during development.
 * Only visible in development mode.
 */
export function ThemeVariantSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTheme = searchParams.get("theme") || "primary";

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleThemeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "primary") {
      params.delete("theme");
    } else {
      params.set("theme", value);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Theme:</span>
      <Select value={currentTheme} onValueChange={handleThemeChange}>
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primary</SelectItem>
          <SelectItem value="jetbrains-blue">JetBrains Blue</SelectItem>
          <SelectItem value="soft-pop">Soft Pop</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
