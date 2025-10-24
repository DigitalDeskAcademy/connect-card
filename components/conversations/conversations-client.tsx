"use client";

import { useState } from "react";
import { ConversationList, type Conversation } from "./conversation-list";
import { ConversationThread, type Message } from "./conversation-thread";
import { Card } from "@/components/ui/card";

/**
 * ConversationsClient - Main wrapper for conversations page
 *
 * Manages state for:
 * - Selected conversation
 * - Messages for active conversation
 * - Conversation list updates
 */

interface ConversationsClientProps {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
}

export function ConversationsClient({
  conversations: initialConversations,
  messagesByConversation,
}: ConversationsClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(initialConversations[0]?.id);

  const [conversations, setConversations] = useState(initialConversations);

  const selectedConversation = conversations.find(
    conv => conv.id === selectedConversationId
  );

  const messages = selectedConversationId
    ? messagesByConversation[selectedConversationId] || []
    : [];

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);

    // Mark conversation as read
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  const handleToggleStar = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, isStarred: !conv.isStarred }
          : conv
      )
    );
  };

  const handleSendMessage = (content: string, channel: "sms" | "whatsapp") => {
    // TODO: Implement send message logic
    console.log("Send message:", { content, channel, selectedConversationId });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header now rendered via Named Slots pattern (@header/default.tsx) */}

      {/* 3-Panel Layout: 20% List + 50% Thread + 30% Details */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[20%_50%_30%] h-[calc(100vh-280px)]">
          {/* Left Panel: Conversation List (20%) */}
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onToggleStar={handleToggleStar}
          />

          {/* Center Panel: Message Thread (50%) */}
          <ConversationThread
            contactName={selectedConversation?.contactName}
            messages={messages}
            onSendMessage={handleSendMessage}
          />

          {/* Right Panel: Contact Details (30%) */}
          <div className="border-l bg-muted/10">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-4">Contact Details</h3>
              {selectedConversation ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">
                      {selectedConversation.contactName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Last Message
                    </p>
                    <p className="text-sm">
                      {selectedConversation.lastMessage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className="text-sm">
                      {selectedConversation.unreadCount > 0 ? "Unread" : "Read"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a conversation to view details
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
