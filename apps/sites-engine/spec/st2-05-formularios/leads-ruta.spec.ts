import { describe, expect, it } from 'vitest';
import { FORM_COOKIE, signFormCookie } from '@/leads/antispam';
import { handleLead, type LeadDeps } from '@/leads/handler';
import { createMemoryOutbox } from '@/leads/outbox';
import { siteKey } from '@/leads/sitekey';

const A = '00000000-0000-4000-8000-0000000000b1';
const B = '00000000-0000-4000-8000-0000000000b2';
const SECRET = 'synth-secret-0001';
const HOST = 'a.synth.invalid';
const T = 1_800_000_000_000;

interface Call { url: string; headers: Record<string, string>; body: Record<string, unknown> }
function mkDeps(statuses: number[] = [202], now = () => T + 10_000) {
  const calls: Call[] = [];
  let i = 0;
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    const s = statuses[Math.min(i++, statuses.length - 1)];
    return new Response(null, { status: s });
  }) as unknown as typeof fetch;
  const deps: LeadDeps = { fetch: fetchFn, baseUrl: 'https://core.synth.invalid/api/v1/sites', secret: SECRET, outbox: createMemoryOutbox({ now }), now, sleep: async () => {} };
  return { deps, calls };
}
const cookie = (site = A, ts = T) => `${FORM_COOKIE}=${signFormCookie(SECRET, site, ts)}`;
const fields = (o: Record<string, string> = {}) => ({ intent: 'buyer', name: 'Visitante SYNTH', email: 'v1@synth.invalid', lang: 'es', consent: 'on', ...o });
const urlenc = (o: Record<string, string>, h: Record<string, string> = {}) =>
  new Request(`https://${HOST}/api/lead`, { method: 'POST', headers: { host: HOST, 'content-type': 'application/x-www-form-urlencoded', cookie: cookie(), origin: `https://${HOST}`, ...h }, body: new URLSearchParams(o).toString() });
const json = (o: Record<string, unknown>, h: Record<string, string> = {}) =>
  new Request(`https://${HOST}/api/lead`, { method: 'POST', headers: { host: HOST, 'content-type': 'application/json', cookie: cookie(), ...h }, body: JSON.stringify(o) });

describe('ST2-05 ruta de formularios', () => {
  it('[positivo] POST urlencoded sin JS: el core recibe un LeadSubmission con X-Site-Key e Idempotency-Key y el visitante recibe 303 a enviado', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(urlenc(fields()), A, deps);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://core.synth.invalid/api/v1/sites/public/${A}/leads`);
    expect(calls[0].headers['x-site-key']).toBe(siteKey(SECRET, A));
    expect(calls[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[0].body.consents).toHaveLength(3);
  });
  it('[positivo] JSON -> {ok:true}; en ingles redirige a message-sent', async () => {
    const { deps } = mkDeps();
    const r = await handleLead(json(fields()), A, deps);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const e = await handleLead(urlenc(fields({ lang: 'en', email: 'v2@synth.invalid' })), A, mkDeps().deps);
    expect(e.headers.get('location')).toBe('/en/message-sent');
  });
  it('[positivo] core 503 dos veces y luego 202 -> un solo lead aceptado con la misma clave', async () => {
    const { deps, calls } = mkDeps([503, 503, 202]);
    const r = await handleLead(urlenc(fields()), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls).toHaveLength(3);
    expect(new Set(calls.map((c) => c.headers['idempotency-key'])).size).toBe(1);
  });
  it('[positivo] doble POST del mismo cuerpo en 60 s -> misma clave y un solo envio al core', async () => {
    const { deps, calls } = mkDeps();
    await handleLead(urlenc(fields()), A, deps);
    const r = await handleLead(urlenc(fields()), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls.length).toBe(1);
  });
  it('[negativo] honeypot lleno -> 303 enviado y 0 llamadas al core', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(urlenc(fields({ company_website: 'http://spam.invalid' })), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls).toHaveLength(0);
  });
  it('[negativo] envio en menos de 3 s -> mismo falso exito sin llamar al core', async () => {
    const { deps, calls } = mkDeps([202], () => T + 1_000);
    const r = await handleLead(urlenc(fields()), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls).toHaveLength(0);
  });
  it('[negativo] sin cookie de tiempo ni form_rendered_at -> no-enviado (nunca se inventa)', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(urlenc(fields(), { cookie: '' }), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-no-enviado');
    expect(calls).toHaveLength(0);
  });
  it('[negativo] Origin ajeno o Sec-Fetch-Site cross-site -> 403 sin llamar al core', async () => {
    const { deps, calls } = mkDeps();
    expect((await handleLead(urlenc(fields(), { origin: 'https://evil.invalid' }), A, deps)).status).toBe(403);
    expect((await handleLead(json(fields(), { 'sec-fetch-site': 'cross-site' }), A, deps)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
  it('[negativo] core caido -> 303 no-enviado, nunca enviado; JSON 503 {ok:false}', async () => {
    const { deps } = mkDeps([503]);
    const r = await handleLead(urlenc(fields()), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-no-enviado');
    const j = await handleLead(json(fields({ email: 'v3@synth.invalid' })), A, mkDeps([503]).deps);
    expect(j.status).toBe(503);
    expect((await j.json()).ok).toBe(false);
  });
  it('[negativo] 422 del core sin reintento y sin detalle sensible', async () => {
    const { deps, calls } = mkDeps([422]);
    const r = await handleLead(json(fields()), A, deps);
    expect(calls).toHaveLength(1);
    expect(r.status).toBe(422);
    expect(JSON.stringify(await r.json())).not.toMatch(/core|synth-secret|v1\./);
  });
  it('[negativo] cuerpo mayor de 16 KiB -> 413 sin llamar al core', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(json(fields({ message: 'x'.repeat(17_000) })), A, deps);
    expect(r.status).toBe(413);
    expect(calls).toHaveLength(0);
  });
  it('[negativo] tenant_id en el cuerpo se rechaza', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(json({ ...fields(), tenant_id: 'x' }), A, deps);
    expect(r.status).toBe(422);
    expect(calls).toHaveLength(0);
  });
  it('[tenant-ajeno] desde el host de A con site_id/tenant_id de B en el cuerpo: el POST va a A con la clave de A', async () => {
    const { deps, calls } = mkDeps();
    await handleLead(urlenc(fields({ site_id: B })), A, deps);
    expect(calls[0].url).toContain(`/public/${A}/leads`);
    expect(calls[0].headers['x-site-key']).toBe(siteKey(SECRET, A));
    expect(JSON.stringify(calls[0].body)).not.toContain(B);
    const r = await handleLead(urlenc(fields({ tenant_id: B, email: 'v9@synth.invalid' })), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-no-enviado');
    expect(calls).toHaveLength(1);
  });
  it('[tenant-ajeno] la cookie de tiempo de B no vale en A', async () => {
    const { deps, calls } = mkDeps();
    const r = await handleLead(urlenc(fields(), { cookie: cookie(B) }), A, deps);
    expect(r.headers.get('location')).toBe('/es/mensaje-no-enviado');
    expect(calls).toHaveLength(0);
  });
  it('[tenant-ajeno] dos visitantes distintos desde el mismo HTML obtienen claves distintas y llegan dos leads', async () => {
    const { deps, calls } = mkDeps();
    await handleLead(urlenc(fields({ email: 'uno@synth.invalid' })), A, deps);
    await handleLead(urlenc(fields({ email: 'dos@synth.invalid' })), A, deps);
    expect(calls).toHaveLength(2);
    expect(calls[0].headers['idempotency-key']).not.toBe(calls[1].headers['idempotency-key']);
  });
});
