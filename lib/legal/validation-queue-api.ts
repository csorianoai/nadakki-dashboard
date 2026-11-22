import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson } from "@/lib/legal/parse-api-error";

/**
 * Cola de validación de abogados (backend: api/legal/expedientes/validation_queue_api.py,
 * prefijo /api/v1/legal/validation-queue). Solo lectura desde el Inicio legal:
 * asignar, aprobar y rechazar quedan fuera hasta validar permisos y flujos.
 *
 * Totales: el backend corregido (#2852) devuelve `total` y `has_more` en la lista y un
 * agregado en GET /validation-queue/summary. Contra un backend anterior (sin `total`),
 * el conteo se hace sobre la página y, si llega a 200, la vista se marca parcial.
 * Nunca se muestra un total que el servidor no haya confirmado.
 */
const LEGAL_PREFIX = "/api/legal";

/** Estados que todavía esperan a un abogado. */
export const OPEN_REVIEW_STATUSES = ["pending", "assigned", "in_review"] as const;

export interface ValidationQueueItem {
  queue_item_id: string;
  case_id: string;
  document_id: string;
  priority: string;
  status: string;
  sla_deadline: string | null;
  sla_breached: boolean;
  assigned_to: string | null;
  created_at: string | null;
}

export interface ValidationQueueList {
  items: ValidationQueueItem[];
  count: number;
  /** Total del servidor con los mismos filtros; null = desconocido (backend anterior o conteo fallido). */
  total: number | null;
  /** true si hay más ítems que los de esta página (o no se puede descartar). */
  hasMore: boolean;
}

/** GET /validation-queue/summary — agregado calculado en el servidor sobre la cola abierta del tenant. */
export interface ValidationQueueSummary {
  total_open: number;
  overdue: number;
  critical: number;
  high: number;
  unassigned: number;
  /** null = el usuario no tiene perfil de abogado: no se afirma 0. */
  assigned_to_me: number | null;
  attorney_profile: boolean;
  as_of: string | null;
}

function tenantHeaders(tenantId: string): HeadersInit {
  return { "X-Tenant-ID": tenantId.trim() };
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

export function normalizeQueueItem(raw: unknown): ValidationQueueItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.queue_item_id);
  const caseId = asString(o.case_id);
  if (!id || !caseId) return null;
  return {
    queue_item_id: id,
    case_id: caseId,
    document_id: asString(o.document_id) ?? "",
    priority: asString(o.priority) ?? "normal",
    status: asString(o.status) ?? "pending",
    sla_deadline: asString(o.sla_deadline),
    sla_breached: o.sla_breached === true || o.sla_breached === 1,
    assigned_to: asString(o.assigned_to),
    created_at: asString(o.created_at),
  };
}

export async function fetchValidationQueue(
  tenantId: string,
  limit = 200,
): Promise<ValidationQueueList> {
  const q = new URLSearchParams({ limit: String(limit), status: OPEN_REVIEW_STATUSES.join(",") });
  const res = await apiFetch(`${LEGAL_PREFIX}/validation-queue?${q.toString()}`, {
    headers: tenantHeaders(tenantId),
  });
  const raw = await readLegalJson<{ items?: unknown[]; total?: unknown; has_more?: unknown }>(
    res,
    "Error al cargar la cola de revisión",
  );
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(normalizeQueueItem)
    .filter((x): x is ValidationQueueItem => x !== null);
  const total = typeof raw.total === "number" && Number.isFinite(raw.total) ? raw.total : null;
  const hasMore = typeof raw.has_more === "boolean" ? raw.has_more : items.length >= limit;
  return { items, count: items.length, total, hasMore };
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Agregado de la cola. Devuelve null si el backend todavía no tiene el endpoint (404/405):
 * en ese caso el Inicio usa la lista y marca la vista parcial cuando corresponde.
 */
export async function fetchValidationQueueSummary(tenantId: string): Promise<ValidationQueueSummary | null> {
  const res = await apiFetch(`${LEGAL_PREFIX}/validation-queue/summary`, { headers: tenantHeaders(tenantId) });
  if (res.status === 404 || res.status === 405) return null;
  const raw = await readLegalJson<Record<string, unknown>>(res, "Error al cargar el resumen de la cola");
  const total = num(raw.total_open);
  if (total === null) return null;
  return {
    total_open: total,
    overdue: num(raw.overdue) ?? 0,
    critical: num(raw.critical) ?? 0,
    high: num(raw.high) ?? 0,
    unassigned: num(raw.unassigned) ?? 0,
    assigned_to_me: num(raw.assigned_to_me),
    attorney_profile: raw.attorney_profile === true,
    as_of: typeof raw.as_of === "string" ? raw.as_of : null,
  };
}

/** Ítems que siguen esperando revisión, los vencidos o urgentes primero. */
export function openReviewItems(items: ValidationQueueItem[]): ValidationQueueItem[] {
  const rank = (p: string) => (p === "critical" ? 0 : p === "high" ? 1 : 2);
  return items
    .filter((i) => (OPEN_REVIEW_STATUSES as readonly string[]).includes(i.status))
    .sort((a, b) => {
      if (a.sla_breached !== b.sla_breached) return a.sla_breached ? -1 : 1;
      if (rank(a.priority) !== rank(b.priority)) return rank(a.priority) - rank(b.priority);
      return String(a.sla_deadline ?? "").localeCompare(String(b.sla_deadline ?? ""));
    });
}
