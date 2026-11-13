import { apiFetch } from "@/lib/api/fetch-client";
import type { Contacto, ContactoPayload } from "./contactos-tipos";

const BASE = "/api/v1/autos/contacts";
export class ContactosError extends Error {
  constructor(public status: number, public reason_code: string | null, public field: string | null) {
    super(status === 403 ? "Tu usuario no tiene permiso para esta operación." : "No se pudo completar la operación de contactos.");
  }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ContactosError(response.status, body?.detail?.reason_code ?? null, body?.detail?.field ?? null);
  return body as T;
}
export const contactosApi = {
  listar: (signal?: AbortSignal) => request<{ items: Contacto[] }>(BASE, { signal }),
  // Los documentos y el nombre buscado viajan en el cuerpo, nunca en URL ni logs del cliente.
  buscarDocumento: (datos: { dni?: string; cuit?: string }, signal?: AbortSignal) =>
    request<{ items: Contacto[] }>(`${BASE}/search`, { method: "POST", body: JSON.stringify(datos), signal }),
  obtener: (id: string) => request<Contacto>(`${BASE}/${encodeURIComponent(id)}`),
  crear: (datos: ContactoPayload) => request<Contacto>(BASE, { method: "POST", body: JSON.stringify(datos) }),
  editar: (id: string, datos: ContactoPayload) => request<Contacto>(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(datos) }),
};
