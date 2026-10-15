import { apiFetch } from "@/lib/api/fetch-client";
import type { ClientRole, Contact } from "./types";

/** Ruta de lectura de C-RE-OLA2 (listClients). La identidad y el tenant salen del token: el cliente no envía nada más. */
export const CLIENTS_PATH = "/api/v1/realestate/clients";
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

type Point = { type?: unknown; value_masked?: unknown };
type ClientRow = {
  contact?: { id?: unknown; display_label?: unknown; source?: unknown; primary_points?: unknown };
  client_roles?: unknown;
  agreement_signed?: unknown;
};

/** Rol de cliente del contrato → rol de la pantalla. Primero compra, luego alquiler, luego oferta (venta o arriendo). */
const ROLE_ORDER: readonly [string, ClientRole][] = [["buyer", "comprador"], ["tenant", "inquilino"], ["seller", "vendedor"], ["landlord", "vendedor"]];

function pointOf(points: unknown, types: readonly string[]): string | null {
  if (!Array.isArray(points)) return null;
  const p = (points as Point[]).find((x) => typeof x?.type === "string" && types.includes(x.type) && typeof x.value_masked === "string");
  return p ? (p.value_masked as string) : null;
}

/** ClientSummary → Contact. El contrato entrega la etiqueta y los puntos ya enmascarados; no trae estado de lead. */
export function toContact(row: ClientRow): Contact | null {
  const c = row?.contact;
  if (!c || typeof c.id !== "string" || typeof c.display_label !== "string") return null;
  const roles = Array.isArray(row.client_roles) ? row.client_roles : [];
  const role = ROLE_ORDER.find(([k]) => roles.includes(k))?.[1] ?? null;
  if (!role) return null;
  const signed = row.agreement_signed === true;
  return {
    id: c.id, name: c.display_label, role, roleActive: true,
    origin: c.source === "referral" ? "referido" : null, leadStatus: null,
    phone: "", email: "",
    phoneMasked: pointOf(c.primary_points, ["sms", "whatsapp", "voice_call"]),
    emailMasked: pointOf(c.primary_points, ["email"]),
    summary: signed ? { es: "Acuerdo firmado", en: "Agreement signed" } : { es: "Sin acuerdo firmado", en: "No signed agreement" },
  };
}

/** Clientes reales. 404/503, error de red o cuerpo ilegible → lista vacía («Sin datos todavía»); nunca se inventa nada. */
export async function fetchClients(): Promise<Contact[]> {
  const out: Contact[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i += 1) {
      const qs = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) qs.set("cursor", cursor);
      const res = await apiFetch(`${CLIENTS_PATH}?${qs}`, { method: "GET", cache: "no-store" });
      if (res.status !== 200) return out;
      const body = (await res.json()) as { items?: unknown; next_cursor?: unknown };
      if (!Array.isArray(body?.items)) return out;
      for (const row of body.items) { const c = toContact(row); if (c) out.push(c); }
      cursor = typeof body.next_cursor === "string" && body.next_cursor ? body.next_cursor : null;
      if (!cursor) break;
    }
  } catch {
    return out;
  }
  return out;
}
