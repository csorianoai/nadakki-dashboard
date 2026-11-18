import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import { renderSite } from '@/render/site';

function client(body: unknown[]) {
  const f = createFakeCore();
  f.mutate('/manifest', (b) => ({ ...b, template: { id: 'baylara', version: 1 } }));
  f.mutate('/pages/about', (b) => ({ ...b, body }));
  return { f, c: createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch }) };
}
const page = (siteId: string, segs: string[], body: unknown[]) => renderSite(client(body).c, siteId, segs);
async function html(siteId: string, segs: string[], body: unknown[]) {
  const o = await page(siteId, segs, body);
  if (o.kind !== 'ok') throw new Error(o.kind);
  return renderToStaticMarkup(o.element);
}
const SECTION = { block_id: 's1', type: 'baylara.section', data: { eyebrow: { es: 'Servicio', en: 'Service' }, title: { es: 'Vender con datos', en: 'Sell with data' }, paragraphs: [{ es: 'Primer parrafo sintetico', en: 'First synthetic paragraph' }, { es: 'Segundo parrafo' }] } };
const STEPS = { block_id: 'p1', type: 'baylara.steps', data: { items: [{ title: { es: 'Valoracion', en: 'Valuation' }, body: { es: 'Analizamos', en: 'We analyse' } }, { title: { es: 'Plan' }, body: { es: 'Definimos' } }] } };
const STATS = { block_id: 'k1', type: 'baylara.stats', data: { items: [{ value: '24 h', label: { es: 'Respuesta', en: 'Response' }, source: 'Dato sintetico', date: '2026-01' }] } };

describe('ST2-07 bloques de seccion, pasos y cifras', () => {
  it('[positivo] seccion, pasos y cifras en es y en (fallback a es si falta en)', async () => {
    const es = await html(SITE_A.id, ['sobre-mi'], [SECTION, STEPS, STATS]);
    expect(es).toContain('data-block="baylara.section"');
    expect(es).toContain('Vender con datos');
    expect(es).toContain('Primer parrafo sintetico');
    expect(es).toContain('<ol');
    expect(es).toContain('01');
    expect(es).toContain('24 h');
    expect(es).toContain('Dato sintetico');
    const en = await html(SITE_A.id, ['en', 'about'], [SECTION, STEPS, STATS]);
    expect(en).toContain('Sell with data');
    expect(en).toContain('Segundo parrafo');
    expect(en).toContain('We analyse');
    expect(en).toContain('Response');
  });

  it('[negativo] datos fuera de esquema o contenido sin es -> error cerrado', async () => {
    const bad = (type: string, data: unknown) => page(SITE_A.id, ['sobre-mi'], [{ block_id: 'x', type, data }]);
    expect((await bad('baylara.section', { title: { en: 'solo en' } })).kind).toBe('error');
    expect((await bad('baylara.section', { title: { es: 'ok' }, paragraphs: 'texto' })).kind).toBe('error');
    expect((await bad('baylara.steps', { items: [] })).kind).toBe('error');
    expect((await bad('baylara.steps', { items: [{ title: { es: 'a' } }] })).kind).toBe('error');
    expect((await bad('baylara.stats', { items: [{ value: 5, label: { es: 'x' } }] })).kind).toBe('error');
    expect((await bad('baylara.stats', { items: [{ value: '1', label: { es: 'x' }, extra: 1 }] })).kind).toBe('error');
  });

  it('[tenant-ajeno] el texto del sitio B no aparece en el sitio A y cada sitio pide solo su id', async () => {
    const a = await html(SITE_A.id, ['sobre-mi'], [SECTION]);
    expect(a).not.toContain('otro-loft-01');
    const { f, c } = client([SECTION]);
    await renderSite(c, SITE_B.id, ['sobre-mi']);
    expect(f.calls.every((x) => !x.url.includes(SITE_A.id))).toBe(true);
  });
});
