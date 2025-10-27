"use client";

/**
 * API Dashboard - Test and monitor GoHighLevel API integration
 *
 * This dashboard provides tools to test GHL API connections,
 * simulate webhooks, and debug integration issues.
 *
 * Features:
 * - Connection status testing
 * - Webhook simulation
 * - API endpoint testing
 * - Response inspection
 *
 * Access: Platform admin only (enforced by middleware)
 * Header: Rendered via Named Slots pattern (@header/api/page.tsx)
 */

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconApi,
  IconWebhook,
  IconMapPin,
  IconUsers,
  IconTarget,
  IconTag,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import {
  testGHLConnection,
  fetchGHLLocations,
  fetchGHLContacts,
  checkGHLConnection,
  disconnectGHL,
  getLearners,
  syncGHLLocations,
} from "./actions";
import Link from "next/link";

type TestResult = {
  status: "success" | "error" | "idle";
  message: string;
};

type Learner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string | null;
  ghlLocationId: string | null;
};

export default function APIDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [locationId, setLocationId] = useState<string | undefined>();
  const [isAgencyLevel, setIsAgencyLevel] = useState(false);
  const [locationCount, setLocationCount] = useState(0);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [syncResult, setSyncResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });

  const [connectionResult, setConnectionResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [webhookResult, setWebhookResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [locationsResult, setLocationsResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [contactsResult, setContactsResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [opportunitiesResult, setOpportunitiesResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [tagsResult, setTagsResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });

  const [loadingStates, setLoadingStates] = useState({
    connection: false,
    webhook: false,
    locations: false,
    contacts: false,
    opportunities: false,
    tags: false,
    sync: false,
  });

  // Check GHL connection status on mount
  useEffect(() => {
    checkGHLConnection().then(status => {
      setIsConnected(status.connected);
      setLocationId(status.locationId);
      setIsAgencyLevel(status.isAgencyLevel);
      setLocationCount(status.locationCount);
    });

    // Load learners if connected
    getLearners().then(data => {
      setLearners(data.learners);
      setLocationCount(data.learners.length);
    });
  }, []);

  const handleDisconnect = async () => {
    const result = await disconnectGHL();
    if (result.success) {
      setIsConnected(false);
      setLocationId(undefined);
      handleClearAll(); // Clear all test results
    }
  };

  const handleTestConnection = async (targetLocationId?: string) => {
    setLoadingStates(prev => ({ ...prev, connection: true }));
    const result = await testGHLConnection(targetLocationId);
    setConnectionResult(result);
    setLoadingStates(prev => ({ ...prev, connection: false }));
  };

  const handleTestWebhook = async () => {
    setLoadingStates(prev => ({ ...prev, webhook: true }));
    // Placeholder for webhook test
    await new Promise(resolve => setTimeout(resolve, 1000));
    setWebhookResult({
      status: "success",
      message: "Webhook simulation coming soon",
    });
    setLoadingStates(prev => ({ ...prev, webhook: false }));
  };

  const handleFetchLocations = async () => {
    setLoadingStates(prev => ({ ...prev, locations: true }));
    const result = await fetchGHLLocations();
    setLocationsResult(result);
    setLoadingStates(prev => ({ ...prev, locations: false }));
  };

  const handleFetchContacts = async () => {
    setLoadingStates(prev => ({ ...prev, contacts: true }));
    const result = await fetchGHLContacts();
    setContactsResult(result);
    setLoadingStates(prev => ({ ...prev, contacts: false }));
  };

  const handleTestOpportunities = async () => {
    setLoadingStates(prev => ({ ...prev, opportunities: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOpportunitiesResult({
      status: "success",
      message: "Opportunities endpoint coming soon",
    });
    setLoadingStates(prev => ({ ...prev, opportunities: false }));
  };

  const handleTestTags = async () => {
    setLoadingStates(prev => ({ ...prev, tags: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTagsResult({
      status: "success",
      message: "Tags & custom fields endpoint coming soon",
    });
    setLoadingStates(prev => ({ ...prev, tags: false }));
  };

  const handleSyncLocations = async () => {
    setLoadingStates(prev => ({ ...prev, sync: true }));
    const result = await syncGHLLocations();
    setSyncResult(result);
    setLoadingStates(prev => ({ ...prev, sync: false }));

    // Reload learners after sync
    if (result.status === "success") {
      const data = await getLearners();
      setLearners(data.learners);
      setLocationCount(data.learners.length);
    }
  };

  const handleClearAll = () => {
    setConnectionResult({ status: "idle", message: "" });
    setWebhookResult({ status: "idle", message: "" });
    setLocationsResult({ status: "idle", message: "" });
    setContactsResult({ status: "idle", message: "" });
    setOpportunitiesResult({ status: "idle", message: "" });
    setTagsResult({ status: "idle", message: "" });
  };

  const handleRunAllTests = async () => {
    // Run all tests sequentially
    await handleTestConnection();
    await handleFetchLocations();
    await handleFetchContacts();
    await handleTestWebhook();
    await handleTestOpportunities();
    await handleTestTags();
  };

  const isAnyTestRunning = Object.values(loadingStates).some(
    state => state === true
  );

  const apiTestCards = [
    {
      title: "GHL Connection",
      description: "Test API credentials and connection status",
      icon: <IconApi className="size-8 text-green-600" />,
      buttonText: "Test Connection",
      stats: "Not Tested",
      onClick: () => handleTestConnection(),
      loading: loadingStates.connection,
      result: connectionResult,
    },
    {
      title: "Test Webhook",
      description: "Simulate GHL webhook for lesson completion",
      icon: <IconWebhook className="size-8 text-blue-600" />,
      buttonText: "Send Test Webhook",
      stats: "Ready",
      onClick: handleTestWebhook,
      loading: loadingStates.webhook,
      result: webhookResult,
    },
    {
      title: "Fetch Locations",
      description: "Get list of authorized GHL locations",
      icon: <IconMapPin className="size-8 text-purple-600" />,
      buttonText: "Get Locations",
      stats: "API Ready",
      onClick: handleFetchLocations,
      loading: loadingStates.locations,
      result: locationsResult,
    },
    {
      title: "Contacts API",
      description: "Test contact retrieval from GHL",
      icon: <IconUsers className="size-8 text-orange-600" />,
      buttonText: "Fetch Contacts",
      stats: "Endpoint Ready",
      onClick: handleFetchContacts,
      loading: loadingStates.contacts,
      result: contactsResult,
    },
    {
      title: "Opportunities",
      description: "Test opportunity management endpoints",
      icon: <IconTarget className="size-8 text-indigo-600" />,
      buttonText: "Test Opportunities",
      stats: "Available",
      onClick: handleTestOpportunities,
      loading: loadingStates.opportunities,
      result: opportunitiesResult,
    },
    {
      title: "Tags & Custom Fields",
      description: "Test location tags and custom fields",
      icon: <IconTag className="size-8 text-cyan-600" />,
      buttonText: "Test Metadata",
      stats: "Available",
      onClick: handleTestTags,
      loading: loadingStates.tags,
      result: tagsResult,
    },
  ];

  return (
    <PageContainer variant="padded" as="main">
      <div className="flex items-end justify-end">
        <div className="flex gap-3">
          {!isConnected ? (
            <Link
              href="/api/crm/authorize"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="cursor-pointer">Connect GHL</Button>
            </Link>
          ) : (
            <>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="cursor-pointer"
              >
                Disconnect GHL
              </Button>
              <Button
                onClick={handleClearAll}
                variant="outline"
                disabled={isAnyTestRunning}
              >
                Clear All Results
              </Button>
              <Button
                onClick={handleRunAllTests}
                disabled={isAnyTestRunning}
                className="cursor-pointer"
              >
                {isAnyTestRunning && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Run All Tests
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Status</CardDescription>
            <CardTitle className="text-2xl">
              {isConnected ? "Connected" : "Not Connected"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isConnected && isAgencyLevel
                ? `Agency-level access (${locationCount} locations)`
                : isConnected && locationId
                  ? `Location: ${locationId}`
                  : "Click 'Connect GHL' to authorize"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>GHL Locations</CardDescription>
            <CardTitle className="text-2xl">{locationCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isAgencyLevel ? "Sub-accounts tracked" : "Location connected"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Calls</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync Section */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Sync</CardTitle>
            <CardDescription>
              Manually fetch and sync learners from GHL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSyncLocations}
              disabled={loadingStates.sync}
              className="w-full cursor-pointer"
            >
              {loadingStates.sync && (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sync GHL Locations
            </Button>

            {/* Sync Result Display */}
            {syncResult.status !== "idle" && (
              <div
                className={`p-4 rounded-md text-sm ${
                  syncResult.status === "success"
                    ? "bg-green-50 text-green-900 border border-green-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                <p className="font-medium mb-1">
                  {syncResult.status === "success" ? "✓ Success" : "✗ Error"}
                </p>
                <p className="text-xs opacity-90">{syncResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learners List */}
      {learners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learners ({learners.length})</CardTitle>
            <CardDescription>
              Synced from GHL - IV therapy companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {learners.map(learner => (
                <div
                  key={learner.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{learner.name}</h3>
                    {learner.email && (
                      <p className="text-sm text-muted-foreground">
                        {learner.email}
                      </p>
                    )}
                    {learner.ghlLocationId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        GHL ID: {learner.ghlLocationId}
                      </p>
                    )}
                    {learner.address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {learner.address}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleTestConnection(learner.ghlLocationId!)}
                    variant="outline"
                    size="sm"
                    disabled={
                      loadingStates.connection || !learner.ghlLocationId
                    }
                    className="cursor-pointer"
                  >
                    Test API
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apiTestCards.map((card, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow flex flex-col"
          >
            <CardHeader className="flex-1">
              <div className="flex items-center justify-between mb-4">
                {card.icon}
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {card.stats}
                </span>
              </div>
              <CardTitle className="text-lg">{card.title}</CardTitle>
              <CardDescription className="text-sm mt-2">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Button
                onClick={card.onClick}
                disabled={card.loading}
                className="w-full cursor-pointer"
                variant="secondary"
              >
                {card.loading && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {card.buttonText}
              </Button>

              {/* Result Display */}
              {card.result.status !== "idle" && (
                <div
                  className={`p-3 rounded-md text-sm relative ${
                    card.result.status === "success"
                      ? "bg-green-50 text-green-900 border border-green-200"
                      : "bg-red-50 text-red-900 border border-red-200"
                  }`}
                >
                  <button
                    onClick={() => {
                      // Reset the specific result based on card title
                      if (card.title === "GHL Connection") {
                        setConnectionResult({ status: "idle", message: "" });
                      } else if (card.title === "Test Webhook") {
                        setWebhookResult({ status: "idle", message: "" });
                      } else if (card.title === "Fetch Locations") {
                        setLocationsResult({ status: "idle", message: "" });
                      } else if (card.title === "Contacts API") {
                        setContactsResult({ status: "idle", message: "" });
                      } else if (card.title === "Opportunities") {
                        setOpportunitiesResult({ status: "idle", message: "" });
                      } else if (card.title === "Tags & Custom Fields") {
                        setTagsResult({ status: "idle", message: "" });
                      }
                    }}
                    className="absolute top-2 right-2 hover:opacity-70 transition-opacity cursor-pointer"
                    aria-label="Clear result"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                  <p className="font-medium mb-1">
                    {card.result.status === "success" ? "✓ Success" : "✗ Error"}
                  </p>
                  <p className="text-xs opacity-90 pr-6">
                    {card.result.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
