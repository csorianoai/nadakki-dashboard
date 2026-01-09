/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para SaaS Multi-tenant
  output: 'standalone',
  
  // Deshabilitar prerender para páginas tenant-specific
  experimental: {
    // Evitar errores por falta de suspense
    missingSuspenseWithCSRBailout: false,
  },
  
  // Configuración de build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers para multi-tenant
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Tenant-ID',
            value: 'default',
          },
        ],
      },
    ];
  },
  
  // Redirecciones basadas en tenant
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'header',
            key: 'x-tenant-id',
            value: '(?<tenant>.*)',
          },
        ],
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
