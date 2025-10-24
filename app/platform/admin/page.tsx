/**
 * Operations Dashboard - Daily overview for IV therapy clinic operations
 *
 * Provides real-time overview of daily operations:
 * - Today's appointment schedule
 * - Unread messages (SMS, FB, IG)
 * - Outstanding payments
 * - Inventory alerts
 * - Recent reviews
 *
 * Data sources:
 * - GHL API (appointments, messages, payments)
 * - Custom DB (inventory tracking)
 *
 * Access: All roles (filtered by organization)
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  IconCalendar,
  IconMessage,
  IconCreditCard,
  IconPackage,
  IconAlertCircle,
  IconBrandFacebook,
  IconBrandInstagram,
  IconMessageCircle,
} from "@tabler/icons-react";

export default function OperationsDashboard() {
  // TODO: Fetch from GHL API
  const todaysAppointments = [
    {
      id: "1",
      time: "9:00 AM",
      client: "Sarah Johnson",
      service: "IV Hydration Therapy",
      status: "confirmed",
    },
    {
      id: "2",
      time: "10:30 AM",
      client: "Mike Thompson",
      service: "Vitamin B12 Boost",
      status: "cancelled",
    },
    {
      id: "3",
      time: "2:00 PM",
      client: "Emma Davis",
      service: "Myers Cocktail",
      status: "confirmed",
    },
    {
      id: "4",
      time: "3:30 PM",
      client: "James Wilson",
      service: "Immune Boost IV",
      status: "confirmed",
    },
  ];

  // TODO: Fetch from GHL API
  const messageStats = {
    unread: 12,
    pending: 3,
    channels: {
      sms: 7,
      facebook: 3,
      instagram: 2,
    },
  };

  // TODO: Fetch from GHL API
  const paymentsDue = [
    { id: "1", client: "Sarah Johnson", amount: 150, service: "IV Therapy" },
    { id: "2", client: "Mike Thompson", amount: 75, service: "B12 Boost" },
  ];

  // TODO: Fetch from custom DB
  const inventoryAlerts = [
    { id: "1", item: "Vitamin C 500ml", current: 5, minimum: 10 },
    { id: "2", item: "B12 Injectable", current: 3, minimum: 8 },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Today&apos;s Appointments</CardDescription>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">
              {todaysAppointments.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Next: {todaysAppointments[0]?.time}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Unread Messages</CardDescription>
              <IconMessage className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{messageStats.unread}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {messageStats.pending} need response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Payments Due</CardDescription>
              <IconCreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">
              ${paymentsDue.length * 150}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {paymentsDue.length} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Inventory Alerts</CardDescription>
              <IconAlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-3xl text-destructive">
              {inventoryAlerts.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Items low on stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today&apos;s Schedule</CardTitle>
                <CardDescription>
                  {todaysAppointments.length} appointments scheduled
                </CardDescription>
              </div>
              <Link href="/platform/admin/appointments">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-muted-foreground">
                          {apt.time.split(" ")[1]}
                        </div>
                        <div className="text-lg font-bold">
                          {apt.time.split(":")[0]}:
                          {apt.time.split(":")[1].split(" ")[0]}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{apt.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.service}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === "confirmed"
                        ? "default"
                        : apt.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                    className="w-[90px] justify-center"
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  {messageStats.unread} unread across all channels
                </CardDescription>
              </div>
              <Link href="/platform/admin/messages">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <IconMessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold">SMS Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Text messages
                    </p>
                  </div>
                </div>
                <Badge className="min-w-[40px] justify-center">
                  {messageStats.channels.sms}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <IconBrandFacebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Facebook</p>
                    <p className="text-sm text-muted-foreground">
                      Messenger messages
                    </p>
                  </div>
                </div>
                <Badge className="min-w-[40px] justify-center">
                  {messageStats.channels.facebook}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <IconBrandInstagram className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Instagram</p>
                    <p className="text-sm text-muted-foreground">DM messages</p>
                  </div>
                </div>
                <Badge className="min-w-[40px] justify-center">
                  {messageStats.channels.instagram}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Due */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payments Due</CardTitle>
                <CardDescription>Collect before appointments</CardDescription>
              </div>
              <Link href="/platform/admin/payments">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentsDue.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-semibold">{payment.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.service}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${payment.amount}</p>
                    <Button size="sm" className="mt-1">
                      Collect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items running low</CardDescription>
              </div>
              <Link href="/platform/admin/inventory">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryAlerts.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <IconPackage className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-semibold">{item.item}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {item.current} / Min: {item.minimum}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive">
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/platform/admin/appointments">
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-1 px-2 py-3"
              >
                <IconCalendar className="h-6 w-6 mb-1" />
                <div className="text-xs text-center leading-tight">
                  <div>Schedule</div>
                  <div>Appointment</div>
                </div>
              </Button>
            </Link>
            <Link href="/platform/admin/messages">
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-1 px-2 py-3"
              >
                <IconMessage className="h-6 w-6 mb-1" />
                <div className="text-xs text-center leading-tight">
                  <div>Send</div>
                  <div>Message</div>
                </div>
              </Button>
            </Link>
            <Link href="/platform/admin/payments">
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-1 px-2 py-3"
              >
                <IconCreditCard className="h-6 w-6 mb-1" />
                <div className="text-xs text-center leading-tight">
                  <div>Process</div>
                  <div>Payment</div>
                </div>
              </Button>
            </Link>
            <Link href="/platform/admin/inventory">
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-1 px-2 py-3"
              >
                <IconPackage className="h-6 w-6 mb-1" />
                <div className="text-xs text-center leading-tight">
                  <div>Update</div>
                  <div>Inventory</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
