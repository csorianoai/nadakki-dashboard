/** Map backend autos Vehicle → consumer shape. Sin semillas: solo datos del propio vehiculo. */

import type { Vehicle as BackendVehicle } from "@/types/autos";
import type { Vehicle as ConsumerVehicle } from "@/lib/vehicles";
import { getVehicleById } from "@/lib/vehicles";
import type { VehiclePhoto } from "@/lib/vehicles";

/** Fotos que el backend publico devuelve (P2): solo cdn_url y orden; nunca storage_key ni tenant_id. */
type FotosBackend = {
  primary_photo_url?: string | null;
  photos?: Array<{ cdn_url?: unknown; display_order?: unknown; is_primary?: unknown } | null> | null;
};

function urlHttp(u: unknown): string | null {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u.trim() : null;
}

/** Copia las fotos reales del backend; degrada a null/[] si falta o no es http(s). */
export function mapFotos(v: FotosBackend): { primary_photo_url: string | null; photos: VehiclePhoto[] } {
  const photos: VehiclePhoto[] = [];
  for (const p of Array.isArray(v.photos) ? v.photos : []) {
    const url = urlHttp(p?.cdn_url);
    if (!url) continue;
    const pos = p?.display_order;
    photos.push({ cdn_url: url, position: typeof pos === "number" && Number.isFinite(pos) ? pos : null });
  }
  return { primary_photo_url: urlHttp(v.primary_photo_url), photos };
}

const GRADS = [
  "linear-gradient(135deg,#1E3A8A,#3B82F6)",
  "linear-gradient(135deg,#0F766E,#14B8A6)",
  "linear-gradient(135deg,#1D4ED8,#60A5FA)",
  "linear-gradient(135deg,#7C3AED,#A78BFA)",
];

/** Id numerico estable solo para presentacion (clave React, degradado); NO identifica al vehiculo. */
function displayId(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && String(n) === raw.trim()) return n;
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) h = (h * 31 + raw.charCodeAt(i)) % 1_000_000_007;
  return h + 1000;
}

function fotos(v: FotosBackend): Pick<ConsumerVehicle, "primary_photo_url" | "photos"> {
  const f = mapFotos(v);
  return {
    ...(f.primary_photo_url ? { primary_photo_url: f.primary_photo_url } : {}),
    ...(f.photos.length ? { photos: f.photos } : {}),
  };
}

// El 2.º argumento (semilla) se ignora: ya no se inventan datos. Se acepta solo por compatibilidad con llamadores previos.
export function mapBackendVehicle(v: BackendVehicle & FotosBackend, _legacySeed?: number): ConsumerVehicle {
  const refId = String(v.id);
  const id = displayId(refId);
  const trans = v.transmission ?? "";
  const fuel = v.fuel_type ?? "";
  // Precio real del backend (price_amount + price_currency); price_rd es solo el campo legado en DOP.
  const amount = v.price_amount != null && v.price_amount > 0 ? v.price_amount : 0;
  const legacy = v.price_rd != null && v.price_rd > 0 ? v.price_rd : 0;
  const price = amount || legacy;
  const currency = amount ? v.price_currency || undefined : legacy ? "DOP" : undefined;

  return {
    id,
    refId,
    make: v.make,
    model: v.model,
    year: v.year,
    price,
    ...(price > 0 && currency ? { currency } : {}),
    loc: v.province ?? "",
    type: (v.body_type as ConsumerVehicle["type"]) ?? "SUV",
    km: v.mileage_km ?? 0,
    trans,
    fuel,
    grad: GRADS[id % GRADS.length]!,
    verified: false,
    featuresLine: [trans, fuel].filter(Boolean).join(" · ").toUpperCase(),
    ...(v.photo_count != null && v.photo_count > 0 ? { photoCount: v.photo_count } : {}),
    ...fotos(v),
  };
}

export function backendVehicleToConsumer(
  v: BackendVehicle | null,
  id: string | number,
): ConsumerVehicle | undefined {
  if (!v) return getVehicleById(id);
  return mapBackendVehicle(v);
}
