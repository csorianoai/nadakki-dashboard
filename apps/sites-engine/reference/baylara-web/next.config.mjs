/** @type {import('next').NextConfig} */
const isProd = process.env.VERCEL_ENV === 'production';

export default {
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    const h = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ];
    if (!isProd) h.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    return [{ source: '/:path*', headers: h }];
  }
};
