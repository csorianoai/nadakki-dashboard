const isProd = process.env.VERCEL_ENV === 'production';
const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://baylara.com';

export default function robots() {
  if (!isProd) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return { rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }], sitemap: `${base}/sitemap.xml` };
}
