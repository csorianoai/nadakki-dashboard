/** Concierge API: failures never produce inventory recommendations. */

import { autosFetch } from "@/lib/autos-consumer-api";
export class ConciergeUnavailableError extends Error {
  readonly code = "CONCIERGE_UNAVAILABLE";
  constructor() {
    super("No pude consultar el inventario en este momento. Intenta de nuevo en unos minutos.");
    this.name = "ConciergeUnavailableError";
  }
}

/** Auto REAL del inventario publicado del concesionario del portal (backend POST /api/v1/autos/concierge/message). */
export type ConciergeVehicle = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  price_amount: number | null;
  price_currency: string | null;
  mileage_km: number | null;
  transmission: string | null;
  primary_photo_url: string | null;
  url: string;
};

export type ConciergeMessageResponse = {
  message: string;
  /** Obsoleto: el backend ya no devuelve ids numericos de ejemplo. Se mantiene para no romper a quien lo lee. */
  recId?: number;
  sessionId?: string;
  vehicles: ConciergeVehicle[];
};

export const CONCIERGE_MESSAGE_PATH = "/api/v1/autos/concierge/message";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function vehiculosReales(raw: unknown): ConciergeVehicle[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v) => {
    const o = (v ?? {}) as Record<string, unknown>;
    const id = typeof o.id === "string" && UUID.test(o.id) ? o.id : null;
    if (!id) return [];
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
    const str = (x: unknown) => (typeof x === "string" && x.trim() ? x : null);
    return [{
      id, make: str(o.make), model: str(o.model), year: num(o.year), price_amount: num(o.price_amount),
      price_currency: str(o.price_currency), mileage_km: num(o.mileage_km), transmission: str(o.transmission),
      primary_photo_url: str(o.primary_photo_url), url: `/autos/vehiculo/${encodeURIComponent(id)}`,
    }];
  });
}

export async function sendConciergeMessage(
  sessionId: string | null,
  message: string,
  context: Record<string, unknown>,
): Promise<ConciergeMessageResponse> {
  try {
    const res = await autosFetch<{ reply: string; session_id?: string; vehicles?: unknown }>(CONCIERGE_MESSAGE_PATH, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message, context }),
    });
    if (!res || typeof res.reply !== "string" || !res.reply.trim()) throw new ConciergeUnavailableError();
    return { message: res.reply, sessionId: res.session_id ?? sessionId ?? undefined, vehicles: vehiculosReales(res.vehicles) };
  } catch {
    throw new ConciergeUnavailableError();
  }
}

/** Busqueda conversacional de una sola frase: mismo concierge, sin sesion previa. */
export function conversationalSearch(query: string): Promise<ConciergeMessageResponse> {
  return sendConciergeMessage(null, query, {});
}
