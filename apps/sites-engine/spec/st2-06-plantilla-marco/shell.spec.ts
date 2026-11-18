import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import type { Manifest } from '@/core/types';
import { renderSite } from '@/render/site';
import { getTemplate } from '@/templates';
import { Shell } from '@/templates/baylara/shell';

const FORBIDDEN = /vercel|cloudflare|\br2\b|cloudinary|amazonaws/i;
const A: Manifest = { ...SITE_A.manifest, contact: { phone: '+13055550101', whatsapp: '+13055550102', email: 'hola@synth1.invalid' },
  theme: { navy: '#112233' } };
const route = (m: Manifest, key: string) => m.routes.find((r) => r.key === key)!;
const shell = (m: Manifest, lang: 'es' | 'en', key = 'about') =>
  renderToStaticMarkup(createElement(Shell, { manifest: m, lang, route: route(m, key) }, createElement('p', null, 'cuerpo')));

async function site(id: string, slug: string[]) {
  const f = createFakeCore();
  const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
  const out = await renderSite(c, id, slug);
  if (out.kind !== 'ok') throw new Error('no ok');
  return renderToStaticMarkup(out.element);
}

describe('ST2-06 shell de Baylara por manifiesto', () => {
  it('[positivo] cabecera, menu, selector de idioma y barra fija salen del manifiesto (rutas por slug)', () => {
    const h = shell(A, 'es');
    expect(h).toContain('SYNTH Realty');
    expect(h).toContain('href="/sobre-mi"');
    expect(h).toContain('href="/en/about"'); // selector: mismo destino en el otro idioma
    expect(h).toContain('class="stickybar"');
    expect(h).toContain('wa.me/13055550102');
    expect(h).toContain('cuerpo');
    expect(h).toContain('SYNTH Brokerage 1 LLC'); // utility bar con la correduria
    expect(h).not.toMatch(FORBIDDEN);
  });

  it('[positivo] la plantilla baylara@1 esta registrada y el sitio sale con shell + bloques legales del renderizador', async () => {
    expect(getTemplate('baylara', 1)).toBeTypeOf('function');
    const html = await site(SITE_A.id, ['sobre-mi']);
    expect(html).toContain('Equal Housing Opportunity');
  });

  it('[negativo] sin contacto en el manifiesto no se pintan enlaces vacios y el shell no rompe', () => {
    const h = shell({ ...A, contact: {} }, 'en');
    expect(h).not.toContain('wa.me');
    expect(h).not.toContain('tel:');
    expect(h).toContain('lang="en"');
  });

  it('[negativo] texto del manifiesto se escapa (nada ejecutable en el shell)', () => {
    const h = shell({ ...A, name: { es: '<script>x</script>', en: 'x' } }, 'es');
    expect(h).not.toContain('<script>');
  });

  it('[tenant-ajeno] el shell de A no contiene nada de B (nombre, correduria, licencia, hosts)', async () => {
    const h = shell(A, 'es') + (await site(SITE_A.id, []).catch(() => ''));
    for (const s of ['Estates Otra Marca', 'SYNTH Brokerage 2', 'SYNTH-0002', 'synth-estates', 'otro-loft-01']) expect(h).not.toContain(s);
    expect(shell(SITE_B.manifest, 'es')).not.toContain('SYNTH-0001');
  });
});
