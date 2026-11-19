import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import { BASE_PI, statusToState } from "./client";
import type { Section } from "./types";

/** PI-2 carga manual (backend #2329). Procedencia: evidence_tier, método y usuario los pone el servidor; aquí nunca. */
export type Competitor = {
  id: string; name: string; address: string; developer: string | null; price_from_amount: string | null; price_currency: string | null;
  units: number | null; floors: number | null; delivery: string | null; source_url: string; evidence_tier: "observado";
  source_method: "manual" | "csv"; observed_at: string;
};
export const OBS_KINDS = ["price", "availability", "incentive", "advertising", "construction", "other"] as const;
export type ObsKind = (typeof OBS_KINDS)[number];
export type Observation = {
  id: string; competitor_project_id: string | null; kind: ObsKind; description: string; value_amount: string | null;
  value_currency: string | null; source_ref: string; source_url: string | null; evidence_tier: "observado";
  source_method: "manual" | "csv"; observed_at: string;
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
/** Solo filas con procedencia completa: sin fuente u observed_at no se muestran como observadas. */
const isComp = (r: Obj) => typeof r.id === "string" && typeof r.name === "string" && typeof r.source_url === "string" && r.evidence_tier === "observado" && typeof r.observed_at === "string";
const isObs = (r: Obj) => typeof r.id === "string" && typeof r.source_ref === "string" && r.evidence_tier === "observado" && typeof r.observed_at === "string" && (OBS_KINDS as readonly unknown[]).includes(r.kind);

async function list<T>(path: string, ok: (r: Obj) => boolean): Promise<Section<T[]>> {
  if (!getAuthHeaders().Authorization) return { state: "session_expired" };
  try {
    const res = await apiFetch(`${BASE_PI}${path}`, { method: "GET", cache: "no-store" });
    if (!res.ok) return { state: statusToState(res.status) };
    const j: unknown = await res.json();
    return isObj(j) && Array.isArray(j.data) ? { state: "ok", data: j.data.filter((r) => isObj(r) && ok(r)) as T[] } : { state: "error" };
  } catch {
    return { state: "error" };
  }
}

const enc = encodeURIComponent;
export const fetchCompetitors = (pid: string) => list<Competitor>(`/properties/${enc(pid)}/competitor-projects`, isComp);
export const fetchObservations = (pid: string) => list<Observation>(`/properties/${enc(pid)}/observations`, isObs);

export type SaveResult = { ok: true } | { ok: false; errors: { row?: number; msg: string }[] };

async function send(path: string, body: string, csv: boolean): Promise<SaveResult> {
  if (!getAuthHeaders().Authorization) return { ok: false, errors: [{ msg: "Tu sesión terminó. Vuelve a entrar." }] };
  try {
    const res = await apiFetch(`${BASE_PI}${path}`, { method: "POST", body, headers: csv ? { "Content-Type": "text/csv" } : undefined });
    if (res.ok) return { ok: true };
    const j: unknown = await res.json().catch(() => null);
    const d = isObj(j) ? j.detail : null;
    const errs = isObj(d) && Array.isArray(d.errors) ? d.errors.filter(isObj).map((e) => ({ row: typeof e.row === "number" ? e.row : undefined, msg: String(e.msg ?? "") })) : [];
    return { ok: false, errors: errs.length ? errs : [{ msg: res.status === 404 ? "La propiedad o el competidor no existen." : `No se pudo guardar (${res.status}).` }] };
  } catch {
    return { ok: false, errors: [{ msg: "No se pudo guardar." }] };
  }
}

export const saveCompetitor = (body: Obj) => send("/competitor-projects", JSON.stringify(body), false);
export const saveObservation = (body: Obj) => send("/observations", JSON.stringify(body), false);
export const importCsv = (pid: string, what: "competitor-projects" | "observations", text: string) => send(`/properties/${enc(pid)}/${what}/import`, text, true);
