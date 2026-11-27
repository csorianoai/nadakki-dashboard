import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const POST_SALE_LEGAL_CASES_PATH = "/api/v1/legal/cases";
export const POST_SALE_ASIENTOS_PATH = "/api/v1/contable/asientos";
export const POST_SALE_HEARTBEAT_PATH = "/api/marketing/scheduler/heartbeat";

export type PostSaleCase = { id: string; state: string | null };
/** GET /api/v1/contable/asientos (routers/contable/asientos_router.py): llega ordenado por fecha y numero, del mas nuevo. */
export type PostSaleAsiento = {
  id: string;
  status: string | null;
  numero: string | null;
  fecha: string | null;
  descripcion: string | null;
};
/** GET /api/v1/autos/dealers/{id}/vehicles (_SQL_LISTA_PRIVADA): llega del alta mas nueva a la mas vieja. */
export type PostSaleListing = {
  id: string;
  status: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  stock: string | null;
};
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

function readNumeroOTexto(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readTrimmed(value);
}

/** "2026-11-26" (o con hora) → "26/11/2026", sin pasar por Date (sin corrimiento de zona horaria). */
export function fechaCorta(iso: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/**
 * Resumenes legibles de la tarjeta "Tras una venta" (Cowork 26-nov): antes se listaban 134 lineas "<uuid> · posted"
 * y 25 "<uuid> · archivado". Nunca se muestra un id crudo: una fila sin dato legible no se lista, solo se cuenta.
 */
export function resumenAsientos(asientos: PostSaleAsiento[], max = 3): { total: number; ultimos: string[] } {
  const ultimos: string[] = [];
  for (const a of asientos) {
    if (ultimos.length >= max) break;
    const legible = [a.numero ? `N.º ${a.numero}` : null, a.descripcion].filter(Boolean);
    if (legible.length === 0) continue;
    ultimos.push([fechaCorta(a.fecha), ...legible].filter(Boolean).join(" · "));
  }
  return { total: asientos.length, ultimos };
}

const ESTADO_PLURAL: Record<string, [string, string]> = {
  disponible: ["disponible", "disponibles"],
  reservado: ["reservado", "reservados"],
  vendido: ["vendido", "vendidos"],
  draft: ["borrador", "borradores"],
};
const ORDEN_ESTADOS = ["disponible", "reservado", "vendido", "draft"];

/** Conteo por estado en palabras ("2 disponibles · 2 vendidos") y los ultimos autos con nombre; sin archivados. */
export function resumenAnuncios(listings: PostSaleListing[], max = 3): { conteo: string | null; ultimos: string[] } {
  const activos = listings.filter((l) => (l.status ?? "").toLowerCase() !== "archivado");
  const porEstado = new Map<string, number>();
  for (const l of activos) {
    const e = (l.status ?? "").toLowerCase();
    if (ESTADO_PLURAL[e]) porEstado.set(e, (porEstado.get(e) ?? 0) + 1);
  }
  const conteo = ORDEN_ESTADOS.filter((e) => porEstado.has(e))
    .map((e) => {
      const n = porEstado.get(e)!;
      return `${n} ${ESTADO_PLURAL[e]![n === 1 ? 0 : 1]}`;
    })
    .join(" · ");
  const ultimos: string[] = [];
  for (const l of activos) {
    if (ultimos.length >= max) break;
    const nombre = [l.make, l.model, l.year].filter((x) => x != null && x !== "").join(" ");
    if (!nombre) continue;
    const estado = ESTADO_PLURAL[(l.status ?? "").toLowerCase()]?.[0];
    ultimos.push([nombre, l.stock ? `stock ${l.stock}` : null, estado].filter(Boolean).join(" · "));
  }
  return { conteo: conteo || null, ultimos };
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
  return {
    id,
    status: readTrimmed(rec.status),
    numero: readNumeroOTexto(rec.numero_asiento),
    fecha: readTrimmed(rec.fecha_asiento),
    descripcion: readTrimmed(rec.descripcion),
  };
}

export function parsePostSaleListing(value: unknown): PostSaleListing | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const id = readTrimmed(rec.id);
  if (!id) return null;
  return {
    id,
    status: readTrimmed(rec.status),
    make: readTrimmed(rec.make),
    model: readTrimmed(rec.model),
    year: typeof rec.year === "number" && Number.isFinite(rec.year) ? rec.year : null,
    stock: readNumeroOTexto(rec.stock_number),
  };
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
