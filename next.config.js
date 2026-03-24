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
        source: "/api/v1/sic/:path*",
        destination: `${backendUrl}/api/v1/sic/:path*`,
      },
      {
        source: "/api/v1/auth/:path*",
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
