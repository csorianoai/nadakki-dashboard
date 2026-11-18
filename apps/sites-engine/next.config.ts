import type { NextConfig } from 'next';

// Cabeceras tomadas de baylara-web next.config.mjs:7-15. Este motor no fija cookies con dominio compartido.
const isProd = process.env.VERCEL_ENV === 'production' || (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: { '/s/[siteId]/fonts/[file]': ['./src/templates/baylara/fonts/*.woff2'] },
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    if (!isProd) base.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    return [{ source: '/:path*', headers: base }];
  },
};

export default nextConfig;
