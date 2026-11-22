import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore, type SynthSite } from '@/core/fixtures';
import type { Block, PublicPage } from '@/core/types';
import { renderSite } from '@/render/site';

const schema = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/templates/baylara/blocks.schema.json'), 'utf8'));
const ajv = new Ajv2020({ strict: false });
ajv.addSchema(schema);
const DEF: Record<string, string> = { text: 'block_text', 'baylara.hero': 'block_baylara_hero', 'baylara.section': 'block_baylara_section',
  'baylara.lead_form': 'block_baylara_lead_form', 'baylara.entity_list': 'block_baylara_entity_list' };
const valid = (b: Block) => ajv.getSchema(`${schema.$id}#/$defs/${DEF[b.type]}`)!(b.data ?? {});

// Las 17 claves de ruta de la plantilla (clave neutra, slug es, slug en). Los textos y slugs salen de este contenido sintetico, no del motor.
const KEYS: [string, string, string][] = [
  ['home', 'inicio', 'home'], ['listings', 'propiedades', 'properties'], ['developments', 'nuevos-desarrollos', 'new-developments'],
  ['buildings', 'edificios', 'buildings'], ['areas', 'zonas', 'areas'], ['international', 'compradores-internacionales', 'international-buyers'],
  ['sell', 'vender', 'sell'], ['market', 'mercado', 'market'], ['rentals', 'alquileres', 'rentals'], ['puntacana', 'punta-cana', 'punta-cana'],
  ['about', 'sobre-mi', 'about'], ['contact', 'contacto', 'contact'], ['privacy', 'privacidad', 'privacy'], ['terms', 'terminos', 'terms'],
  ['accessibility', 'accesibilidad', 'accessibility'], ['sent', 'mensaje-enviado', 'message-sent'], ['not_sent', 'mensaje-no-enviado', 'message-not-sent'],
];
const LISTS: Record<string, string> = { listings: 'listings', developments: 'developments', buildings: 'buildings', areas: 'zones' };
const FORM = { intent: 'consult', submit: { es: 'Enviar', en: 'Send' }, fields: [{ name: 'name', label: { es: 'Nombre', en: 'Name' } }],
  consent_email: { es: 'Acepto correos SYNTH', en: 'I accept SYNTH emails' }, privacy_route: 'privacy', privacy_label: { es: 'Privacidad', en: 'Privacy' } };

function body(key: string): Block[] {
  const b: Block[] = [{ block_id: 'h', type: 'baylara.hero', data: { title: { es: `Titulo ${key}`, en: `Title ${key}` } } },
    { block_id: 's', type: 'baylara.section', data: { title: { es: `Seccion ${key}`, en: `Section ${key}` }, paragraphs: [{ es: 'Parrafo es', en: 'Paragraph en' }] } }];
  if (LISTS[key]) b.push({ block_id: 'l', type: 'baylara.entity_list', data: { source: LISTS[key] } });
  if (key === 'contact') b.push({ block_id: 'f', type: 'baylara.lead_form', data: FORM });
  return b;
}

function site(base: SynthSite, tag: string): SynthSite {
  const when = '2026-11-07T15:00:00Z';
  const own = base.manifest.routes.filter((r) => r.kind !== 'page');
  const pages: PublicPage[] = KEYS.map(([k, es, en]) => ({ page_key: k, slug: { es, en }, title: { es: `${tag} ${k}`, en: `${tag} ${k} en` }, body: body(k) }));
  return { ...base, pages, manifest: { ...base.manifest, template: { id: 'baylara', version: 1 },
    routes: [...KEYS.map(([k, es, en]) => ({ kind: 'page' as const, key: k, slugs: { es, en }, lastmod: when })), ...own] } };
}
const A = site(SITE_A, 'A');
const B = site(SITE_B, 'B');
const client = () => createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: createFakeCore([A, B]).fetch });
async function html(siteId: string, segs: string[]) {
  const o = await renderSite(client(), siteId, segs);
  if (o.kind !== 'ok') throw new Error(`${o.kind} ${segs.join('/')}`);
  return renderToStaticMarkup(o.element);
}

describe('ST2-07 las 17 claves de ruta de la plantilla', () => {
  it('[positivo] cada clave se renderiza en es y en desde fixtures sinteticos y su contenido valida contra blocks.schema.json', async () => {
    expect(KEYS).toHaveLength(17);
    for (const [k, es, en] of KEYS) {
      for (const b of body(k)) expect(valid(b), `${k}/${b.type}`).toBe(true);
      const root = k === 'home'; // la home vive en la raiz de cada idioma (el slug del manifiesto no se usa)
      const hes = await html(A.id, root ? [] : [es]);
      expect(hes, k).toContain(`Titulo ${k}`);
      expect(hes, k).toContain('Parrafo es');
      const hen = await html(A.id, root ? ['en'] : ['en', en]);
      expect(hen, k).toContain(`Title ${k}`);
      expect(hen, k).toContain('Paragraph en');
      expect(hen, k).not.toContain(`Titulo ${k}`);
    }
  });

  it('[positivo] el formulario de contacto sin JS: POST nativo a /api/lead, honeypot, form_rendered_at vacio y ninguna Idempotency-Key', async () => {
    const h = await html(A.id, ['contacto']);
    expect(h).toContain('action="/api/lead" method="post"');
    expect(h).toContain('name="company_website"');
    expect(h).toContain('name="form_rendered_at"');
    expect(h).toContain('name="intent" value="consult"');
    expect(h.toLowerCase()).not.toContain('idempotency');
    expect(h).toContain('data-text-version');
  });

  it('[negativo] bloque de tipo no registrado -> error cerrado, sin pintar nada a medias', async () => {
    const f = createFakeCore([A, B]);
    f.mutate('/pages/sell', (p) => ({ ...p, body: [...(p.body as unknown[]), { block_id: 'x', type: 'baylara.video_hero', data: {} }] }));
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    expect((await renderSite(c, A.id, ['vender'])).kind).toBe('error');
  });

  it('[negativo] slug inexistente -> 404 y contenido sin "es" -> rechazado', async () => {
    expect((await renderSite(client(), A.id, ['no-existe'])).kind).toBe('not_found');
    const f = createFakeCore([A, B]);
    f.mutate('/pages/sell', (p) => ({ ...p, title: { en: 'Only en' } }));
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    await expect(renderSite(c, A.id, ['vender'])).rejects.toMatchObject({ code: 'CONTRACT_VIOLATION' });
  });

  it('[tenant-ajeno] las fichas y zonas del sitio B no se resuelven desde el sitio A; los listados no mezclan sitios', async () => {
    for (const slug of ['otro-loft-01', 'otro-barrio', 'otro-edificio', 'otra-torre']) {
      expect((await renderSite(client(), A.id, [slug])).kind, slug).toBe('not_found');
    }
    const lst = await html(A.id, ['propiedades']);
    expect(lst).toContain('synth-condo-01');
    expect(lst).not.toContain('otro-loft-01');
  });
});
