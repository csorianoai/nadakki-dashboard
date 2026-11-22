import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore, type SynthSite } from '@/core/fixtures';
import { createHandler, type Decision } from '@/proxy/handler';

const MARIA: SynthSite = { ...SITE_A, host: 'www.maria.example' };
const CLIENTE: SynthSite = { ...SITE_B, host: 'www.cliente.example' };

function setup(sites: SynthSite[] = [MARIA, CLIENTE]) {
  const f = createFakeCore(sites);
  const client = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
  let now = 1_000_000;
  const handle = createHandler({ client, now: () => now });
  const run = (url: string, host: string | null, extra: Record<string, string> = {}): Promise<Decision> => {
    const headers = new Headers(extra);
    if (host !== null) headers.set('host', host);
    return handle({ url, headers });
  };
  return { f, run, tick: (ms: number) => { now += ms; } };
}

describe('ST2-03 proxy host -> sitio', () => {
  it('[positivo] www.maria.example y www.cliente.example se reescriben a /s/<site_id>/ con path y query intactos', async () => {
    const { run } = setup();
    const a = await run('https://www.maria.example/es/propiedades?zona=norte&x=1', 'www.maria.example');
    expect(a).toMatchObject({ kind: 'rewrite', pathname: `/s/${MARIA.id}/es/propiedades`, search: '?zona=norte&x=1' });
    const b = await run('https://www.cliente.example/', 'WWW.Cliente.Example:443');
    expect(b).toMatchObject({ kind: 'rewrite', pathname: `/s/${CLIENTE.id}/`, search: '' });
  });

  it('[positivo] state=redirect responde 301 al primary_host conservando path y query', async () => {
    const { f, run } = setup();
    f.mutate('/public/resolve', (b) => ({ ...b, state: 'redirect', primary_host: 'www.nuevo.example', redirect: { to_host: 'www.nuevo.example', status: 301, until: '2027-01-01T00:00:00Z' } }));
    const d = await run('https://www.maria.example/es/a?b=2', 'www.maria.example');
    expect(d).toMatchObject({ kind: 'redirect', status: 301, location: 'https://www.nuevo.example/es/a?b=2' });
  });

  it('[positivo] la resolucion se cachea 60 s y vuelve a consultar al core despues', async () => {
    const { f, run, tick } = setup();
    await run('https://www.maria.example/', 'www.maria.example');
    await run('https://www.maria.example/otra', 'www.maria.example');
    expect(f.calls).toHaveLength(1);
    tick(61_000);
    await run('https://www.maria.example/', 'www.maria.example');
    expect(f.calls.length).toBeGreaterThan(1);
  });

  it('[negativo] host desconocido y SITE_UNPUBLISHED -> 404 identicos con max-age=30', async () => {
    const { f, run } = setup();
    const unknown = await run('https://nadie.example/', 'nadie.example');
    f.queue('/public/resolve', 404, { code: 'SITE_UNPUBLISHED' });
    const unpub = await run('https://www.maria.example/', 'www.maria.example');
    for (const d of [unknown, unpub]) {
      expect(d).toMatchObject({ kind: 'status', status: 404 });
      expect((d as { headers: Record<string, string> }).headers['cache-control']).toBe('public, max-age=30');
    }
    expect(JSON.stringify(unknown)).toBe(JSON.stringify(unpub));
  });

  it('[negativo] host malformado, IDN raro, puerto y mayusculas se normalizan o se rechazan', async () => {
    const { f, run } = setup();
    for (const h of ['', 'a b.example', 'www.maria.example/x', 'user@www.maria.example', '[::1]', '127.0.0.1', 'localhost', 'www.maria.example:abc', '-x.example', 'a..example', 'www.maria.example;x']) {
      expect(await run('https://x/', h), h).toMatchObject({ kind: 'status', status: 404 });
    }
    expect(await run('https://x/', null)).toMatchObject({ kind: 'status', status: 404 });
    expect(f.calls).toHaveLength(0);
    expect(await run('https://x/', 'WWW.MARIA.EXAMPLE.:8443')).toMatchObject({ kind: 'rewrite' });
    await run('https://x/', 'bücher.example');
    expect(f.calls[f.calls.length - 1].url).toContain('host=xn--bcher-kva.example');
  });

  it('[negativo] hosts de nadakki.com son del panel: 404 con 0 llamadas al core', async () => {
    const { f, run } = setup();
    for (const h of ['baylara.nadakki.com', 'dashboard.nadakki.com', 'nadakki.com', 'sites.nadakki.com', 'NADAKKI.COM:3000', 'a.b.nadakki.com.']) {
      expect(await run('https://x/', h), h).toMatchObject({ kind: 'status', status: 404 });
    }
    expect(f.calls).toHaveLength(0);
    expect(await run('https://x/', 'nadakki.com.evil.example')).toMatchObject({ kind: 'status' });
    expect(f.calls).toHaveLength(1); // un dominio ajeno que solo contiene el texto si se consulta al core
  });

  it('[negativo] core caido -> 503 con Retry-After, sin pagina de otro sitio y sin cachear el fallo', async () => {
    const { f, run } = setup();
    f.queue('/public/resolve', 500, { code: 'X' });
    const d = await run('https://www.maria.example/', 'www.maria.example');
    expect(d).toMatchObject({ kind: 'status', status: 503 });
    expect((d as { headers: Record<string, string> }).headers['retry-after']).toMatch(/^\d+$/);
    expect((await run('https://www.maria.example/', 'www.maria.example')).kind).toBe('rewrite');
    f.queueThrow('/public/resolve', new Error('red'));
    expect(await run('https://www.cliente.example/', 'www.cliente.example')).toMatchObject({ status: 503 });
  });

  it('[negativo] respuestas sin Set-Cookie y con Vary: Host', async () => {
    const { run } = setup();
    for (const [u, h] of [['https://nadie.example/', 'nadie.example'], ['https://x/s/abc', 'www.maria.example']]) {
      const d = (await run(u, h)) as { headers: Record<string, string> };
      expect(d.headers.vary?.toLowerCase()).toContain('host');
      expect(Object.keys(d.headers).map((k) => k.toLowerCase())).not.toContain('set-cookie');
    }
  });

  it('[tenant-ajeno] con Host de A y x-tenant-id/x-site-id de B se sirve A y las cabeceras se borran', async () => {
    const { f, run } = setup();
    const d = await run('https://www.maria.example/', 'www.maria.example', {
      'x-tenant-id': 'tenant-b', 'x-site-id': CLIENTE.id, 'x-forwarded-host': 'www.cliente.example', 'x-middleware-rewrite': `/s/${CLIENTE.id}`,
      'x-middleware-subrequest': 'x', 'x-keep': 'ok',
    });
    expect(d).toMatchObject({ kind: 'rewrite', pathname: `/s/${MARIA.id}/` });
    const h = (d as { requestHeaders: Headers }).requestHeaders;
    for (const k of ['x-tenant-id', 'x-site-id', 'x-forwarded-host', 'x-middleware-rewrite', 'x-middleware-subrequest']) expect(h.has(k), k).toBe(false);
    expect(h.get('x-keep')).toBe('ok');
    expect(f.calls.every((c) => c.url.includes('host=www.maria.example'))).toBe(true);
  });

  it('[tenant-ajeno] GET directo a /s/<site_id de B> en el host de A (y en cualquier host) -> 404', async () => {
    const { f, run } = setup();
    for (const [u, h] of [[`https://x/s/${CLIENTE.id}/`, 'www.maria.example'], [`https://x/s/${CLIENTE.id}`, 'www.cliente.example'], ['https://x/S/abc', 'nadie.example'],
      [`https://x/%73/${CLIENTE.id}/`, 'www.maria.example'], [`https://x//s/${CLIENTE.id}`, 'www.maria.example'], [`https://x/s%2F${CLIENTE.id}`, 'www.maria.example']]) {
      expect(await run(u, h), u).toMatchObject({ kind: 'status', status: 404 });
    }
    expect(f.calls).toHaveLength(0);
  });

  it('[tenant-ajeno] el host de B nunca resuelve al site_id de A, ni aunque el core conteste otro host', async () => {
    const { f, run } = setup();
    const d = await run('https://www.cliente.example/', 'www.cliente.example');
    expect(d).toMatchObject({ pathname: `/s/${CLIENTE.id}/` });
    expect(JSON.stringify(d)).not.toContain(MARIA.id);
    f.mutate('/public/resolve', (b) => ({ ...b, host: 'www.otro.example' }));
    expect(await run('https://www.maria.example/', 'www.maria.example')).toMatchObject({ kind: 'status', status: 503 });
  });
});
