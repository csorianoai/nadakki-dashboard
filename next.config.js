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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.imagin.studio",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_CH_BUILD_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local").slice(0, 7),
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://nadakki-ai-suite.onrender.com https://*.sentry.io https://vitals.vercel-insights.com wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
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
        source: "/",
        has: [{ type: "host", value: "autos.nadakki.com" }],
        destination: "/autos/vehiculos",
        permanent: false,
      },
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
      // PR-LEGACY-1: legacy /credit/* -> modern /credit-hub/* (parity routes only).
      // permanent:false (temporary) while legacy pages still exist; KEEP_TEMPORARILY
      // routes (/credit/dealer/analytics, /credit/dealer/real, /credit, /credit/new,
      // /credit/dashboard, /credit/[id]/*) are intentionally NOT redirected.
      {
        source: "/credit/dealer/new",
        destination: "/credit-hub/dealer/applications/new",
        permanent: false,
      },
      {
        // Exclude KEEP_TEMPORARILY single-segment routes (analytics, real) and the
        // explicit /new rule above so they are not swallowed by the dynamic :id match.
        source: "/credit/dealer/:applicationId((?!analytics|real|new)[^/]+)",
        destination: "/credit-hub/dealer/applications/:applicationId",
        permanent: false,
      },
      {
        source: "/credit/dealer",
        destination: "/credit-hub/dealer",
        permanent: false,
      },
      {
        source: "/credit/bank/:applicationId",
        destination: "/credit-hub/bank/applications/:applicationId",
        permanent: false,
      },
      {
        source: "/credit/bank",
        destination: "/credit-hub/bank",
        permanent: false,
      },
      {
        source: "/credit/status/:applicationId",
        destination: "/credit-hub/dealer/applications/:applicationId",
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
      // Cap 11 routers (offers_router, dashboard_router) mount at /credit/*
      // without the /api/v2 prefix — proxy these to the backend.
      {
        source: "/credit/:path*",
        destination: `${backendUrl}/credit/:path*`,
      },
    ];
  },
};
module.exports = withPWA(nextConfig);
