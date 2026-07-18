"use client";

import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { fmtRD } from "@/lib/format";
import type { ShopperMatch } from "@/lib/shopper/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function ShopperMatchCard({
  match,
  onDismiss,
  onInterest,
  className,
}: {
  match: ShopperMatch;
  onDismiss?: () => void;
  onInterest?: () => void;
  className?: string;
}) {
  return (
    <article className={cn("space-y-3", className)}>
      <div className="relative">
        <VehicleCard vehicle={match.vehicle} variant="list" />
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-nk-sm">
          <Sparkles className="h-3 w-3" aria-hidden />
          Sugerido por AI
        </span>
      </div>

      <div className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="font-manrope text-sm font-bold text-nk-fg">¿Por qué es match?</h4>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
            {match.score}% match
          </span>
        </div>
        <ul className="space-y-1.5 text-sm text-nk-fg-muted">
          {match.reasons.map((reason) => (
            <li key={reason} className="text-nk-fg">
              {reason.startsWith("✓") ? reason : `✓ ${reason}`}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-nk-fg-subtle">
          Precio listado: {fmtRD(match.vehicle.price)} · {match.vehicle.loc}
        </p>

        {(onDismiss || onInterest) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-full border border-nk-border px-4 py-2 text-sm font-medium text-nk-fg-muted hover:bg-nk-surface-2"
              >
                Descartar
              </button>
            ) : null}
            {onInterest ? (
              <button
                type="button"
                onClick={onInterest}
                className="rounded-full bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white"
              >
                Me interesa
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
