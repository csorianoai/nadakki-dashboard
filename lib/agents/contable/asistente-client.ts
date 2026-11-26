import { apiFetch } from "@/lib/api/fetch-client";

/** Copia de ENLACES_PERMITIDOS de nadakki-ai-suite api/assistant/contable_enlaces.py. */
export const ENLACES_PERMITIDOS: Readonly<Record<string, string>> = {
  "/autos/dealer/finanzas": "Finanzas del dealer",
  "/autos/dealer/inventario": "Inventario de vehiculos",
  "/autos/dealer/inventario/nuevo": "Alta de vehiculo",
  "/autos/dealer/inventario/importar": "Importar inventario",
  "/autos/dealer/leads": "Leads",
  "/autos/dealer/contactos": "Contactos",
};

export const RUTA_CHAT = "/api/assistant/contable/ia/chat";

export const RUTA_CONFIRMAR = "/api/assistant/contable/ia/confirmar";

/** Accion que el asistente PROPONE; solo se hace si el usuario toca Confirmar (POST RUTA_CONFIRMAR {id}). */
export type AccionPropuesta = { id: string; tipo: string; resumen: string };
export type RespuestaAsistente = {
  response: string; links: string[]; modo?: "ia" | "fijo"; motivo?: string; accionPropuesta?: AccionPropuesta;
};
export type ResultadoConfirmar = { ok: boolean; response: string; links: string[] };
export type ResultadoChat = { ok: true; data: RespuestaAsistente } | { ok: false };

/** Devuelve el enlace tal cual si es interno, de la lista blanca y con query simple; si no, null. */
export function enlaceSeguro(token: string): string | null {
  const m = /^(\/[A-Za-z0-9_/-]*)(\?[A-Za-z0-9_=&-]*)?$/.exec(token);
  if (!m) return null;
  return Object.prototype.hasOwnProperty.call(ENLACES_PERMITIDOS, m[1]) ? token : null;
}

/** Unico endpoint del asistente: POST {message}. Falla cerrado (sin respuestas inventadas). */
export async function enviarMensaje(message: string): Promise<ResultadoChat> {
  try {
    const r = await apiFetch(RUTA_CHAT, { method: "POST", body: JSON.stringify({ message }) });
    if (!r.ok) return { ok: false };
    const j = await r.json();
    if (!j || typeof j.response !== "string") return { ok: false };
    const links = Array.isArray(j.links) ? j.links.filter((l: unknown): l is string => typeof l === "string") : [];
    return { ok: true, data: {
      response: j.response, links,
      ...(j.modo === "ia" || j.modo === "fijo" ? { modo: j.modo } : {}),
      ...(typeof j.motivo === "string" ? { motivo: j.motivo } : {}),
      ...(accionValida(j.accion_propuesta) ? { accionPropuesta: {
        id: j.accion_propuesta.id, tipo: j.accion_propuesta.tipo, resumen: j.accion_propuesta.resumen } } : {}),
    } };
  } catch {
    return { ok: false };
  }
}

function accionValida(a: unknown): a is AccionPropuesta {
  const x = a as Partial<AccionPropuesta> | null;
  return !!x && typeof x.id === "string" && x.id.length > 0 && typeof x.tipo === "string" && typeof x.resumen === "string";
}

const NO_SE_PUDO = "No se pudo hacer. Proba de nuevo mas tarde.";

/** Ejecuta UNA accion propuesta. El tenant y el usuario salen del token en el servidor, nunca del cuerpo. */
export async function confirmarAccion(id: string): Promise<ResultadoConfirmar> {
  try {
    const r = await apiFetch(RUTA_CONFIRMAR, { method: "POST", body: JSON.stringify({ id }) });
    const j = await r.json().catch(() => null);
    const links = Array.isArray(j?.links) ? j.links.filter((l: unknown): l is string => typeof l === "string") : [];
    if (r.ok && j && typeof j.response === "string") return { ok: true, response: j.response, links };
    const motivo = j?.detail?.response;
    return { ok: false, response: typeof motivo === "string" ? motivo : NO_SE_PUDO, links: [] };
  } catch {
    return { ok: false, response: NO_SE_PUDO, links: [] };
  }
}
