"use client";

import Link from "next/link";
import { fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";
import type { Vehicle } from "@/lib/vehicles";

const PROVINCE_POSITIONS: Record<string, { top: string; left: string }> = {
  "Distrito Nacional": { top: "58%", left: "52%" },
  "Santo Domingo Este": { top: "62%", left: "58%" },
  Santiago: { top: "28%", left: "42%" },
  "La Vega": { top: "34%", left: "48%" },
  "San Pedro de Macorís": { top: "66%", left: "62%" },
  "Puerto Plata": { top: "18%", left: "38%" },
  "Santo Domingo": { top: "55%", left: "48%" },
};

export function ResultsMap({
  vehicles,
  loading,
}: {
  vehicles: Vehicle[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="relative aspect-[16/10] animate-nkShimmer rounded-r border border-nk-border bg-nk-surface-2" />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-r border border-nk-border bg-nk-surface-2">
      <div
        className="relative aspect-[16/10]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-soft/30 to-transparent" />
        {vehicles.map((vehicle) => {
          const pos = PROVINCE_POSITIONS[vehicle.loc] ?? {
            top: `${20 + (vehicle.id * 7) % 60}%`,
            left: `${25 + (vehicle.id * 11) % 50}%`,
          };
          const monthly = Math.round(cuota(vehicle.price, 20, 60));
          return (
            <Link
              key={vehicle.id}
              href={`/autos/vehiculo/${vehicle.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-nk-surface px-2 py-1 text-[10px] font-bold text-brand shadow-nk-md transition hover:scale-110"
              style={{ top: pos.top, left: pos.left }}
            >
              {fmtRD(monthly)}/mes
            </Link>
          );
        })}
      </div>
      <p className="border-t border-nk-border px-4 py-3 text-xs text-nk-fg-subtle">
        En producción integrar Mapbox/Google Maps. Pins aproximados por provincia según cuota
        mensual.
      </p>
    </div>
  );
}
