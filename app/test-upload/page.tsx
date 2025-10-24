/**
 * S3 Upload Test Page
 *
 * Interactive test page for verifying S3 upload functionality
 * Access at: http://localhost:3000/test-upload
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  scenario: string;
  success: boolean;
  key?: string;
  error?: string;
  time: number;
}

export default function TestUploadPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Generate a test image blob
  const generateTestImage = (text: string = "TEST"): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;

    // Random background color
    ctx.fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    ctx.fillRect(0, 0, 200, 200);

    // Text
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 100, 100);

    return new Promise<Blob>(resolve => {
      canvas.toBlob(blob => resolve(blob!), "image/png");
    });
  };

  // Test a single upload scenario
  const testUpload = async (
    courseName: string,
    orgSlug: string | null,
    fileType: string = "thumbnail"
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const scenario = `${orgSlug ? `Agency (${orgSlug})` : "Platform"}: ${courseName}`;

    try {
      // Generate test image
      const imageBlob = await generateTestImage(courseName.substring(0, 10));
      const file = new File([imageBlob], `test-${Date.now()}.png`, {
        type: "image/png",
      });

      // Call upload API
      const response = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          isImage: true,
          fileType: fileType,
          courseName: courseName,
          organizationSlug: orgSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Verify path structure
      const expectedPrefix = orgSlug
        ? `organizations/${orgSlug}/courses/`
        : "platform/courses/";

      if (!data.key.startsWith(expectedPrefix)) {
        throw new Error(`Invalid path structure. Got: ${data.key}`);
      }

      return {
        scenario,
        success: true,
        key: data.key,
        time: Date.now() - startTime,
      };
    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        time: Date.now() - startTime,
      };
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    toast.info("Starting tests...");

    const testScenarios = [
      { name: "Platform Course", org: null },
      { name: "Agency Course", org: "digitaldesk" },
      { name: "Special Chars: Test!", org: "test-org" },
      { name: "Numbers 123", org: null },
      {
        name: "Very Long Course Name That Should Be Truncated",
        org: "long-org",
      },
    ];

    const newResults: TestResult[] = [];

    for (const scenario of testScenarios) {
      const result = await testUpload(scenario.name, scenario.org);
      newResults.push(result);
      setResults([...newResults]);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Concurrent test
    toast.info("Running concurrent upload test...");
    const concurrentPromises = Array(5)
      .fill(0)
      .map((_, i) => testUpload(`Concurrent ${i}`, "concurrent-test"));

    const concurrentResults = await Promise.all(concurrentPromises);
    newResults.push(...concurrentResults);
    setResults([...newResults]);

    setTesting(false);

    // Summary
    const successful = newResults.filter(r => r.success).length;
    const failed = newResults.filter(r => !r.success).length;

    if (failed === 0) {
      toast.success(`All ${successful} tests passed!`);
    } else {
      toast.error(`${failed} tests failed, ${successful} passed`);
    }
  };

  // Manual test
  const [manualCourseName, setManualCourseName] = useState("");
  const [manualOrgSlug, setManualOrgSlug] = useState("");

  const runManualTest = async () => {
    if (!manualCourseName) {
      toast.error("Please enter a course name");
      return;
    }

    setTesting(true);
    const result = await testUpload(manualCourseName, manualOrgSlug || null);
    setResults([result, ...results]);
    setTesting(false);

    if (result.success) {
      toast.success("Upload successful!");
    } else {
      toast.error("Upload failed!");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">S3 Upload Test Suite</h1>

      <Tabs defaultValue="automated" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Test</TabsTrigger>
        </TabsList>

        <TabsContent value="automated">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Suite</CardTitle>
              <CardDescription>
                Run comprehensive tests for S3 upload functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runAllTests}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>

              {results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Test Results:</h3>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">{result.scenario}</p>
                            {result.key && (
                              <p className="text-sm text-gray-600 font-mono break-all">
                                {result.key}
                              </p>
                            )}
                            {result.error && (
                              <p className="text-sm text-red-600">
                                {result.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {result.time}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Test</CardTitle>
              <CardDescription>Test with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name (Required)</Label>
                <Input
                  id="courseName"
                  value={manualCourseName}
                  onChange={e => setManualCourseName(e.target.value)}
                  placeholder="e.g., GHL Onboarding"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">
                  Organization Slug (Leave empty for platform)
                </Label>
                <Input
                  id="orgSlug"
                  value={manualOrgSlug}
                  onChange={e => setManualOrgSlug(e.target.value)}
                  placeholder="e.g., digitaldesk"
                />
              </div>

              <Button
                onClick={runManualTest}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Expected Path Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-green-600">
              ✓ platform/courses/course-name/thumbnail-{"{timestamp}"}-{"{id}"}
              .png
            </p>
            <p className="text-green-600">
              ✓ organizations/org-slug/courses/course-name/banner-
              {"{timestamp}"}-{"{id}"}.jpg
            </p>
            <p className="text-red-600">
              ✗ assets/uuid-filename.jpg (old format)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
