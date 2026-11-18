// Fixtures SINTETICOS (a partir de los ejemplos del contrato) y un fetch falso que sirve dos sitios y registra cada llamada.
// El core real no se llama nunca. Solo para pruebas y modo DEMO.
import type { Manifest, PublicBuilding, PublicDevelopment, PublicListing, PublicMedia, PublicPage, PublicZone } from '../types';

export interface SynthSite {
  id: string; host: string; manifest: Manifest; pages: PublicPage[]; listings: PublicListing[]; developments: PublicDevelopment[];
  zones: PublicZone[]; buildings: PublicBuilding[]; media: PublicMedia[];
}

function media(id: string, path: string): PublicMedia {
  const u = (n: string) => `https://cdn.nadakki.example/t/${path}/${n}`;
  return {
    id, width: 1600, height: 900, mime_type: 'image/webp', alt: { es: 'Sala con vista', en: 'Living room with view' }, credit: 'Propietario',
    variants: [{ width: 800, format: 'webp', url: u('0001-800.webp') }, { width: 1600, format: 'avif', url: u('0001-1600.avif') }],
  };
}

function build(o: { n: number; host: string; name: string; zone: string; listings: [string, string][]; dev: string; bld: string }): SynthSite {
  const id = `00000000-0000-4000-8000-0000000000b${o.n}`;
  const m = media(`00000000-0000-4000-8000-0000000000${o.n === 1 ? 'c' : 'd'}0`, `synth${o.n}`);
  const when = '2026-11-07T15:00:00Z';
  const listings: PublicListing[] = o.listings.map(([slug, price], i) => ({
    item_kind: 'property', slug, title: { es: `Propiedad ${slug}`, en: `Property ${slug}` }, features: [{ es: 'Vista al mar' }], featured: i === 0,
    price: { amount: price, currency: 'USD' }, zone_slug: o.zone, media: [m],
  }));
  return {
    id, host: o.host, media: [m], listings,
    manifest: {
      site_id: id, content_version: 3, generated_at: when, vertical: 'realestate', template: { id: 'realestate-agent-v1', version: 1 },
      name: { es: o.name, en: o.name }, languages: ['es', 'en'], default_language: 'es', theme: { primary: o.n === 1 ? '#0a3d62' : '#6a1b4d' },
      contact: { email: `hola@synth${o.n}.invalid` },
      legal: { brokerage_legal_name: `SYNTH Brokerage ${o.n} LLC`, agent_registered_last_name: `Synth${o.n}`, license_no: `SYNTH-000${o.n}` },
      hosts: [{ host: o.host, is_primary: true }], indexable: true, required_blocks: ['legal_brokerage', 'legal_eho', 'legal_privacy'],
      routes: [{ kind: 'page', key: 'privacy', slugs: { es: 'privacidad', en: 'privacy' }, lastmod: when },
        { kind: 'page', key: 'about', slugs: { es: 'sobre-mi', en: 'about' }, lastmod: when },
        ...listings.map((l) => ({ kind: 'listing' as const, key: l.slug, slugs: { es: l.slug }, lastmod: when }))],
      counts: { listings: listings.length },
    },
    pages: [{ page_key: 'about', slug: { es: 'sobre-mi', en: 'about' }, title: { es: `Sobre ${o.name}`, en: `About ${o.name}` }, body: [] }],
    developments: [{ slug: o.dev, name: o.dev.toUpperCase(), authorized: false, price_from: '380000', currency: 'USD', media: [m] }],
    zones: [{ slug: o.zone, name: { es: `Zona ${o.zone}`, en: `Zone ${o.zone}` }, source: 'SYNTH Census', source_date: '2026-01-15', photo: null }],
    buildings: [{ slug: o.bld, name: o.bld.toUpperCase(), data_source: 'SYNTH Registry', data_date: '2026-01-15', zone_slug: o.zone }],
  };
}

export const SITE_A = build({ n: 1, host: 'www.synth-realty.example', name: 'SYNTH Realty', zone: 'synth-district', dev: 'synth-tower', bld: 'synth-building',
  listings: [['synth-condo-01', '450000'], ['synth-condo-02', '520000']] });
export const SITE_B = build({ n: 2, host: 'www.synth-estates.example', name: 'Estates Otra Marca', zone: 'otro-barrio', dev: 'otra-torre', bld: 'otro-edificio',
  listings: [['otro-loft-01', '210000']] });

export interface FakeCall { url: string; method: string; headers: Record<string, string>; hasBody: boolean; tags: string[]; status: number }
type Body = Record<string, unknown>;
interface Queued { match: string; res?: Response; err?: Error }

function etagOf(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return `"${h.toString(16)}"`;
}

function problem(status: number, code: string, headers: Record<string, string> = {}): Response {
  const body = { type: 'about:blank', title: code, status, code };
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/problem+json', ...headers } });
}

/** Fetch falso: sirve los sitios A y B por el contrato, soporta ETag/304 y registra cada llamada. */
export function createFakeCore(sites: SynthSite[] = [SITE_A, SITE_B]) {
  const calls: FakeCall[] = [];
  const queued: Queued[] = [];
  const mutations = new Map<string, (b: Body) => Body>();
  let pageCap = Infinity;

  function route(url: URL): { status: number; body?: Body; code?: string } {
    const p = url.pathname.replace(/^.*\/sites/, '');
    if (p === '/public/resolve') {
      const s = sites.find((x) => x.host === url.searchParams.get('host'));
      if (!s) return { status: 404, code: 'HOST_NOT_FOUND' };
      const m = s.manifest;
      return { status: 200, body: { site_id: s.id, vertical: m.vertical, template_id: m.template.id, template_version: m.template.version, languages: m.languages,
        default_language: m.default_language, content_version: m.content_version, host: s.host, host_kind: 'custom', primary_host: s.host, state: 'serve', redirect: null } };
    }
    const mt = /^\/public\/([^/]+)\/(manifest|pages|listings|developments|zones|buildings|media)(?:\/([^/]+))?$/.exec(p);
    const s = mt && sites.find((x) => x.id === mt[1]);
    if (!mt || !s) return { status: 404, code: 'NOT_FOUND' };
    const [, , kind, key] = mt;
    if (kind === 'manifest') return { status: 200, body: s.manifest as unknown as Body };
    const coll = { pages: s.pages, listings: s.listings, developments: s.developments, zones: s.zones, buildings: s.buildings, media: s.media }[kind] as unknown as Body[];
    if (key) {
      const hit = coll.find((x) => (kind === 'pages' ? x.page_key : kind === 'media' ? x.id : x.slug) === key);
      return hit ? { status: 200, body: hit } : { status: 404, code: 'NOT_FOUND' };
    }
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), pageCap);
    const start = Number(url.searchParams.get('cursor') ?? 0);
    const items = coll.slice(start, start + limit);
    return { status: 200, body: { items, next_cursor: start + limit < coll.length ? String(start + limit) : null } };
  }

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => { headers[k] = v; });
    const call: FakeCall = { url: url.toString(), method: init?.method ?? 'GET', headers, hasBody: init?.body != null,
      tags: (init as { next?: { tags?: string[] } } | undefined)?.next?.tags ?? [], status: 0 };
    calls.push(call);
    const qi = queued.findIndex((q) => url.pathname.includes(q.match));
    if (qi >= 0) {
      const q = queued.splice(qi, 1)[0];
      if (q.err) { call.status = -1; throw q.err; }
      call.status = q.res!.status;
      return q.res!;
    }
    const r = route(url);
    if (r.status !== 200 || !r.body) { call.status = r.status; return problem(r.status, r.code!); }
    let body = r.body;
    for (const [m, fn] of mutations) if (url.pathname.includes(m)) body = fn(body);
    const text = JSON.stringify(body);
    const etag = etagOf(text);
    if (headers['if-none-match'] === etag) { call.status = 304; return new Response(null, { status: 304, headers: { etag } }); }
    call.status = 200;
    return new Response(text, { status: 200, headers: { 'content-type': 'application/json', etag, 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  };

  return {
    fetch, calls,
    /** Fuerza una respuesta de error unica para la proxima llamada cuya ruta contenga `match`. */
    queue(match: string, status: number, body: { code: string; detail?: string }, headers: Record<string, string> = {}) {
      queued.push({ match, res: new Response(JSON.stringify({ type: 'about:blank', title: body.code, status, ...body }), { status, headers: { 'content-type': 'application/problem+json', ...headers } }) });
    },
    queueThrow(match: string, err: Error) { queued.push({ match, err }); },
    /** Altera el cuerpo 200 de las rutas que contengan `match` (para simular violaciones del contrato). */
    mutate(match: string, fn: (b: Body) => Body) { mutations.set(match, fn); },
    paginate(size: number) { pageCap = size; },
    /** Fetch que nunca responde hasta que lo aborta el timeout. */
    hangingFetch: ((_i: unknown, init?: RequestInit) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new Error('aborted')));
    })) as typeof globalThis.fetch,
  };
}
