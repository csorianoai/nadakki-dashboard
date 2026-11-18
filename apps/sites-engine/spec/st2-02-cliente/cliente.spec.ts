import { describe, expect, it } from 'vitest';
import { CoreError, createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';

const TOKEN = 'tok-solo-lectura-sintetico';
const fake = () => {
  const f = createFakeCore();
  return { f, client: createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: TOKEN, fetch: f.fetch }) };
};
async function err(p: Promise<unknown>): Promise<CoreError> {
  try { await p; } catch (e) { expect(e).toBeInstanceOf(CoreError); return e as CoreError; }
  throw new Error('no lanzo');
}

describe('ST2-02 cliente tipado del core', () => {
  it('[positivo] manifiesto y pagina de A validan, se tipan, y el 304 reutiliza la copia', async () => {
    const { f, client } = fake();
    expect((await client.resolveHost(SITE_A.host)).site_id).toBe(SITE_A.id);
    const m = await client.getManifest(SITE_A.id);
    expect(m.name.es).toBe(SITE_A.manifest.name.es);
    expect((await client.getPage(SITE_A.id, 'about')).page_key).toBe('about');
    expect(await client.getManifest(SITE_A.id)).toEqual(m);
    const last = f.calls[f.calls.length - 1];
    expect([last.status, last.method, last.headers.authorization]).toEqual([304, 'GET', `Bearer ${TOKEN}`]);
    expect(last.tags).toEqual([`site:${SITE_A.id}`]);
  });

  it('[negativo] 404 HOST_NOT_FOUND, 410 SITE_UNPUBLISHED, 429 con Retry-After, 500 -> UNAVAILABLE', async () => {
    const { f, client } = fake();
    expect((await err(client.resolveHost('desconocido.example'))).code).toBe('HOST_NOT_FOUND');
    f.queue('/manifest', 410, { code: 'SITE_UNPUBLISHED' });
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('SITE_UNPUBLISHED');
    f.queue('/manifest', 429, { code: 'RATE_LIMITED' }, { 'retry-after': '7' });
    expect((await err(client.getManifest(SITE_A.id))).retryAfter).toBe(7);
    f.queue('/manifest', 500, { code: 'X', detail: 'stack SECRETO' });
    const e = await err(client.getManifest(SITE_A.id));
    expect(e.code).toBe('UNAVAILABLE');
    expect(`${e.message}${JSON.stringify(e)}`).not.toContain('SECRETO');
  });

  it('[negativo] tenant_id o storage_key en la respuesta -> CONTRACT_VIOLATION', async () => {
    const { f, client } = fake();
    f.mutate('/manifest', (b) => ({ ...b, tenant_id: '00000000-0000-4000-8000-0000000000a1' }));
    expect((await err(client.getManifest(SITE_A.id))).code).toBe('CONTRACT_VIOLATION');
    f.mutate('/media/', (b) => ({ ...b, storage_key: 'tenant/x/0001.webp' }));
    expect((await err(client.getMedia(SITE_A.id, SITE_A.media[0].id))).code).toBe('CONTRACT_VIOLATION');
  });

  it('[tenant-ajeno] B nunca devuelve datos de A, el ETag de A no viaja a B y no se envia tenant', async () => {
    const { f, client } = fake();
    const a = await client.getManifest(SITE_A.id);
    const b = await client.getManifest(SITE_B.id);
    expect(b.name.es).not.toBe(a.name.es);
    expect(JSON.stringify(b)).not.toContain(SITE_A.id);
    expect(f.calls[1].headers['if-none-match']).toBeUndefined();
    expect((await err(client.getListing(SITE_B.id, SITE_A.listings[0].slug))).code).toBe('NOT_FOUND');
    for (const c of f.calls) {
      expect(c.hasBody).toBe(false);
      expect(c.url.toLowerCase() + JSON.stringify(c.headers)).not.toContain('tenant');
    }
  });
});
