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

export const RUTA_CHAT = "/api/assistant/contable/chat";

export type RespuestaAsistente = { response: string; links: string[] };
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
    return { ok: true, data: { response: j.response, links } };
  } catch {
    return { ok: false };
  }
}
