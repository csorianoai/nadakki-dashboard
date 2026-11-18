import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import { robotsTxt, sitemapXml } from '@/render/seo';
import { FONT_FILES, fontFaceCss } from '@/templates/baylara/fonts';
import { themeCss } from '@/templates/baylara/theme';

const A = SITE_A.manifest;
const B = SITE_B.manifest;

describe('ST2-06 sitemap.xml y robots.txt por host', () => {
  it('[positivo] el sitemap usa el primary_host del manifiesto, con alternates por idioma y lastmod', () => {
    const x = sitemapXml(A);
    expect(x).toContain('<loc>https://www.synth-realty.example/</loc>'.replace('/</loc>', '/sobre-mi</loc>'));
    expect(x).toContain('hreflang="en" href="https://www.synth-realty.example/en/about"');
    expect(x).toContain('<lastmod>2026-11-07T15:00:00Z</lastmod>');
    expect(x).not.toContain('baylara.com');
  });

  it('[positivo] robots de produccion indexable: permite, bloquea /api/ y apunta al sitemap del host', () => {
    const r = robotsTxt(A, { vercelEnv: 'production' });
    expect(r).toContain('Allow: /');
    expect(r).toContain('Disallow: /api/');
    expect(r).toContain('Sitemap: https://www.synth-realty.example/sitemap.xml');
  });

  it('[negativo] fuera de produccion o no indexable: Disallow: / y sin sitemap', () => {
    expect(robotsTxt(A, { vercelEnv: 'preview' })).toBe('User-agent: *\nDisallow: /\n');
    expect(robotsTxt({ ...A, indexable: false }, { vercelEnv: 'production' })).toBe('User-agent: *\nDisallow: /\n');
  });

  it('[negativo] caracteres XML en slugs se escapan y un host con basura no entra', () => {
    const m = { ...A, hosts: [{ host: 'www.synth-realty.example', is_primary: true }], routes: [{ kind: 'page' as const, key: 'x', slugs: { es: 'a&b<c' }, lastmod: '2026-11-07T15:00:00Z' }] };
    const x = sitemapXml(m);
    expect(x).not.toContain('a&b<c');
    expect(x).toContain('a&amp;b&lt;c');
  });

  it('[tenant-ajeno] sitemap y robots de A no contienen host, slug ni correduria de B (y viceversa)', () => {
    const a = sitemapXml(A) + robotsTxt(A, { vercelEnv: 'production' });
    const b = sitemapXml(B) + robotsTxt(B, { vercelEnv: 'production' });
    expect(a).not.toContain('synth-estates');
    expect(a).not.toContain('SYNTH Brokerage 2');
    expect(b).not.toContain('synth-realty');
    expect(b).toContain('https://www.synth-estates.example/');
  });
});

describe('ST2-06 fuentes locales de la plantilla', () => {
  it('[positivo] Cormorant 500 y Manrope por @font-face same-origin con font-display swap', () => {
    const css = fontFaceCss();
    expect(css).toContain("font-family:'Cormorant Garamond'");
    expect(css).toContain('font-weight:500');
    expect(css).toContain("font-family:'Manrope'");
    expect(css).toContain('font-weight:400 700');
    expect(css).toContain('font-display:swap');
    expect(Object.keys(FONT_FILES).sort()).toEqual(['cormorant-garamond-latin-500-normal.woff2', 'manrope-latin-wght-normal.woff2']);
  });

  it('[negativo] el CSS de fuentes no referencia hosts externos', () => {
    expect(fontFaceCss()).not.toMatch(/https?:|googleapis|gstatic/i);
  });

  it('[tenant-ajeno] el CSS de tokens de A no cambia por los de B y las fuentes son comunes', () => {
    expect(themeCss(A.theme)).not.toContain(String(B.theme.primary));
    expect(fontFaceCss()).toBe(fontFaceCss());
  });
});
