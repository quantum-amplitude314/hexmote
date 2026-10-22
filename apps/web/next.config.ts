import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// Only `next dev` sets API_URL; the web Worker forwards `/api` and `/admin/*` in preview and production.
const { API_URL: devApiUrl } = process.env;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
  rewrites: async () =>
    devApiUrl
      ? [
          { source: "/api/:path*", destination: `${devApiUrl}/api/:path*` },
          { source: "/admin/:path+", destination: `${devApiUrl}/admin/:path+` },
        ]
      : [],
};

export default nextConfig;

initOpenNextCloudflareForDev();
