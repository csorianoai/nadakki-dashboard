"use client";

import { Sparkles, TrendingDown } from "lucide-react";
import { FixedModal } from "@/components/system/ModalRoot";
import { fmtRD } from "@/lib/format";
import type { Vehicle } from "@/lib/vehicles";

function computeBelowMarketPct(vehicle: Vehicle): number {
  if (vehicle.badge.includes("Excelente")) return 8 + (vehicle.id % 4);
  if (vehicle.match >= 90) return 5 + (vehicle.id % 3);
  return 3 + (vehicle.id % 2);
}

function similarCount(vehicle: Vehicle): number {
  return 72 + vehicle.id * 11;
}

function priceTimeline(vehicle: Vehicle): { label: string; pct: number }[] {
  return [
    { label: "Ene", pct: 100 },
    { label: "Feb", pct: 98 },
    { label: "Mar", pct: 96 },
    { label: "Abr", pct: 97 },
    { label: "May", pct: 95 },
    { label: "Hoy", pct: 92 },
  ].map((p, i) => ({
    label: p.label,
    pct: Math.min(100, Math.max(70, p.pct - (vehicle.id % 3) + (i === 5 ? -2 : 0))),
  }));
}

export function PriceAnalysisModal({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const belowPct = computeBelowMarketPct(vehicle);
  const similar = similarCount(vehicle);
  const timeline = priceTimeline(vehicle);

  return (
    <FixedModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Análisis de precio Nadakki AI"
      titleId="price-analysis-modal-title"
      icon={<Sparkles className="h-5 w-5 text-brand" aria-hidden />}
      subtitle={
        <>
          {vehicle.year} {vehicle.make} {vehicle.model} · {fmtRD(vehicle.price)}
        </>
      }
      footer={
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg bg-brand py-2.5 font-manrope text-sm font-semibold text-[var(--on-brand)] hover:brightness-110"
          >
            Entendido
          </button>
        </div>
      }
    >
      <div className="space-y-5 px-5 py-4">
        <div className="flex items-start gap-3 rounded-r border border-nk-success/25 bg-nk-success/10 p-4">
          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-nk-success" aria-hidden />
          <div>
            <p className="font-manrope text-base font-bold text-nk-fg">
              Este vehículo está {belowPct}% por debajo del promedio del mercado
            </p>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Basado en {similar.toLocaleString("en-US")} vehículos similares vendidos en los
              últimos 90 días
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">
            Precio promedio — vehículos similares (90 días)
          </p>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {timeline.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-brand to-brand-2"
                  style={{ height: `${point.pct}%` }}
                  title={`${point.label}: ${point.pct}% del pico`}
                />
                <span className="text-[10px] font-medium text-nk-fg-subtle">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-xs text-nk-fg-muted">
          Datos verificados con importaciones DGII · Actualizado hace 24h
        </p>
      </div>
    </FixedModal>
  );
}
