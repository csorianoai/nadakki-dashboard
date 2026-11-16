import { createHmac } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockError, validateBlocks } from '@/blocks/model';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import { buildCsp, cspForDeployment, hashesFromEnv, mediaHostsFromEnv } from '../../src/lib/csp';
import { buildMetadata, renderSite, resolveRoute } from '@/render/site';
import { createRevalidateHandler } from '@/revalidate/handler';
import { getTemplate } from '@/templates';

const A = SITE_A.id;
const B = SITE_B.id;
const mk = (f = createFakeCore(), fetchFn: typeof fetch = f.fetch) => ({ f, c: createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: fetchFn }) });
const html = (o: Awaited<ReturnType<typeof renderSite>>) => (o.kind === 'ok' ? renderToStaticMarkup(o.element) : '');

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe('ST2-04 render por manifiesto', () => {
  it('[positivo] la pagina de A se renderiza desde el manifiesto simulado, por idioma', async () => {
    const { c } = mk();
    const es = await renderSite(c, A, ['sobre-mi']);
    expect(es.kind).toBe('ok');
    expect(html(es)).toContain('Sobre SYNTH Realty');
    expect(html(await renderSite(c, A, ['en', 'about']))).toContain('About SYNTH Realty');
  });

  it('[positivo] las lecturas llevan las etiquetas de ST2-02 y revalidate 60 s', async () => {
    const { f, c } = mk();
    await renderSite(c, A, ['sobre-mi']);
    expect(f.calls.map((x) => x.tags)).toEqual([[`site:${A}`], [`site:${A}`, `site:${A}:page:about`]]);
    expect(await import('node:fs').then((fs) => fs.readFileSync('src/core/client.ts', 'utf8'))).toContain('revalidate: 60');
  });

  it('[positivo] canonical al primary_host del manifiesto y alternates es/en; noindex fuera de produccion o si indexable=false', () => {
    const m = SITE_A.manifest;
    const hit = resolveRoute(m, ['en', 'about'])!;
    const prod = buildMetadata(m, hit.lang, hit.route, { vercelEnv: 'production' });
    expect(prod.alternates.canonical).toBe('https://www.synth-realty.example/en/about');
    expect(prod.alternates.languages).toEqual({ es: 'https://www.synth-realty.example/sobre-mi', en: 'https://www.synth-realty.example/en/about' });
    expect(prod.robots.index).toBe(true);
    expect(buildMetadata(m, hit.lang, hit.route, { vercelEnv: 'preview' }).robots.index).toBe(false);
    expect(buildMetadata({ ...m, indexable: false }, hit.lang, hit.route, { vercelEnv: 'production' }).robots.index).toBe(false);
  });

  it('[negativo] un slug que no esta en el manifiesto -> not_found (404) y no se lee ninguna pagina', async () => {
    const { f, c } = mk();
    expect((await renderSite(c, A, ['no-existe'])).kind).toBe('not_found');
    expect((await renderSite(c, A, ['sobre-mi', 'extra'])).kind).toBe('not_found');
    expect((await renderSite(c, A, ['fr', 'sobre-mi'])).kind).toBe('not_found');
    expect(f.calls.filter((x) => x.url.includes('/pages/'))).toHaveLength(0);
  });

  it('[negativo] plantilla desconocida -> error generico sin datos (falla cerrado)', async () => {
    const { f, c } = mk();
    f.mutate('/manifest', (b) => ({ ...b, template: { id: 'desconocida', version: 9 } }));
    expect(getTemplate('desconocida', 9)).toBeUndefined();
    const o = await renderSite(c, A, ['sobre-mi']);
    expect(o.kind).toBe('error');
    expect(f.calls.filter((x) => x.url.includes('/pages/'))).toHaveLength(0);
  });

  it('[negativo] el modelo de bloques rechaza <script>, javascript: y atributos on*', () => {
    const blk = (data: Record<string, unknown>) => [{ block_id: 'b1', type: 'text', data }];
    expect(() => validateBlocks(blk({ text: 'hola <script>alert(1)</script>' }))).toThrow(BlockError);
    expect(() => validateBlocks(blk({ text: '< SCRIPT src=x>' }))).toThrow(BlockError);
    expect(() => validateBlocks(blk({ href: 'javascript:alert(1)' }))).toThrow(BlockError);
    expect(() => validateBlocks(blk({ href: ' JaVa\tScRiPt:alert(1)' }))).toThrow(BlockError);
    expect(() => validateBlocks(blk({ onclick: 'x()' }))).toThrow(BlockError);
    expect(() => validateBlocks(blk({ html: '<img src=x onerror=alert(1)>' }))).toThrow(BlockError);
    expect(() => validateBlocks([{ block_id: 'b', type: 'text', i18n: { text: { es: '<script>x</script>' } } }])).toThrow(BlockError);
    expect(validateBlocks(blk({ text: 'Bienvenidos', href: 'https://example.invalid/x' }))).toHaveLength(1);
  });

  it('[negativo] una pagina con un bloque con <script> no se renderiza (error generico)', async () => {
    const { f, c } = mk();
    f.mutate('/pages/about', (b) => ({ ...b, body: [{ block_id: 'b1', type: 'text', data: { text: '<script>x</script>' } }] }));
    expect((await renderSite(c, A, ['sobre-mi'])).kind).toBe('error');
  });

  it('[tenant-ajeno] /s/<A>/ nunca usa el manifiesto de B (y un manifiesto con otro site_id se descarta)', async () => {
    const { f, c } = mk();
    const o = await renderSite(c, A, ['sobre-mi']);
    expect(html(o)).not.toContain('Otra Marca');
    expect(f.calls.every((x) => !x.url.includes(B))).toBe(true);
    f.mutate('/manifest', (b) => ({ ...b, site_id: B }));
    expect((await renderSite(c, A, ['sobre-mi'])).kind).toBe('not_found');
    expect((await renderSite(c, 'no-es-uuid', [])).kind).toBe('not_found');
  });
});

describe('ST2-04 CSP', () => {
  it('[positivo] la politica no contiene unsafe-inline ni unsafe-eval y trae las directivas base', () => {
    const csp = buildCsp({ mediaHosts: ['https://cdn.nadakki.example'], hashes: ['sha256-' + 'A'.repeat(43) + '='] });
    expect(csp).not.toMatch(/unsafe-(inline|eval)/);
    for (const d of ["default-src 'self'", "script-src 'self' 'sha256-", "style-src 'self'", "img-src 'self' data: https://cdn.nadakki.example", "connect-src 'self'",
      "frame-ancestors 'none'", "base-uri 'none'", "form-action 'self'", "object-src 'none'", 'upgrade-insecure-requests']) expect(csp).toContain(d);
  });

  it('[positivo] la cabecera Content-Security-Policy de una pagina servida por el proxy no contiene unsafe-inline ni unsafe-eval', async () => {
    const f = createFakeCore();
    vi.stubGlobal('fetch', f.fetch);
    vi.stubEnv('SITES_CORE_URL', 'https://core.test/api/v1/sites');
    vi.stubEnv('SITES_CORE_TOKEN', 'tok-sintetico');
    vi.stubEnv('SITES_MEDIA_HOSTS', 'cdn.nadakki.example');
    const { proxy } = await import('@/proxy');
    const { NextRequest } = await import('next/server');
    const res = await proxy(new NextRequest('https://www.synth-realty.example/sobre-mi', { headers: { host: 'www.synth-realty.example' } }));
    const csp = res.headers.get('content-security-policy')!;
    expect(res.headers.get('x-middleware-rewrite')).toContain(`/s/${A}/sobre-mi`);
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it('[negativo] hosts y hashes invalidos del env se descartan; el cliente no puede inyectar directivas', () => {
    expect(mediaHostsFromEnv("evil.example; script-src *, ok.example, https://x.y.example:8443, a b.example,localhost")).toEqual(['https://ok.example', 'https://x.y.example:8443']);
    expect(hashesFromEnv("sha256-abc, 'unsafe-inline', sha256-" + 'B'.repeat(43) + '=')).toEqual(['sha256-' + 'B'.repeat(43) + '=']);
    expect(cspForDeployment({ SITES_MEDIA_HOSTS: "x.example' 'unsafe-inline" })).not.toContain('unsafe-inline');
  });

  it('[tenant-ajeno] la CSP de A no incluye hosts de B: depende solo del despliegue, nunca del manifiesto', () => {
    const hostsA = mediaHostsFromEnv('cdn.nadakki.example');
    const csp = buildCsp({ mediaHosts: hostsA });
    for (const h of [...SITE_B.manifest.hosts.map((x) => x.host), ...SITE_B.media[0].variants.map((v) => new URL(v.url).host).filter((x) => !hostsA.includes(`https://${x}`))]) {
      expect(csp).not.toContain(h);
    }
    expect(csp).not.toContain('synth-estates');
  });
});

describe('ST2-04 publicar -> visible', () => {
  it('[positivo] con core simulado, un evento firmado hace visible el cambio en < 5 s (medicion)', async () => {
    // Cache etiquetada que imita a Next: lecturas cacheadas por URL hasta que se revalida una de sus etiquetas.
    const f = createFakeCore();
    const store = new Map<string, { tags: string[]; body: string; status: number }>();
    const tagged: typeof fetch = async (input, init) => {
      const key = String(input);
      const hit = store.get(key);
      if (hit) return new Response(hit.body, { status: hit.status, headers: { 'content-type': 'application/json' } });
      const res = await f.fetch(input, { ...init, headers: undefined });
      const body = await res.clone().text();
      store.set(key, { tags: (init as { next?: { tags?: string[] } }).next?.tags ?? [], body, status: res.status });
      return res;
    };
    const { c } = mk(f, tagged);
    const secret = 's3cret-sintetico';
    const NOW = 1_800_000_000;
    const handle = createRevalidateHandler({ secrets: { k1: secret }, now: () => NOW * 1000,
      revalidate: (tag) => { for (const [k, v] of store) if (v.tags.includes(tag)) store.delete(k); } });

    expect(html(await renderSite(c, A, ['sobre-mi']))).toContain('Sobre SYNTH Realty');
    f.mutate('/pages/about', (b) => ({ ...b, title: { es: 'Titulo publicado', en: 'Published title' } }));
    expect(html(await renderSite(c, A, ['sobre-mi']))).toContain('Sobre SYNTH Realty'); // aun cacheado

    const t0 = performance.now();
    const body = JSON.stringify({ event_id: '00000000-0000-4000-8000-000000000201', event_name: 'sites.render.revalidation_requested', event_version: 1,
      tenant_id: '00000000-0000-4000-8000-0000000000a1', site_id: A, occurred_at: '2026-11-07T15:00:00Z', idempotency_key: 'reval:synth:4:page:about', actor_id: null,
      payload: { site_id: A, kind: 'page', slug: 'about', content_version: 4 } });
    const sig = `v1=${createHmac('sha256', secret).update(`${NOW}.${body}`).digest('hex')}`;
    const r = await handle({ body, headers: new Headers({ 'x-nadakki-signature': sig, 'x-nadakki-timestamp': String(NOW), 'x-nadakki-event-id': '00000000-0000-4000-8000-000000000201', 'x-nadakki-key-id': 'k1' }) });
    expect(r.status).toBe(204);
    expect(html(await renderSite(c, A, ['sobre-mi']))).toContain('Titulo publicado');
    const ms = performance.now() - t0;
    console.log(`MEDICION publicar->visible (core simulado): ${ms.toFixed(1)} ms (meta < 5000 ms)`);
    expect(ms).toBeLessThan(5000);
  });
});
