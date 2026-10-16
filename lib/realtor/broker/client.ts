import { apiFetch } from "@/lib/api/fetch-client";
import type { Desk, DeskItem, ItemKind, ItemsPage, ItemStatus, Summary } from "./types";

/** Solo GET. No se llama a POST /decision. Sin tenant en el cliente: el backend lo toma del token. */
export const BASE_BROKER = "/api/v1/realestate/broker-desk";

/** vacio: 404 (mesa sin crear o ruta sin montar) o 503 (sin base). error: cualquier otro fallo. */
export type Leida<T> = { estado: "ok"; datos: T } | { estado: "vacio" } | { estado: "error" };
export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;

async function leer<T>(ruta: string, enviar: Enviar): Promise<Leida<T>> {
  try {
    const res = await enviar(ruta, { method: "GET", cache: "no-store" });
    if (res.status === 404 || res.status === 503) return { estado: "vacio" };
    if (res.status !== 200) return { estado: "error" };
    return { estado: "ok", datos: (await res.json()) as T };
  } catch {
    return { estado: "error" };
  }
}

export type Filtros = { status?: ItemStatus; kind?: ItemKind; cursor?: string; limit?: number };

export function rutaItems(f: Filtros): string {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.kind) q.set("kind", f.kind);
  if (f.cursor) q.set("cursor", f.cursor);
  q.set("limit", String(f.limit ?? 50));
  return `${BASE_BROKER}/items?${q.toString()}`;
}

export const leerMesa = (e: Enviar = apiFetch) => leer<Desk>(BASE_BROKER, e);
export const leerResumen = (e: Enviar = apiFetch) => leer<Summary>(`${BASE_BROKER}/summary`, e);
export const leerItems = (f: Filtros, e: Enviar = apiFetch) => leer<ItemsPage>(rutaItems(f), e);
export const leerItem = (id: string, e: Enviar = apiFetch) => leer<DeskItem>(`${BASE_BROKER}/items/${encodeURIComponent(id)}`, e);
