// Manejador puro (sin Next) del POST same-origin '/api/lead'. El site_id lo da la ruta interna /s/[siteId]/ (reescrita por el
// proxy desde el host): jamas se lee del cuerpo. Sin PII en logs: este modulo no registra nada.
import { createHash } from 'node:crypto';
import { checkOrigin, checkTiming, FORM_COOKIE, verifyFormCookie } from './antispam';
import { sendLead } from './core-send';
import { buildSubmission, isHoneypot } from './mapping';
import type { LeadOutbox } from './outbox';

export interface LeadDeps {
  fetch: typeof globalThis.fetch; baseUrl: string; secret: string; outbox: LeadOutbox;
  now?: () => number; sleep?: (ms: number) => Promise<void>;
}
export const MAX_BODY_BYTES = 16 * 1024;
const DONE = { es: '/es/mensaje-enviado', en: '/en/message-sent' };
const FAIL = { es: '/es/mensaje-no-enviado', en: '/en/message-not-sent' };
const NO_STORE = { 'cache-control': 'no-store' };

type Lang = 'es' | 'en';
type Outcome = { ok: true } | { ok: false; status: number; retryAfter?: number };

function reply(native: boolean, lang: Lang, o: Outcome): Response {
  if (native) {
    const headers: Record<string, string> = { location: o.ok ? DONE[lang] : FAIL[lang], ...NO_STORE };
    return new Response(null, { status: 303, headers });
  }
  const headers: Record<string, string> = { ...NO_STORE, 'content-type': 'application/json' };
  if (!o.ok && o.retryAfter) headers['retry-after'] = String(o.retryAfter);
  return new Response(JSON.stringify(o.ok ? { ok: true } : { ok: false, error: 'not_sent' }), { status: o.ok ? 200 : o.status, headers });
}

function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

async function readBody(req: Request): Promise<string | null> {
  const len = Number(req.headers.get('content-length'));
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) return null;
  const text = await req.text();
  return Buffer.byteLength(text) > MAX_BODY_BYTES ? null : text;
}

export async function handleLead(req: Request, siteId: string, deps: LeadDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  const native = !type.includes('application/json');
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST', ...NO_STORE } });
  if (!checkOrigin(req.headers)) return new Response(null, { status: 403, headers: NO_STORE });

  const raw = await readBody(req);
  if (raw === null) return native ? reply(true, 'es', { ok: false, status: 413 }) : reply(false, 'es', { ok: false, status: 413 });

  let data: Record<string, unknown> | null = null;
  try {
    if (!native) {
      const j: unknown = JSON.parse(raw);
      data = j && typeof j === 'object' && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
    } else if (type.includes('application/x-www-form-urlencoded')) {
      data = Object.fromEntries(new URLSearchParams(raw).entries());
    }
  } catch { data = null; }
  const lang: Lang = data?.lang === 'en' ? 'en' : 'es';
  if (!data) return reply(native, lang, { ok: false, status: 400 });

  // Antispam: respuesta identica a un exito, sin llamar al core.
  if (isHoneypot(data)) return reply(native, lang, { ok: true });

  // Tiempo de relleno: cookie firmada de host (sin JS) o, con JS, form_rendered_at fijado por el navegador al pintar.
  let renderedMs = verifyFormCookie(deps.secret, siteId, readCookie(req.headers.get('cookie'), FORM_COOKIE));
  if (renderedMs === null && typeof data.form_rendered_at === 'string') {
    const t = Date.parse(data.form_rendered_at);
    if (Number.isFinite(t)) renderedMs = t;
  }
  if (renderedMs === null) return reply(native, lang, { ok: false, status: 422 }); // no se inventa el tiempo
  const timing = checkTiming(renderedMs, now());
  if (timing === 'too_fast') return reply(native, lang, { ok: true });
  if (timing === 'expired') return reply(native, lang, { ok: false, status: 422 });

  const mapped = buildSubmission(data, { formRenderedAt: new Date(renderedMs).toISOString(), referer: req.headers.get('referer') ?? undefined });
  if (!mapped.ok) return reply(native, lang, { ok: false, status: 422 });
  if (!deps.secret || !/^https?:\/\//.test(deps.baseUrl)) return reply(native, lang, { ok: false, status: 503 });

  // Idempotency-Key del MOTOR: una por envio recibido; el mismo cuerpo en 60 s reutiliza item y clave.
  const fingerprint = createHash('sha256').update(`${siteId}\n${raw}`).digest('hex');
  const item = await deps.outbox.enqueue({ siteId, fingerprint, payload: mapped.submission });
  if (item.status === 'sent') return reply(native, lang, { ok: true });
  const res = await sendLead({ fetch: deps.fetch, baseUrl: deps.baseUrl, siteId, secret: deps.secret, key: item.key, submission: mapped.submission, now: deps.now, sleep: deps.sleep });
  if (res.kind === 'accepted') {
    await deps.outbox.markSent(item.id);
    return reply(native, mapped.locale, { ok: true });
  }
  // Sin 202 la respuesta honesta es no-enviado (el item queda pendiente en el outbox para drain); nunca 'enviado'.
  return reply(native, mapped.locale, { ok: false, status: res.kind === 'rejected' ? 422 : 503 });
}
