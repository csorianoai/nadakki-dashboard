import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import { createRevalidateHandler, parseSecrets } from '@/revalidate/handler';

const SECRET = 'secreto-sintetico-1';
const NOW = 1_800_000_000;
const A = SITE_A.id;
const B = SITE_B.id;

interface Ev { id?: string; site?: string; kind?: string; slug?: string | null; host?: string | null; v?: number }
function envelope(e: Ev): string {
  const payload: Record<string, unknown> = { site_id: e.site ?? A, kind: e.kind ?? 'listing', content_version: e.v ?? 3 };
  payload.slug = e.slug === undefined ? 'synth-condo-01' : e.slug;
  if (e.host !== undefined) payload.host = e.host;
  return JSON.stringify({
    event_id: e.id ?? '00000000-0000-4000-8000-000000000101', event_name: 'sites.render.revalidation_requested', event_version: 1,
    tenant_id: '00000000-0000-4000-8000-0000000000a1', site_id: e.site ?? A, occurred_at: '2026-11-07T15:00:00Z',
    idempotency_key: 'reval:synth:3:listing:synth-condo-01', actor_id: null, payload,
  });
}
const sig = (body: string, ts: number, secret = SECRET) => `v1=${createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`;

function setup(secrets: Record<string, string> = { k1: SECRET }) {
  const tags: string[] = [];
  const handle = createRevalidateHandler({ secrets, now: () => NOW * 1000, revalidate: (t) => { tags.push(t); } });
  const send = (body: string, o: { ts?: number; signature?: string; keyId?: string | null; eventId?: string } = {}) => {
    const ts = o.ts ?? NOW;
    const h = new Headers({ 'x-nadakki-timestamp': String(ts), 'x-nadakki-signature': o.signature ?? sig(body, ts), 'x-nadakki-event-id': o.eventId ?? (JSON.parse(body.startsWith('{') ? body : '{}').event_id ?? 'x') });
    if (o.keyId !== null) h.set('x-nadakki-key-id', o.keyId ?? 'k1');
    return handle({ headers: h, body });
  };
  return { tags, send };
}

describe('ST2-04 revalidacion firmada', () => {
  it('[positivo] evento firmado valido -> 204 y revalida exactamente las etiquetas esperadas', async () => {
    const { tags, send } = setup();
    expect((await send(envelope({ kind: 'listing', slug: 'synth-condo-01' }))).status).toBe(204);
    expect(tags.sort()).toEqual([`site:${A}:listing:synth-condo-01`, `site:${A}`].sort());
  });

  it('[positivo] mapeo kind -> etiquetas (site, page, media, host) y rotacion con dos firmas v1', async () => {
    const m = async (e: Ev) => { const s = setup(); await s.send(envelope(e)); return s.tags.sort(); };
    expect(await m({ kind: 'site' })).toEqual([`site:${A}`]);
    expect(await m({ kind: 'manifest' })).toEqual([`site:${A}`]);
    expect(await m({ kind: 'page', slug: 'about' })).toEqual([`site:${A}`, `site:${A}:page:about`].sort());
    expect(await m({ kind: 'media' })).toEqual([`site:${A}`, `site:${A}:media`].sort());
    expect(await m({ kind: 'host', host: 'www.synth-realty.example' })).toEqual(['host:www.synth-realty.example']);
    const { tags, send } = setup();
    const body = envelope({});
    const both = `${sig(body, NOW, 'otro-secreto')},${sig(body, NOW)}`;
    expect((await send(body, { signature: both })).status).toBe(204);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('[negativo] firma mala, cuerpo alterado, timestamp +-301 s, Key-Id desconocido o ausente -> 401 sin revalidar', async () => {
    const { tags, send } = setup();
    const body = envelope({});
    expect((await send(body, { signature: `v1=${'0'.repeat(64)}` })).status).toBe(401);
    expect((await send(body, { signature: 'v1=abc' })).status).toBe(401); // longitud distinta: sin excepcion
    expect((await send(body, { signature: 'basura' })).status).toBe(401);
    expect((await send(body.replace('synth-condo-01', 'otra'), { signature: sig(body, NOW) })).status).toBe(401);
    expect((await send(body, { ts: NOW + 301 })).status).toBe(401);
    expect((await send(body, { ts: NOW - 301 })).status).toBe(401);
    expect((await send(body, { keyId: 'desconocido' })).status).toBe(401);
    expect((await send(body, { keyId: null })).status).toBe(401);
    expect((await send(body, { ts: NOW + 300 })).status).toBe(204);
    expect(tags.length).toBe(2);
  });

  it('[negativo] JSON mal formado o fuera de contrato, firmados -> 400; event_id repetido -> 204 sin segunda revalidacion', async () => {
    const { tags, send } = setup();
    expect((await send('{no es json', { eventId: 'x' })).status).toBe(400);
    expect((await send(JSON.stringify({ event_id: 'no-uuid' }), { eventId: 'x' })).status).toBe(400);
    expect((await send(envelope({ kind: 'inventado' }))).status).toBe(400);
    expect((await send(envelope({ id: '00000000-0000-4000-8000-000000000999' }), { eventId: '00000000-0000-4000-8000-000000000101' })).status).toBe(400); // cabecera != sobre
    expect(tags.length).toBe(0);
    expect((await send(envelope({}))).status).toBe(204);
    const n = tags.length;
    expect((await send(envelope({}))).status).toBe(204);
    expect(tags.length).toBe(n);
  });

  it('[negativo] content_version menor a la ya vista del site se descarta (204 sin revalidar); mayor revalida', async () => {
    const { tags, send } = setup();
    await send(envelope({ id: '00000000-0000-4000-8000-000000000201', v: 5, kind: 'site' }));
    expect(tags.length).toBe(1);
    expect((await send(envelope({ id: '00000000-0000-4000-8000-000000000202', v: 4, kind: 'site' }))).status).toBe(204);
    expect(tags.length).toBe(1);
    await send(envelope({ id: '00000000-0000-4000-8000-000000000203', v: 6, kind: 'site' }));
    expect(tags.length).toBe(2);
  });

  it('[tenant-ajeno] un evento firmado del site B solo toca etiquetas de B, ninguna de A', async () => {
    const { tags, send } = setup();
    for (const [i, kind] of (['site', 'manifest', 'listing', 'media'] as const).entries()) {
      await send(envelope({ site: B, kind, slug: kind === 'listing' ? 'otro-loft-01' : undefined, id: `00000000-0000-4000-8000-00000000030${i}` }));
    }
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => t.startsWith(`site:${B}`))).toBe(true);
    expect(tags.some((t) => t.includes(A))).toBe(false);
  });

  it('[positivo] parseSecrets lee SITES_REVALIDATE_SECRETS y falla cerrado sin secretos o con JSON invalido', () => {
    expect(parseSecrets('{"k1":"abc"}')).toEqual({ k1: 'abc' });
    expect(parseSecrets(undefined)).toEqual({});
    expect(parseSecrets('no json')).toEqual({});
    expect(parseSecrets('{"k1":5}')).toEqual({});
  });

  it('[negativo] sin secretos configurados todo es 401', async () => {
    const { send } = setup({});
    expect((await send(envelope({}))).status).toBe(401);
  });
});
