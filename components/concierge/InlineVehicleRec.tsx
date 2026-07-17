"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";
import { getVehicleById } from "@/lib/vehicles";

export function InlineVehicleRec({
  vehicleId,
  onNavigate,
}: {
  vehicleId: number;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) return null;

  const monthly = Math.round(cuota(vehicle.price, 20, 60));

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        router.push(`/autos/vehiculo/${vehicle.id}`);
      }}
      className="mt-3 flex w-full items-center gap-2 rounded-r-sm border border-nk-border bg-nk-surface-2 p-2 text-left transition hover:bg-nk-surface"
    >
      <div
        className="h-[46px] w-[58px] shrink-0 rounded-r-sm"
        style={{ background: vehicle.grad }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-nk-fg">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-[10px] text-nk-fg-muted">{vehicle.loc}</p>
        <p className="text-xs font-semibold tabular-nums text-brand">
          {fmtRD(monthly)}/mes
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-nk-fg-muted" aria-hidden />
    </button>
  );
}
