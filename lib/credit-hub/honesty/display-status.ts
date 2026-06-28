import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";

/**
 * Display status for dealer/bank tiles until backend `display_status` ships.
 * Maps frontend `status` (+ optional backend `state` from raw) to human buckets.
 */
export type DisplayStatus =
  | "DRAFT"
  | "ACTIVE"
  | "APPROVED"
  | "REJECTED"
  | "FUNDED"
  | "OFFERED"
  | "LEGACY";

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "En curso",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  FUNDED: "Completada",
  OFFERED: "Con ofertas",
  LEGACY: "Legado",
};

const ACTIVE_STATUSES = new Set([
  "submitted",
  "processing",
  "manual_review",
  "conditioned",
  "received",
  "ai_analysis",
  "ai_complete",
  "bank_submitted",
  "hybrid_in_progress",
]);

export function resolveDisplayStatus(
  status: CreditApplicationStatus,
  backendState?: string | null,
): DisplayStatus {
  const s = status.toLowerCase();
  const raw = (backendState ?? "").toUpperCase();

  if (s === "draft" || raw === "DRAFT") return "DRAFT";
  if (["approved", "approved_with_stipulations"].includes(s)) return "APPROVED";
  if (["rejected", "declined"].includes(s) || raw === "FAILED") return "REJECTED";
  if (["processed", "completed"].includes(s) || ["COMPLETED", "BANK_COMPLETE"].includes(raw))
    return "FUNDED";
  if (["offered", "counter_offer"].includes(s) || raw === "OFFER_SELECTED") return "OFFERED";
  if (ACTIVE_STATUSES.has(s) || ["RECEIVED", "AI_ANALYSIS", "AI_COMPLETE", "BANK_SUBMITTED", "HYBRID_IN_PROGRESS"].includes(raw))
    return "ACTIVE";
  return "LEGACY";
}

export function isPipelineActiveDisplay(status: CreditApplicationStatus): boolean {
  const d = resolveDisplayStatus(status);
  return d === "ACTIVE" || d === "OFFERED";
}
