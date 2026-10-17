import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";

/** BFF same-origin (C-PI x-bff). Sin tenant en el cliente: el BFF lo deriva del JWT. */
export const BASE_SIGNALS = "/api/v1/market-signals";

export type DataStatus = "LIVE" | "HISTORICAL" | "ESTIMATED" | "UNAVAILABLE";
export type UnavailableReason = "budget_exhausted" | "provider_not_configured" | "provider_error" | "no_data";

export interface MarketSignal {
  signal_id: string;
  signal_type: string;
  subject: string;
  geo: { country: string; region?: string; city?: string };
  /** Campos abiertos por contrato salvo `kind`. */
  values: { kind: string; [campo: string]: unknown };
  unit?: string | null;
  observed_at: string;
  window: { start: string; end: string };
  data_status: DataStatus;
  evidence_tier: "observado" | "estimado";
  unavailable_reason?: UnavailableReason | null;
  coverage?: number | null;
  uncertainty?: string | null;
  provenance: { source: string; as_of: string; status: DataStatus; confidence: string; method?: string | null };
}

export interface SignalBatch { data: MarketSignal[]; meta: { cost_cents: number; cached: boolean; provider_status: string } }

/** session_expired: 401 o sin Bearer. hidden: 404 (sin entitlement o recurso ajeno). service_unavailable: 503. */
export type Leida =
  | { estado: "ok"; lote: SignalBatch }
  | { estado: "session_expired" }
  | { estado: "hidden" }
  | { estado: "service_unavailable" }
  | { estado: "error" };

export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;
export type Consulta =
  | { tipo: "keyword"; keyword: string; country: string; region?: string; city?: string }
  | { tipo: "interes"; keyword: string; country: string; region?: string; city?: string }
  | { tipo: "dominio"; domain: string };

export function rutaConsulta(c: Consulta): string {
  if (c.tipo === "dominio") return `${BASE_SIGNALS}/domains/${encodeURIComponent(c.domain)}`;
  const q = new URLSearchParams({ keyword: c.keyword, country: c.country });
  if (c.region) q.set("region", c.region);
  if (c.city) q.set("city", c.city);
  return `${BASE_SIGNALS}/${c.tipo === "keyword" ? "keyword-stats" : "interest-series"}?${q.toString()}`;
}

const tieneBearer = () => Boolean(getAuthHeaders().Authorization);

/** Solo GET. Sin Bearer no se envía la petición (fail-closed). Un 200 se devuelve tal cual: UNAVAILABLE no es error. */
export async function leerSenales(c: Consulta, enviar?: Enviar): Promise<Leida> {
  if (!enviar && !tieneBearer()) return { estado: "session_expired" };
  try {
    const res = await (enviar ?? apiFetch)(rutaConsulta(c), { method: "GET", cache: "no-store" });
    if (res.status === 401) return { estado: "session_expired" };
    if (res.status === 404) return { estado: "hidden" };
    if (res.status === 503) return { estado: "service_unavailable" };
    if (res.status !== 200) return { estado: "error" };
    const lote = (await res.json()) as SignalBatch;
    return Array.isArray(lote?.data) ? { estado: "ok", lote } : { estado: "error" };
  } catch {
    return { estado: "error" };
  }
}
