"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { PriceAnalysisModal } from "@/components/vehicle/PriceAnalysisModal";
import type { Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function PrecioJustoBadge({
  vehicle,
  className,
}: {
  vehicle: Vehicle;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!vehicle.verified) return null;

  return (
    <>
      <span
        className={cn(
          "quality-badge inline-flex items-center gap-1 rounded-full bg-nk-success/15 px-2 py-0.5 text-[10px] font-bold text-nk-success",
          className,
        )}
      >
        <Check className="h-3 w-3 shrink-0" aria-hidden />
        Precio Justo verificado
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(true);
          }}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-nk-success/80 transition hover:bg-nk-success/20 hover:text-nk-success"
          aria-label="Ver análisis de precio AI"
        >
          <Info className="h-3 w-3" aria-hidden />
        </button>
      </span>

      <PriceAnalysisModal vehicle={vehicle} open={open} onOpenChange={setOpen} />
    </>
  );
}
