import type { NextConfig } from "next";

// Baseline security headers. A strict Content-Security-Policy is left out
// because the PayPal JS SDK loads scripts and frames from several PayPal
// domains; a CSP would need to allow-list them all and use nonces.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Tailwind v4 is compiled by Turbopack's loader (no PostCSS config needed).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
