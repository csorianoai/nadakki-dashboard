"use client";

import Link from "next/link";

/** The backend ID is only a navigation target; never resolve it against sample inventory. */
export function InlineVehicleRec({ vehicleId, onNavigate }: { vehicleId: number; onNavigate?: () => void }) {
  if (!Number.isFinite(vehicleId) || vehicleId <= 0) return null;
  return <Link href={`/autos/vehiculo/${encodeURIComponent(vehicleId)}`} onClick={onNavigate}
    className="mt-3 block rounded border border-nk-border p-2 text-sm underline">Ver vehículo en inventario</Link>;
}
