import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import { renderSite } from '@/render/site';
import { BLOCK_TYPES } from '@/templates/baylara/registry';

const schema = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/templates/baylara/blocks.schema.json'), 'utf8'));
const ajv = new Ajv2020({ strict: false });
ajv.addSchema(schema);
const check = (def: string, data: unknown) => ajv.getSchema(`${schema.$id}#/$defs/${def}`)!(data);

const HERO = { title: { es: 'Bienvenidos', en: 'Welcome' }, subtitle: { es: 'Su hogar en Miami', en: 'Your Miami home' }, cta: { label: { es: 'Contactar', en: 'Get in touch' }, route: 'about' } };
const CTA = { title: { es: 'Hablemos', en: "Let's talk" }, button: { label: { es: 'Escribir', en: 'Write' }, route: 'about' } };
const body = (type: string, data: unknown) => [{ block_id: 'b1', type, data }];

async function page(blocks: unknown[], siteId = SITE_A.id, segs = ['sobre-mi']) {
  const f = createFakeCore();
  f.mutate('/manifest', (b) => ({ ...b, template: { id: 'baylara', version: 1 } }));
  f.mutate('/pages/about', (b) => ({ ...b, body: blocks }));
  const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
  return renderSite(c, siteId, segs);
}
const html = (o: Awaited<ReturnType<typeof page>>) => { if (o.kind !== 'ok') throw new Error(o.kind); return renderToStaticMarkup(o.element); };

describe('ST2-07 registro de bloques tipo -> componente', () => {
  it('[positivo] cada tipo registrado tiene su esquema en blocks.schema.json y valida su muestra sintetica', () => {
    expect(BLOCK_TYPES).toEqual(expect.arrayContaining(['baylara.hero', 'baylara.cta', 'text']));
    expect(check('block_baylara_hero', HERO)).toBe(true);
    expect(check('block_baylara_cta', CTA)).toBe(true);
    expect(check('block_text', { text: 'hola' })).toBe(true);
  });

  it('[positivo] hero y cta se pintan en es y en; el enlace sale del manifiesto (slug por idioma)', async () => {
    const blocks = [{ block_id: 'h', type: 'baylara.hero', data: HERO }, { block_id: 'c', type: 'baylara.cta', data: CTA }];
    const es = html(await page(blocks));
    expect(es).toContain('Bienvenidos');
    expect(es).toContain('href="/sobre-mi"');
    const en = html(await page(blocks, SITE_A.id, ['en', 'about']));
    expect(en).toContain('Welcome');
    expect(en).toContain('href="/en/about"');
    expect(en).not.toContain('Bienvenidos');
  });

  it('[negativo] un tipo no registrado falla cerrado (no se pinta a medias)', async () => {
    const o = await page([{ block_id: 'a', type: 'baylara.hero', data: HERO }, { block_id: 'b', type: 'baylara.inventado', data: {} }]);
    expect(o.kind).toBe('error');
  });

  it('[negativo] contenido sin "es" o con enlace a una ruta inexistente se rechaza', async () => {
    expect(check('block_baylara_hero', { title: { en: 'Only en' } })).toBe(false);
    expect((await page(body('baylara.hero', { title: { en: 'Only en' } }))).kind).toBe('error');
    expect((await page(body('baylara.cta', { ...CTA, button: { label: CTA.button.label, route: 'no-existe' } }))).kind).toBe('error');
    expect((await page(body('baylara.hero', { ...HERO, extra: 1 }))).kind).toBe('error');
  });

  it('[tenant-ajeno] una ficha del sitio B no se resuelve desde el sitio A aunque el slug llegue por la URL', async () => {
    const f = createFakeCore();
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    expect((await renderSite(c, SITE_A.id, ['otro-loft-01'])).kind).toBe('not_found');
    expect((await renderSite(c, SITE_B.id, ['otro-loft-01'])).kind).toBe('ok');
    expect((await renderSite(c, SITE_B.id, ['synth-condo-01'])).kind).toBe('not_found');
  });
});
