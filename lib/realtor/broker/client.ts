import { apiFetch } from "@/lib/api/fetch-client";
import type { Desk, DeskItem, ItemKind, ItemsPage, ItemStatus, Summary } from "./types";

/** GET de lectura y POST /items/{id}/decision. Sin tenant en el cliente: el backend lo toma del token. */
export const BASE_BROKER = "/api/v1/realestate/broker-desk";

/** vacio: 404 (mesa sin crear o ruta sin montar) o 503 (sin base). error: cualquier otro fallo. */
export type Leida<T> = { estado: "ok"; datos: T } | { estado: "vacio" } | { estado: "error" };
export type Enviar = (ruta: string, init?: RequestInit) => Promise<Response>;

/**
 * Forma mínima de cada respuesta (ROP-UX-ROUTING): un 200 que no la cumple es «error», no datos. Antes se confiaba en el
 * cuerpo (`as T`) y un 200 incompleto reventaba la pantalla (TypeError al leer `.length` o `pending_by_kind`).
 */
const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esTxt = (v: unknown) => typeof v === "string";
export const esMesa = (v: unknown): v is Desk => esObj(v) && esTxt(v.id) && esTxt(v.brokerage_id) && esTxt(v.created_at);
export const esItem = (v: unknown): v is DeskItem => esObj(v) && esTxt(v.id) && esTxt(v.kind) && esTxt(v.status) && esTxt(v.created_at);
export const esResumen = (v: unknown): v is Summary =>
  esObj(v) && esTxt(v.brokerage_status) && esObj(v.pending_by_kind) && esObj(v.agents_by_status) &&
  Array.isArray(v.supervised_agent_counts) && v.supervised_agent_counts.every((s) => esObj(s) && typeof s.active_supervised === "number");
export const esPagina = (v: unknown): v is ItemsPage =>
  esObj(v) && Array.isArray(v.items) && v.items.every(esItem) && (v.next_cursor === null || esTxt(v.next_cursor));

async function leer<T>(ruta: string, enviar: Enviar, forma: (v: unknown) => v is T): Promise<Leida<T>> {
  try {
    const res = await enviar(ruta, { method: "GET", cache: "no-store" });
    if (res.status === 404 || res.status === 503) return { estado: "vacio" };
    if (res.status !== 200) return { estado: "error" };
    const cuerpo: unknown = await res.json();
    return forma(cuerpo) ? { estado: "ok", datos: cuerpo } : { estado: "error" };
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

export const leerMesa = (e: Enviar = apiFetch) => leer<Desk>(BASE_BROKER, e, esMesa);
export const leerResumen = (e: Enviar = apiFetch) => leer<Summary>(`${BASE_BROKER}/summary`, e, esResumen);
export const leerItems = (f: Filtros, e: Enviar = apiFetch) => leer<ItemsPage>(rutaItems(f), e, esPagina);
export const leerItem = (id: string, e: Enviar = apiFetch) => leer<DeskItem>(`${BASE_BROKER}/items/${encodeURIComponent(id)}`, e, esItem);

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
    if (res.status === 200) { const d: unknown = await res.json(); return esItem(d) ? { estado: "ok", datos: d } : { estado: "error", motivo: "error" }; }
    return { estado: "error", motivo: MOTIVO[res.status] ?? "error" };
  } catch {
    return { estado: "error", motivo: "error" };
  }
}
