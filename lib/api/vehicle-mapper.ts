/** Map backend autos Vehicle → consumer shape. Sin semillas: solo datos del propio vehiculo. */

import type { Vehicle as BackendVehicle } from "@/types/autos";
import type { Vehicle as ConsumerVehicle } from "@/lib/vehicles";
import { getVehicleById } from "@/lib/vehicles";

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

// El 2.º argumento (semilla) se ignora: ya no se inventan datos. Se acepta solo por compatibilidad con llamadores previos.
export function mapBackendVehicle(v: BackendVehicle, _legacySeed?: number): ConsumerVehicle {
  const refId = String(v.id);
  const id = displayId(refId);
  const trans = v.transmission ?? "";
  const fuel = v.fuel_type ?? "";

  return {
    id,
    refId,
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price_rd && v.price_rd > 0 ? v.price_rd : 0,
    loc: v.province ?? "",
    type: (v.body_type as ConsumerVehicle["type"]) ?? "SUV",
    km: v.mileage_km ?? 0,
    trans,
    fuel,
    badge: "Precio justo",
    match: 82,
    grad: GRADS[id % GRADS.length]!,
    verified: false,
    featuresLine: [trans, fuel].filter(Boolean).join(" · ").toUpperCase(),
  };
}

export function backendVehicleToConsumer(
  v: BackendVehicle | null,
  id: string | number,
): ConsumerVehicle | undefined {
  if (!v) return getVehicleById(id);
  return mapBackendVehicle(v);
}
