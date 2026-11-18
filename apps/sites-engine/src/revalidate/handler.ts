// Receptor de revalidacion firmada (C-SITES-RENDER webhooks.revalidation). Puro: sin Next, sin red, sin logs de cuerpo.
import { createHmac, timingSafeEqual } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import schema from '../../contracts/C-SITES-RENDER/schema.json';
import { cacheTags } from '@/core/client';

const WINDOW_S = 300;
const ID = schema.$id;
const ajv = new Ajv2020({ strict: false, allErrors: false });
addFormats(ajv);
ajv.addSchema(schema);
const vEnvelope = ajv.getSchema(`${ID}#/$defs/EventEnvelope`)!;
const vPayload = ajv.getSchema(`${ID}#/$defs/RevalidationPayload`)!;

export interface RevalidatePayload { site_id: string; kind: string; slug?: string | null; host?: string | null; content_version: number }
export interface RevalidateRequest { headers: Headers; body: string }

/** SITES_REVALIDATE_SECRETS = JSON {keyId: secreto}. Cualquier defecto -> {} (todo 401). */
export function parseSecrets(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v !== 'string' || v.length === 0) return {};
      out[k] = v;
    }
    return out;
  } catch { return {}; }
}

/** Etiquetas a invalidar, SOLO del site_id del evento (formato de ST2-02). */
export function tagsFor(p: RevalidatePayload): string[] {
  const id = p.site_id;
  const t = { ...cacheTags, manifest: cacheTags.site }; // el manifiesto se lee con la etiqueta site:<id> (ST2-02)
  switch (p.kind) {
    case 'site': return [t.site(id)];
    case 'manifest': return [t.manifest(id)];
    case 'media': return [t.media(id), t.manifest(id)];
    case 'host': return p.host ? [t.host(p.host)] : [];
    case 'page': return p.slug ? [t.page(id, p.slug), t.manifest(id)] : [t.manifest(id)];
    default: return p.slug ? [t.item(id, p.kind as 'listing' | 'development' | 'zone' | 'building', p.slug), t.manifest(id)] : [t.manifest(id)];
  }
}

function signatureOk(signatures: string, ts: string, body: string, secret: string): boolean {
  const want = createHmac('sha256', secret).update(`${ts}.${body}`).digest();
  let ok = false;
  for (const part of signatures.split(',')) {
    const m = /^v1=([0-9a-f]+)$/.exec(part.trim());
    if (!m) continue;
    const got = Buffer.from(m[1], 'hex');
    if (got.length === want.length && timingSafeEqual(got, want)) ok = true; // sin cortocircuito
  }
  return ok;
}

export function createRevalidateHandler(o: { secrets: Record<string, string>; revalidate: (tag: string) => void; now?: () => number; maxSeen?: number }) {
  const now = o.now ?? Date.now;
  const maxSeen = o.maxSeen ?? 5000;
  const seen = new Set<string>(); // event_id (best-effort por instancia)
  const versions = new Map<string, number>(); // site_id -> mayor content_version vista

  return async function handle(req: RevalidateRequest): Promise<{ status: 204 | 400 | 401 }> {
    const h = req.headers;
    const keyId = h.get('x-nadakki-key-id');
    const ts = h.get('x-nadakki-timestamp');
    const sigs = h.get('x-nadakki-signature');
    const secret = keyId !== null && Object.hasOwn(o.secrets, keyId) ? o.secrets[keyId] : undefined;
    if (!secret || !ts || !sigs || !/^\d{1,12}$/.test(ts)) return { status: 401 };
    if (Math.abs(now() / 1000 - Number(ts)) > WINDOW_S) return { status: 401 };
    if (!signatureOk(sigs, ts, req.body, secret)) return { status: 401 };

    let ev: { event_id: string; payload: RevalidatePayload; site_id?: string };
    try { ev = JSON.parse(req.body); } catch { return { status: 400 }; }
    if (!vEnvelope(ev) || !vPayload(ev.payload)) return { status: 400 };
    if (h.get('x-nadakki-event-id') !== ev.event_id) return { status: 400 };
    const p = ev.payload;
    if (ev.site_id !== undefined && ev.site_id !== p.site_id) return { status: 400 };

    if (seen.has(ev.event_id)) return { status: 204 };
    const last = versions.get(p.site_id);
    if (last !== undefined && p.content_version < last) return { status: 204 };
    for (const tag of tagsFor(p)) o.revalidate(tag);
    seen.add(ev.event_id);
    if (seen.size > maxSeen) seen.delete(seen.values().next().value as string);
    versions.set(p.site_id, Math.max(last ?? 0, p.content_version));
    return { status: 204 };
  };
}
