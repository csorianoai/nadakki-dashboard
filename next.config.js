/** @type {import('next').NextConfig} */
function cleanBackendUrl(value) {
  const raw = (value || "").trim();
  const match = raw.match(/^(https?:\/\/.+?)(?=[A-Z_]+=|$)/);
  return (match ? match[1] : raw).replace(/\/$/, "");
}

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/legal-agents", destination: "/legal", permanent: false },
      { source: "/legal-agents/:path*", destination: "/legal/:path*", permanent: false },
      // P11-S0: legacy / audit URLs → canonical Credit Hub routes (no new pages)
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
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_RENDER_API_URL ||
      "http://127.0.0.1:8000"
    );
    return [
      {
        source: "/api/marketing/campaigns/launch-pilot",
        destination: `${backendUrl}/marketing/campaigns/launch-pilot`,
      },
      { source: "/api/campaigns/:path*", destination: `${backendUrl}/campaigns/:path*` },
      { source: "/api/marketing/:path*", destination: `${backendUrl}/api/marketing/:path*` },
      { source: "/analytics/:path*", destination: `${backendUrl}/analytics/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/metrics", destination: `${backendUrl}/metrics` },
      { source: "/cores", destination: `${backendUrl}/cores` },
      { source: "/api/v1/sic/:path*", destination: `${backendUrl}/api/v1/sic/:path*` },
      { source: "/api/v1/auth/:path*", destination: `${backendUrl}/api/v1/auth/:path*` },
      { source: "/api/v1/ame/:path*", destination: `${backendUrl}/api/v1/ame/:path*` },
      { source: "/api/v1/advertising/:path*", destination: `${backendUrl}/api/v1/advertising/:path*` },
      { source: "/api/v1/tenants/:path*", destination: `${backendUrl}/api/v1/tenants/:path*` },
      { source: "/api/v1/ops/:path*", destination: `${backendUrl}/api/v1/ops/:path*` },
      { source: "/api/v1/landing-readiness/:path*", destination: `${backendUrl}/api/v1/landing-readiness/:path*` },
      { source: "/api/v1/system/:path*", destination: `${backendUrl}/api/v1/system/:path*` },
      { source: "/api/v2/sic-mt/:path*", destination: `${backendUrl}/api/v2/sic-mt/:path*` },
      { source: "/api/v2/credit/:path*", destination: `${backendUrl}/api/v2/credit/:path*` },
      { source: "/api/v1/google-ads/:path*", destination: `${backendUrl}/api/v1/google-ads/:path*` },
      { source: "/api/v1/knowledge-pipeline/:path*", destination: `${backendUrl}/api/v1/knowledge-pipeline/:path*` },
      // Same-origin shorter alias → `/api/v1/ops/*` (client code prefers `/api/v1/ops/...` via rewrites + catch-all)
      { source: "/api/ops/:path*", destination: "/api/v1/ops/:path*" },
      { source: "/api/v1/whatsapp/:path*", destination: `${backendUrl}/api/v1/whatsapp/:path*` },
      { source: "/api/v1/offers/:path*", destination: `${backendUrl}/api/v1/offers/:path*` },
      // Social status + future same-origin calls to suite (dashboard uses API_URL for most fetches)
      { source: "/api/social/:path*", destination: `${backendUrl}/api/social/:path*` },
      // Legal Core (same-origin /api/legal → backend /api/v1/legal) — Worker L
      { source: "/api/legal/:path*", destination: `${backendUrl}/api/v1/legal/:path*` },
    ];
  },
};
module.exports = nextConfig;
