"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtRD } from "@/lib/format";
import { SaveButton } from "@/components/vehicle/SaveButton";
import { VEHICLES_SEED, type Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function StickyHeader({
  vehicle,
  stuck,
  saved,
  onSaveToggle,
  onPrev,
  onNext,
  navIndex,
  navTotal,
}: {
  vehicle: Vehicle;
  stuck: boolean;
  saved?: boolean;
  onSaveToggle?: () => void;
  onPrev: () => void;
  onNext: () => void;
  navIndex: number;
  navTotal: number;
}) {
  return (
    <div
      className={cn(
        "sticky top-[63px] z-30 border-b border-nk-border bg-nk-surface/95 backdrop-blur-md transition-all duration-300",
        stuck ? "animate-nkUp opacity-100" : "pointer-events-none h-0 overflow-hidden opacity-0",
      )}
      aria-hidden={!stuck}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-[22px] py-2.5">
        <div
          className="h-[60px] w-[60px] shrink-0 rounded-r-sm"
          style={{ background: vehicle.grad }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-manrope text-sm font-bold text-nk-fg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="hidden truncate text-[10px] font-medium uppercase tracking-wide text-nk-fg-subtle sm:block">
            {vehicle.featuresLine}
          </p>
        </div>
        <p className="font-manrope text-lg font-bold tabular-nums text-brand">
          {fmtRD(vehicle.price)}
        </p>

        <div className="flex items-center rounded-r-sm border border-nk-border">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex h-9 items-center px-2 text-nk-fg-muted hover:bg-nk-surface-2"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="border-x border-nk-border px-3 text-xs font-semibold tabular-nums text-nk-fg-muted">
            {navIndex} de {navTotal}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-9 items-center px-2 text-nk-fg-muted hover:bg-nk-surface-2"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <SaveButton saved={saved ?? false} onToggle={onSaveToggle ?? (() => undefined)} />
        <Button variant="brand" size="sm" className="shrink-0">
          Contactar
        </Button>
      </div>
    </div>
  );
}

export function useVdpNavigation(currentId: number) {
  const pool = VEHICLES_SEED;
  const idx = pool.findIndex((v) => v.id === currentId);
  const navIndex = idx >= 0 ? idx + 1 : 1;
  const navTotal = 400;

  const goPrev = () => {
    const prevIdx = idx <= 0 ? pool.length - 1 : idx - 1;
    window.location.href = `/autos/vehiculo/${pool[prevIdx]!.id}`;
  };

  const goNext = () => {
    const nextIdx = idx >= pool.length - 1 ? 0 : idx + 1;
    window.location.href = `/autos/vehiculo/${pool[nextIdx]!.id}`;
  };

  return { navIndex, navTotal, goPrev, goNext };
}
