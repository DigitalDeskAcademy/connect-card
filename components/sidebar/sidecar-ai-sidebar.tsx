"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconUsers,
  IconTag,
  IconBolt,
  IconBellOff,
  IconMessage,
  IconCheckbox,
  IconChartBar,
  IconSend,
  IconLayoutSidebarRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

/**
 * ChurchConnectAISidebar - Always-available AI assistant sidebar
 *
 * Features:
 * - AI chat interface for member data queries
 * - Contact details view
 * - Tasks/workflow management
 * - Analytics insights
 * - Toggles with left nav sidebar (mutually exclusive)
 * - Slides into main content area
 */

interface SideCarAISidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  contact?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

type TabType = "chat" | "contact" | "tasks" | "insights";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <IconChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="px-4 py-3 text-sm">{children}</div>}
    </div>
  );
}

// Mock chat messages for demo
const mockChatMessages = [
  {
    id: "1",
    sender: "user",
    content: "How many volunteers signed up for Kids Camp so far?",
    timestamp: "10:32 AM",
  },
  {
    id: "2",
    sender: "cc",
    content:
      "You currently have **18 volunteers** signed up for Kids Camp. That includes **8 for nursery**, **6 for elementary**, and **4 for check-in**. You still need **3 more volunteers** for the preschool room to meet your required ratios.",
    timestamp: "10:32 AM",
  },
  {
    id: "3",
    sender: "user",
    content: "Did all the connect cards from this weekend get reviewed?",
    timestamp: "10:33 AM",
  },
  {
    id: "4",
    sender: "cc",
    content:
      "You processed **47 connect cards** this weekend. **42 have been reviewed and approved**, but **5 are still pending** in the review queue. 3 of those have low confidence scores and need manual verification of phone numbers.",
    timestamp: "10:33 AM",
  },
  {
    id: "5",
    sender: "user",
    content: "How many first-time visitors did we have this month?",
    timestamp: "10:34 AM",
  },
  {
    id: "6",
    sender: "cc",
    content:
      "This month you&apos;ve had **23 first-time visitors** across all services. **14 have returned** for a second visit (61% return rate), and **8 have submitted prayer requests**. The most common interest areas are **small groups** and **kids ministry**.",
    timestamp: "10:34 AM",
  },
];

export function SideCarAISidebar({
  isOpen,
  onClose,
  contact,
}: SideCarAISidebarProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("chat");
  const [chatInput, setChatInput] = React.useState("");

  const tabs = [
    { id: "chat" as TabType, icon: IconMessage, label: "Chat" },
    { id: "contact" as TabType, icon: IconUser, label: "Contact" },
    { id: "tasks" as TabType, icon: IconCheckbox, label: "Tasks" },
    { id: "insights" as TabType, icon: IconChartBar, label: "Insights" },
  ];

  return (
    <>
      {/* Mobile backdrop only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - integrated into layout flow on desktop, overlay on mobile */}
      <aside
        className={cn(
          "bg-background border-l flex flex-col h-full transition-all duration-300 ease-in-out",
          // Mobile: fixed overlay, only visible when open
          "md:hidden fixed right-0 top-0 z-50 h-screen w-80",
          isOpen ? "flex" : "hidden",
          // Desktop (md+): part of layout flow, width-based animation
          "md:flex md:relative md:h-auto",
          isOpen ? "md:w-80" : "md:w-0 md:border-l-0 md:overflow-hidden"
        )}
      >
        <div className="flex h-full flex-col w-80 min-w-[320px]">
          {/* Header - matches SiteHeader height and styling */}
          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 whitespace-nowrap">
            <h2 className="text-lg font-semibold">Church Connect AI</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <IconLayoutSidebarRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b shrink-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors hover:bg-accent whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {mockChatMessages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender === "user" ? "flex-row-reverse" : ""
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={cn(
                            message.sender === "cc"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.sender === "cc" ? "CC" : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          message.sender === "user" ? "items-end" : ""
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            message.sender === "cc"
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about members, visitors, volunteers..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="icon" variant="default">
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    AI assistant for church data and insights
                  </p>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div>
                {/* Contact Information */}
                <CollapsibleSection
                  title="Contact Information"
                  icon={<IconUser className="h-4 w-4" />}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">
                        {contact?.name || "No contact selected"}
                      </p>
                    </div>
                    {contact?.email && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Email
                        </p>
                        <div className="flex items-center gap-2">
                          <IconMail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{contact.email}</p>
                        </div>
                      </div>
                    )}
                    {contact?.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Phone
                        </p>
                        <div className="flex items-center gap-2">
                          <IconPhone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    {contact?.address && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Address
                        </p>
                        <div className="flex items-center gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{contact.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Owner */}
                <CollapsibleSection
                  title="Owner"
                  icon={<IconUser className="h-4 w-4" />}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconUser className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Unassigned</p>
                        <p className="text-xs text-muted-foreground">
                          Click to assign
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Followers */}
                <CollapsibleSection
                  title="Followers"
                  icon={<IconUsers className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      No followers yet. Add team members to receive updates.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Add Followers
                    </Button>
                  </div>
                </CollapsibleSection>

                {/* Tags */}
                <CollapsibleSection
                  title="Tags"
                  icon={<IconTag className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      No tags applied. Add tags to organize contacts.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Add Tags
                    </Button>
                  </div>
                </CollapsibleSection>

                {/* Automations */}
                <CollapsibleSection
                  title="Automations"
                  icon={<IconBolt className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      No active automations. Create workflows to automate tasks.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Add Automation
                    </Button>
                  </div>
                </CollapsibleSection>

                {/* DND Settings */}
                <CollapsibleSection
                  title="Do Not Disturb"
                  icon={<IconBellOff className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      Configure communication preferences and quiet hours.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">DND Active</span>
                      <div className="h-5 w-9 rounded-full bg-muted relative">
                        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform" />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Today&apos;s Tasks
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 rounded hover:bg-accent">
                        <input type="checkbox" className="mt-1" id="task1" />
                        <label htmlFor="task1" className="text-sm flex-1">
                          Review 5 pending connect cards from Sunday
                        </label>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded hover:bg-accent">
                        <input type="checkbox" className="mt-1" id="task2" />
                        <label htmlFor="task2" className="text-sm flex-1">
                          Follow up with first-time visitors from last week
                        </label>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          className="mt-1"
                          id="task3"
                          defaultChecked
                        />
                        <label
                          htmlFor="task3"
                          className="text-sm flex-1 line-through text-muted-foreground"
                        >
                          Assign prayer requests to pastoral team
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Upcoming Automations
                    </h3>
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">Visitor Follow-up</p>
                        <p className="text-xs text-muted-foreground">
                          Sends welcome SMS 24 hours after first visit
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">Prayer Request Check-in</p>
                        <p className="text-xs text-muted-foreground">
                          Follows up on prayer requests after 7 days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === "insights" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">342</p>
                        <p className="text-xs text-muted-foreground">
                          Total Members
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">23</p>
                        <p className="text-xs text-muted-foreground">
                          New Visitors
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">156</p>
                        <p className="text-xs text-muted-foreground">
                          Cards Processed
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">61%</p>
                        <p className="text-xs text-muted-foreground">
                          Return Rate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Volunteer Teams
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded hover:bg-accent">
                        <span className="text-sm">Kids Ministry</span>
                        <span className="text-sm font-medium">
                          24 volunteers
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded hover:bg-accent">
                        <span className="text-sm">Hospitality</span>
                        <span className="text-sm font-medium">
                          18 volunteers
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded hover:bg-accent">
                        <span className="text-sm">Worship Team</span>
                        <span className="text-sm font-medium">
                          12 volunteers
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-muted/30">
                        <p className="font-medium">Connect card processed</p>
                        <p className="text-xs text-muted-foreground">
                          Maria Garcia - 2 hours ago
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <p className="font-medium">Prayer request submitted</p>
                        <p className="text-xs text-muted-foreground">
                          Anonymous - 3 hours ago
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <p className="font-medium">Volunteer signup</p>
                        <p className="text-xs text-muted-foreground">
                          James Wilson - Kids Camp
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
