/**
 * Analytics Dashboard - Platform performance metrics and insights
 *
 * This page provides comprehensive analytics for admins to track
 * platform performance, student engagement, and revenue metrics.
 *
 * Components:
 * - SectionCards: Key metric cards (revenue, enrollments, etc.)
 * - ChartAreaInteractive: Time-series visualization of trends
 * - DataTable: Detailed tabular data with sorting/filtering
 *
 * Data Source: Currently using mock data from data.json
 * TODO: Integrate with real database queries for live metrics
 *
 * Access: Admin role required
 * Header: Rendered via Named Slots pattern (@header/analytics/page.tsx)
 */

"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { DataTable } from "@/components/sidebar/data-table";
import { SectionCards } from "@/components/sidebar/section-cards";

import data from "../data.json";

export default function AnalyticsPage() {
  return (
    <PageContainer as="main">
      <SectionCards />

      <ChartAreaInteractive />

      <DataTable data={data} />
    </PageContainer>
  );
}
