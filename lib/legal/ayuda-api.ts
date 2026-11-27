import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson } from "@/lib/legal/parse-api-error";
import m from "@/messages/es/legal-ayuda.json";

export type NivelAyuda = "guia" | "agente";
export type EstadoAyuda = { nivel: NivelAyuda; ia_disponible: boolean; sugerencias: string[] };
export type RespuestaAyuda = {
  respuesta: string;
  enlaces: string[];
  relacionadas: string[];
  nivel: NivelAyuda;
  modo: "ia" | "guia";
};
export type PasoInicial = { clave?: string; paso: string; hecho: boolean; enlace?: string | null; opcional?: boolean };
export type PrimerosPasos = { completados: number; total: number; siguiente: PasoInicial | null; pasos: PasoInicial[] };

const base = "/api/legal/cases/ayuda";
const headers = (tenantId: string) => ({ "X-Tenant-ID": tenantId.trim(), Accept: "application/json" });

/** Solo pantallas conocidas: un enlace que no está en la lista no se muestra como botón. */
export const PANTALLAS: Record<string, string> = m.pantallas;
export const enlacesValidos = (e: unknown): string[] =>
  Array.isArray(e) ? e.filter((x): x is string => typeof x === "string" && x in PANTALLAS) : [];

export async function leerEstado(tenantId: string): Promise<EstadoAyuda> {
  const res = await apiFetch(`${base}/estado`, { headers: headers(tenantId) });
  const raw = await readLegalJson<EstadoAyuda>(res, m.error);
  return { nivel: raw?.nivel === "agente" ? "agente" : "guia", ia_disponible: Boolean(raw?.ia_disponible),
           sugerencias: Array.isArray(raw?.sugerencias) ? raw.sugerencias.filter((s) => typeof s === "string") : [] };
}

export async function preguntar(tenantId: string, pregunta: string): Promise<RespuestaAyuda> {
  const res = await apiFetch(`${base}/preguntar`, {
    method: "POST", headers: { ...headers(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify({ pregunta: pregunta.slice(0, 1000) }),
  });
  const raw = await readLegalJson<RespuestaAyuda>(res, m.error);
  if (!raw || typeof raw.respuesta !== "string" || !raw.respuesta.trim()) throw new Error(m.error);
  return { ...raw, enlaces: enlacesValidos(raw.enlaces),
           relacionadas: Array.isArray(raw.relacionadas) ? raw.relacionadas.filter((s) => typeof s === "string") : [] };
}

/** Avance del despacho (motor de onboarding). Sin core activo o sin respuesta: null, y el chat sigue. */
export async function leerPrimerosPasos(): Promise<PrimerosPasos | null> {
  try {
    const res = await apiFetch("/api/v1/onboarding/legal/primeros-pasos", { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const raw = (await res.json()) as PrimerosPasos;
    return typeof raw?.completados === "number" && typeof raw?.total === "number" ? raw : null;
  } catch {
    return null;
  }
}
