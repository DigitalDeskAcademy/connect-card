#!/usr/bin/env node

/**
 * S3 Upload Testing Script
 *
 * Tests the S3 upload functionality with various scenarios
 * Run with: node scripts/test-s3-upload.js
 */

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000";
const TEST_SCENARIOS = [
  {
    name: "Platform Course Upload",
    courseName: "Test Course S3",
    organizationSlug: null,
    fileType: "thumbnail",
    expectedPath:
      /^platform\/courses\/test-course-s3\/thumbnail-\d+-\w{8}\.(jpg|png)$/,
  },
  {
    name: "Agency Course Upload",
    courseName: "Agency Test Course",
    organizationSlug: "digitaldesk",
    fileType: "thumbnail",
    expectedPath:
      /^organizations\/digitaldesk\/courses\/agency-test-course\/thumbnail-\d+-\w{8}\.(jpg|png)$/,
  },
  {
    name: "Special Characters in Name",
    courseName: "GHL: Advanced! @2024",
    organizationSlug: "testorg",
    fileType: "banner",
    expectedPath:
      /^organizations\/testorg\/courses\/ghl-advanced-2024\/banner-\d+-\w{8}\.(jpg|png)$/,
  },
  {
    name: "Concurrent Uploads",
    courseName: "Concurrent Test",
    organizationSlug: null,
    fileType: "asset",
    count: 5, // Upload 5 files simultaneously
    expectedPath:
      /^platform\/courses\/concurrent-test\/asset-\d+-\w{8}\.(jpg|png)$/,
  },
];

/**
 * Generate a test image file
 */
function generateTestImage(filename = "test-image.png") {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");

  // Draw a simple test pattern
  ctx.fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("TEST", 75, 105);

  const buffer = canvas.toBuffer("image/png");
  const filepath = path.join("/tmp", filename);
  fs.writeFileSync(filepath, buffer);

  return {
    path: filepath,
    buffer: buffer,
    size: buffer.length,
    type: "image/png",
  };
}

/**
 * Test S3 upload endpoint
 */
async function testUpload(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log("─".repeat(50));

  try {
    // Generate test image
    const testImage = generateTestImage(`test-${Date.now()}.png`);

    // Prepare request body
    const requestBody = {
      fileName: path.basename(testImage.path),
      contentType: testImage.type,
      size: testImage.size,
      isImage: true,
      fileType: scenario.fileType,
      courseName: scenario.courseName,
      organizationSlug: scenario.organizationSlug,
    };

    console.log("📤 Request:", JSON.stringify(requestBody, null, 2));

    // Call the upload API
    const response = await fetch(`${API_URL}/api/s3/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers if needed
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Response:", {
      key: data.key,
      presignedUrl: data.presignedUrl ? "Generated" : "Missing",
    });

    // Verify the key matches expected pattern
    if (scenario.expectedPath && !scenario.expectedPath.test(data.key)) {
      console.log("❌ Path pattern mismatch!");
      console.log("   Expected:", scenario.expectedPath);
      console.log("   Got:", data.key);
    } else {
      console.log("✅ Path pattern matches!");
    }

    // Clean up test file
    fs.unlinkSync(testImage.path);

    return { success: true, key: data.key };
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test concurrent uploads
 */
async function testConcurrentUploads(scenario) {
  console.log(
    `\n🧪 Testing: ${scenario.name} (${scenario.count} concurrent uploads)`
  );
  console.log("─".repeat(50));

  const uploads = [];
  for (let i = 0; i < scenario.count; i++) {
    uploads.push(
      testUpload({
        ...scenario,
        name: `Concurrent Upload ${i + 1}`,
      })
    );
  }

  const results = await Promise.all(uploads);
  const keys = results.filter(r => r.success).map(r => r.key);

  // Check for unique keys
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size === keys.length) {
    console.log("✅ All keys are unique!");
  } else {
    console.log("❌ Duplicate keys detected!");
  }

  return results;
}

/**
 * Load test - rapid sequential uploads
 */
async function loadTest(count = 10) {
  console.log(`\n🚀 Load Test: ${count} sequential uploads`);
  console.log("─".repeat(50));

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < count; i++) {
    const result = await testUpload({
      name: `Load Test ${i + 1}`,
      courseName: `Load Test Course ${i}`,
      organizationSlug: "loadtest",
      fileType: "thumbnail",
    });
    results.push(result);

    // Show progress
    process.stdout.write(`\rProgress: ${i + 1}/${count}`);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const successful = results.filter(r => r.success).length;

  console.log(`\n\n📊 Load Test Results:`);
  console.log(`   Total uploads: ${count}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${count - successful}`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Avg time per upload: ${(duration / count).toFixed(2)}s`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("🚀 S3 Upload Testing Suite");
  console.log("═".repeat(50));

  // Check if canvas is available
  try {
    require("canvas");
  } catch (error) {
    console.log("\n⚠️  Canvas package not installed.");
    console.log("   Install with: npm install canvas");
    console.log("\n   Alternatively, you can test with real image files.");
    return;
  }

  // Run individual scenario tests
  for (const scenario of TEST_SCENARIOS) {
    if (scenario.count) {
      await testConcurrentUploads(scenario);
    } else {
      await testUpload(scenario);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Optional: Run load test
  const runLoadTest = process.argv.includes("--load-test");
  if (runLoadTest) {
    await loadTest(20);
  }

  console.log("\n✨ Testing complete!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testUpload, generateTestImage, loadTest };
