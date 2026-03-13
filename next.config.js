/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_NADAKKI_API_BASE || "http://127.0.0.1:8000";
    return [
      // SIC module — proxy /api/v1/sic/* to backend /sic/*
      {
        source: "/api/v1/sic/:path*",
        destination: `${backendUrl}/sic/:path*`,
      },
      // SIC auth — proxy /api/v1/auth/* to backend /auth/*
      {
        source: "/api/v1/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
