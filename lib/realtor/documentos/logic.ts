import type { OperationDoc, DocStatus, Template } from "./types";
import { DOC_STATUSES } from "./types";

/** Una plantilla solo es «aprobada» con el visto bueno completo del abogado de Florida; en cualquier otro caso está pendiente. */
export function templateState(t: Template): "aprobada" | "pendiente" {
  const a = t.lawyerApproval;
  return a && a.reviewer.trim() !== "" && isPastIsoDate(a.date.trim()) ? "aprobada" : "pendiente";
}

/** AAAA-MM-DD real y no futura. */
function isPastIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && d.getTime() <= Date.now();
}

export function countByDocStatus(list: readonly OperationDoc[]): Record<DocStatus, number> {
  const out = Object.fromEntries(DOC_STATUSES.map((s) => [s, 0])) as Record<DocStatus, number>;
  for (const d of list) out[d.status] += 1;
  return out;
}
