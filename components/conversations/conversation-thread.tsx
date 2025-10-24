"use client";

import { useState } from "react";
import {
  IconSend,
  IconPaperclip,
  IconPhone,
  IconVideo,
  IconDotsVertical,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * ConversationThread - Center panel showing message thread and composer
 *
 * Features:
 * - Channel tabs (SMS, WhatsApp)
 * - Message thread with sent/received styling
 * - Message composer with send button
 * - Action buttons (call, video, more)
 */

export type Message = {
  id: string;
  content: string;
  timestamp: string;
  direction: "inbound" | "outbound";
  channel: "sms" | "whatsapp";
  status?: "sent" | "delivered" | "read" | "failed";
};

interface ConversationThreadProps {
  contactName?: string;
  messages: Message[];
  onSendMessage?: (content: string, channel: "sms" | "whatsapp") => void;
}

export function ConversationThread({
  contactName,
  messages,
  onSendMessage,
}: ConversationThreadProps) {
  const [messageContent, setMessageContent] = useState("");
  const [activeChannel, setActiveChannel] = useState<"sms" | "whatsapp">("sms");

  const handleSend = () => {
    if (messageContent.trim() && onSendMessage) {
      onSendMessage(messageContent, activeChannel);
      setMessageContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Filter messages by active channel
  const filteredMessages = messages.filter(
    msg => msg.channel === activeChannel
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {contactName ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10">
                  {getInitials(contactName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{contactName}</h3>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <IconPhone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <IconVideo className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <IconDotsVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Channel Tabs */}
          <Tabs
            value={activeChannel}
            onValueChange={val => setActiveChannel(val as "sms" | "whatsapp")}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList className="h-10">
                <TabsTrigger value="sms" className="text-sm">
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="text-sm">
                  WhatsApp
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="sms"
              className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden"
            >
              <MessageThreadContent
                messages={filteredMessages}
                contactName={contactName}
                getInitials={getInitials}
                formatMessageTime={formatMessageTime}
              />
            </TabsContent>

            <TabsContent
              value="whatsapp"
              className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden"
            >
              <MessageThreadContent
                messages={filteredMessages}
                contactName={contactName}
                getInitials={getInitials}
                formatMessageTime={formatMessageTime}
              />
            </TabsContent>
          </Tabs>

          {/* Message Composer */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                <IconPaperclip className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <Textarea
                  placeholder={`Type a message via ${activeChannel.toUpperCase()}...`}
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] max-h-[120px] resize-none"
                  rows={2}
                />
              </div>
              <Button
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleSend}
                disabled={!messageContent.trim()}
              >
                <IconSend className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <IconSend className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageThreadContent({
  messages,
  contactName,
  getInitials,
  formatMessageTime,
}: {
  messages: Message[];
  contactName: string;
  getInitials: (name: string) => string;
  formatMessageTime: (timestamp: string) => string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.direction === "outbound" && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    message.direction === "outbound"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.direction === "outbound"
                    ? "SC"
                    : getInitials(contactName)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[70%]",
                  message.direction === "outbound" && "items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    message.direction === "outbound"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-muted-foreground">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {message.direction === "outbound" && message.status && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {message.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
