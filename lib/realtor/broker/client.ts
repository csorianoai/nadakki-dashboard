import { apiFetch } from "@/lib/api/fetch-client";
import type { Desk, DeskItem, ItemKind, ItemsPage, ItemStatus, Summary } from "./types";

/** GET de lectura y POST /items/{id}/decision. Sin tenant en el cliente: el backend lo toma del token. */
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

export type Decision = "approved" | "rejected";
export type MotivoFallo = "prohibido" | "no-existe" | "conflicto" | "invalido" | "error";
export type Decidida = { estado: "ok"; datos: DeskItem } | { estado: "error"; motivo: MotivoFallo };
const MOTIVO: Record<number, MotivoFallo> = { 403: "prohibido", 404: "no-existe", 409: "conflicto", 422: "invalido" };

/** POST /items/{id}/decision. Solo decision y reason; quien decide y el tenant salen del token. El backend exige reason. */
export async function decidir(id: string, decision: Decision, reason: string, enviar: Enviar = apiFetch): Promise<Decidida> {
  const motivo = reason.trim();
  if (!motivo) return { estado: "error", motivo: "invalido" };
  try {
    const res = await enviar(`${BASE_BROKER}/items/${encodeURIComponent(id)}/decision`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: motivo }),
    });
    if (res.status === 200) return { estado: "ok", datos: (await res.json()) as DeskItem };
    return { estado: "error", motivo: MOTIVO[res.status] ?? "error" };
  } catch {
    return { estado: "error", motivo: "error" };
  }
}
