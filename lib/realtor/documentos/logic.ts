import type { OperationDoc, DocStatus, Template } from "./types";
import { DOC_STATUSES } from "./types";

/** Una plantilla solo es «aprobada» con el visto bueno completo del abogado de Florida; en cualquier otro caso está pendiente. */
export function templateState(t: Template): "aprobada" | "pendiente" {
  const a = t.lawyerApproval;
  return a && a.reviewer.trim() !== "" && a.date.trim() !== "" ? "aprobada" : "pendiente";
}

export function countByDocStatus(list: readonly OperationDoc[]): Record<DocStatus, number> {
  const out = Object.fromEntries(DOC_STATUSES.map((s) => [s, 0])) as Record<DocStatus, number>;
  for (const d of list) out[d.status] += 1;
  return out;
}
