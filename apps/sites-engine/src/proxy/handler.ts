// Decision del proxy host -> sitio, pura (sin Next): recibe url y cabeceras, devuelve que hacer.
import type { CoreClient } from '@/core/client';
import { isPanelHost, normalizeHost } from './host';
import { createResolver } from './resolver';

export type Decision =
  | { kind: 'rewrite'; pathname: string; search: string; requestHeaders: Headers }
  | { kind: 'redirect'; status: 301; location: string; headers: Record<string, string> }
  | { kind: 'status'; status: 404 | 503; headers: Record<string, string> };

const STRIP = /^(x-tenant-|x-site-|x-middleware-)|^x-forwarded-host$/i;
const VARY = 'host';

/** Quita de la peticion entrante todo lo que el cliente podria usar para envenenar cache o elegir tenant. */
export function sanitizeHeaders(src: Headers): Headers {
  const out = new Headers();
  src.forEach((v, k) => { if (!STRIP.test(k) && k.toLowerCase() !== 'set-cookie') out.append(k, v); });
  return out;
}

const notFound = (): Decision => ({ kind: 'status', status: 404, headers: { 'cache-control': 'public, max-age=30', vary: VARY } });
const unavailable = (retryAfter: number): Decision => ({ kind: 'status', status: 503, headers: { 'retry-after': String(retryAfter), 'cache-control': 'no-store', vary: VARY } });

/** La ruta interna /s/... solo se alcanza por la reescritura: toda peticion externa a ella (en cualquier forma) es 404. */
export function isInternalPath(pathname: string): boolean {
  if (/%2f|%5c/i.test(pathname)) return true; // separadores codificados: ambiguos, se tratan como hostiles
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return true; }
  const norm = decoded.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  return /^\/s(\/|$)/i.test(norm) || norm.split('/').some((s) => s === '.' || s === '..');
}

export function createHandler(o: { client: Pick<CoreClient, 'resolveHost'>; now?: () => number }) {
  const resolve = createResolver(o.client, { now: o.now });
  return async function handle(req: { url: string; headers: Headers }): Promise<Decision> {
    const host = normalizeHost(req.headers.get('host'));
    if (!host || isPanelHost(host)) return notFound(); // el panel nunca se consulta al core
    let url: URL;
    try { url = new URL(req.url); } catch { return notFound(); }
    if (isInternalPath(url.pathname)) return notFound();
    const r = await resolve(host);
    if (r.kind === 'not_found') return notFound();
    if (r.kind === 'unavailable') return unavailable(r.retryAfter);
    const { result } = r;
    if (result.state === 'redirect') {
      const to = normalizeHost(result.primary_host);
      if (!to || isPanelHost(to)) return unavailable(5);
      return { kind: 'redirect', status: 301, location: `https://${to}${url.pathname}${url.search}`, headers: { 'cache-control': 'public, max-age=30', vary: VARY } };
    }
    return { kind: 'rewrite', pathname: `/s/${result.site_id}${url.pathname}`, search: url.search, requestHeaders: sanitizeHeaders(req.headers) };
  };
}
