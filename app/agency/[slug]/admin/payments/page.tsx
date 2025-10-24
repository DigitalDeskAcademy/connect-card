/**
 * Agency Admin - Payments Page
 *
 * Displays payment transactions and revenue analytics for the agency's organization.
 * Data is synced from GoHighLevel via webhooks when payments are collected.
 * Data is automatically scoped based on user role (agency admin, clinic admin, etc.)
 *
 * Architecture:
 * - Staff collect payments via Lead Connector mobile app (tap-to-pay)
 * - GHL sends payment webhooks to SideCar
 * - SideCar displays read-only payment dashboard
 * - AI layer provides insights on top of GHL data
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PaymentsClient } from "@/components/dashboard/payments/payments-client";
import type { PaymentWithRelations } from "@/components/dashboard/payments/payments-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Calculate timestamps once at module level to avoid impure Date.now() during render
const now = Date.now();
const timestamps = {
  today: new Date(now).toISOString(),
  yesterday: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  twoDaysAgo: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  threeDaysAgo: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
  oneWeekAgo: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
  twoWeeksAgo: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
};

export default async function AgencyPaymentsPage({ params }: PageProps) {
  const { slug } = await params;

  // Universal access control - handles all user roles with proper data scoping
  await requireDashboardAccess(slug);

  // TODO: Fetch real payments from database with dataScope
  // const dataScope = createAgencyDataScope(organization.id);
  // const payments = await dataScope.getPayments();

  // Mock payments data for demo (IV therapy clinic services)
  const mockPayments = [
    {
      id: "pay_1",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12345",
      ghlContactId: "ghl_contact_001",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Sarah Johnson",
      patientEmail: "sarah.j@example.com",
      patientPhone: "+1 (555) 123-4567",
      amount: 150.0,
      status: "PAID",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-001",
      description: "Myers Cocktail IV Therapy",
      paidAt: new Date(timestamps.today),
      createdAt: new Date(timestamps.today),
      updatedAt: new Date(timestamps.today),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_2",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12346",
      ghlContactId: "ghl_contact_002",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Michael Chen",
      patientEmail: "m.chen@example.com",
      patientPhone: "+1 (555) 234-5678",
      amount: 200.0,
      status: "PAID",
      paymentMethod: "cash",
      invoiceNumber: "INV-2025-002",
      description: "NAD+ IV Therapy",
      paidAt: new Date(timestamps.today),
      createdAt: new Date(timestamps.today),
      updatedAt: new Date(timestamps.today),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_3",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12347",
      ghlContactId: "ghl_contact_003",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Emily Rodriguez",
      patientEmail: "e.rodriguez@example.com",
      patientPhone: "+1 (555) 345-6789",
      amount: 175.0,
      status: "PAID",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-003",
      description: "Hydration Therapy + Vitamin C Boost",
      paidAt: new Date(timestamps.yesterday),
      createdAt: new Date(timestamps.yesterday),
      updatedAt: new Date(timestamps.yesterday),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_4",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12348",
      ghlContactId: "ghl_contact_004",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "David Kim",
      patientEmail: "d.kim@example.com",
      patientPhone: "+1 (555) 456-7890",
      amount: 150.0,
      status: "PENDING",
      paymentMethod: null,
      invoiceNumber: "INV-2025-004",
      description: "Myers Cocktail IV Therapy",
      paidAt: null,
      createdAt: new Date(timestamps.yesterday),
      updatedAt: new Date(timestamps.yesterday),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_5",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12349",
      ghlContactId: "ghl_contact_005",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Jessica Martinez",
      patientEmail: "j.martinez@example.com",
      patientPhone: "+1 (555) 567-8901",
      amount: 225.0,
      status: "PAID",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-005",
      description: "Glutathione IV Therapy + B12 Injection",
      paidAt: new Date(timestamps.twoDaysAgo),
      createdAt: new Date(timestamps.twoDaysAgo),
      updatedAt: new Date(timestamps.twoDaysAgo),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_6",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12350",
      ghlContactId: "ghl_contact_006",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Robert Taylor",
      patientEmail: "r.taylor@example.com",
      patientPhone: "+1 (555) 678-9012",
      amount: 150.0,
      status: "FAILED",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-006",
      description: "Myers Cocktail IV Therapy",
      paidAt: null,
      createdAt: new Date(timestamps.threeDaysAgo),
      updatedAt: new Date(timestamps.threeDaysAgo),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_7",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12351",
      ghlContactId: "ghl_contact_007",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Amanda White",
      patientEmail: "a.white@example.com",
      patientPhone: "+1 (555) 789-0123",
      amount: 300.0,
      status: "PAID",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-007",
      description: "Premium Wellness Package - 3 Sessions",
      paidAt: new Date(timestamps.oneWeekAgo),
      createdAt: new Date(timestamps.oneWeekAgo),
      updatedAt: new Date(timestamps.oneWeekAgo),
      contact: null,
      service: null,
      organization: null,
    },
    {
      id: "pay_8",
      organizationId: "org_1",
      ghlPaymentId: "ghl_inv_12352",
      ghlContactId: "ghl_contact_008",
      contactId: null,
      serviceId: null,
      stripePaymentId: null,
      patientName: "Christopher Lee",
      patientEmail: "c.lee@example.com",
      patientPhone: "+1 (555) 890-1234",
      amount: 175.0,
      status: "REFUNDED",
      paymentMethod: "card",
      invoiceNumber: "INV-2025-008",
      description: "Hydration Therapy (Refunded - Client Request)",
      paidAt: new Date(timestamps.twoWeeksAgo),
      createdAt: new Date(timestamps.twoWeeksAgo),
      updatedAt: new Date(timestamps.oneWeekAgo),
      contact: null,
      service: null,
      organization: null,
    },
  ] as unknown as PaymentWithRelations[];

  // Note: In production, these would be filtered based on dataScope
  // Platform admins see all, agency admins see their org, clinic users see their clinic

  return <PaymentsClient payments={mockPayments} />;
}
