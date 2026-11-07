import type { Vehicle } from "@/lib/vehicles";

/** El enlace usa el id REAL del backend (refId); el id numerico es solo de presentacion. */
export function publicVehicleHref(v: Pick<Vehicle, "id" | "refId">): string {
  return `/autos/vehiculo/${encodeURIComponent(String(v.refId ?? v.id))}`;
}
