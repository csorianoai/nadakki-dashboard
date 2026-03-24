/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_RENDER_API_URL ||
      "https://nadakki-ai-suite.onrender.com"
    ).replace(/\/$/, "");
    return [
      { source: "/api/marketing/:path*", destination: `${backendUrl}/api/marketing/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/cores", destination: `${backendUrl}/cores` },
      { source: "/api/v1/sic/:path*", destination: `${backendUrl}/api/v1/sic/:path*` },
      { source: "/api/v1/auth/:path*", destination: `${backendUrl}/api/v1/auth/:path*` },
      { source: "/api/v1/ame/:path*", destination: `${backendUrl}/api/v1/ame/:path*` },
      { source: "/api/v1/advertising/:path*", destination: `${backendUrl}/api/v1/advertising/:path*` },
    ];
  },
};
module.exports = nextConfig;
