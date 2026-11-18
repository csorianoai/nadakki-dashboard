// sitemap.xml y robots.txt por host, desde el manifiesto (base = primary_host; no la fija de sitemap.js:4). Puro, sin Next.
import type { Manifest } from '@/core/types';
import { pathFor, primaryHost } from './site';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function sitemapXml(m: Manifest): string {
  const origin = `https://${primaryHost(m)}`;
  const urls = m.routes.flatMap((r) => m.languages.map((lang) => {
    const alts = m.languages.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(origin + pathFor(m, l, r))}"/>`).join('');
    return `<url><loc>${esc(origin + pathFor(m, lang, r))}</loc><lastmod>${esc(r.lastmod)}</lastmod>${alts}</url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
}

/** Misma politica que robots.js de Baylara: solo produccion indexable se abre; el resto, Disallow: /. */
export function robotsTxt(m: Manifest, env: { vercelEnv?: string }): string {
  if (!m.indexable || env.vercelEnv !== 'production') return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${primaryHost(m)}/sitemap.xml\n`;
}
