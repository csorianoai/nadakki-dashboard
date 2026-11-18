import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import type { PublicMedia } from '@/core/types';
import { Media, allowedMediaUrl } from '@/templates/baylara/media';

const HOSTS = ['https://cdn.nadakki.example'];
const base = SITE_A.media[0];
const html = (m: PublicMedia, o: Partial<Parameters<typeof Media>[0]> = {}) =>
  renderToStaticMarkup(createElement(Media, { m, lang: 'es', hosts: HOSTS, ...o }));
const FORBIDDEN = /vercel|cloudflare|\br2\b|cloudinary|amazonaws/i;

describe('ST2-06 medios', () => {
  it('[positivo] <picture> con source avif y webp, srcset por ancho, img con width/height y alt[lang]', () => {
    const h = html(base);
    expect(h).toContain('<picture>');
    expect(h).toMatch(/<source type="image\/avif" srcSet="[^"]*0001-1600\.avif 1600w"/i);
    expect(h).toMatch(/<source type="image\/webp" srcSet="[^"]*0001-800\.webp 800w"/i);
    expect(h).toContain('width="1600"');
    expect(h).toContain('height="900"');
    expect(h).toContain('alt="Sala con vista"');
    expect(html(base, { lang: 'en' })).toContain('alt="Living room with view"');
    expect(h).not.toMatch(FORBIDDEN);
  });

  it('[positivo] prioridad: eager + fetchpriority=high; sin prioridad: lazy', () => {
    expect(html(base, { priority: true })).toMatch(/loading="eager"/);
    expect(html(base, { priority: true })).toMatch(/fetchPriority="high"/i);
    expect(html(base)).toMatch(/loading="lazy"/);
    expect(html(base)).not.toMatch(/fetchpriority/i);
  });

  it('[positivo] el credito solo aparece donde se pide (credit=true) y por defecto no se ve', () => {
    expect(html(base)).not.toContain('Propietario');
    expect(html(base, { credit: true })).toContain('Propietario');
  });

  it('[negativo] URL fuera de SITES_MEDIA_HOSTS, http o con credenciales no se pinta', () => {
    const bad = (url: string): PublicMedia => ({ ...base, variants: [{ width: 800, format: 'webp', url }] });
    for (const u of ['https://evil.example/a.webp', 'http://cdn.nadakki.example/a.webp', 'https://u:p@cdn.nadakki.example/a.webp', 'javascript:alert(1)'])
      expect(html(bad(u))).toBe('');
    expect(allowedMediaUrl('https://cdn.nadakki.example/x.webp', HOSTS)).toBe(true);
    expect(allowedMediaUrl('https://cdn.nadakki.example.evil.test/x.webp', HOSTS)).toBe(false);
    expect(html(base, { hosts: [] })).toBe(''); // sin hosts configurados: cerrado
  });

  it('[negativo] sin alt ES/EN no se pinta; variantes permitidas se mantienen y las ajenas se descartan', () => {
    expect(html({ ...base, alt: { es: '', en: 'x' } })).toBe('');
    const mixed: PublicMedia = { ...base, variants: [...base.variants, { width: 400, format: 'webp', url: 'https://evil.example/z.webp' }] };
    expect(html(mixed)).not.toContain('evil.example');
    expect(html(mixed)).toContain('0001-800.webp');
  });

  it('[tenant-ajeno] el medio de B nunca sale en el HTML del medio de A', () => {
    const h = html(base);
    expect(h).not.toContain('synth2');
    expect(html(SITE_B.media[0])).toContain('synth2');
    expect(html(SITE_B.media[0])).not.toContain('synth1');
  });
});
