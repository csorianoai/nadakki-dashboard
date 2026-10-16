import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";

/** C-RE-OLA3 1.0.0 (congelado), C-RE-MARKETING-AI getMarketingAiSummary, solo lectura. El tenant sale del token en el servidor: el cliente no envía ninguno. */
export const MARKETING_SUMMARY_PATH = "/api/v1/realestate/marketing-ai/summary";

export type MarketingMetric = { key: string; value: number | null };
export type MarketingKind = "sale" | "rental" | "unattributed";
export type MarketingSpend = {
  kind: MarketingKind; currency: string; campaigns: number;
  spend: string | null; budget: string | null; leads: number | null; costPerLead: string | null;
};
export type MarketingSummary = { period: { from: string; to: string }; metrics: MarketingMetric[]; spend: MarketingSpend[] };

const KINDS: readonly MarketingKind[] = ["sale", "rental", "unattributed"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const strOrNull = (v: unknown): string | null => (isStr(v) ? v : null);
const intOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);

/** MarketingAiSummary → vista. Elementos inválidos se descartan; sin forma base devuelve null (fail-closed). NO_DISPONIBLE/null → null, nunca 0. */
export function parseMarketingSummary(body: unknown): MarketingSummary | null {
  if (!isObj(body) || !isObj(body.period) || !isStr(body.period.from) || !isStr(body.period.to)) return null;
  if (!Array.isArray(body.metrics) || !Array.isArray(body.spend)) return null;
  const metrics: MarketingMetric[] = [];
  for (const m of body.metrics) {
    if (!isObj(m) || !isStr(m.key)) continue;
    if (m.quality === "OK" && intOrNull(m.value) !== null) metrics.push({ key: m.key, value: m.value as number });
    else if (m.quality === "NO_DISPONIBLE") metrics.push({ key: m.key, value: null });
  }
  const spend: MarketingSpend[] = [];
  for (const s of body.spend) {
    const kind = isObj(s) ? KINDS.find((k) => k === s.kind) : undefined;
    if (!isObj(s) || !kind || !isStr(s.currency) || typeof s.campaigns !== "number" || s.campaigns < 1) continue;
    spend.push({ kind, currency: s.currency, campaigns: s.campaigns, spend: strOrNull(s.spend), budget: strOrNull(s.budget),
      leads: intOrNull(s.leads_attributed), costPerLead: strOrNull(s.cost_per_lead) });
  }
  return { period: { from: body.period.from, to: body.period.to }, metrics, spend };
}

/** true si hay algún dato real: conteo disponible o gasto por tipo y moneda. Todo vacío o NO_DISPONIBLE → «Sin datos todavía». */
export function hasData(s: MarketingSummary): boolean {
  return s.metrics.some((m) => m.value !== null) || s.spend.length > 0;
}

/** 404, 503, red caída, cuerpo inválido o sin datos → null. */
export async function fetchMarketingSummary(): Promise<MarketingSummary | null> {
  try {
    const res = await apiFetch(MARKETING_SUMMARY_PATH, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
    if (res.status !== 200) return null;
    const s = parseMarketingSummary(await res.json());
    return s && hasData(s) ? s : null;
  } catch {
    return null;
  }
}
