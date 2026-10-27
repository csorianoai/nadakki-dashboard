import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import { BASE_PI, statusToState } from "./client";
import type { Section } from "./types";

/** Sobre de una fuente de PI-2 (backend #2330). El backend nunca emite DEMO: si no hay dato, UNAVAILABLE con motivo. */
export type SourceEnvelope = {
  source: string; provider_status: "configured" | "not_configured" | "degraded";
  data_status: "LIVE" | "HISTORICAL" | "ESTIMATED" | "UNAVAILABLE";
  unavailable_reason: "budget_exhausted" | "provider_not_configured" | "provider_error" | "no_data" | null;
  detail: string | null; evidence_tier: "observado" | "estimado"; values: Record<string, unknown>; geo: Record<string, unknown>;
  window: Record<string, unknown>; uncertainty: string | null; provenance: Record<string, unknown>;
};
export const SOURCES = ["acs", "miami-permits", "dor"] as const;
export type SourceKey = (typeof SOURCES)[number];

const STATUS = ["LIVE", "HISTORICAL", "ESTIMATED", "UNAVAILABLE"];
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Sobre incoherente (UNAVAILABLE sin motivo, o con motivo y dato) → error: nunca se pinta como dato. */
export function isEnvelope(j: unknown): j is SourceEnvelope {
  if (!isObj(j) || typeof j.source !== "string" || !STATUS.includes(String(j.data_status)) || !isObj(j.values)) return false;
  return (j.data_status === "UNAVAILABLE") === (typeof j.unavailable_reason === "string");
}

export async function fetchSource(propertyId: string, key: SourceKey): Promise<Section<SourceEnvelope>> {
  if (!getAuthHeaders().Authorization) return { state: "session_expired" };
  try {
    const res = await apiFetch(`${BASE_PI}/properties/${encodeURIComponent(propertyId)}/sources/${key}`, { method: "GET", cache: "no-store" });
    if (!res.ok) return { state: statusToState(res.status) };
    const j: unknown = await res.json();
    return isEnvelope(j) ? { state: "ok", data: j } : { state: "error" };
  } catch {
    return { state: "error" };
  }
}
