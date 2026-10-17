import type { RadarSignal } from "@/lib/realtor/types";
import type { MarketSignal, UnavailableReason } from "./api";

export const REASON_TEXT: Record<UnavailableReason, string> = {
  budget_exhausted: "Se agotó el presupuesto de consultas del periodo.",
  provider_not_configured: "La fuente de datos aún no está configurada.",
  provider_error: "La fuente de datos devolvió un error.",
  no_data: "La fuente no tiene datos para esta consulta.",
};

export const DEMO_SIGNAL: RadarSignal = {
  id: "demo", title: "Señal de ejemplo", signalType: "keyword_stats", source: "DEMO", asOf: "2026-01-01",
  status: "DEMO", unit: "", points: [], note: "Ejemplo para revisar el diseño. No es un dato real.",
};

const TITLE: Record<string, string> = {
  keyword_stats: "Palabra clave", ad_observation: "Anuncios", interest_series: "Interés relativo",
  domain_stats: "Dominio", advertiser_profile: "Anunciante",
};

/** Una UNAVAILABLE jamás lleva cifras: la nota trae solo el motivo. */
export function aRadarSignal(s: MarketSignal): RadarSignal {
  const unavailable = s.data_status === "UNAVAILABLE";
  const reason = unavailable ? REASON_TEXT[s.unavailable_reason ?? "no_data"] : null;
  const rotulo = s.evidence_tier === "estimado" ? "Estimado" : "Observado";
  return {
    id: s.signal_id,
    title: `${TITLE[s.signal_type] ?? s.signal_type}: ${s.subject}`,
    signalType: s.signal_type,
    source: s.provenance.source,
    asOf: s.observed_at.slice(0, 10),
    status: s.data_status,
    unit: s.unit ?? "",
    points: [],
    note: reason ?? `${rotulo}${s.uncertainty ? ` · ${s.uncertainty}` : ""}`,
    period: unavailable ? undefined : `${s.window.start} → ${s.window.end}`,
    precision: unavailable ? undefined : s.coverage != null ? `Cobertura ${Math.round(s.coverage * 100)} %` : s.provenance.confidence,
  };
}

/** Campos escalares de `values` (los campos concretos los fija un contrato posterior). Nada con UNAVAILABLE. */
export function camposVisibles(s: MarketSignal): [string, string][] {
  if (s.data_status === "UNAVAILABLE") return [];
  return Object.entries(s.values)
    .filter(([k, v]) => k !== "kind" && (typeof v === "string" || typeof v === "number"))
    .map(([k, v]) => [k, String(v)]);
}
