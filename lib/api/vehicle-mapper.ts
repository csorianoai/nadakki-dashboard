/** Map backend autos Vehicle → consumer seed shape. */

import type { Vehicle as BackendVehicle } from "@/types/autos";
import type { Vehicle as ConsumerVehicle } from "@/lib/vehicles";
import { getVehicleById } from "@/lib/vehicles";

const GRADS = [
  "linear-gradient(135deg,#1E3A8A,#3B82F6)",
  "linear-gradient(135deg,#0F766E,#14B8A6)",
  "linear-gradient(135deg,#1D4ED8,#60A5FA)",
  "linear-gradient(135deg,#7C3AED,#A78BFA)",
];

const DEALERS = ["AutoMundo RD", "Motores del Este", "Autos del Cibao", "Caribe Motors"];
const AVG_RESP = ["15 min", "1 hora", "30 min", "2 horas"];

export function mapBackendVehicle(v: BackendVehicle, seedFallbackId?: number): ConsumerVehicle {
  const id = Number.parseInt(String(v.id), 10) || seedFallbackId || 1;
  const seed = getVehicleById(id);

  return {
    id,
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price_rd ?? seed?.price ?? 1_000_000,
    loc: v.province ?? seed?.loc ?? "Distrito Nacional",
    type: (v.body_type as ConsumerVehicle["type"]) ?? seed?.type ?? "SUV",
    km: v.mileage_km ?? seed?.km ?? 0,
    trans: v.transmission ?? seed?.trans ?? "Automática",
    fuel: v.fuel_type ?? seed?.fuel ?? "Gasolina",
    badge: seed?.badge ?? "Precio justo",
    match: seed?.match ?? 82,
    grad: seed?.grad ?? GRADS[id % GRADS.length]!,
    verified: v.condition !== "private",
    rating: seed?.rating ?? 4.5,
    reviews: seed?.reviews ?? 50,
    featuresLine: seed?.featuresLine ?? "AUTOMÁTICO · GASOLINA",
    dealerName: seed?.dealerName ?? DEALERS[id % 4]!,
    avgResp: seed?.avgResp ?? AVG_RESP[id % 4]!,
  };
}

export function backendVehicleToConsumer(
  v: BackendVehicle | null,
  id: string | number,
): ConsumerVehicle | undefined {
  if (!v) return getVehicleById(id);
  return mapBackendVehicle(v, Number(id) || undefined);
}
