/**
 * Cliente HTTP de contactos (F4C-3). Vive en la zona: lib/api/** no se toca. El tenant sale SOLO del token (sin
 * X-Tenant-ID). Sin DELETE: la baja es logica (PATCH con motivo) y la reactivacion es PATCH con `reactivate`.
 */
import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import type { Contacto, ContactoPayload } from "./contactos-tipos";

const BASE = "/api/v1/autos/contacts";

async function llamar(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  const response = await apiFetch(path, { ...init, headers });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

const enJson = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Menos de 7 digitos o texto: busca por nombre; 7-8 digitos: DNI; 11: CUIT/CUIL. */
export async function buscarContactos(texto: string, limit = 50): Promise<Contacto[]> {
  const q = texto.trim();
  const digitos = q.replace(/[.\-\s]/g, "");
  const esDoc = /^\d+$/.test(digitos) && /^(\d{7,8}|\d{11})$/.test(digitos);
  const body = esDoc
    ? await llamar(`${BASE}/search`, enJson("POST", digitos.length === 11 ? { cuit: digitos } : { dni: digitos }))
    : await llamar(`${BASE}?${new URLSearchParams({ ...(q ? { q } : {}), limit: String(limit) })}`);
  const items = (body as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as Contacto[]) : [];
}

export const crearContacto = (p: ContactoPayload) => llamar(BASE, enJson("POST", p)) as Promise<Contacto>;

const ruta = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export const actualizarContacto = (id: string, p: ContactoPayload) =>
  llamar(ruta(id), enJson("PATCH", p)) as Promise<Contacto>;

export const darDeBaja = (id: string, motivo: string) => actualizarContacto(id, { deactivation_reason: motivo });

export const reactivar = (id: string) => actualizarContacto(id, { reactivate: true });

const POR_MOTIVO: Record<string, string> = {
  CAPABILITY_DENIED: "No tienes permiso para esta operación con contactos.",
  CONTACT_NOT_FOUND: "El contacto ya no existe.",
  CONTACT_DUPLICATE_DOCUMENT: "Ya existe un contacto con ese documento.",
};

export type ErrorContacto = { reason_code: string | null; field: string | null; message: string };

/** El texto del servidor manda; la tabla solo cubre su ausencia. */
export function errorContacto(error: unknown): ErrorContacto {
  if (!(error instanceof AccessApiError)) {
    return { reason_code: null, field: null, message: "No hubo respuesta del servidor. Inténtalo de nuevo." };
  }
  const d = error.detail && typeof error.detail === "object" ? (error.detail as Record<string, unknown>) : {};
  const code = error.reason_code ?? (typeof d.reason_code === "string" ? d.reason_code : null);
  const texto = typeof d.error === "string" ? d.error : null;
  return {
    reason_code: code,
    field: typeof d.field === "string" ? d.field : null,
    message: texto ?? (code && POR_MOTIVO[code]) ?? `No se pudo completar la operación (${code ?? `HTTP ${error.status}`}).`,
  };
}
