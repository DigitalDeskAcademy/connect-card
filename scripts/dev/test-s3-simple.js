#!/usr/bin/env node

/**
 * Simple S3 Upload Test using external test images
 *
 * Uses free image services for testing without needing canvas
 * Run with: node scripts/test-s3-simple.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Test image sources (free, no auth required)
const TEST_IMAGES = [
  "https://picsum.photos/200/200", // Random image service
  "https://via.placeholder.com/300x300", // Placeholder image
  "https://dummyimage.com/400x400/000/fff", // Dummy image generator
];

/**
 * Download a test image
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const filename = `test-${Date.now()}.jpg`;
    const filepath = path.join("/tmp", filename);
    const file = fs.createWriteStream(filepath);

    https
      .get(url, response => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          const stats = fs.statSync(filepath);
          resolve({
            path: filepath,
            size: stats.size,
            type: "image/jpeg",
            filename: filename,
          });
        });
      })
      .on("error", reject);
  });
}

/**
 * Test S3 upload with a real image
 */
async function testRealImageUpload(courseName, orgSlug = null) {
  console.log(`\n🧪 Testing upload for: ${courseName}`);
  console.log(`   Organization: ${orgSlug || "Platform"}`);

  try {
    // Download a test image
    const imageUrl =
      TEST_IMAGES[Math.floor(Math.random() * TEST_IMAGES.length)];
    console.log(`📥 Downloading test image from: ${imageUrl}`);
    const image = await downloadImage(imageUrl);

    // Call your API
    const response = await fetch("http://localhost:3000/api/s3/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers here if needed
      },
      body: JSON.stringify({
        fileName: image.filename,
        contentType: image.type,
        size: image.size,
        isImage: true,
        fileType: "thumbnail",
        courseName: courseName,
        organizationSlug: orgSlug,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Upload successful!");
      console.log(`   S3 Key: ${data.key}`);

      // Verify path structure
      if (orgSlug) {
        const expectedPattern = `organizations/${orgSlug}/courses/`;
        if (data.key.includes(expectedPattern)) {
          console.log("✅ Path structure correct for organization");
        } else {
          console.log("❌ Path structure incorrect");
        }
      } else {
        if (data.key.startsWith("platform/courses/")) {
          console.log("✅ Path structure correct for platform");
        } else {
          console.log("❌ Path structure incorrect");
        }
      }

      // Now actually upload to S3 using the presigned URL
      if (data.presignedUrl) {
        console.log("📤 Uploading to S3...");
        const fileBuffer = fs.readFileSync(image.path);

        const s3Response = await fetch(data.presignedUrl, {
          method: "PUT",
          body: fileBuffer,
          headers: {
            "Content-Type": image.type,
          },
        });

        if (s3Response.ok) {
          console.log("✅ File uploaded to S3!");
        } else {
          console.log("❌ S3 upload failed:", s3Response.statusText);
        }
      }
    } else {
      console.log("❌ API Error:", data.error || response.statusText);
    }

    // Clean up
    fs.unlinkSync(image.path);

    return data.key;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return null;
  }
}

/**
 * Stress test with multiple concurrent uploads
 */
async function stressTest() {
  console.log("\n🚀 Running stress test with concurrent uploads...\n");

  const testCases = [
    { name: "Platform Course 1", org: null },
    { name: "Agency Course Alpha", org: "agency-alpha" },
    { name: "Agency Course Beta", org: "agency-beta" },
    { name: "Special Characters: Test!", org: "test-org" },
    { name: "30 Day Challenge Course", org: null },
  ];

  // Run all uploads concurrently
  const results = await Promise.all(
    testCases.map(test => testRealImageUpload(test.name, test.org))
  );

  // Check for uniqueness
  const uniqueKeys = new Set(results.filter(Boolean));
  console.log("\n📊 Stress Test Results:");
  console.log(`   Total uploads: ${testCases.length}`);
  console.log(`   Successful: ${results.filter(Boolean).length}`);
  console.log(`   Unique keys: ${uniqueKeys.size}`);

  if (uniqueKeys.size === results.filter(Boolean).length) {
    console.log("✅ All uploads have unique keys!");
  } else {
    console.log("❌ Duplicate keys detected!");
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("🧪 S3 Upload Testing - Simple Version");
  console.log("═".repeat(50));

  // Test 1: Platform course
  await testRealImageUpload("Test Platform Course");

  // Test 2: Agency course
  await testRealImageUpload("Test Agency Course", "digitaldesk");

  // Test 3: Special characters
  await testRealImageUpload("GHL: Advanced! @2024", "test-org");

  // Optional: Run stress test
  if (process.argv.includes("--stress")) {
    await stressTest();
  }

  console.log("\n✨ Testing complete!");
  console.log(
    "\nNote: Check your S3 bucket to verify the files were uploaded correctly."
  );
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
