// Cliente tipado, de SOLO LECTURA, de C-SITES-RENDER (copia congelada en contracts/). Autocontenido.
// fetch INYECTADO; nunca envia tenant_id (el core lo deduce de host/site_id); nunca imprime ni registra el token.
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import schema from '../../contracts/C-SITES-RENDER/schema.json';
import type { Manifest, Page, PublicBuilding, PublicDevelopment, PublicListing, PublicMedia, PublicPage, PublicZone, ResolveResult } from './types';

export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'HOST_NOT_FOUND' | 'SITE_UNPUBLISHED' | 'VALIDATION_ERROR' | 'RATE_LIMITED'
  | 'UNAVAILABLE' | 'CONTRACT_VIOLATION';
const PROBLEM_CODES = ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'HOST_NOT_FOUND', 'SITE_UNPUBLISHED', 'VALIDATION_ERROR', 'RATE_LIMITED'];
const BY_STATUS: Record<number, ErrorCode> = { 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 410: 'SITE_UNPUBLISHED', 422: 'VALIDATION_ERROR', 429: 'RATE_LIMITED' };

/** Error del core: mensaje fijo por code, sin detalle interno del servidor ni de la red. */
export class CoreError extends Error {
  constructor(readonly code: ErrorCode, readonly status?: number, readonly retryAfter?: number) {
    super(`core:${code}`);
    this.name = 'CoreError';
  }
}

type FetchFn = typeof globalThis.fetch;
export interface CoreClientOptions { baseUrl: string; token: string; fetch: FetchFn; timeoutMs?: number; cacheMax?: number }

/** Etiquetas de cache de Next (formato fijado en ST2-02, consumido por ST2-03/04). */
export const cacheTags = {
  site: (id: string) => `site:${id}`,
  page: (id: string, key: string) => `site:${id}:page:${key}`,
  item: (id: string, kind: 'listing' | 'development' | 'zone' | 'building', slug: string) => `site:${id}:${kind}:${slug}`,
  media: (id: string) => `site:${id}:media`,
  host: (host: string) => `host:${host}`,
};

const ID = schema.$id;
const ajv = new Ajv2020({ strict: false, allErrors: false });
addFormats(ajv);
ajv.addSchema(schema);
const def = (name: string): ValidateFunction => ajv.getSchema(`${ID}#/$defs/${name}`)!;
const listOf = (name: string): ValidateFunction => ajv.compile({
  type: 'object', additionalProperties: false, required: ['items', 'next_cursor'],
  properties: { items: { type: 'array', items: { $ref: `${ID}#/$defs/${name}` } }, next_cursor: { type: ['string', 'null'] } },
});
const V = {
  uuid: def('Uuid'), slug: def('Slug'), host: def('Host'), resolve: def('ResolveResult'), manifest: def('Manifest'), page: def('PublicPage'),
  listing: def('PublicListing'), development: def('PublicDevelopment'), zone: def('PublicZone'), building: def('PublicBuilding'), media: def('PublicMedia'),
  listings: listOf('PublicListing'), developments: listOf('PublicDevelopment'), zones: listOf('PublicZone'), buildings: listOf('PublicBuilding'),
};
const PAGE_KEY = /^[a-z][a-z0-9_]{0,47}$/;
const FORBIDDEN_KEYS = new Set(['tenant_id', 'storage_key']);

/** El contrato prohibe tenant_id y storage_key en cualquier profundidad (incluidos objetos libres como theme). */
function hasForbiddenKey(v: unknown): boolean {
  if (Array.isArray(v)) return v.some(hasForbiddenKey);
  if (v && typeof v === 'object') return Object.entries(v).some(([k, x]) => FORBIDDEN_KEYS.has(k) || hasForbiddenKey(x));
  return false;
}

const bad = (): CoreError => new CoreError('VALIDATION_ERROR');
function need(v: ValidateFunction, x: unknown): string {
  if (typeof x !== 'string' || !v(x)) throw bad();
  return x;
}
function need2(re: RegExp, x: unknown): string {
  if (typeof x !== 'string' || !re.test(x)) throw bad();
  return x;
}

export interface ListQuery { limit?: number; cursor?: string; updated_since?: string; zone?: string; development?: string; featured?: boolean }

function queryString(q: ListQuery = {}, allowed: (keyof ListQuery)[]): string {
  const p = new URLSearchParams();
  for (const k of allowed) {
    const v = q[k];
    if (v === undefined) continue;
    if (k === 'limit' && (!Number.isInteger(v) || (v as number) < 1 || (v as number) > 200)) throw bad();
    if (k === 'cursor' && (typeof v !== 'string' || v.length > 512)) throw bad();
    if ((k === 'zone' || k === 'development') && !V.slug(v)) throw bad();
    if (k === 'updated_since' && (typeof v !== 'string' || Number.isNaN(Date.parse(v)))) throw bad();
    p.set(k, String(v));
  }
  p.sort();
  const s = p.toString();
  return s ? `?${s}` : '';
}

function retryAfterOf(h: string | null): number | undefined {
  if (!h) return undefined;
  const n = Number(h);
  if (Number.isFinite(n) && n >= 0) return n;
  const d = Date.parse(h);
  return Number.isNaN(d) ? undefined : Math.max(0, Math.ceil((d - Date.now()) / 1000));
}

async function toError(res: Response): Promise<CoreError> {
  if (res.status >= 500) return new CoreError('UNAVAILABLE', res.status);
  let code: ErrorCode | undefined;
  try {
    const b = (await res.json()) as { code?: unknown };
    if (typeof b.code === 'string' && PROBLEM_CODES.includes(b.code)) code = b.code as ErrorCode;
  } catch { /* cuerpo no JSON: se decide por status */ }
  code ??= BY_STATUS[res.status];
  if (!code) return new CoreError('UNAVAILABLE', res.status);
  return new CoreError(code, res.status, code === 'RATE_LIMITED' ? retryAfterOf(res.headers.get('retry-after')) : undefined);
}

export function createCoreClient(opts: CoreClientOptions) {
  const timeoutMs = opts.timeoutMs ?? 3000;
  const cacheMax = opts.cacheMax ?? 256;
  const base = opts.baseUrl.replace(/\/+$/, '');
  const cache = new Map<string, { etag: string; body: unknown }>(); // clave = URL completa (incluye site_id)

  async function get<T>(path: string, tags: string[], v: ValidateFunction): Promise<T> {
    const url = base + path;
    const hit = cache.get(url);
    const headers: Record<string, string> = { authorization: `Bearer ${opts.token}`, accept: 'application/json' };
    if (hit) headers['if-none-match'] = hit.etag;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      let res: Response;
      try {
        res = await opts.fetch(url, { method: 'GET', headers, signal: ctl.signal, redirect: 'error', next: { tags } } as RequestInit);
      } catch {
        throw new CoreError('UNAVAILABLE');
      }
      if (res.status === 304) {
        if (!hit) throw new CoreError('UNAVAILABLE', 304);
        cache.delete(url);
        cache.set(url, hit); // recencia
        return hit.body as T;
      }
      if (res.status !== 200) throw await toError(res);
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        throw new CoreError('CONTRACT_VIOLATION', 200);
      }
      if (hasForbiddenKey(body) || !v(body)) throw new CoreError('CONTRACT_VIOLATION', 200);
      const etag = res.headers.get('etag');
      if (etag) {
        cache.delete(url);
        cache.set(url, { etag, body });
        if (cache.size > cacheMax) cache.delete(cache.keys().next().value as string);
      }
      return body as T;
    } catch (e) {
      throw e instanceof CoreError ? e : new CoreError('UNAVAILABLE');
    } finally {
      clearTimeout(timer);
    }
  }

  const site = (id: string) => need(V.uuid, id);
  const item = <T>(kind: 'listing' | 'development' | 'zone' | 'building', plural: string, v: ValidateFunction) => async (siteId: string, slug: string): Promise<T> => {
    const id = site(siteId);
    return get<T>(`/public/${id}/${plural}/${need(V.slug, slug)}`, [cacheTags.site(id), cacheTags.item(id, kind, slug)], v);
  };
  const list = <T>(plural: string, v: ValidateFunction, allowed: (keyof ListQuery)[]) => async (siteId: string, q?: ListQuery): Promise<Page<T>> => {
    const id = site(siteId);
    return get<Page<T>>(`/public/${id}/${plural}${queryString(q, allowed)}`, [cacheTags.site(id)], v);
  };
  const common: (keyof ListQuery)[] = ['limit', 'cursor', 'updated_since'];

  return {
    timeoutMs,
    async resolveHost(host: string): Promise<ResolveResult> {
      const h = need(V.host, host.toLowerCase());
      return get(`/public/resolve?host=${encodeURIComponent(h)}`, [cacheTags.host(h)], V.resolve);
    },
    async getManifest(siteId: string): Promise<Manifest> {
      const id = site(siteId);
      return get(`/public/${id}/manifest`, [cacheTags.site(id)], V.manifest);
    },
    async getPage(siteId: string, pageKey: string): Promise<PublicPage> {
      const id = site(siteId);
      return get(`/public/${id}/pages/${need2(PAGE_KEY, pageKey)}`, [cacheTags.site(id), cacheTags.page(id, pageKey)], V.page);
    },
    async getMedia(siteId: string, assetId: string): Promise<PublicMedia> {
      const id = site(siteId);
      return get(`/public/${id}/media/${need(V.uuid, assetId)}`, [cacheTags.site(id), cacheTags.media(id)], V.media);
    },
    getListing: item<PublicListing>('listing', 'listings', V.listing),
    getDevelopment: item<PublicDevelopment>('development', 'developments', V.development),
    getZone: item<PublicZone>('zone', 'zones', V.zone),
    getBuilding: item<PublicBuilding>('building', 'buildings', V.building),
    listListings: list<PublicListing>('listings', V.listings, [...common, 'zone', 'development', 'featured']),
    listDevelopments: list<PublicDevelopment>('developments', V.developments, [...common, 'zone']),
    listZones: list<PublicZone>('zones', V.zones, common),
    listBuildings: list<PublicBuilding>('buildings', V.buildings, [...common, 'zone']),
  };
}

export type CoreClient = ReturnType<typeof createCoreClient>;

/** Configuracion por env (SITES_CORE_URL, SITES_CORE_TOKEN). Los valores nunca se incluyen en errores. */
export function createCoreClientFromEnv(fetchFn: FetchFn, env: Record<string, string | undefined> = process.env): CoreClient {
  const baseUrl = env.SITES_CORE_URL;
  const token = env.SITES_CORE_TOKEN;
  if (!baseUrl || !token || !/^https?:\/\//.test(baseUrl)) throw new CoreError('UNAVAILABLE');
  return createCoreClient({ baseUrl, token, fetch: fetchFn });
}

/** Recorre paginas por cursor con tope de items y de paginas; `truncated` indica que quedaban mas. */
export async function collectAll<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
  opts: { maxItems?: number; maxPages?: number } = {},
): Promise<{ items: T[]; truncated: boolean }> {
  const maxItems = opts.maxItems ?? 1000;
  const maxPages = opts.maxPages ?? 50;
  const items: T[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    if (items.length >= maxItems) return { items: items.slice(0, maxItems), truncated: items.length > maxItems || page.next_cursor !== null };
    if (page.next_cursor === null) return { items, truncated: false };
    if (seen.has(page.next_cursor)) throw new CoreError('CONTRACT_VIOLATION');
    seen.add(page.next_cursor);
    cursor = page.next_cursor;
  }
  return { items, truncated: true };
}
