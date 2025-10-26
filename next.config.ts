import type { NextConfig } from "next";

/**
 * SECURITY HEADERS CONFIGURATION
 *
 * Industry-standard HTTP security headers to protect against common web vulnerabilities.
 * These headers work alongside Better Auth (CSRF protection) and Arcjet (bot/rate limiting)
 * to provide defense-in-depth security.
 *
 * Applied to all routes via Next.js headers() configuration.
 */
const securityHeaders = [
  {
    // Prevent clickjacking attacks by disallowing iframe embedding
    // Protects admin dashboards from being embedded in malicious sites
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevent MIME-sniffing attacks
    // Forces browsers to respect declared Content-Type, preventing execution of malicious files
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Control referrer information sent with requests
    // Prevents leaking sensitive URLs to third-party sites
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict browser features to reduce attack surface
    // Disables camera, microphone, geolocation, and FLoC tracking
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Force HTTPS connections and prevent protocol downgrade attacks
    // Only applies when site is accessed via HTTPS (production)
    // max-age=31536000 = 1 year, includeSubDomains = apply to all subdomains
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/**
 * CONTENT SECURITY POLICY (CSP) - Future Enhancement
 *
 * CSP is deferred to Phase 4 (post-$1k MRR) for the following reasons:
 * 1. Requires thorough testing with Stripe embeds, S3/Tigris assets, and inline styles
 * 2. Complex to configure without breaking functionality
 * 3. Current stack (Better Auth + Arcjet + headers above) provides strong baseline security
 *
 * When implementing CSP, start with report-only mode and whitelist:
 * - Stripe: https://js.stripe.com, https://api.stripe.com
 * - Tigris S3: https://*.tigris.dev
 * - Inline styles: 'unsafe-inline' (Tailwind requirement)
 * - Next.js scripts: 'unsafe-eval' (development requirement)
 *
 * Example CSP (test thoroughly before production):
 * "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://*.tigris.dev; frame-src https://js.stripe.com;"
 */

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "sidecar-uploads.t3.storage.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "connect-card-testing.t3.storage.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "digital-desk-sidecar.t3.storage.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "sidecar-uploads.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "avatar.vercel.sh",
        port: "",
        protocol: "https",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
