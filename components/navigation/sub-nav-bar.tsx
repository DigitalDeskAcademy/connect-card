"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface TabConfig {
  value: string;
  label: string;
}

interface SubNavBarProps {
  tabs?: TabConfig[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  title: string;
  children?: ReactNode;
}

/**
 * SubNavBar - Wrapper component for page headers with optional tabs
 *
 * Can be used two ways:
 * 1. Simple mode: Just pass title and tabs
 * 2. Custom mode: Pass children to render custom header content
 */
export function SubNavBar({
  tabs,
  defaultValue,
  onValueChange,
  title,
  children,
}: SubNavBarProps) {
  return (
    <div>
      <div className="px-4 lg:px-6 pt-8 pb-8">
        {/* If children provided, render custom content */}
        {children ? (
          children
        ) : (
          /* Default: Simple title + tabs */
          <>
            <h1 className="text-4xl font-bold mb-4">{title}</h1>

            {tabs && tabs.length > 0 && (
              <Tabs
                defaultValue={defaultValue || tabs[0]?.value}
                onValueChange={onValueChange}
              >
                <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground justify-start text-base">
                  {tabs.map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative text-base after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
