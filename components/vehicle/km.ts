import { fmtKm } from "@/lib/format";
import type { Vehicle } from "@/lib/vehicles";

/** Kilometraje para mostrar, o null si el backend no lo informo: nunca "0 km" inventado. */
export function kmTexto(v: Pick<Vehicle, "km" | "kmDesconocido">): string | null {
  if (v.kmDesconocido || v.km == null || !Number.isFinite(v.km)) return null;
  return fmtKm(v.km);
}
