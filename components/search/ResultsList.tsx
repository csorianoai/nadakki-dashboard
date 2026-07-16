"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { VehicleCardSkeleton } from "@/components/vehicle/VehicleCardSkeleton";
import { fmtKm, fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";
import type { Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function ResultsList({
  vehicles,
  loading,
}: {
  vehicles: Vehicle[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <VehicleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => {
        const monthly = Math.round(cuota(vehicle.price, 20, 60));
        return (
          <Link
            key={vehicle.id}
            href={`/autos/vehiculo/${vehicle.id}`}
            className={cn(
              "flex flex-col gap-4 overflow-hidden rounded-r border border-nk-border bg-nk-surface p-3 shadow-nk-sm transition sm:flex-row sm:items-stretch",
              "hover:-translate-y-0.5 hover:shadow-nk-md",
            )}
          >
            <div
              className="h-[140px] w-full shrink-0 rounded-r sm:h-auto sm:w-[170px]"
              style={{ background: vehicle.grad }}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-manrope text-base font-bold text-nk-fg">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="flex items-center gap-1 text-xs text-nk-fg-muted">
                <MapPin className="h-3 w-3" aria-hidden />
                {vehicle.loc} · {fmtKm(vehicle.km)} · {vehicle.trans}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-nk-fg-subtle">
                {vehicle.featuresLine}
              </p>
              <p className="text-xs text-nk-fg-muted">
                {vehicle.dealerName} ·{" "}
                <Star className="inline h-3 w-3 fill-nk-warning text-nk-warning" aria-hidden />{" "}
                {vehicle.rating.toFixed(1)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start justify-center gap-1 sm:items-end sm:text-right">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                {vehicle.match}% match
              </span>
              <p className="font-manrope text-lg font-extrabold tabular-nums">{fmtRD(vehicle.price)}</p>
              <p className="text-sm font-semibold tabular-nums text-brand">
                {fmtRD(monthly)}/mes
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
