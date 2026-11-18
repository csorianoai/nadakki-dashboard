import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import { renderSite } from '@/render/site';

const EXTRA = [['zone', 'synth-district'], ['building', 'synth-building'], ['development', 'synth-tower'],
  ['zone', 'otro-barrio'], ['building', 'otro-edificio'], ['development', 'otra-torre']] as const;
// El manifiesto sintetico solo trae paginas y fichas de propiedad: se anaden aqui las rutas de zona/edificio/desarrollo del propio sitio.
function withEntities(b: Record<string, unknown>) {
  const own = (b.site_id === SITE_A.id ? EXTRA.slice(0, 3) : EXTRA.slice(3));
  const routes = [...(b.routes as unknown[]), ...own.map(([kind, key]) => ({ kind, key, slugs: { es: key }, lastmod: '2026-11-07T15:00:00Z' }))];
  return { ...b, routes, template: { id: 'baylara', version: 1 } };
}
function client() {
  const f = createFakeCore();
  f.mutate('/manifest', withEntities);
  return createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
}
async function html(siteId: string, segs: string[]) {
  const o = await renderSite(client(), siteId, segs);
  if (o.kind !== 'ok') throw new Error(o.kind);
  return renderToStaticMarkup(o.element);
}

describe('ST2-07 fichas de entidades (propiedad, desarrollo, zona, edificio)', () => {
  it('[positivo] ficha de propiedad en es y en: titulo, precio, caracteristicas y formulario con la propiedad de interes', async () => {
    const es = await html(SITE_A.id, ['synth-condo-01']);
    expect(es).toContain('Propiedad synth-condo-01');
    expect(es).toContain('450');
    expect(es).toContain('Vista al mar');
    expect(es).toContain('data-ficha="listing"');
    const en = await html(SITE_A.id, ['en', 'synth-condo-01']);
    expect(en).toContain('Property synth-condo-01');
    expect(en).not.toContain('Propiedad synth-condo-01');
  });

  it('[positivo] ficha de zona y de edificio muestran su fuente y fecha; la de desarrollo su nombre y precio desde', async () => {
    const z = await html(SITE_A.id, ['synth-district']);
    expect(z).toContain('data-ficha="zone"');
    expect(z).toContain('SYNTH Census');
    const b = await html(SITE_A.id, ['synth-building']);
    expect(b).toContain('data-ficha="building"');
    expect(b).toContain('SYNTH Registry');
    const d = await html(SITE_A.id, ['synth-tower']);
    expect(d).toContain('data-ficha="development"');
    expect(d).toContain('380');
  });

  it('[negativo] slug de ficha inexistente -> 404 y una ficha sin "es" en el titulo se rechaza (contrato)', async () => {
    expect((await renderSite(client(), SITE_A.id, ['no-existe'])).kind).toBe('not_found');
    const f = createFakeCore();
    f.mutate('/manifest', withEntities);
    f.mutate('/listings/synth-condo-01', (b) => ({ ...b, title: { en: 'Only en' } }));
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    await expect(renderSite(c, SITE_A.id, ['synth-condo-01'])).rejects.toMatchObject({ code: 'CONTRACT_VIOLATION' });
  });

  it('[tenant-ajeno] zona, edificio y desarrollo del sitio B no se resuelven desde el sitio A', async () => {
    for (const slug of ['otro-barrio', 'otro-edificio', 'otra-torre', 'otro-loft-01']) {
      expect((await renderSite(client(), SITE_A.id, [slug])).kind).toBe('not_found');
    }
    expect(await html(SITE_B.id, ['otro-barrio'])).toContain('data-ficha="zone"');
  });
});
