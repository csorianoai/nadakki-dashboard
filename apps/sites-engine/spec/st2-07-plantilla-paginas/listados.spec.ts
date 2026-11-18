import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import { renderSite } from '@/render/site';

const EXTRA = [['development', 'synth-tower'], ['development', 'otra-torre']] as const;
function client(data: Record<string, unknown>) {
  const f = createFakeCore();
  f.mutate('/manifest', (b) => {
    const own = b.site_id === SITE_A.id ? EXTRA.slice(0, 1) : EXTRA.slice(1);
    const routes = [...(b.routes as unknown[]), ...own.map(([kind, key]) => ({ kind, key, slugs: { es: key }, lastmod: '2026-11-07T15:00:00Z' }))];
    return { ...b, routes, template: { id: 'baylara', version: 1 } };
  });
  f.mutate('/pages/about', (b) => ({ ...b, body: [{ block_id: 'l1', type: 'baylara.entity_list', data }] }));
  return { f, c: createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch }) };
}
async function page(siteId: string, segs: string[], data: Record<string, unknown>) {
  const { c } = client(data);
  return renderSite(c, siteId, segs);
}
const html = async (siteId: string, segs: string[], data: Record<string, unknown>) => {
  const o = await page(siteId, segs, data);
  if (o.kind !== 'ok') throw new Error(o.kind);
  return renderToStaticMarkup(o.element);
};

describe('ST2-07 listados de entidades (ListingsBrowser / BuildingDirectory)', () => {
  it('[positivo] rejilla de propiedades en es y en: titulo, precio y enlace a la ficha por slug del idioma', async () => {
    const es = await html(SITE_A.id, ['sobre-mi'], { source: 'listings', title: { es: 'Propiedades', en: 'Properties' } });
    expect(es).toContain('data-list="listings"');
    expect(es).toContain('Propiedades');
    expect(es).toContain('Propiedad synth-condo-01');
    expect(es).toContain('$450,000');
    expect(es).toContain('href="/synth-condo-02"');
    const en = await html(SITE_A.id, ['en', 'about'], { source: 'listings', title: { es: 'Propiedades', en: 'Properties' } });
    expect(en).toContain('Property synth-condo-01');
    expect(en).toContain('href="/en/synth-condo-01"');
  });

  it('[positivo] desarrollos con precio desde y limite', async () => {
    const d = await html(SITE_A.id, ['sobre-mi'], { source: 'developments' });
    expect(d).toContain('data-list="developments"');
    expect(d).toContain('SYNTH-TOWER');
    expect(d).toContain('$380,000');
    const one = await html(SITE_A.id, ['sobre-mi'], { source: 'listings', limit: 1 });
    expect(one).toContain('synth-condo-01');
    expect(one).not.toContain('synth-condo-02');
  });

  it('[negativo] fuente desconocida o datos fuera de esquema -> error cerrado; entidad sin ruta en el manifiesto no se enlaza ni se pinta', async () => {
    expect((await page(SITE_A.id, ['sobre-mi'], { source: 'secrets' })).kind).toBe('error');
    expect((await page(SITE_A.id, ['sobre-mi'], { source: 'listings', limit: 9999 })).kind).toBe('error');
    expect((await page(SITE_A.id, ['sobre-mi'], { source: 'listings', extra: 1 })).kind).toBe('error');
    // las zonas del sintetico no tienen ruta en el manifiesto: lista vacia, sin enlaces
    const z = await html(SITE_A.id, ['sobre-mi'], { source: 'zones' });
    expect(z).not.toContain('Zona synth-district');
  });

  it('[tenant-ajeno] el listado del sitio A nunca muestra entidades del sitio B (y viceversa)', async () => {
    const a = await html(SITE_A.id, ['sobre-mi'], { source: 'listings' });
    expect(a).not.toContain('otro-loft-01');
    const { f, c } = client({ source: 'listings' });
    await renderSite(c, SITE_B.id, ['sobre-mi']);
    expect(f.calls.every((x) => !x.url.includes(SITE_A.id))).toBe(true);
    const b = await html(SITE_B.id, ['sobre-mi'], { source: 'listings' });
    expect(b).toContain('otro-loft-01');
    expect(b).not.toContain('synth-condo-01');
  });
});
