"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCash, IconTrendingUp, IconAlertCircle } from "@tabler/icons-react";
import type {
  Payment,
  ChurchMember,
  Organization,
} from "@/lib/generated/prisma";
import { PaymentsTable } from "./payments-table";

/**
 * Payment with optional relations for display
 */
export type PaymentWithRelations = Payment & {
  churchMember: ChurchMember | null;
  organization: Organization | null;
};

interface PaymentsClientProps {
  payments: PaymentWithRelations[];
}

/**
 * Payments Client Component
 *
 * Displays payment dashboard with revenue summary cards and payment transactions table.
 * Shows real-time payment data synced from GoHighLevel.
 *
 * Features:
 * - Revenue summary cards (Today, Week, Month, Pending)
 * - Payments data table with status filtering
 * - Payment status badges and actions
 */
export function PaymentsClient({ payments }: PaymentsClientProps) {
  // Calculate revenue metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayRevenue = payments
    .filter(
      p => p.status === "PAID" && p.paidAt && new Date(p.paidAt) >= todayStart
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const weekRevenue = payments
    .filter(
      p => p.status === "PAID" && p.paidAt && new Date(p.paidAt) >= weekStart
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const monthRevenue = payments
    .filter(
      p => p.status === "PAID" && p.paidAt && new Date(p.paidAt) >= monthStart
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const failedCount = payments.filter(p => p.status === "FAILED").length;

  /**
   * Layout: Canvas Pattern (Full-Height Component)
   *
   * Uses `flex-1` instead of `h-full` because parent is `flex flex-col`.
   * In flexbox columns, children need flex-1 to consume available space.
   *
   * Structure:
   * - Summary cards: flex-shrink-0 (fixed height)
   * - Table wrapper: flex-1 min-h-0 (fills remaining space, scrollable)
   */
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Revenue
            </CardTitle>
            <IconCash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  p =>
                    p.status === "PAID" &&
                    p.paidAt &&
                    new Date(p.paidAt) >= todayStart
                ).length
              }{" "}
              payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${weekRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  p =>
                    p.status === "PAID" &&
                    p.paidAt &&
                    new Date(p.paidAt) >= weekStart
                ).length
              }{" "}
              payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  p =>
                    p.status === "PAID" &&
                    p.paidAt &&
                    new Date(p.paidAt) >= monthStart
                ).length
              }{" "}
              payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Payments
            </CardTitle>
            <IconAlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {failedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {failedCount === 1 ? "payment" : "payments"} need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <div className="flex-1 min-h-0">
        <PaymentsTable payments={payments} />
      </div>
    </div>
  );
}
