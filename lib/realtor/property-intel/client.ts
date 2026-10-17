import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { AdvertiserLink, BrokerPolicy, PiDocument, PiData, Section, SignalRef, Target } from "./types";

export const BASE_PI = "/api/v1/realestate/property-intel";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export function statusToState(status: number): Exclude<Section<never>["state"], "loading" | "ok"> {
  if (status === 401) return "session_expired";
  if (status === 404) return "hidden";
  if (status === 503) return "service_unavailable";
  return "error";
}

/** Sin Bearer no se envía la petición (fail-closed). No se manda X-Tenant-ID: lo pone el BFF. */
async function read<T>(path: string, pick: (j: unknown) => T | null): Promise<Section<T>> {
  if (!getAuthHeaders().Authorization) return { state: "session_expired" };
  try {
    const res = await apiFetch(`${BASE_PI}${path}`, { method: "GET", cache: "no-store" });
    if (!res.ok) return { state: statusToState(res.status) };
    const data = pick(await res.json());
    return data === null ? { state: "error" } : { state: "ok", data };
  } catch {
    return { state: "error" };
  }
}

const rows = <T>(ok: (r: Obj) => boolean) => (j: unknown): T[] | null =>
  isObj(j) && Array.isArray(j.data) ? (j.data.filter((r) => isObj(r) && ok(r)) as T[]) : null;

const q = (t: Target, extra = "") => `?${t.kind}=${encodeURIComponent(t.id)}&limit=100${extra}`;

export const fetchSignals = (t: Target) => read<SignalRef[]>(`/signal-refs${q(t)}`, rows((r) => typeof r.id === "string" && typeof r.signal_type === "string"));
export const fetchLinks = (t: Target) =>
  read<AdvertiserLink[]>(`/advertiser-links${q(t)}`, rows<AdvertiserLink>((r) => typeof r.id === "string" && ["proposed", "confirmed", "rejected"].includes(String(r.status)) && Array.isArray(r.evidence)));
/** El contrato lista solo `stored` por defecto: se piden también pending para no presentarlos como almacenados. */
export const fetchDocuments = async (t: Target): Promise<Section<PiDocument[]>> => {
  const ok = rows<PiDocument>((r) => typeof r.id === "string" && ["pending", "stored", "failed"].includes(String(r.status)));
  const [stored, pending] = await Promise.all([read(`/documents${q(t, "&status=stored")}`, ok), read(`/documents${q(t, "&status=pending")}`, ok)]);
  if (stored.state !== "ok") return stored;
  return { state: "ok", data: [...stored.data, ...(pending.state === "ok" ? pending.data : [])] };
};
export const fetchPolicy = (propertyId: string) =>
  read<BrokerPolicy>(`/broker-policies/${encodeURIComponent(propertyId)}`, (j) => (isObj(j) && typeof j.registration_status === "string" ? (j as unknown as BrokerPolicy) : null));

export async function fetchAll(t: Target): Promise<PiData> {
  const [signals, links, documents, policy] = await Promise.all([
    fetchSignals(t), fetchLinks(t), fetchDocuments(t),
    t.kind === "property_id" ? fetchPolicy(t.id) : Promise.resolve<Section<BrokerPolicy>>({ state: "hidden" }),
  ]);
  return { signals, links, documents, policy };
}

/** Confirmar o rechazar es siempre un clic humano; el usuario sale del JWT en el servidor. */
export async function decideLink(id: string, decision: "confirmed" | "rejected", reason: string): Promise<boolean> {
  if (!getAuthHeaders().Authorization || !reason.trim()) return false;
  try {
    const res = await apiFetch(`${BASE_PI}/advertiser-links/${encodeURIComponent(id)}/decision`, {
      method: "POST", body: JSON.stringify({ decision, status_reason: reason.trim().slice(0, 500) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Registro: abre el envío de prospectos solo si el registro está confirmado y el servidor permite el envío (el acuerdo lo impone el servidor); si no, el gate lo bloquea. */
export function registrationGate(p: BrokerPolicy): "open" | "blocked" | "not_required" {
  if (!p.registration_required) return "not_required";
  return p.registration_status === "confirmed" && p.prospect_submission_allowed ? "open" : "blocked";
}
