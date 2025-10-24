"use client";

import { useState } from "react";
import {
  IconSearch,
  IconStar,
  IconStarFilled,
  IconMessage,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * ConversationList - Left panel showing list of conversations
 *
 * Features:
 * - Search conversations
 * - Filter by status (Unread, Recents, Starred, All)
 * - Display conversation preview with unread count
 * - Click to select conversation
 */

export type Conversation = {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isStarred: boolean;
  avatar?: string;
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onToggleStar?: (conversationId: string) => void;
}

type FilterTab = "all" | "unread" | "recents" | "starred";

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onToggleStar,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter conversations based on search and active filter
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    const matchesSearch = conv.contactName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    switch (activeFilter) {
      case "unread":
        return conv.unreadCount > 0;
      case "starred":
        return conv.isStarred;
      case "recents":
        // For demo, just show all for "recents"
        return true;
      case "all":
      default:
        return true;
    }
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    // Simple formatting for demo - could use date-fns for real implementation
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header with search */}
      <div className="p-4 border-b">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b">
        <Button
          variant={activeFilter === "all" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setActiveFilter("all")}
        >
          All
        </Button>
        <Button
          variant={activeFilter === "unread" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setActiveFilter("unread")}
        >
          Unread
        </Button>
        <Button
          variant={activeFilter === "recents" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setActiveFilter("recents")}
        >
          Recents
        </Button>
        <Button
          variant={activeFilter === "starred" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setActiveFilter("starred")}
        >
          Starred
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <IconMessage className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 hover:bg-accent transition-colors text-left",
                  selectedConversationId === conversation.id && "bg-accent"
                )}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    {getInitials(conversation.contactName)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={cn(
                        "text-sm font-medium truncate",
                        conversation.unreadCount > 0 && "font-semibold"
                      )}
                    >
                      {conversation.contactName}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTimestamp(conversation.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm text-muted-foreground truncate",
                        conversation.unreadCount > 0 &&
                          "font-medium text-foreground"
                      )}
                    >
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium text-white bg-primary rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation();
                          onToggleStar?.(conversation.id);
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleStar?.(conversation.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-yellow-500 transition-colors cursor-pointer"
                      >
                        {conversation.isStarred ? (
                          <IconStarFilled className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <IconStar className="h-4 w-4" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
