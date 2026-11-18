// Resolucion host -> sitio con cache en memoria acotada. El tenant se deduce SIEMPRE del Host real.
import { CoreError, type CoreClient } from '@/core/client';
import type { ResolveResult } from '@/core/types';

export const TTL_MS = 60_000; // = s-maxage de C-SITES-RENDER
export const NEGATIVE_TTL_MS = 30_000; // = max-age de los 404 del contrato
export type Resolution =
  | { kind: 'site'; result: ResolveResult }
  | { kind: 'not_found' }
  | { kind: 'unavailable'; retryAfter: number };

interface Entry { at: number; ttl: number; value: Resolution }

export function createResolver(client: Pick<CoreClient, 'resolveHost'>, o: { now?: () => number; max?: number } = {}) {
  const now = o.now ?? Date.now;
  const max = o.max ?? 1000;
  const cache = new Map<string, Entry>();
  const inflight = new Map<string, Promise<Resolution>>();

  async function fetchOne(host: string): Promise<Resolution> {
    try {
      const result = await client.resolveHost(host);
      // Defensa en profundidad: el core debe contestar por el host pedido; si no, nunca se sirve.
      if (result.host !== host) return { kind: 'unavailable', retryAfter: 5 };
      return { kind: 'site', result };
    } catch (e) {
      const code = e instanceof CoreError ? e.code : 'UNAVAILABLE';
      if (code === 'HOST_NOT_FOUND' || code === 'SITE_UNPUBLISHED' || code === 'NOT_FOUND' || code === 'VALIDATION_ERROR') return { kind: 'not_found' };
      const ra = e instanceof CoreError && e.retryAfter ? Math.min(Math.ceil(e.retryAfter), 60) : 5;
      return { kind: 'unavailable', retryAfter: ra };
    }
  }

  return async function resolve(host: string): Promise<Resolution> {
    const hit = cache.get(host);
    if (hit && now() - hit.at < hit.ttl) return hit.value;
    cache.delete(host);
    let p = inflight.get(host);
    if (!p) {
      p = fetchOne(host).then((value) => {
        if (value.kind !== 'unavailable') { // los fallos del core no se cachean
          cache.set(host, { at: now(), ttl: value.kind === 'site' ? TTL_MS : NEGATIVE_TTL_MS, value });
          if (cache.size > max) cache.delete(cache.keys().next().value as string);
        }
        return value;
      }).finally(() => inflight.delete(host));
      inflight.set(host, p);
    }
    return p;
  };
}
