import { describe, expect, it } from 'vitest';
import { CoreError, collectAll, createCoreClient, createCoreClientFromEnv } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';

const TOKEN = 'tok-solo-lectura-sintetico';
const BASE = 'https://core.test/api/v1/sites';
const fake = () => {
  const f = createFakeCore();
  return { f, client: createCoreClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch }) };
};
async function err(p: Promise<unknown>): Promise<CoreError> {
  try { await p; } catch (e) { expect(e).toBeInstanceOf(CoreError); return e as CoreError; }
  throw new Error('no lanzo');
}

describe('ST2-02 cliente: bordes (PARTE 2/2)', () => {
  it('[positivo] cada operacion declara su etiqueta de cache con el formato fijado', async () => {
    const { f, client } = fake();
    const id = SITE_A.id;
    await client.resolveHost(SITE_A.host);
    await client.getPage(id, 'about');
    await client.getListing(id, SITE_A.listings[0].slug);
    await client.getDevelopment(id, SITE_A.developments[0].slug);
    await client.getZone(id, SITE_A.zones[0].slug);
    await client.getBuilding(id, SITE_A.buildings[0].slug);
    await client.getMedia(id, SITE_A.media[0].id);
    expect(f.calls.map((c) => c.tags)).toEqual([
      [`host:${SITE_A.host}`],
      [`site:${id}`, `site:${id}:page:about`],
      [`site:${id}`, `site:${id}:listing:${SITE_A.listings[0].slug}`],
      [`site:${id}`, `site:${id}:development:${SITE_A.developments[0].slug}`],
      [`site:${id}`, `site:${id}:zone:${SITE_A.zones[0].slug}`],
      [`site:${id}`, `site:${id}:building:${SITE_A.buildings[0].slug}`],
      [`site:${id}`, `site:${id}:media`],
    ]);
    for (const c of f.calls) expect(c.method).toBe('GET');
  });

  it('[positivo] las listas devuelven items tipados y collectAll recorre cursores con tope', async () => {
    const { f, client } = fake();
    f.paginate(1);
    const first = await client.listListings(SITE_A.id, { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.next_cursor).toBe('1');
    const all = await collectAll((cursor) => client.listListings(SITE_A.id, { limit: 1, cursor }));
    expect(all.items.map((l) => l.slug)).toEqual(SITE_A.listings.map((l) => l.slug));
    expect(all.truncated).toBe(false);
    const capped = await collectAll((cursor) => client.listListings(SITE_A.id, { limit: 1, cursor }), { maxItems: 1 });
    expect([capped.items.length, capped.truncated]).toEqual([1, true]);
    const pages = await collectAll((cursor) => client.listListings(SITE_A.id, { limit: 1, cursor }), { maxPages: 1 });
    expect([pages.items.length, pages.truncated]).toEqual([1, true]);
    expect((await client.listZones(SITE_A.id)).items[0].slug).toBe(SITE_A.zones[0].slug);
    expect((await client.listDevelopments(SITE_A.id)).items).toHaveLength(1);
    expect((await client.listBuildings(SITE_A.id)).items).toHaveLength(1);
  });

  it('[negativo] collectAll corta un cursor repetido como CONTRACT_VIOLATION', async () => {
    const looping = async () => ({ items: [1], next_cursor: 'x' });
    expect((await err(collectAll(looping))).code).toBe('CONTRACT_VIOLATION');
  });

  it('[negativo] parametros invalidos se rechazan antes de la red', async () => {
    const { f, client } = fake();
    const cases: Promise<unknown>[] = [
      client.getManifest('no-es-uuid'),
      client.getPage(SITE_A.id, '../etc'),
      client.getListing(SITE_A.id, 'Slug Malo'),
      client.getMedia(SITE_A.id, 'x'),
      client.resolveHost('no es host'),
      client.listListings(SITE_A.id, { limit: 201 }),
      client.listListings(SITE_A.id, { limit: 0 }),
      client.listListings(SITE_A.id, { cursor: 'x'.repeat(513) }),
      client.listListings(SITE_A.id, { zone: 'Zona Mala' }),
      client.listListings(SITE_A.id, { updated_since: 'ayer' }),
    ];
    for (const c of cases) expect((await err(c)).code).toBe('VALIDATION_ERROR');
    expect(f.calls).toHaveLength(0);
  });

  it('[negativo] 401, 403 y 422 mapean a su code estable; code desconocido cae al status', async () => {
    const { f, client } = fake();
    for (const [status, code] of [[401, 'UNAUTHENTICATED'], [403, 'FORBIDDEN'], [422, 'VALIDATION_ERROR']] as const) {
      f.queue('/manifest', status, { code });
      const e = await err(client.getManifest(SITE_A.id));
      expect([e.code, e.status]).toEqual([code, status]);
    }
    f.queue('/manifest', 403, { code: 'INVENTADO' });
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('FORBIDDEN');
    f.queue('/manifest', 418, { code: 'INVENTADO' });
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('UNAVAILABLE');
  });

  it('[negativo] 429 sin Retry-After valido deja retryAfter indefinido', async () => {
    const { f, client } = fake();
    f.queue('/manifest', 429, { code: 'RATE_LIMITED' });
    expect((await err(client.getManifest(SITE_A.id))).retryAfter).toBeUndefined();
    f.queue('/manifest', 429, { code: 'RATE_LIMITED' }, { 'retry-after': 'pronto' });
    expect((await err(client.getManifest(SITE_A.id))).retryAfter).toBeUndefined();
  });

  it('[negativo] red caida y timeout -> UNAVAILABLE sin detalle interno', async () => {
    const { f, client } = fake();
    f.queueThrow('/manifest', new Error('ECONNREFUSED 10.0.0.9:5432 secreto-interno'));
    const e = await err(client.getManifest(SITE_A.id));
    expect(e.code).toBe('UNAVAILABLE');
    expect(`${e.message}${JSON.stringify(e)}`).not.toContain('secreto-interno');
    const slow = createCoreClient({ baseUrl: BASE, token: TOKEN, fetch: f.hangingFetch, timeoutMs: 20 });
    expect((await err(slow.getManifest(SITE_A.id))).code).toBe('UNAVAILABLE');
    expect(createCoreClient({ baseUrl: BASE, token: TOKEN, fetch: f.fetch }).timeoutMs).toBe(3000);
  });

  it('[negativo] campos no declarados, tenant_id anidado o cuerpo no JSON -> CONTRACT_VIOLATION', async () => {
    const { f, client } = fake();
    f.mutate('/manifest', (b) => ({ ...b, campo_extra: 1 }));
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
    f.mutate('/manifest', (b) => ({ ...b, theme: { primary: '#000', interno: { tenant_id: 'x' } } }));
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
    f.mutate('/manifest', (b) => Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'site_id')));
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
    f.mutate('/listings', (b) => ({ ...b, items: [{ slug: 'x', tenant_id: 't' }] }));
    expect((await err(client.listListings(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
    const garbage = (async () => new Response('<html>', { status: 200 })) as typeof fetch;
    const c2 = createCoreClient({ baseUrl: BASE, token: TOKEN, fetch: garbage });
    expect((await err(c2.getManifest(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
  });

  it('[negativo] createCoreClientFromEnv exige URL y token, y no los filtra en el error', async () => {
    const { f } = fake();
    for (const env of [{}, { SITES_CORE_URL: BASE }, { SITES_CORE_TOKEN: 'tok-secreto' }, { SITES_CORE_URL: 'ftp://x', SITES_CORE_TOKEN: 'tok-secreto' }]) {
      try { createCoreClientFromEnv(f.fetch, env); throw new Error('no lanzo'); } catch (e) {
        expect((e as CoreError).code).toBe('UNAVAILABLE');
        expect(`${(e as Error).message}${JSON.stringify(e)}`).not.toContain('tok-secreto');
      }
    }
    const ok = createCoreClientFromEnv(f.fetch, { SITES_CORE_URL: `${BASE}/`, SITES_CORE_TOKEN: TOKEN });
    expect((await ok.getManifest(SITE_A.id)).site_id).toBe(SITE_A.id);
    expect(f.calls[0].url.startsWith(`${BASE}/public/`)).toBe(true);
  });

  it('[tenant-ajeno] listas y detalle de B no mezclan datos de A, y la cache no cruza sitios', async () => {
    const { f, client } = fake();
    const la = await client.listListings(SITE_A.id);
    const lb = await client.listListings(SITE_B.id);
    expect(lb.items.map((l) => l.slug)).toEqual(SITE_B.listings.map((l) => l.slug));
    expect(JSON.stringify(lb)).not.toContain(SITE_A.listings[0].slug);
    expect(la.items).toHaveLength(SITE_A.listings.length);
    expect(f.calls[1].headers['if-none-match']).toBeUndefined();
    expect((await err(client.getZone(SITE_B.id, SITE_A.zones[0].slug))).code).toBe('NOT_FOUND');
    expect((await err(client.getMedia(SITE_B.id, SITE_A.media[0].id))).code).toBe('NOT_FOUND');
    await client.listListings(SITE_A.id);
    expect(f.calls[f.calls.length - 1].status).toBe(304);
    for (const c of f.calls) {
      expect(c.hasBody).toBe(false);
      expect(Object.keys(c.headers).join(',').toLowerCase()).not.toContain('tenant');
      expect(new URL(c.url).searchParams.has('tenant_id')).toBe(false);
    }
  });
});
