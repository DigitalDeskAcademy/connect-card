"use client";

import { type Icon, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  isActive?: boolean;
  className?: string;
  items?: {
    title: string;
    url: string;
  }[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setOpenItems(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-0 px-1">
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title} className={item.className}>
              {item.items && item.items.length > 0 ? (
                // Collapsible menu with subitems
                <>
                  <SidebarMenuButton
                    onClick={() => toggleItem(item.title)}
                    size="md"
                    className="cursor-pointer"
                    tooltip={item.title}
                  >
                    {item.icon ? (
                      <item.icon stroke={1.5} />
                    ) : (
                      <IconChevronRight
                        className={cn(
                          "transition-transform duration-200",
                          openItems[item.title] && "rotate-90"
                        )}
                        stroke={1.5}
                      />
                    )}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {openItems[item.title] && (
                    <SidebarMenuSub>
                      {item.items.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link href={subItem.url} onClick={handleLinkClick}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                // Regular menu item
                <SidebarMenuButton
                  tooltip={item.title}
                  size="md"
                  asChild
                  isActive={pathname === item.url}
                >
                  <Link href={item.url} onClick={handleLinkClick}>
                    {item.icon && <item.icon stroke={1.5} />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
