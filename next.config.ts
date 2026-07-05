import type { NextConfig } from "next";

// Security headers applied to every response (PCI DSS / general hardening).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Enforced by the browser only over HTTPS (production).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // PGlite (dev database) ships native/wasm assets that must not be bundled
  serverExternalPackages: ["@electric-sql/pglite"],
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      // drive uploads go through server actions
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
