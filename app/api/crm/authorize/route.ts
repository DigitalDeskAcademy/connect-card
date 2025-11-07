import { requireAdmin } from "@/app/data/admin/require-admin";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GHL OAuth Authorization Endpoint
 * Redirects admin to GHL authorization page to grant access
 */
export async function GET() {
  try {
    // 1. Verify admin authentication
    await requireAdmin();

    // 2. Get OAuth credentials from environment
    const clientId = env.GHL_CLIENT_ID;
    const redirectUri = env.GHL_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "GHL OAuth not configured" },
        { status: 500 }
      );
    }

    // 3. Build authorization URL with ALL available scopes for development testing
    const scopes = [
      // Core
      "businesses.readonly",
      "businesses.write",
      "companies.readonly",
      "locations.readonly",
      "locations.write",
      "locations/templates.readonly",
      "locations/tags.write",
      "locations/tags.readonly",
      "locations/tasks.write",
      "locations/tasks.readonly",
      "locations/customFields.write",
      "locations/customFields.readonly",
      "locations/customValues.write",
      "locations/customValues.readonly",

      // Contacts & Conversations
      "contacts.readonly",
      "contacts.write",
      "conversations.readonly",
      "conversations.write",
      "conversations/message.readonly",
      "conversations/message.write",
      "conversations/reports.readonly",
      "conversations/livechat.write",
      "conversation-ai.readonly",
      "conversation-ai.write",

      // Calendars
      "calendars.readonly",
      "calendars.write",
      "calendars/events.readonly",
      "calendars/events.write",
      "calendars/groups.readonly",
      "calendars/groups.write",
      "calendars/resources.readonly",
      "calendars/resources.write",

      // Campaigns
      "campaigns.readonly",

      // Workflows & Tasks
      "workflows.readonly",
      "recurring-tasks.readonly",
      "recurring-tasks.write",

      // Users
      "users.readonly",
      "users.write",

      // Forms & Surveys
      "forms.readonly",
      "forms.write",
      "surveys.readonly",

      // Courses & Knowledge
      "courses.readonly",
      "courses.write",
      "knowledge-bases.readonly",
      "knowledge-bases.write",

      // Products & Payments
      "products.readonly",
      "products.write",
      "products/prices.readonly",
      "products/prices.write",
      "products/collection.readonly",
      "products/collection.write",
      "payments/orders.readonly",
      "payments/orders.write",
      "payments/orders.collectPayment",
      "payments/subscriptions.readonly",
      "payments/transactions.readonly",
      "payments/integration.readonly",
      "payments/integration.write",
      "payments/coupons.readonly",
      "payments/coupons.write",
      "payments/custom-provider.readonly",
      "payments/custom-provider.write",
      "charges.readonly",
      "charges.write",

      // Invoices
      "invoices.readonly",
      "invoices.write",
      "invoices/schedule.readonly",
      "invoices/schedule.write",
      "invoices/template.readonly",
      "invoices/template.write",
      "invoices/estimate.readonly",
      "invoices/estimate.write",

      // Store
      "store/setting.readonly",
      "store/setting.write",
      "store/shipping.readonly",
      "store/shipping.write",

      // Media & Links
      "medias.readonly",
      "medias.write",
      "links.readonly",
      "links.write",
      "lc-email.readonly",

      // Funnels
      "funnels/funnel.readonly",
      "funnels/page.readonly",
      "funnels/redirect.readonly",
      "funnels/redirect.write",
      "funnels/pagecount.readonly",

      // Social Planner
      "socialplanner/oauth.readonly",
      "socialplanner/oauth.write",
      "socialplanner/post.readonly",
      "socialplanner/post.write",
      "socialplanner/account.readonly",
      "socialplanner/account.write",
      "socialplanner/csv.readonly",
      "socialplanner/csv.write",
      "socialplanner/category.readonly",
      "socialplanner/category.write",
      "socialplanner/tag.readonly",
      "socialplanner/tag.write",
      "socialplanner/statistics.readonly",

      // Blogs
      "blogs/list.readonly",
      "blogs/posts.readonly",
      "blogs/post.write",
      "blogs/post-update.write",
      "blogs/check-slug.readonly",
      "blogs/category.readonly",
      "blogs/author.readonly",

      // Emails
      "emails/builder.readonly",
      "emails/builder.write",
      "emails/schedule.readonly",

      // WordPress
      "wordpress.site.readonly",

      // Custom Menus
      "custom-menu-link.readonly",
      "custom-menu-link.write",

      // Snapshots
      "snapshots.readonly",
      "snapshots.write",

      // SaaS
      "saas/company.read",
      "saas/company.write",
      "saas/location.read",
      "saas/location.write",

      // OAuth
      "oauth.readonly",
      "oauth.write",

      // Associations & Objects
      "associations.readonly",
      "associations.write",
      "associations/relation.readonly",
      "associations/relation.write",
      "objects/schema.readonly",
      "objects/schema.write",
      "objects/record.readonly",
      "objects/record.write",

      // Documents & Contracts
      "documents_contracts/list.readonly",
      "documents_contracts/sendLink.write",
      "documents_contracts_template/list.readonly",
      "documents_contracts_template/sendLink.write",

      // Voice AI
      "voice-ai-agents.readonly",
      "voice-ai-agents.write",
      "voice-ai-agent-goals.readonly",
      "voice-ai-agent-goals.write",
      "voice-ai-dashboard.readonly",

      // Phone & Twilio
      "phonenumbers.read",
      "numberpools.read",
      "twilioaccount.read",

      // Marketplace
      "marketplace-installer-details.readonly",
    ].join(" ");

    const authUrl = new URL(
      "https://marketplace.gohighlevel.com/oauth/chooselocation"
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);

    // 4. Redirect to GHL authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("GHL authorization error:", error);
    return NextResponse.json(
      { error: "Authorization failed" },
      { status: 500 }
    );
  }
}
