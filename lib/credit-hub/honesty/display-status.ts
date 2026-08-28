import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";

/**
 * Canonical display_status values from CreditOrchestrator (server source of truth).
 * Local buckets are fallback only when `display_status` is absent (legacy payloads).
 */
export type ServerDisplayStatus =
  | "DRAFT"
  | "RECEIVED"
  | "AI_ANALYSIS"
  | "AI_COMPLETE"
  | "BANK_SUBMITTED"
  | "SENT_TO_BANKS"
  | "HYBRID_IN_PROGRESS"
  | "DOCUMENTS_PENDING"
  | "OFFER_SELECTED"
  | "READY_FOR_DISBURSEMENT"
  | "DISBURSED"
  | "OFFERS_RECEIVED"
  | "BANK_COMPLETE"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | (string & {});

/** UI bucket for legacy grouping (pipeline tiles). */
export type DisplayStatus =
  | "DRAFT"
  | "ACTIVE"
  | "APPROVED"
  | "REJECTED"
  | "FUNDED"
  | "OFFERED"
  | "LEGACY";

export const SERVER_DISPLAY_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  RECEIVED: "Recibida",
  AI_ANALYSIS: "Análisis IA",
  AI_COMPLETE: "IA completada",
  BANK_SUBMITTED: "En banco",
  SENT_TO_BANKS: "Enviada a bancos",
  HYBRID_IN_PROGRESS: "Híbrido en curso",
  DOCUMENTS_PENDING: "Documentos pendientes",
  OFFER_SELECTED: "Oferta seleccionada",
  READY_FOR_DISBURSEMENT: "Lista para desembolso",
  DISBURSED: "Desembolsada",
  OFFERS_RECEIVED: "Ofertas recibidas · pendiente de revisión",
  BANK_COMPLETE: "Banco completado",
  COMPLETED: "Completada",
  FAILED: "Fallida",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "En curso",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  FUNDED: "Completada",
  OFFERED: "Con ofertas",
  LEGACY: "Estado legado",
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

let legacyWarned = false;

function warnLegacyMappingOnce(): void {
  if (legacyWarned || process.env.NODE_ENV === "production") return;
  legacyWarned = true;
  console.warn("[display-status] Using legacy status→bucket mapping; server display_status preferred.");
}

/** Prefer server `display_status` when present. */
export function resolveDisplayStatusLabel(input: {
  displayStatus?: string | null;
  status?: CreditApplicationStatus;
  backendState?: string | null;
  hasOffers?: boolean;
  hasHumanDecision?: boolean;
}): { key: string; label: string; source: "server" | "legacy" } {
  const server = (input.displayStatus ?? "").trim().toUpperCase();
  if (server) {
    const offersPending =
      server === "BANK_COMPLETE" && input.hasOffers === true && input.hasHumanDecision !== true;
    return {
      key: offersPending ? "OFFERS_RECEIVED" : server,
      label: offersPending
        ? SERVER_DISPLAY_STATUS_LABELS.OFFERS_RECEIVED
        : SERVER_DISPLAY_STATUS_LABELS[server] ?? server.replace(/_/g, " ").toLowerCase(),
      source: "server",
    };
  }

  warnLegacyMappingOnce();
  const bucket = resolveDisplayStatus(input.status ?? "unknown", input.backendState);
  return { key: bucket, label: DISPLAY_STATUS_LABELS[bucket], source: "legacy" };
}

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
  if (ACTIVE_STATUSES.has(s) || ["RECEIVED", "AI_ANALYSIS", "AI_COMPLETE", "BANK_SUBMITTED", "HYBRID_IN_PROGRESS", "SENT_TO_BANKS", "DOCUMENTS_PENDING"].includes(raw))
    return "ACTIVE";
  return "LEGACY";
}

export function isPipelineActiveDisplay(status: CreditApplicationStatus): boolean {
  const d = resolveDisplayStatus(status);
  return d === "ACTIVE" || d === "OFFERED";
}

export function formatApplicationStateLabel(state: string | null | undefined): string {
  if (!state?.trim()) return "Sin estado";
  return resolveDisplayStatusLabel({ backendState: state.trim(), status: "unknown" }).label;
}

export function extractDisplayStatus(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const v = o.display_status ?? o.displayStatus;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
