import { apiFetch } from "@/lib/api/fetch-client";
import { SitesApiError, errorFromResponse } from "./errors";
import type {
  Building, BuildingCreate, BuildingUpdate, ComplianceEvaluation, ComplianceOverride, Development, DevelopmentCreate,
  DevelopmentUpdate, Listing, ListingCreate, ListingUpdate, MediaAsset, MediaCreate, MediaPresign, MediaPresignRequest,
  MediaRevoke, MediaUpdate, OverrideCreate, Page, PageUpdate, Paginated, PublishRequest, PublishResult, ReadinessReport,
  Site, SiteUpdate, Zone, ZoneCreate, ZoneUpdate,
} from "./types";

/** Cliente de C-SITES-ADMIN-API 1.0.0 sobre apiFetch (Bearer + reintento 401). El tenant sale del JWT: jamas se envia. */
const BASE = "/api/v1/sites";

export interface CallOpts { idempotencyKey?: string }
export interface ListQuery { limit?: number; cursor?: string }

export function newIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

const forbidden = () => new SitesApiError(0, "TENANT_FIELD_FORBIDDEN", "tenant_id no se envia desde el cliente");

/** Busca `tenant_id` a cualquier profundidad del cuerpo. */
function hasTenantField(v: unknown, depth = 0): boolean {
  if (!v || typeof v !== "object" || depth > 10) return false;
  if (Array.isArray(v)) return v.some((x) => hasTenantField(x, depth + 1));
  return Object.entries(v).some(([k, x]) => k === "tenant_id" || hasTenantField(x, depth + 1));
}

function seg(id: string): string {
  if (!id || id === "." || id === ".." || /[/?#\\%]/.test(id)) throw new SitesApiError(0, "VALIDATION_ERROR", "Identificador invalido");
  return encodeURIComponent(id);
}

function qs(q: object = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (k === "tenant_id") throw forbidden();
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function call<T>(method: "GET" | "POST" | "PATCH" | "PUT", pathFn: () => string, body?: object, opts?: CallOpts): Promise<T> {
  if (body !== undefined && hasTenantField(body)) throw forbidden();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // Toda escritura POST/PUT lleva clave; el reintento de la misma operacion usa la misma (se fija una vez, antes de enviar).
  if (method === "POST" || method === "PUT") headers["Idempotency-Key"] = opts?.idempotencyKey ?? newIdempotencyKey();
  const init = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) };
  const url = `${BASE}${pathFn()}`;
  let res: Response;
  try {
    res = await apiFetch(url, init);
  } catch {
    try { res = await apiFetch(url, init); } catch { throw new SitesApiError(0, "NETWORK", "Sin conexion"); }
  }
  if (!res.ok) throw await errorFromResponse(res);
  try {
    return (await res.json()) as T; // incluye 202: es resultado, no error
  } catch {
    throw new SitesApiError(res.status, "UNKNOWN", "Respuesta ilegible");
  }
}

// La ruta es un thunk: un id invalido rechaza la promesa en vez de lanzar de forma sincrona.
type P = () => string;
const get = <T>(p: P, q?: object) => call<T>("GET", () => p() + qs(q));
const post = <T>(p: P, b: object, o?: CallOpts) => call<T>("POST", p, b, o);
const patch = <T>(p: P, b: object) => call<T>("PATCH", p, b);
const sp = (siteId: string) => `/sites/${seg(siteId)}`;

// Sitios y publicacion
export const listSites = (q: ListQuery & { status?: string } = {}) => get<Paginated<Site>>(() => "/sites", q);
export const getSite = (siteId: string) => get<Site>(() => sp(siteId));
export const updateSite = (siteId: string, b: SiteUpdate) => patch<Site>(() => sp(siteId), b);
export const publishSite = (siteId: string, b: PublishRequest = {}, o?: CallOpts) => post<PublishResult>(() => `${sp(siteId)}/publish`, b, o);
export const unpublishSite = (siteId: string, b: PublishRequest = {}, o?: CallOpts) => post<PublishResult>(() => `${sp(siteId)}/unpublish`, b, o);
export const getReadiness = (siteId: string) => get<ReadinessReport>(() => `${sp(siteId)}/readiness`);
export const listEvaluations = (siteId: string, q: ListQuery & { result?: string } = {}) =>
  get<Paginated<ComplianceEvaluation>>(() => `${sp(siteId)}/evaluations`, q);
export const createOverride = (siteId: string, b: OverrideCreate, o?: CallOpts) => post<ComplianceOverride>(() => `${sp(siteId)}/overrides`, b, o);

// Paginas
export const listPages = (siteId: string, q: ListQuery = {}) => get<Paginated<Page>>(() => `${sp(siteId)}/pages`, q);
export const getPage = (siteId: string, pageId: string) => get<Page>(() => `${sp(siteId)}/pages/${seg(pageId)}`);
export const updatePage = (siteId: string, pageId: string, b: PageUpdate) => patch<Page>(() => `${sp(siteId)}/pages/${seg(pageId)}`, b);

// Colecciones con alta y edicion
function collection<T, C extends object, U extends object>(name: string) {
  return {
    list: (siteId: string, q: ListQuery = {}) => get<Paginated<T>>(() => `${sp(siteId)}/${name}`, q),
    create: (siteId: string, b: C, o?: CallOpts) => post<T>(() => `${sp(siteId)}/${name}`, b, o),
    update: (siteId: string, id: string, b: U) => patch<T>(() => `${sp(siteId)}/${name}/${seg(id)}`, b),
  };
}
const L = collection<Listing, ListingCreate, ListingUpdate>("listings");
export const getListing = (siteId: string, id: string) => get<Listing>(() => `${sp(siteId)}/listings/${seg(id)}`);
export const listListings = L.list, createListing = L.create, updateListing = L.update;
const D = collection<Development, DevelopmentCreate, DevelopmentUpdate>("developments");
export const listDevelopments = D.list, createDevelopment = D.create, updateDevelopment = D.update;
const Z = collection<Zone, ZoneCreate, ZoneUpdate>("zones");
export const listZones = Z.list, createZone = Z.create, updateZone = Z.update;
const B = collection<Building, BuildingCreate, BuildingUpdate>("buildings");
export const listBuildings = B.list, createBuilding = B.create, updateBuilding = B.update;

// Medios
export const presignMedia = (siteId: string, b: MediaPresignRequest, o?: CallOpts) => post<MediaPresign>(() => `${sp(siteId)}/media/presign`, b, o);
export const createMedia = (siteId: string, b: MediaCreate, o?: CallOpts) => post<MediaAsset>(() => `${sp(siteId)}/media`, b, o);
export const listMedia = (siteId: string, q: ListQuery = {}) => get<Paginated<MediaAsset>>(() => `${sp(siteId)}/media`, q);
export const updateMedia = (siteId: string, mediaId: string, b: MediaUpdate) => patch<MediaAsset>(() => `${sp(siteId)}/media/${seg(mediaId)}`, b);
export const revokeMedia = (siteId: string, mediaId: string, reason: MediaRevoke["reason"], o?: CallOpts) =>
  post<MediaAsset>(() => `${sp(siteId)}/media/${seg(mediaId)}/revoke`, { reason }, o);
