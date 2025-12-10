"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className,
  highlight = false,
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className={className}>
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors w-full group",
          highlight
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            !isOpen && "-rotate-90"
          )}
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
