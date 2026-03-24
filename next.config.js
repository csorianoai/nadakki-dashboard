/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com").replace(
      /\/$/,
      ""
    );
    return [
      {
        source: "/marketing/:path*",
        destination: `${backendUrl}/marketing/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/cores",
        destination: `${backendUrl}/cores`,
      },
      {
        source: "/api/v1/sic/:path*",
        destination: `${backendUrl}/api/v1/sic/:path*`,
      },
      {
        source: "/api/v1/auth/:path*",
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
      {
        source: "/api/catalog/:path*",
        destination: `${backendUrl}/api/catalog/:path*`,
      },
      {
        source: "/api/social/:path*",
        destination: `${backendUrl}/api/social/:path*`,
      },
      {
        source: "/api/journeys/:path*",
        destination: `${backendUrl}/api/journeys/:path*`,
      },
      {
        source: "/api/integrations/:path*",
        destination: `${backendUrl}/api/integrations/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${backendUrl}/api/webhooks/:path*`,
      },
      {
        source: "/api/marketing/:path*",
        destination: `${backendUrl}/api/marketing/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/workflows/:path*",
        destination: `${backendUrl}/workflows/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
