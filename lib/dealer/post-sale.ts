import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const POST_SALE_LEGAL_CASES_PATH = "/api/v1/legal/cases";
export const POST_SALE_ASIENTOS_PATH = "/api/v1/contable/asientos";
export const POST_SALE_HEARTBEAT_PATH = "/api/marketing/scheduler/heartbeat";

export type PostSaleCase = { id: string; state: string | null };
export type PostSaleAsiento = { id: string; status: string | null };
export type PostSaleListing = { id: string; status: string | null };
export type PostSaleHeartbeat = Record<string, string | number | boolean>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function accessGet(path: string, tenantId: string): Promise<unknown> {
  const response = await apiFetch(path, {
    method: "GET",
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

function asList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const rec = asRecord(body);
  if (!rec) return [];
  if (Array.isArray(rec.cases)) return rec.cases;
  if (Array.isArray(rec.items)) return rec.items;
  if (Array.isArray(rec.vehicles)) return rec.vehicles;
  if (Array.isArray(rec.data)) return rec.data;
  return [];
}

export function parsePostSaleCase(value: unknown): PostSaleCase | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id) ?? readTrimmed(rec.case_id);
  if (!id) return null;
  return { id, state: readTrimmed(rec.state) };
}

export function parsePostSaleAsiento(value: unknown): PostSaleAsiento | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return { id, status: readTrimmed(rec.status) };
}

export function parsePostSaleListing(value: unknown): PostSaleListing | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return { id, status: readTrimmed(rec.status) };
}

export function parseHeartbeat(value: unknown): PostSaleHeartbeat {
  const rec = asRecord(value);
  if (!rec) return {};
  const out: PostSaleHeartbeat = {};
  for (const [key, raw] of Object.entries(rec)) {
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      out[key] = raw;
    }
  }
  return out;
}

export function dealerVehiclesUrl(dealerId: string): string {
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles`;
}

/**
 * Cada parte de la tarjeta post-venta se lee por separado (Cowork, 26-nov): un plan sin Legal da 403
 * `capability_denied:legal.cases.view:<razon>` y un tenant sin marketing da 404 `heartbeat_not_found`; antes
 * cualquiera de los dos tumbaba la tarjeta entera con "DEFAULT_DENY".
 */
export type PostSaleParte<T> =
  | { estado: "ok"; datos: T }
  | { estado: "no_incluido" }
  | { estado: "sin_datos" }
  | { estado: "error" };

export type PostSaleSnapshot = {
  cases: PostSaleParte<PostSaleCase[]>;
  asientos: PostSaleParte<PostSaleAsiento[]>;
  listings: PostSaleParte<PostSaleListing[]>;
  heartbeat: PostSaleParte<PostSaleHeartbeat>;
};

/** Texto del `detail` del backend, sea `detail: "..."` o `detail: { detail | code | error: "..." }`. */
function detalleTexto(detail: unknown): string | null {
  const directo = readTrimmed(detail);
  if (directo) return directo;
  const rec = asRecord(detail);
  if (!rec) return null;
  return readTrimmed(rec.detail) ?? readTrimmed(rec.code) ?? readTrimmed(rec.error);
}

/** `capability_denied:<capability>:<razon>` → sus partes; null si el texto no tiene esa forma. */
export function parseCapabilityDenied(texto: string | null | undefined): { capability: string; razon: string | null } | null {
  const m = /^capability_denied:([^:\s]+)(?::(.*))?$/.exec((texto ?? "").trim());
  if (!m) return null;
  return { capability: m[1]!, razon: m[2]?.trim() || null };
}

export function clasificarFalloPostSale(error: unknown): "no_incluido" | "sin_datos" | "error" {
  if (!(error instanceof AccessApiError)) return "error";
  const texto = detalleTexto(error.detail);
  if (error.status === 403 && parseCapabilityDenied(texto)) return "no_incluido";
  if (error.status === 404 && texto === "heartbeat_not_found") return "sin_datos";
  return "error";
}

function parte<T>(r: PromiseSettledResult<unknown>, mapear: (body: unknown) => T): PostSaleParte<T> {
  if (r.status === "fulfilled") return { estado: "ok", datos: mapear(r.value) };
  return { estado: clasificarFalloPostSale(r.reason) };
}

export async function fetchPostSaleSnapshot(tenantId: string, dealerId: string | null): Promise<PostSaleSnapshot> {
  const [casesR, asientosR, heartbeatR, listingsR] = await Promise.allSettled([
    accessGet(POST_SALE_LEGAL_CASES_PATH, tenantId),
    accessGet(POST_SALE_ASIENTOS_PATH, tenantId),
    accessGet(POST_SALE_HEARTBEAT_PATH, tenantId),
    dealerId ? accessGet(dealerVehiclesUrl(dealerId), tenantId) : Promise.resolve([]),
  ]);
  return {
    cases: parte(casesR, (body) =>
      asList(body)
        .map(parsePostSaleCase)
        .filter((row): row is PostSaleCase => row != null)
        .filter((row) => row.state !== "CLOSED" && row.state !== "ARCHIVED"),
    ),
    asientos: parte(asientosR, (body) =>
      asList(body).map(parsePostSaleAsiento).filter((row): row is PostSaleAsiento => row != null),
    ),
    listings: parte(listingsR, (body) =>
      asList(body).map(parsePostSaleListing).filter((row): row is PostSaleListing => row != null),
    ),
    heartbeat: parte(heartbeatR, parseHeartbeat),
  };
}
