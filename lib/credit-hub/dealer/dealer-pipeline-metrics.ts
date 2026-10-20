import type { CreditApplication, CreditStats } from "@/lib/credit-hub/types/creditCore";
import { isPipelineActiveDisplay } from "@/lib/credit-hub/honesty/display-status";

type StatesMap = Record<string, number>;

function sumStates(states: StatesMap, keys: string[]): number {
  let n = 0;
  for (const k of keys) {
    const v = states[k];
    if (typeof v === "number" && Number.isFinite(v)) n += v;
  }
  return n;
}

function readStates(stats?: CreditStats): StatesMap {
  const raw = stats?.raw;
  if (!raw || typeof raw !== "object") return {};
  const states = (raw as Record<string, unknown>).states;
  if (!states || typeof states !== "object") return {};
  return states as StatesMap;
}

/** In-flight pipeline count from backend `states` — excludes COMPLETED terminal bucket. */
export function activePipelineCountFromStats(stats?: CreditStats): number {
  const states = readStates(stats);
  if (Object.keys(states).length === 0) {
    return (
      (stats?.submitted_applications ?? 0) +
      (stats?.processing_applications ?? 0)
    );
  }
  return sumStates(states, [
    "RECEIVED",
    "AI_ANALYSIS",
    "AI_COMPLETE",
    "BANK_SUBMITTED",
    "HYBRID_IN_PROGRESS",
    "OFFER_SELECTED",
    "SUBMITTED",
    "PROCESSING",
  ]);
}

export function completedCountFromStats(stats?: CreditStats): number {
  const states = readStates(stats);
  return sumStates(states, ["COMPLETED", "BANK_COMPLETE", "PROCESSED"]);
}

export function applicationsThisWeek(apps: CreditApplication[], now = new Date()): number {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return apps.filter((a) => {
    const t = new Date(a.created_at).getTime();
    return Number.isFinite(t) && t >= weekAgo;
  }).length;
}

const OFFER_PENDING_STATUSES = new Set(["offered", "counter_offer", "approved", "approved_with_stipulations"]);
// metrics.derive_display_status: APPROVED = hay oferta aprobada o contraoferta y ninguna aceptada.
const OFFER_PENDING_DISPLAY = new Set(["APPROVED", "OFFERS_AVAILABLE", "OFFERS_RECEIVED"]);

/**
 * Solicitud con ofertas por decidir. Las filas de GET /applications no traen payload: una contraoferta
 * llega como state BANK_COMPLETE + display_status APPROVED, así que el status solo no basta (1b, ronda 3).
 */
export function hasOffersPendingDecision(app: CreditApplication): boolean {
  return OFFER_PENDING_STATUSES.has(app.status) || OFFER_PENDING_DISPLAY.has((app.display_status ?? "").toUpperCase());
}

export function activeApplicationsFromList(apps: CreditApplication[]): CreditApplication[] {
  return apps.filter((a) => isPipelineActiveDisplay(a.status));
}
