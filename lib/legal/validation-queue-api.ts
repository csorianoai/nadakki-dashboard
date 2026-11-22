import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson } from "@/lib/legal/parse-api-error";

/**
 * Cola de validación de abogados (backend: api/legal/expedientes/validation_queue_api.py,
 * prefijo /api/v1/legal/validation-queue). Solo lectura desde el Inicio legal:
 * asignar, aprobar y rechazar quedan fuera hasta validar permisos y flujos.
 *
 * No se usa GET /validation-queue/stats: la consulta compara `sla_breached = 1`
 * sobre una columna BOOLEAN y puede fallar en PostgreSQL. El conteo se calcula
 * aquí a partir de la lista.
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
  const q = new URLSearchParams({ limit: String(limit) });
  const res = await apiFetch(`${LEGAL_PREFIX}/validation-queue?${q.toString()}`, {
    headers: tenantHeaders(tenantId),
  });
  const raw = await readLegalJson<{ items?: unknown[] }>(res, "Error al cargar la cola de revisión");
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(normalizeQueueItem)
    .filter((x): x is ValidationQueueItem => x !== null);
  return { items, count: items.length };
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
