/**
 * Agency Admin - Conversations Page
 *
 * Displays conversations for the agency's organization.
 * Data is automatically scoped based on user role (agency admin, clinic admin, etc.)
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { ConversationsClient } from "@/components/conversations/conversations-client";
import type { Conversation } from "@/components/conversations/conversation-list";
import type { Message } from "@/components/conversations/conversation-thread";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Calculate timestamps once at module level to avoid impure Date.now() during render
const now = Date.now();
const timestamps = {
  fifteenMinsAgo: new Date(now - 1000 * 60 * 15).toISOString(),
  twoHoursAgo: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  oneDayAgo: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  twoDaysAgo: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  threeDaysAgo: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
  thirtyMinsAgo: new Date(now - 1000 * 60 * 30).toISOString(),
  twentyMinsAgo: new Date(now - 1000 * 60 * 20).toISOString(),
  eighteenMinsAgo: new Date(now - 1000 * 60 * 18).toISOString(),
  threeHoursAgo: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
  twoPointFiveHoursAgo: new Date(now - 1000 * 60 * 60 * 2.5).toISOString(),
  twentyFiveHoursAgo: new Date(now - 1000 * 60 * 60 * 25).toISOString(),
  threePointFiveDaysAgo: new Date(
    now - 1000 * 60 * 60 * 24 * 3.5
  ).toISOString(),
};

export default async function AgencyConversationsPage({ params }: PageProps) {
  const { slug } = await params;

  // Universal access control - handles all user roles with proper data scoping
  await requireDashboardAccess(slug);

  // TODO: Fetch real conversations from database
  // For now, using mock data that would be filtered by dataScope

  // Mock conversations data for demo
  const mockConversations: Conversation[] = [
    {
      id: "1",
      contactName: "Dr. Sarah Johnson",
      lastMessage: "Thanks for the update on the appointment scheduling.",
      timestamp: timestamps.fifteenMinsAgo,
      unreadCount: 2,
      isStarred: true,
    },
    {
      id: "2",
      contactName: "Wellness Clinic NYC",
      lastMessage: "Can we schedule a demo for next week?",
      timestamp: timestamps.twoHoursAgo,
      unreadCount: 0,
      isStarred: false,
    },
    {
      id: "3",
      contactName: "John Smith",
      lastMessage: "Perfect! See you then.",
      timestamp: timestamps.oneDayAgo,
      unreadCount: 0,
      isStarred: false,
    },
    {
      id: "4",
      contactName: "Highland Medical",
      lastMessage: "We're interested in integrating with your CRM platform.",
      timestamp: timestamps.twoDaysAgo,
      unreadCount: 1,
      isStarred: true,
    },
    {
      id: "5",
      contactName: "Maria Garcia",
      lastMessage: "Thank you for your help!",
      timestamp: timestamps.threeDaysAgo,
      unreadCount: 0,
      isStarred: false,
    },
  ];

  // Mock messages data for demo
  const mockMessagesByConversation: Record<string, Message[]> = {
    "1": [
      {
        id: "m1",
        content:
          "Hi Sarah, I wanted to update you on our new appointment scheduling feature.",
        timestamp: timestamps.thirtyMinsAgo,
        direction: "outbound",
        channel: "sms",
        status: "read",
      },
      {
        id: "m2",
        content: "That sounds great! Can you tell me more about how it works?",
        timestamp: timestamps.twentyMinsAgo,
        direction: "inbound",
        channel: "sms",
      },
      {
        id: "m3",
        content:
          "Of course! It allows patients to book directly through your website with real-time availability.",
        timestamp: timestamps.eighteenMinsAgo,
        direction: "outbound",
        channel: "sms",
        status: "read",
      },
      {
        id: "m4",
        content: "Thanks for the update on the appointment scheduling.",
        timestamp: timestamps.fifteenMinsAgo,
        direction: "inbound",
        channel: "sms",
      },
    ],
    "2": [
      {
        id: "m5",
        content: "Hi! I'm interested in learning more about your CRM platform.",
        timestamp: timestamps.threeHoursAgo,
        direction: "inbound",
        channel: "whatsapp",
      },
      {
        id: "m6",
        content:
          "Great! I'd be happy to show you around. When works best for you?",
        timestamp: timestamps.twoPointFiveHoursAgo,
        direction: "outbound",
        channel: "whatsapp",
        status: "read",
      },
      {
        id: "m7",
        content: "Can we schedule a demo for next week?",
        timestamp: timestamps.twoHoursAgo,
        direction: "inbound",
        channel: "whatsapp",
      },
    ],
    "3": [
      {
        id: "m8",
        content: "Your appointment is confirmed for Thursday at 2 PM.",
        timestamp: timestamps.twentyFiveHoursAgo,
        direction: "outbound",
        channel: "sms",
        status: "delivered",
      },
      {
        id: "m9",
        content: "Perfect! See you then.",
        timestamp: timestamps.oneDayAgo,
        direction: "inbound",
        channel: "sms",
      },
    ],
    "4": [
      {
        id: "m10",
        content: "We're interested in integrating with your CRM platform.",
        timestamp: timestamps.twoDaysAgo,
        direction: "inbound",
        channel: "sms",
      },
    ],
    "5": [
      {
        id: "m11",
        content:
          "Your support request has been resolved. Is there anything else we can help with?",
        timestamp: timestamps.threePointFiveDaysAgo,
        direction: "outbound",
        channel: "sms",
        status: "read",
      },
      {
        id: "m12",
        content: "Thank you for your help!",
        timestamp: timestamps.threeDaysAgo,
        direction: "inbound",
        channel: "sms",
      },
    ],
  };

  // Note: In production, these would be filtered based on dataScope
  // Platform admins see all, agency admins see their org, clinic users see their clinic

  return (
    <PageContainer variant="none">
      <ConversationsClient
        conversations={mockConversations}
        messagesByConversation={mockMessagesByConversation}
      />
    </PageContainer>
  );
}
