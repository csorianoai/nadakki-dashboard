/**
 * F4F-6 parte 4: senas o reservas (criterio del contador, punto 4): pasivo con el comprador. Se leen y se registran
 * por /deposits (tenant del token, sin X-Tenant-ID).
 */
import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";

export const NO_DISPONIBLE = "Disponible cuando se active la contabilidad fiscal.";

const MENSAJES: Record<string, string> = {
  ESQUEMA_FISCAL_NO_APLICADO: NO_DISPONIBLE + " Todavía no se pueden guardar las señas; no se guardó nada.",
  DEPOSIT_NOT_FOUND: "No se encontró esa seña.",
  DEPOSIT_ALREADY_RESOLVED: "Esa seña ya tiene un destino y no se puede cambiar de nuevo.",
};

/** Texto llano para un reason_code conocido; null si no se conoce (no se inventa). */
export const mensajeSena = (code: string | null | undefined): string | null => (code ? (MENSAJES[code] ?? null) : null);

export const ESTADO_SENA: Record<string, string> = {
  recibida: "Recibida (deuda con el comprador)",
  aplicada: "Aplicada a la venta (parte del cobro)",
  ganada: "Ganada (seña no devuelta, va a resultado)",
  devuelta: "Devuelta al comprador",
};

export type Sena = { id: string; amount: string; currency: string; received_at: string; status: string; note?: string | null };

const depositsUrl = (vehicleId: string) => `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/deposits`;

async function llamar(path: string, init: { method: string; headers?: Record<string, string>; body?: unknown }): Promise<unknown> {
  const response = await apiFetch(path, {
    method: init.method,
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

export async function fetchSenas(vehicleId: string): Promise<Sena[]> {
  const body = await llamar(depositsUrl(vehicleId), { method: "GET" });
  return Array.isArray(body) ? (body as Sena[]) : [];
}

export async function postSena(
  vehicleId: string,
  f: { amount: string; currency: string; received_at: string; note: string },
  idempotencyKey: string,
): Promise<unknown> {
  const amount = normalizaImporte(f.amount);
  if (amount === null) throw new Error("amount invalido");
  const body: Record<string, string> = { amount, currency: f.currency.trim().toUpperCase(), received_at: f.received_at };
  if (f.note.trim()) body.note = f.note.trim();
  return llamar(depositsUrl(vehicleId), { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body });
}

export async function resolverSena(vehicleId: string, depositId: string, outcome: "ganada" | "devuelta"): Promise<unknown> {
  return llamar(`${depositsUrl(vehicleId)}/${encodeURIComponent(depositId)}/resolve`, { method: "POST", body: { outcome } });
}
