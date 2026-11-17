import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import schema from '../../contracts/C-SITES-LEADS/schema.json';
import { checkOrigin, checkTiming, signFormCookie, verifyFormCookie } from '@/leads/antispam';
import { consentsFor } from '@/leads/consent';
import { buildSubmission, isHoneypot } from '@/leads/mapping';
import { createMemoryOutbox } from '@/leads/outbox';
import { sendLead } from '@/leads/core-send';
import { siteKey } from '@/leads/sitekey';

const A = '00000000-0000-4000-8000-0000000000b1';
const B = '00000000-0000-4000-8000-0000000000b2';
const SECRET = 'synth-secret-0001';
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
ajv.addSchema(schema);
const valid = ajv.getSchema(`${schema.$id}#/$defs/LeadSubmission`)!;
const T0 = '2026-11-07T14:59:40Z';

const form = (o: Record<string, unknown> = {}) => ({ intent: 'buyer', name: 'Visitante SYNTH', email: 'visitante@synth.invalid', lang: 'es', listing: 'synth-condo-01', timeline: '3 meses', country: 'Argentina', ...o });

describe('ST2-05 sitekey', () => {
  it('[positivo] X-Site-Key = v1.<site>.<base64url(HMAC)> con vector calculado de forma independiente (openssl)', () => {
    expect(siteKey(SECRET, A)).toBe(`v1.${A}.HD3546vJ-kIlDDCyEVgu4WE4GaSuQa1SKlyzwsPBLKY`);
    expect(siteKey(SECRET, A)).toMatch(/^v1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);
  });
  it('[tenant-ajeno] la clave de A no sirve para el path de B', () => {
    expect(siteKey(SECRET, A).split('.')[2]).not.toBe(siteKey(SECRET, B).split('.')[2]);
    expect(siteKey(SECRET, B)).toContain(`.${B}.`);
  });
  it('[negativo] sin secreto o con site_id mal formado lanza sin imprimir el secreto', () => {
    expect(() => siteKey('', A)).toThrow();
    try { siteKey(SECRET, 'no-uuid'); } catch (e) { expect(String(e)).not.toContain(SECRET); }
  });
});

describe('ST2-05 mapeo Baylara -> LeadSubmission', () => {
  it('[positivo] el formulario por intencion produce un LeadSubmission valido (additionalProperties false)', () => {
    const r = buildSubmission(form({ consent: 'on', phone: '+54 9 11 5555-1234' }), { formRenderedAt: T0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(valid(r.submission), JSON.stringify(valid.errors)).toBe(true);
    expect(r.submission.interest).toEqual({ kind: 'listing', slug: 'synth-condo-01' });
    expect(r.submission.phone).toBe('+5491155551234');
    expect(r.submission.message).toContain('Plazo: 3 meses');
    expect(r.submission.message.length).toBeLessThanOrEqual(4000);
    expect(r.submission.form_rendered_at).toBe(T0);
  });
  it('[positivo] consentimiento por canal: sin marcar -> granted:false en los tres; casilla unica -> sms y whatsapp con su text_version', () => {
    expect(consentsFor({}, 'es').map((c) => [c.channel, c.granted])).toEqual([['email', false], ['phone_sms', false], ['whatsapp', false]]);
    const on = consentsFor({ consent: true }, 'en');
    expect(on.find((c) => c.channel === 'phone_sms')).toMatchObject({ granted: true, text_locale: 'en', text_version: expect.stringMatching(/^consent-/) });
    expect(on.find((c) => c.channel === 'email')!.granted).toBe(false);
  });
  it('[negativo] tenant_id en el cuerpo se rechaza; site_id se descarta; faltan campos -> invalido', () => {
    expect(buildSubmission(form({ tenant_id: B }), { formRenderedAt: T0 })).toMatchObject({ ok: false, reason: 'tenant_field' });
    const r = buildSubmission(form({ site_id: B }), { formRenderedAt: T0 });
    expect(r.ok && JSON.stringify(r.submission)).not.toContain(B);
    expect(buildSubmission(form({ name: '', email: '' }), { formRenderedAt: T0 })).toMatchObject({ ok: false, reason: 'invalid' });
    expect(buildSubmission(form({ email: 'no-es-correo' }), { formRenderedAt: T0 })).toMatchObject({ ok: false, reason: 'invalid' });
    expect(buildSubmission(form({ intent: 'otra' }), { formRenderedAt: T0 })).toMatchObject({ ok: false, reason: 'invalid' });
  });
  it('[negativo] honeypot company_website (o website de Baylara) lleno se detecta; vacio no', () => {
    expect(isHoneypot({ company_website: 'x' })).toBe(true);
    expect(isHoneypot({ website: 'http://spam' })).toBe(true);
    expect(isHoneypot({ company_website: '  ', website: '' })).toBe(false);
  });
  it('[tenant-ajeno] el submission nunca lleva site_id ni tenant_id', () => {
    const r = buildSubmission(form({ site_id: B }), { formRenderedAt: T0 });
    expect(r.ok && Object.keys(r.submission)).not.toEqual(expect.arrayContaining(['site_id']));
  });
});

describe('ST2-05 antispam', () => {
  const now = Date.parse('2026-11-07T15:00:00Z');
  it('[positivo] tiempo minimo: >=3 s ok, <3 s too_fast, >24 h expired, cookie firmada ida y vuelta', () => {
    expect(checkTiming(now - 3000, now)).toBe('ok');
    expect(checkTiming(now - 2999, now)).toBe('too_fast');
    expect(checkTiming(now - 25 * 3600_000, now)).toBe('expired');
    const c = signFormCookie(SECRET, A, now - 5000);
    expect(verifyFormCookie(SECRET, A, c)).toBe(now - 5000);
  });
  it('[negativo] Origin ajeno, null o Sec-Fetch-Site cross-site -> 403; mismo origen y sin cabeceras pasan', () => {
    const h = (o: Record<string, string>) => new Headers({ host: 'www.maria.example', ...o });
    expect(checkOrigin(h({ origin: 'https://evil.example' }))).toBe(false);
    expect(checkOrigin(h({ origin: 'null' }))).toBe(false);
    expect(checkOrigin(h({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(checkOrigin(h({ 'sec-fetch-site': 'same-site' }))).toBe(false);
    expect(checkOrigin(h({ origin: 'https://www.maria.example' }))).toBe(true);
    expect(checkOrigin(h({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(checkOrigin(h({}))).toBe(true);
  });
  it('[tenant-ajeno] la cookie firmada para A no verifica en B, ni alterada, ni con otro secreto', () => {
    const c = signFormCookie(SECRET, A, now);
    expect(verifyFormCookie(SECRET, B, c)).toBeNull();
    expect(verifyFormCookie('otro', A, c)).toBeNull();
    expect(verifyFormCookie(SECRET, A, c.replace(/.$/, 'x'))).toBeNull();
    expect(verifyFormCookie(SECRET, A, undefined)).toBeNull();
  });
});

describe('ST2-05 envio al core con reintentos', () => {
  const sub = () => { const r = buildSubmission(form(), { formRenderedAt: T0 }); if (!r.ok) throw new Error('x'); return r.submission; };
  function core(statuses: (number | 'net')[], headers: Record<string, string> = {}) {
    const calls: { url: string; init: RequestInit }[] = [];
    let i = 0;
    const fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const s = statuses[Math.min(i++, statuses.length - 1)];
      if (s === 'net') throw new Error('red');
      return new Response(s === 202 ? '{"status":"accepted"}' : '{}', { status: s, headers });
    }) as unknown as typeof globalThis.fetch;
    const sleeps: number[] = [];
    return { calls, sleeps, run: (site = A) => sendLead({ fetch, baseUrl: 'https://core.test/api/v1/sites', siteId: site, secret: SECRET, key: 'k-1', submission: sub(), sleep: async (ms) => { sleeps.push(ms); } }) };
  }
  it('[positivo] 503, 503 y luego 202 -> aceptado con la MISMA Idempotency-Key y backoff 200/800', async () => {
    const c = core([503, 503, 202]);
    expect(await c.run()).toMatchObject({ kind: 'accepted' });
    expect(c.calls).toHaveLength(3);
    const keys = c.calls.map((x) => new Headers(x.init.headers).get('idempotency-key'));
    expect(new Set(keys)).toEqual(new Set(['k-1']));
    expect(c.sleeps).toEqual([200, 800]);
    const h = new Headers(c.calls[0].init.headers);
    expect(h.get('x-site-key')).toBe(siteKey(SECRET, A));
    expect(c.calls[0].url).toBe(`https://core.test/api/v1/sites/public/${A}/leads`);
  });
  it('[negativo] 422/413/403 no se reintentan; core caido agota 3 intentos -> unavailable', async () => {
    for (const s of [422, 413, 403, 401, 409]) {
      const c = core([s]);
      expect(await c.run()).toMatchObject({ kind: 'rejected', status: s });
      expect(c.calls).toHaveLength(1);
    }
    const d = core(['net']);
    expect(await d.run()).toMatchObject({ kind: 'unavailable' });
    expect(d.calls).toHaveLength(3);
  });
  it('[negativo] 429 respeta Retry-After y se rinde si excede el tope de 8 s', async () => {
    const ok = core([429, 202], { 'retry-after': '2' });
    expect(await ok.run()).toMatchObject({ kind: 'accepted' });
    expect(ok.sleeps).toEqual([2000]);
    const long = core([429], { 'retry-after': '60' });
    expect(await long.run()).toMatchObject({ kind: 'unavailable' });
    expect(long.calls).toHaveLength(1);
  });
  it('[tenant-ajeno] el POST va al path y con la clave del site_id recibido, y el cuerpo no lleva tenant ni site', async () => {
    const c = core([202]);
    await c.run(B);
    expect(c.calls[0].url).toContain(`/public/${B}/leads`);
    expect(new Headers(c.calls[0].init.headers).get('x-site-key')).toBe(siteKey(SECRET, B));
    expect(String(c.calls[0].init.body)).not.toMatch(/tenant_id|site_id/);
  });
  it('[negativo] core colgado: el tope total se respeta aunque cada intento se cuelgue hasta abortar', async () => {
    const hang = ((_u: unknown, init: RequestInit) => new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new Error('abort')));
    })) as unknown as typeof fetch;
    const t0 = Date.now();
    const r = await sendLead({ fetch: hang, baseUrl: 'https://core.test/api/v1/sites', siteId: A, secret: SECRET, key: 'k-1', submission: sub(), attemptTimeoutMs: 300, budgetMs: 500, sleep: (ms) => new Promise((x) => setTimeout(x, ms)) });
    expect(r.kind).toBe('unavailable');
    expect(Date.now() - t0).toBeLessThanOrEqual(700);
  });
});

describe('ST2-05 LeadOutbox', () => {
  it('[positivo] mismo cuerpo en 60 s -> misma clave; tras 60 s -> clave nueva; claves son UUID v4', async () => {
    let now = 1_000;
    const o = createMemoryOutbox({ now: () => now });
    const a = await o.enqueue({ siteId: A, fingerprint: 'f1', payload: { x: 1 } });
    const b = await o.enqueue({ siteId: A, fingerprint: 'f1', payload: { x: 1 } });
    expect(b.key).toBe(a.key);
    expect(a.key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    now += 61_000;
    expect((await o.enqueue({ siteId: A, fingerprint: 'f1', payload: { x: 1 } })).key).not.toBe(a.key);
  });
  it('[negativo] drain reenvia solo los pendientes y marca enviados los aceptados', async () => {
    const o = createMemoryOutbox({ now: () => 1 });
    const a = await o.enqueue({ siteId: A, fingerprint: 'f1', payload: {} });
    await o.enqueue({ siteId: A, fingerprint: 'f2', payload: {} });
    const seen: string[] = [];
    const r1 = await o.drain(async (it) => { seen.push(it.key); return it.key === a.key; });
    expect(r1).toEqual({ sent: 1, pending: 1 });
    await o.drain(async (it) => { seen.push(it.key); return true; });
    expect(seen).toHaveLength(3);
    expect(await o.drain(async () => true)).toEqual({ sent: 0, pending: 0 });
  });
  it('[tenant-ajeno] dos visitantes con cuerpos distintos o sitios distintos obtienen claves distintas', async () => {
    const o = createMemoryOutbox({ now: () => 1 });
    const k = async (s: string, f: string) => (await o.enqueue({ siteId: s, fingerprint: f, payload: {} })).key;
    const keys = new Set([await k(A, 'v1'), await k(A, 'v2'), await k(B, 'v1')]);
    expect(keys.size).toBe(3);
  });
});
