/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: false,
  clientsClaim: false,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      // ── NEVER CACHE: API, auth, sensitive routes (GET-only filter on all) ──
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/(auth|login|logout|session)(\/.*)?$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/(dashboard|dealer|bank|forge|credit-hub)(\/.*)?$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/(applications|decision|scoring|documents|uploads)(\/.*)?$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/(tenants|admin|market-intel)(\/.*)?$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      // ── SAFE TO CACHE: static assets ──
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        method: "GET",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/image\?.*/i,
        handler: "StaleWhileRevalidate",
        method: "GET",
        options: {
          cacheName: "next-images",
          expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/icons\/.*/i,
        handler: "CacheFirst",
        method: "GET",
        options: {
          cacheName: "icons",
          expiration: { maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/fonts\/.*/i,
        handler: "CacheFirst",
        method: "GET",
        options: {
          cacheName: "fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/manifest\.json$/i,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "manifest",
          expiration: { maxAgeSeconds: 60 * 60 },
        },
      },
      {
        urlPattern: /\/offline$/i,
        handler: "CacheFirst",
        method: "GET",
        options: {
          cacheName: "offline-page",
          expiration: { maxEntries: 1, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

function cleanBackendUrl(value) {
  const raw = (value || "").trim();
  const match = raw.match(/^(https?:\/\/.+?)(?=[A-Z_]+=|$)/);
  return (match ? match[1] : raw).replace(/\/$/, "");
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/workbox-:hash.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/legal-agents",
        destination: "/legal",
        permanent: false,
      },
      {
        source: "/legal-agents/:path*",
        destination: "/legal/:path*",
        permanent: false,
      },
      {
        source: "/credit-hub/dealer/simulator",
        destination: "/credit-hub/dealer/preapproval",
        permanent: false,
      },
      {
        source: "/credit-hub/bank/queue",
        destination: "/credit-hub/bank/applications",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendUrl = cleanBackendUrl(
      process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_RENDER_API_URL ||
        "https://nadakki-ai-suite.onrender.com",
    );
    return [
      {
        source: "/api/marketing/campaigns/launch-pilot",
        destination: `${backendUrl}/marketing/campaigns/launch-pilot`,
      },
      {
        source: "/api/campaigns/:path*",
        destination: `${backendUrl}/campaigns/:path*`,
      },
      {
        source: "/api/marketing/:path*",
        destination: `${backendUrl}/api/marketing/:path*`,
      },
      {
        source: "/analytics/:path*",
        destination: `${backendUrl}/analytics/:path*`,
      },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/metrics", destination: `${backendUrl}/metrics` },
      { source: "/cores", destination: `${backendUrl}/cores` },
      {
        source: "/api/v1/sic/:path*",
        destination: `${backendUrl}/api/v1/sic/:path*`,
      },
      {
        source: "/api/v1/auth/:path*",
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
      {
        source: "/api/v1/ame/:path*",
        destination: `${backendUrl}/api/v1/ame/:path*`,
      },
      {
        source: "/api/v1/advertising/:path*",
        destination: `${backendUrl}/api/v1/advertising/:path*`,
      },
      {
        source: "/api/v1/tenants/:path*",
        destination: `${backendUrl}/api/v1/tenants/:path*`,
      },
      {
        source: "/api/v1/ops/:path*",
        destination: `${backendUrl}/api/v1/ops/:path*`,
      },
      {
        source: "/api/v1/landing-readiness/:path*",
        destination: `${backendUrl}/api/v1/landing-readiness/:path*`,
      },
      {
        source: "/api/v1/system/:path*",
        destination: `${backendUrl}/api/v1/system/:path*`,
      },
      {
        source: "/api/v2/sic-mt/:path*",
        destination: `${backendUrl}/api/v2/sic-mt/:path*`,
      },
      {
        source: "/api/v2/credit/:path*",
        destination: `${backendUrl}/api/v2/credit/:path*`,
      },
      {
        source: "/api/v1/google-ads/:path*",
        destination: `${backendUrl}/api/v1/google-ads/:path*`,
      },
      {
        source: "/api/v1/knowledge-pipeline/:path*",
        destination: `${backendUrl}/api/v1/knowledge-pipeline/:path*`,
      },
      { source: "/api/ops/:path*", destination: "/api/v1/ops/:path*" },
      {
        source: "/api/v1/whatsapp/:path*",
        destination: `${backendUrl}/api/v1/whatsapp/:path*`,
      },
      {
        source: "/api/v1/offers/:path*",
        destination: `${backendUrl}/api/v1/offers/:path*`,
      },
      {
        source: "/api/social/:path*",
        destination: `${backendUrl}/api/social/:path*`,
      },
      {
        source: "/api/legal/:path*",
        destination: `${backendUrl}/api/v1/legal/:path*`,
      },
    ];
  },
};
module.exports = withPWA(nextConfig);
