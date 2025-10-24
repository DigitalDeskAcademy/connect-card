"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TabConfig {
  value: string;
  label: string;
}

interface PageHeaderConfig {
  title: string;
  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  children?: ReactNode;
}

interface PageHeaderContextType {
  config: PageHeaderConfig | null;
  setConfig: (config: PageHeaderConfig) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(
  undefined
);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PageHeaderConfig | null>(null);

  return (
    <PageHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return context;
}
